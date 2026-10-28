import assert from 'assert';
import { db, OrderEntity } from '../../src/database/database.store.js';
import { seedDatabase } from '../../src/seed/seed.js';
import { PaymentsService } from '../../src/modules/payments/payments.service.js';
import { OrderRepository } from '../../src/modules/orders/orders.repository.js';
import { UserRepository } from '../../src/modules/users/users.repository.js';
import { CourseRepository } from '../../src/modules/courses/courses.repository.js';
import { ResourceRepository } from '../../src/modules/resources/resources.repository.js';
import { MockDriveStorageAdapter } from '../../src/modules/drive/mock-drive.adapter.js';
import { CryptoUtil } from '../../src/common/utils/crypto.js';
import { ENV } from '../../src/config/env.js';

export async function runPaymentWebhookUnitTests(): Promise<void> {
  console.log('\n--- CHẠY UNIT TEST: XÁC MINH CHỮ KÝ WEBHOOK & IDEMPOTENCY ---');

  db.clear();
  seedDatabase();

  const orderRepo = new OrderRepository();
  const userRepo = new UserRepository();
  const courseRepo = new CourseRepository();
  const resourceRepo = new ResourceRepository();
  const driveService = new MockDriveStorageAdapter();

  const paymentsService = new PaymentsService(
    orderRepo,
    userRepo,
    courseRepo,
    resourceRepo,
    driveService
  );

  // Tạo một đơn hàng mẫu ở trạng thái PENDING
  const orderCode = 'GGC-TEST-888';
  const testOrder: OrderEntity = {
    id: 'ord_test_888',
    orderCode,
    userId: 'usr_student',
    itemType: 'COURSE',
    courseId: 'course-coloso-yeejchan',
    totalAmount: 50000, // 50,000 VND
    currency: 'VND',
    paymentMethod: 'VNPAY',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await orderRepo.createOrder(testOrder);

  // Hàm tiện ích tạo chữ ký VNPay
  function buildVNPayParams(data: Record<string, string>, secret: string): Record<string, string> {
    const sorted = Object.keys(data)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(data[k])}`)
      .join('&');
    const hash = CryptoUtil.hmacSha512(secret, sorted);
    return { ...data, vnp_SecureHash: hash };
  }

  // Test 1: Chữ ký HMAC-SHA512 sai lệch -> Bị từ chối ngay lập tức (RspCode 97)
  {
    const badParams = {
      vnp_Amount: '5000000',
      vnp_ResponseCode: '00',
      vnp_TxnRef: orderCode,
      vnp_TransactionNo: '145920',
      vnp_SecureHash: 'invalid_fake_checksum_hash_value',
    };

    const res = await paymentsService.processVNPayIpn(badParams);
    assert.strictEqual(res.RspCode, '97', 'Phải từ chối chữ ký giả mạo với mã 97');
    console.log('✅ PASS: Webhook từ chối chữ ký giả mạo HMAC-SHA512 (RspCode 97)');
  }

  // Test 2: Chữ ký đúng, số tiền đúng -> Kích hoạt đơn hàng, tạo Enrollment, cấp Drive
  {
    const validRaw = {
      vnp_Amount: '5000000', // 50,000 VND * 100
      vnp_ResponseCode: '00',
      vnp_TxnRef: orderCode,
      vnp_TransactionNo: 'VN123456789',
    };
    const validParams = buildVNPayParams(validRaw, ENV.VNPAY_HASH_SECRET);

    const res = await paymentsService.processVNPayIpn(validParams);
    assert.strictEqual(res.RspCode, '00', 'Giao dịch thành công phải trả mã 00');

    // Kiểm tra đơn hàng đã đổi sang COMPLETED
    const updatedOrder = await orderRepo.findOrderById(testOrder.id);
    assert.strictEqual(updatedOrder?.status, 'COMPLETED');
    assert.strictEqual(updatedOrder?.transactionId, 'VN123456789');

    // Kiểm tra Enrollment đã được tạo
    const enrollment = await orderRepo.findEnrollment('usr_student', 'course-coloso-yeejchan');
    assert.ok(enrollment, 'Enrollment phải được tạo thành công');
    assert.strictEqual(enrollment?.status, 'ACTIVE');

    // Kiểm tra Google Drive đã được cấp quyền cho student.whale@gmail.com
    assert.strictEqual(driveService.grantedPermissions.size, 1);
    console.log('✅ PASS: Webhook hợp lệ kích hoạt đơn hàng, tạo enrollment và cấp quyền Google Drive (RspCode 00)');
  }

  // Test 3: Idempotency - Webhook gửi lặp lại lần 2 khi đơn hàng đã COMPLETED
  {
    const duplicateRaw = {
      vnp_Amount: '5000000',
      vnp_ResponseCode: '00',
      vnp_TxnRef: orderCode,
      vnp_TransactionNo: 'VN123456789',
    };
    const duplicateParams = buildVNPayParams(duplicateRaw, ENV.VNPAY_HASH_SECRET);

    const res = await paymentsService.processVNPayIpn(duplicateParams);
    assert.strictEqual(res.RspCode, '02', 'Đơn hàng đã xử lý phải trả RspCode 02 (Order already confirmed)');

    // Đảm bảo không tạo thêm Enrollment thứ 2
    const totalEnrollments = Array.from(db.enrollments.values()).filter(
      (e) => e.userId === 'usr_student' && e.courseId === 'course-coloso-yeejchan'
    );
    assert.strictEqual(totalEnrollments.length, 1, 'Không được tạo trùng enrollment khi retry');
    console.log('✅ PASS: Cơ chế Idempotent ngăn chặn xử lý lặp đơn hàng (RspCode 02)');
  }

  // Test 4: Số tiền gửi trong Webhook không khớp với đơn hàng -> Báo lỗi RspCode 04
  {
    const fakeOrderCode = 'GGC-TEST-WRONG-AMOUNT';
    await orderRepo.createOrder({
      id: 'ord_wrong_amount',
      orderCode: fakeOrderCode,
      userId: 'usr_student',
      itemType: 'COURSE',
      courseId: 'course-coloso-yeejchan',
      totalAmount: 100000, // Cần 100,000 VND
      currency: 'VND',
      paymentMethod: 'VNPAY',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const wrongAmountRaw = {
      vnp_Amount: '5000000', // Gửi có 50,000 VND
      vnp_ResponseCode: '00',
      vnp_TxnRef: fakeOrderCode,
      vnp_TransactionNo: 'VN999',
    };
    const wrongAmountParams = buildVNPayParams(wrongAmountRaw, ENV.VNPAY_HASH_SECRET);

    const res = await paymentsService.processVNPayIpn(wrongAmountParams);
    assert.strictEqual(res.RspCode, '04', 'Số tiền không khớp phải trả về mã 04');
    console.log('✅ PASS: Phát hiện và từ chối khi số tiền webhook không khớp đơn hàng (RspCode 04)');
  }
}
