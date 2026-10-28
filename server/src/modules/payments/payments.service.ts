import { IOrderRepository } from '../orders/orders.repository.js';
import { IUserRepository } from '../users/users.repository.js';
import { ICourseRepository } from '../courses/courses.repository.js';
import { ResourceRepository } from '../resources/resources.repository.js';
import { ICloudStorageService } from '../drive/drive.interface.js';
import { CryptoUtil } from '../../common/utils/crypto.js';
import { ENV } from '../../config/env.js';
import { EnrollmentEntity, DriveAccessGrantEntity, db } from '../../database/database.store.js';

export interface VNPayIpnParams {
  vnp_Amount: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TxnRef: string; // Mã đơn hàng GGC-xxxxxx
  vnp_SecureHash: string;
  [key: string]: string | undefined;
}

export class PaymentsService {
  constructor(
    private orderRepo: IOrderRepository,
    private userRepo: IUserRepository,
    private courseRepo: ICourseRepository,
    private resourceRepo: ResourceRepository,
    private storageService: ICloudStorageService
  ) {}

  /**
   * Xử lý Webhook VNPay IPN với chữ ký HMAC-SHA512 & Idempotency
   */
  async processVNPayIpn(params: Record<string, string>): Promise<{ RspCode: string; Message: string }> {
    const secureHash = params['vnp_SecureHash'];
    if (!secureHash) {
      return { RspCode: '97', Message: 'Missing Checksum' };
    }

    // 1. Tách chữ ký và chuẩn bị chuỗi cần verify
    const signParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && value !== undefined && value !== '') {
        signParams[key] = value;
      }
    }

    // 2. Sắp xếp alphabet
    const sortedQuery = Object.keys(signParams)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(signParams[k])}`)
      .join('&');

    // 3. Xác thực chữ ký số HMAC-SHA512
    const isValidSignature = CryptoUtil.verifyHmacSha512(ENV.VNPAY_HASH_SECRET, sortedQuery, secureHash);
    if (!isValidSignature) {
      console.warn('[PAYMENT SECURITY] Webhook IPN nhận chữ ký không hợp lệ!');
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    // 4. Tìm đơn hàng tương ứng
    const orderCode = params['vnp_TxnRef'];
    const order = await this.orderRepo.findOrderByCode(orderCode);
    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 5. Kiểm tra Idempotency: Nếu đơn hàng đã hoàn tất, không xử lý lại!
    if (order.status === 'COMPLETED') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 6. Kiểm tra số tiền khớp với đơn hàng (vnp_Amount = VND * 100)
    const receivedAmount = parseInt(params['vnp_Amount'], 10) / 100;
    if (receivedAmount !== order.totalAmount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    // 7. Kiểm tra trạng thái giao dịch từ VNPay (00 = Thành công)
    const responseCode = params['vnp_ResponseCode'];
    if (responseCode !== '00') {
      await this.orderRepo.updateOrder(order.id, {
        status: 'CANCELLED',
        transactionId: params['vnp_TransactionNo'] || null,
      });
      return { RspCode: '00', Message: 'Transaction Failed, Marked Cancelled' };
    }

    // 8. Kích hoạt đơn hàng COMPLETED
    const transactionId = params['vnp_TransactionNo'];
    await this.orderRepo.updateOrder(order.id, {
      status: 'COMPLETED',
      transactionId,
      paidAt: new Date(),
    });

    // 9. Kích hoạt Enrollment cho học viên
    const enrollment: EnrollmentEntity = {
      id: `enr_${CryptoUtil.randomString(8)}`,
      userId: order.userId,
      courseId: order.courseId,
      resourceId: order.resourceId,
      status: 'ACTIVE',
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.orderRepo.createEnrollment(enrollment);

    // 10. Cấp quyền Google Drive qua Service Account nếu có email Google
    const user = await this.userRepo.findById(order.userId);
    let driveTargetId = '';
    if (order.courseId) {
      const course = await this.courseRepo.findById(order.courseId);
      if (course) driveTargetId = course.driveFolderId;
    } else if (order.resourceId) {
      const res = await this.resourceRepo.findById(order.resourceId);
      if (res) driveTargetId = res.driveFileId;
    }

    if (user?.googleEmail && driveTargetId) {
      const grantRes = await this.storageService.grantAccess(driveTargetId, user.googleEmail);
      const driveGrant: DriveAccessGrantEntity = {
        id: `dag_${CryptoUtil.randomString(8)}`,
        enrollmentId: enrollment.id,
        userId: user.id,
        driveFileOrFolderId: driveTargetId,
        googleEmail: user.googleEmail,
        permissionId: grantRes.permissionId,
        status: 'ACTIVE',
        grantedAt: new Date(),
        revokedAt: null,
      };
      await this.orderRepo.createDriveGrant(driveGrant);
    }

    // 11. Ghi log kiểm toán
    db.auditLogs.push({
      id: `aud_${CryptoUtil.randomString(8)}`,
      actorId: 'SYSTEM_WEBHOOK_VNPAY',
      action: 'PAYMENT_COMPLETED_AND_ENROLLED',
      targetType: 'ORDER',
      targetId: order.id,
      newValues: { orderCode, amount: order.totalAmount, transactionId },
      createdAt: new Date(),
    });

    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
