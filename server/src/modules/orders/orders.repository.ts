import { db, OrderEntity, EnrollmentEntity, DriveAccessGrantEntity } from '../../database/database.store.js';

export interface IOrderRepository {
  createOrder(order: OrderEntity): Promise<OrderEntity>;
  findOrderById(id: string): Promise<OrderEntity | null>;
  findOrderByCode(orderCode: string): Promise<OrderEntity | null>;
  updateOrder(id: string, updates: Partial<OrderEntity>): Promise<OrderEntity>;
  getUserOrders(userId: string): Promise<OrderEntity[]>;
  createEnrollment(enrollment: EnrollmentEntity): Promise<EnrollmentEntity>;
  findEnrollment(userId: string, courseId?: string, resourceId?: string): Promise<EnrollmentEntity | null>;
  updateEnrollment(id: string, updates: Partial<EnrollmentEntity>): Promise<EnrollmentEntity>;
  createDriveGrant(grant: DriveAccessGrantEntity): Promise<DriveAccessGrantEntity>;
  findDriveGrantByEnrollment(enrollmentId: string): Promise<DriveAccessGrantEntity | null>;
  updateDriveGrant(id: string, updates: Partial<DriveAccessGrantEntity>): Promise<DriveAccessGrantEntity>;
}

export class OrderRepository implements IOrderRepository {
  async createOrder(order: OrderEntity): Promise<OrderEntity> {
    db.orders.set(order.id, order);
    return order;
  }

  async findOrderById(id: string): Promise<OrderEntity | null> {
    return db.orders.get(id) || null;
  }

  async findOrderByCode(orderCode: string): Promise<OrderEntity | null> {
    for (const order of db.orders.values()) {
      if (order.orderCode === orderCode) {
        return order;
      }
    }
    return null;
  }

  async updateOrder(id: string, updates: Partial<OrderEntity>): Promise<OrderEntity> {
    const order = db.orders.get(id);
    if (!order) throw new Error('Order not found');
    const updated = { ...order, ...updates, updatedAt: new Date() };
    db.orders.set(id, updated);
    return updated;
  }

  async getUserOrders(userId: string): Promise<OrderEntity[]> {
    return Array.from(db.orders.values()).filter((o) => o.userId === userId);
  }

  async createEnrollment(enrollment: EnrollmentEntity): Promise<EnrollmentEntity> {
    db.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  async findEnrollment(userId: string, courseId?: string, resourceId?: string): Promise<EnrollmentEntity | null> {
    for (const e of db.enrollments.values()) {
      const matchUser = e.userId === userId;
      const matchCourse = courseId ? e.courseId === courseId : true;
      const matchResource = resourceId ? e.resourceId === resourceId : true;
      if (matchUser && matchCourse && matchResource && e.status === 'ACTIVE') {
        return e;
      }
    }
    return null;
  }

  async updateEnrollment(id: string, updates: Partial<EnrollmentEntity>): Promise<EnrollmentEntity> {
    const e = db.enrollments.get(id);
    if (!e) throw new Error('Enrollment not found');
    const updated = { ...e, ...updates, updatedAt: new Date() };
    db.enrollments.set(id, updated);
    return updated;
  }

  async createDriveGrant(grant: DriveAccessGrantEntity): Promise<DriveAccessGrantEntity> {
    db.driveAccessGrants.set(grant.id, grant);
    return grant;
  }

  async findDriveGrantByEnrollment(enrollmentId: string): Promise<DriveAccessGrantEntity | null> {
    for (const g of db.driveAccessGrants.values()) {
      if (g.enrollmentId === enrollmentId && g.status === 'ACTIVE') {
        return g;
      }
    }
    return null;
  }

  async updateDriveGrant(id: string, updates: Partial<DriveAccessGrantEntity>): Promise<DriveAccessGrantEntity> {
    const g = db.driveAccessGrants.get(id);
    if (!g) throw new Error('Grant not found');
    const updated = { ...g, ...updates };
    db.driveAccessGrants.set(id, updated);
    return updated;
  }
}
