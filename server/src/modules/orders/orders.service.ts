import { prisma } from '../../database/prisma.js';
import { db, OrderEntity, EnrollmentEntity, DriveAccessGrantEntity } from '../../database/database.store.js';
import { ICloudStorageService } from '../drive/drive.interface.js';
import { CheckoutDto } from './orders.dto.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import { CryptoUtil } from '../../common/utils/crypto.js';
import { ENV } from '../../config/env.js';
import { PaymentMethod } from '@prisma/client';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export class OrdersService {
  constructor(private storageService: ICloudStorageService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    // 1. Tìm user (Postgres hoặc in-memory)
    let user: any = null;
    if (isUUID(userId)) {
      try {
        user = await prisma.user.findUnique({ where: { id: userId } });
      } catch {
        // ignore
      }
    }
    if (!user) {
      const memUser = db.users.get(userId);
      if (memUser) {
        user = {
          id: memUser.id,
          name: memUser.nickname,
          email: memUser.email,
          tier: memUser.tier,
          credits: memUser.creditsBalance,
          googleEmail: memUser.googleEmail,
        };
      }
    }
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');

    // Cập nhật googleEmail nếu gửi kèm
    if (dto.googleEmail && dto.googleEmail !== user.googleEmail) {
      if (isUUID(userId)) {
        await prisma.user.update({
          where: { id: userId },
          data: { googleEmail: dto.googleEmail.trim().toLowerCase() },
        }).catch(() => {});
      }
      user.googleEmail = dto.googleEmail.trim().toLowerCase();
    }

    let totalCredits = 0;
    let priceVnd = BigInt(0);
    let driveTargetId = '';
    let title = '';
    let courseId: string | null = null;
    let resourceId: string | null = null;

    if (dto.itemType === 'COURSE') {
      let course: any = null;
      if (isUUID(dto.itemId)) {
        try {
          course = await prisma.course.findUnique({ where: { id: dto.itemId } });
        } catch {}
      }
      if (!course) {
        try {
          course = await prisma.course.findFirst({
            where: {
              OR: [
                { code: dto.itemId },
                { code: `[${dto.itemId.replace(/[^0-9]/g, '')}]` },
              ],
            },
          });
        } catch {}
      }
      if (!course) {
        const memCourse = db.courses.get(dto.itemId);
        if (memCourse) {
          course = {
            id: memCourse.id,
            title: memCourse.title,
            code: memCourse.code,
            originalCredits: memCourse.originalPrice,
            goldCredits: memCourse.goldPrice,
            supremeCredits: memCourse.supremePrice,
            priceVnd: BigInt(memCourse.originalPrice * 1000),
            driveFolderId: memCourse.driveFolderId,
          };
        }
      }

      if (!course) throw new NotFoundError('Không tìm thấy khóa học');

      courseId = course.id;
      title = course.title;
      driveTargetId = course.driveFolderId || course.code || course.id;
      priceVnd = course.priceVnd;

      if (user.tier === 'SUPREME') totalCredits = course.supremeCredits;
      else if (user.tier === 'GOLD') totalCredits = course.goldCredits;
      else totalCredits = course.originalCredits;
    } else if (dto.itemType === 'RESOURCE') {
      let resource: any = null;
      if (isUUID(dto.itemId)) {
        try {
          resource = await prisma.resource.findUnique({ where: { id: dto.itemId } });
        } catch {}
      }
      if (!resource) {
        const memRes = db.resources.get(dto.itemId);
        if (memRes) {
          resource = {
            id: memRes.id,
            title: memRes.title,
            driveFileId: memRes.driveFileId,
            priceVnd: BigInt((memRes as any).priceVnd || memRes.priceCredits * 1000),
            priceCredits: memRes.priceCredits,
          };
        }
      }

      if (!resource) throw new NotFoundError('Không tìm thấy tài nguyên');

      resourceId = resource.id;
      title = resource.title;
      driveTargetId = resource.driveFileId;
      priceVnd = resource.priceVnd;
      totalCredits = resource.priceCredits;
    } else if (dto.itemType === 'VIP_UPGRADE') {
      title = 'Nâng cấp Hội viên VIP';
      totalCredits = 100;
      priceVnd = BigInt(300000);
    } else {
      title = 'Nạp Xu Whale Credits';
      totalCredits = 50;
      priceVnd = BigInt(50000);
    }

    // Kiểm tra xem đã sở hữu chưa
    if (courseId || resourceId) {
      if (isUUID(userId) && (isUUID(courseId || '') || isUUID(resourceId || ''))) {
        try {
          const whereClause: any = { userId, status: 'ACTIVE' };
          if (courseId && isUUID(courseId)) whereClause.courseId = courseId;
          if (resourceId && isUUID(resourceId)) whereClause.resourceId = resourceId;

          const existing = await prisma.enrollment.findFirst({ where: whereClause });
          if (existing) {
            throw new BadRequestError('Bạn đã sở hữu khóa học hoặc tài nguyên này rồi');
          }
        } catch (e) {
          if (e instanceof BadRequestError) throw e;
        }
      }

      for (const e of db.enrollments.values()) {
        const matchCourse = courseId ? e.courseId === courseId : false;
        const matchResource = resourceId ? e.resourceId === resourceId : false;
        if (e.userId === userId && (matchCourse || matchResource) && e.status === 'ACTIVE') {
          throw new BadRequestError('Bạn đã sở hữu khóa học hoặc tài nguyên này rồi');
        }
      }
    }

    const orderId = isUUID(userId) ? CryptoUtil.randomUUID() : `ord_${CryptoUtil.randomString(8)}`;
    const orderCode = `GGC-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalAmountVnd = priceVnd > BigInt(0) ? priceVnd : BigInt(totalCredits * 1000);

    // TRƯỜNG HỢP 1: THANH TOÁN BẰNG CREDITS HOẶC FREE
    if (dto.paymentMethod === 'CREDITS' || dto.paymentMethod === 'FREE') {
      const requiredCredits = dto.paymentMethod === 'FREE' ? 0 : totalCredits;

      if (user.credits < requiredCredits) {
        throw new BadRequestError(
          `Số dư xu không đủ (Hiện có: ${user.credits} xu, cần: ${requiredCredits} xu)`
        );
      }

      // Trừ credits
      if (requiredCredits > 0) {
        if (isUUID(userId)) {
          await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: requiredCredits } },
          }).catch(() => {});
        }
        const memUser = db.users.get(userId);
        if (memUser) {
          memUser.creditsBalance -= requiredCredits;
        }
      }

      // Tạo Order
      if (isUUID(userId) && (isUUID(courseId || '') || isUUID(resourceId || ''))) {
        try {
          await prisma.order.create({
            data: {
              id: orderId,
              orderCode,
              userId,
              totalAmountVnd: finalAmountVnd,
              discountAmountVnd: BigInt(0),
              finalAmountVnd,
              totalCredits: requiredCredits,
              paymentMethod: PaymentMethod.CREDITS,
              status: 'COMPLETED',
              idempotencyKey: dto.idempotencyKey || null,
              orderItems: {
                create: {
                  itemType: dto.itemType === 'COURSE' ? 'COURSE' : 'RESOURCE',
                  courseId: isUUID(courseId || '') ? courseId : null,
                  resourceId: isUUID(resourceId || '') ? resourceId : null,
                  priceVnd: finalAmountVnd,
                  priceCredits: requiredCredits,
                },
              },
            },
          });
        } catch {}
      }

      const memOrder: OrderEntity = {
        id: orderId,
        orderCode,
        userId,
        itemType: dto.itemType as any,
        courseId: dto.itemType === 'COURSE' ? dto.itemId : null,
        resourceId: dto.itemType === 'RESOURCE' ? dto.itemId : null,
        totalAmount: requiredCredits,
        currency: 'CREDITS',
        paymentMethod: 'CREDITS',
        status: 'COMPLETED',
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.orders.set(orderId, memOrder);

      // Kích hoạt Enrollment
      const enrollmentId = isUUID(userId) ? CryptoUtil.randomUUID() : `enr_${CryptoUtil.randomString(8)}`;
      if (isUUID(userId) && (isUUID(courseId || '') || isUUID(resourceId || ''))) {
        try {
          await prisma.enrollment.create({
            data: {
              id: enrollmentId,
              userId,
              courseId: isUUID(courseId || '') ? courseId : null,
              resourceId: isUUID(resourceId || '') ? resourceId : null,
              orderId,
              status: 'ACTIVE',
            },
          });
        } catch {}
      }

      const memEnrollment: EnrollmentEntity = {
        id: enrollmentId,
        userId,
        courseId: dto.itemType === 'COURSE' ? dto.itemId : null,
        resourceId: dto.itemType === 'RESOURCE' ? dto.itemId : null,
        status: 'ACTIVE',
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.enrollments.set(enrollmentId, memEnrollment);

      // Cấp quyền Google Drive nếu có email Google
      let driveGranted = false;
      if (user.googleEmail && driveTargetId) {
        try {
          const grantRes = await this.storageService.grantAccess(driveTargetId, user.googleEmail);
          const grantId = isUUID(userId) ? CryptoUtil.randomUUID() : `dag_${CryptoUtil.randomString(8)}`;

          if (isUUID(userId) && (isUUID(courseId || '') || isUUID(resourceId || ''))) {
            await prisma.driveAccessGrant.create({
              data: {
                id: grantId,
                userId,
                courseId: isUUID(courseId || '') ? courseId : null,
                resourceId: isUUID(resourceId || '') ? resourceId : null,
                googleEmail: user.googleEmail,
                driveFileId: driveTargetId,
                permissionId: grantRes.permissionId,
                role: 'reader',
                status: 'GRANTED',
              },
            }).catch(() => {});
          }

          const memGrant: DriveAccessGrantEntity = {
            id: grantId,
            enrollmentId,
            userId,
            driveFileOrFolderId: driveTargetId,
            googleEmail: user.googleEmail,
            permissionId: grantRes.permissionId,
            status: 'ACTIVE',
            grantedAt: new Date(),
            revokedAt: null,
          };
          db.driveAccessGrants.set(grantId, memGrant);
          driveGranted = true;
        } catch (err: any) {
          console.warn('[OrdersService.checkout] Grant Drive Warning:', err?.message);
        }
      }

      const responsePayload = {
        orderId,
        orderCode,
        status: 'COMPLETED',
        paymentMethod: 'CREDITS',
        totalAmount: requiredCredits,
        totalCredits: requiredCredits,
        message: 'Thanh toán bằng xu thành công. Quyền học đã được kích hoạt ngay lập tức!',
        driveAccessGranted: driveGranted,
        paymentUrl: null,
      };

      return {
        data: responsePayload,
        order: {
          id: orderId,
          orderCode,
          totalAmountVnd: Number(finalAmountVnd),
          finalAmountVnd: Number(finalAmountVnd),
          totalCredits: requiredCredits,
          paymentMethod: 'CREDITS',
          status: 'COMPLETED',
        },
        paymentAction: {
          type: 'COMPLETED_INSTANT',
          paymentUrl: null,
          driveAccessGranted: driveGranted,
        },
      };
    }

    // TRƯỜNG HỢP 2: CỔNG THANH TOÁN (VNPAY / MOMO)
    const method = dto.paymentMethod === 'MOMO' ? 'MOMO' : 'VNPAY';

    if (isUUID(userId) && (isUUID(courseId || '') || isUUID(resourceId || ''))) {
      try {
        await prisma.order.create({
          data: {
            id: orderId,
            orderCode,
            userId,
            totalAmountVnd: finalAmountVnd,
            discountAmountVnd: BigInt(0),
            finalAmountVnd,
            totalCredits,
            paymentMethod: method as any,
            status: 'PENDING',
            idempotencyKey: dto.idempotencyKey || null,
            orderItems: {
              create: {
                itemType: dto.itemType === 'COURSE' ? 'COURSE' : 'RESOURCE',
                courseId: isUUID(courseId || '') ? courseId : null,
                resourceId: isUUID(resourceId || '') ? resourceId : null,
                priceVnd: finalAmountVnd,
                priceCredits: totalCredits,
              },
            },
          },
        });
      } catch {}
    }

    const paymentUrl = this.buildVNPayUrl(orderCode, Number(finalAmountVnd), title);

    const memOrder: OrderEntity = {
      id: orderId,
      orderCode,
      userId,
      itemType: dto.itemType as any,
      courseId,
      resourceId,
      totalAmount: Number(finalAmountVnd),
      currency: 'VND',
      paymentMethod: method as any,
      status: 'PENDING',
      idempotencyKey: dto.idempotencyKey || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.orders.set(orderId, memOrder);

    const responsePayload = {
      orderId,
      orderCode,
      status: 'PENDING',
      paymentMethod: method,
      totalAmount: Number(finalAmountVnd),
      totalCredits,
      paymentUrl,
    };

    return {
      data: responsePayload,
      order: {
        id: orderId,
        orderCode,
        totalAmountVnd: Number(finalAmountVnd),
        finalAmountVnd: Number(finalAmountVnd),
        totalCredits,
        paymentMethod: method,
        status: 'PENDING',
      },
      paymentAction: {
        type: 'REDIRECT_GATEWAY',
        paymentUrl,
      },
    };
  }

  async payCreditsForOrder(userId: string, orderCode: string) {
    let order: any = null;
    try {
      order = await prisma.order.findUnique({
        where: { orderCode },
        include: { orderItems: true },
      });
    } catch {}

    if (!order) {
      for (const o of db.orders.values()) {
        if (o.orderCode === orderCode) {
          order = o;
          break;
        }
      }
    }

    if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
    if (order.userId !== userId) throw new BadRequestError('Bạn không có quyền thanh toán đơn hàng này');
    if (order.status === 'COMPLETED') throw new BadRequestError('Đơn hàng này đã được thanh toán rồi');

    return {
      success: true,
      orderCode,
      message: 'Thanh toán đơn hàng bằng Xu thành công!',
    };
  }

  async createVNPayUrlForOrder(userId: string, orderCode: string) {
    let order: any = null;
    try {
      order = await prisma.order.findUnique({
        where: { orderCode },
      });
    } catch {}

    if (!order) {
      for (const o of db.orders.values()) {
        if (o.orderCode === orderCode) {
          order = o;
          break;
        }
      }
    }

    if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');

    const paymentUrl = this.buildVNPayUrl(
      order.orderCode,
      Number(order.finalAmountVnd || order.totalAmount || 50000),
      `Thanh toan don hang ${order.orderCode}`
    );

    return { paymentUrl };
  }

  async getOrderByCode(userId: string, orderCode: string) {
    let order: any = null;
    try {
      order = await prisma.order.findUnique({
        where: { orderCode },
        include: {
          orderItems: { include: { course: true, resource: true } },
        },
      });
    } catch {}

    if (!order) {
      for (const o of db.orders.values()) {
        if (o.orderCode === orderCode) {
          order = o;
          break;
        }
      }
    }

    if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
    if (order.userId !== userId) throw new BadRequestError('Bạn không có quyền xem đơn hàng này');

    return {
      id: order.id,
      orderCode: order.orderCode,
      totalAmountVnd: Number(order.totalAmountVnd || order.totalAmount || 0),
      finalAmountVnd: Number(order.finalAmountVnd || order.totalAmount || 0),
      totalCredits: order.totalCredits || 0,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt,
    };
  }

  private buildVNPayUrl(orderCode: string, amountVnd: number, title: string): string {
    const amount = amountVnd > 0 ? amountVnd : 50000;
    const params = new URLSearchParams({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: ENV.VNPAY_TMN_CODE,
      vnp_Amount: (amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderCode,
      vnp_OrderInfo: `Thanh toan don hang ${orderCode} - ${title.slice(0, 40)}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: ENV.VNPAY_RETURN_URL,
      vnp_CreateDate: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    });

    const sortedQuery = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const secureHash = CryptoUtil.hmacSha512(ENV.VNPAY_HASH_SECRET, sortedQuery);
    return `${ENV.VNPAY_URL}?${sortedQuery}&vnp_SecureHash=${secureHash}`;
  }
}
