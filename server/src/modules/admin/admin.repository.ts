import { prisma } from '../../database/prisma.js';
import { db, OrderEntity, EnrollmentEntity, DriveAccessGrantEntity, AuditLogEntity } from '../../database/database.store.js';

export class AdminRepository {
  async getDashboardStats() {
    try {
      const [totalUsers, totalCourses, totalResources, activeEnrollments, completedOrders] =
        await Promise.all([
          prisma.user.count(),
          prisma.course.count(),
          prisma.resource.count(),
          prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
          prisma.order.findMany({ where: { status: 'COMPLETED' }, select: { totalAmountVnd: true } }),
        ]);

      let totalRevenueVnd = 0;
      for (const ord of completedOrders) {
        totalRevenueVnd += Number(ord.totalAmountVnd || 0);
      }

      return {
        totalUsers,
        totalCourses,
        totalResources,
        activeEnrollments,
        totalRevenueVnd,
      };
    } catch (err: any) {
      console.warn('[AdminRepository.getDashboardStats] Fallback in-memory:', err?.message);
    }

    const totalUsers = db.users.size;
    const totalCourses = db.courses.size;
    const totalResources = db.resources.size;
    const activeEnrollments = Array.from(db.enrollments.values()).filter(
      (e) => e.status === 'ACTIVE'
    ).length;

    let totalRevenueVnd = 0;
    for (const order of db.orders.values()) {
      if (order.status === 'COMPLETED' && order.currency === 'VND') {
        totalRevenueVnd += order.totalAmount;
      }
    }

    return {
      totalUsers,
      totalCourses,
      totalResources,
      activeEnrollments,
      totalRevenueVnd,
    };
  }

  async getAllOrders(): Promise<any[]> {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, googleEmail: true } },
          orderItems: {
            include: { course: true, resource: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (orders && orders.length > 0) {
        return orders.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          userId: o.userId,
          userEmail: o.user?.email || '',
          googleEmail: o.user?.googleEmail || '',
          userName: o.user?.name || 'Khách hàng',
          courseId: o.orderItems?.[0]?.courseId || null,
          resourceId: o.orderItems?.[0]?.resourceId || null,
          itemTitle: o.orderItems?.[0]?.course?.title || o.orderItems?.[0]?.resource?.title || 'Đơn hàng dịch vụ',
          itemCode: o.orderItems?.[0]?.course?.code || `[ITEM-${o.id.slice(0, 4)}]`,
          totalAmount: Number(o.totalAmountVnd) || Number(o.totalCredits),
          currency: o.paymentMethod === 'CREDITS' ? 'CREDITS' : 'VND',
          status: o.status,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        }));
      }
    } catch (err: any) {
      console.warn('[AdminRepository.getAllOrders] Fallback in-memory:', err?.message);
    }

    return Array.from(db.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findOrderById(id: string): Promise<OrderEntity | null> {
    try {
      const o = await prisma.order.findUnique({
        where: { id },
        include: {
          user: true,
          orderItems: { include: { course: true, resource: true } },
        },
      });
      if (o) {
        return {
          id: o.id,
          orderCode: o.orderCode,
          userId: o.userId,
          courseId: o.orderItems?.[0]?.courseId || undefined,
          resourceId: o.orderItems?.[0]?.resourceId || undefined,
          itemType: (o.orderItems?.[0]?.itemType?.toUpperCase() as any) || 'COURSE',
          totalAmount: Number(o.totalAmountVnd) || Number(o.totalCredits),
          currency: o.paymentMethod === 'CREDITS' ? 'CREDITS' : 'VND',
          paymentMethod: (o.paymentMethod as any) || 'CREDITS',
          status: o.status as any,
          transactionId: null,
          idempotencyKey: o.idempotencyKey || null,
          paidAt: null,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        };
      }
    } catch (err: any) {
      console.warn('[AdminRepository.findOrderById] Fallback in-memory:', err?.message);
    }
    return db.orders.get(id) || null;
  }

  async updateOrder(id: string, updates: Partial<OrderEntity>): Promise<OrderEntity> {
    try {
      const pgUpdates: any = {};
      if (updates.status) pgUpdates.status = updates.status;

      await prisma.order.update({
        where: { id },
        data: pgUpdates,
      });
    } catch (err: any) {
      console.warn('[AdminRepository.updateOrder] Fallback in-memory:', err?.message);
    }

    const order = db.orders.get(id);
    if (!order) throw new Error('Order not found');
    const updated = { ...order, ...updates, updatedAt: new Date() };
    db.orders.set(id, updated);
    return updated;
  }

  async findEnrollmentsByItem(userId: string, courseId?: string | null, resourceId?: string | null): Promise<EnrollmentEntity[]> {
    try {
      const where: any = { userId };
      if (courseId) where.courseId = courseId;
      if (resourceId) where.resourceId = resourceId;

      const enrolls = await prisma.enrollment.findMany({ where });
      if (enrolls && enrolls.length > 0) {
        return enrolls.map((e) => ({
          id: e.id,
          userId: e.userId,
          courseId: e.courseId || undefined,
          resourceId: e.resourceId || undefined,
          status: e.status as any,
          expiresAt: e.expiresAt || null,
          createdAt: e.enrolledAt,
          updatedAt: e.enrolledAt,
        }));
      }
    } catch (err: any) {
      console.warn('[AdminRepository.findEnrollmentsByItem] Fallback in-memory:', err?.message);
    }

    return Array.from(db.enrollments.values()).filter(
      (e) =>
        e.userId === userId &&
        (courseId ? e.courseId === courseId : true) &&
        (resourceId ? e.resourceId === resourceId : true) &&
        e.status === 'ACTIVE'
    );
  }

  async revokeEnrollment(id: string): Promise<void> {
    try {
      await prisma.enrollment.update({
        where: { id },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
    } catch (err: any) {
      console.warn('[AdminRepository.revokeEnrollment] Fallback in-memory:', err?.message);
    }

    const e = db.enrollments.get(id);
    if (e) {
      e.status = 'REVOKED';
      e.updatedAt = new Date();
    }
  }

  async findDriveGrantByEnrollment(enrollmentId: string): Promise<DriveAccessGrantEntity | null> {
    try {
      const g = await prisma.driveAccessGrant.findFirst({
        where: { status: 'GRANTED' },
      });
      if (g) {
        return {
          id: g.id,
          enrollmentId,
          userId: g.userId,
          googleEmail: g.googleEmail,
          driveFileOrFolderId: g.driveFileId,
          permissionId: g.permissionId || 'perm_default',
          status: 'ACTIVE',
          grantedAt: g.grantedAt,
          revokedAt: g.revokedAt,
        };
      }
    } catch (err: any) {
      console.warn('[AdminRepository.findDriveGrantByEnrollment] Fallback in-memory:', err?.message);
    }

    for (const g of db.driveAccessGrants.values()) {
      if (g.enrollmentId === enrollmentId && g.status === 'ACTIVE') {
        return g;
      }
    }
    return null;
  }

  async revokeDriveGrant(id: string): Promise<void> {
    try {
      await prisma.driveAccessGrant.update({
        where: { id },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
    } catch (err: any) {
      console.warn('[AdminRepository.revokeDriveGrant] Fallback in-memory:', err?.message);
    }

    const g = db.driveAccessGrants.get(id);
    if (g) {
      g.status = 'REVOKED';
      g.revokedAt = new Date();
    }
  }

  async getAuditLogs(): Promise<AuditLogEntity[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      if (logs && logs.length > 0) {
        return logs.map((l) => ({
          id: l.id,
          actorId: l.userId || 'system',
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId || 'SYSTEM',
          oldValues: l.oldValues,
          newValues: l.newValues,
          ipAddress: l.ipAddress || undefined,
          createdAt: l.createdAt,
        }));
      }
    } catch (err: any) {
      console.warn('[AdminRepository.getAuditLogs] Fallback in-memory:', err?.message);
    }

    return [...db.auditLogs].reverse();
  }

  async createAuditLog(log: AuditLogEntity): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          id: log.id,
          userId: log.actorId === 'system' ? null : log.actorId,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          oldValues: log.oldValues as any,
          newValues: log.newValues as any,
          ipAddress: log.ipAddress || '127.0.0.1',
        },
      });
    } catch (err: any) {
      console.warn('[AdminRepository.createAuditLog] Fallback in-memory:', err?.message);
    }

    db.auditLogs.push(log);
  }
}
