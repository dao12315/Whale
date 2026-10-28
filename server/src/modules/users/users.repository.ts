import { prisma } from '../../database/prisma.js';
import { db, UserEntity } from '../../database/database.store.js';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  updateUser(id: string, updates: Partial<UserEntity>): Promise<UserEntity>;
  getUserEnrollments(userId: string): Promise<any[]>;
  getUserOrders(userId: string): Promise<any[]>;
  getUserNotifications(userId: string): Promise<any[]>;
  createCheckin(userId: string, creditsReward: number, pointsReward: number): Promise<{ creditsEarned: number; newBalance: number; newPoints: number }>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUuid) return db.users.get(id) || null;
      const u = await prisma.user.findUnique({ where: { id } });
      if (u) {
        return {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash || '',
          nickname: u.name,
          role: u.role as any,
          tier: (u.tier === 'ADMIN' ? 'SUPREME' : u.tier) as any,
          creditsBalance: u.credits,
          googleEmail: u.googleEmail || null,
          phone: undefined,
          avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          isActive: !u.isBanned,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      }
    } catch (err: any) {
      console.warn('[UserRepository.findById] Fallback in-memory:', err?.message);
    }
    return db.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<UserEntity>): Promise<UserEntity> {
    try {
      const pgUpdates: any = {};
      if (updates.nickname !== undefined) pgUpdates.name = updates.nickname;
      if (updates.googleEmail !== undefined) pgUpdates.googleEmail = updates.googleEmail;
      if (updates.avatarUrl !== undefined) pgUpdates.avatarUrl = updates.avatarUrl;
      if (updates.creditsBalance !== undefined) pgUpdates.credits = updates.creditsBalance;

      const u = await prisma.user.update({
        where: { id },
        data: pgUpdates,
      });

      return {
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash || '',
        nickname: u.name,
        role: u.role as any,
        tier: (u.tier === 'ADMIN' ? 'SUPREME' : u.tier) as any,
        creditsBalance: u.credits,
        googleEmail: u.googleEmail || null,
        phone: undefined,
        avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        isActive: !u.isBanned,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    } catch (err: any) {
      console.warn('[UserRepository.updateUser] Fallback in-memory:', err?.message);
    }

    const user = db.users.get(id);
    if (!user) throw new Error('User not found');
    const updated = { ...user, ...updates, updatedAt: new Date() };
    db.users.set(id, updated);
    return updated;
  }

  async getUserEnrollments(userId: string): Promise<any[]> {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          course: {
            include: { category: true },
          },
          resource: true,
        },
        orderBy: { enrolledAt: 'desc' },
      });

      if (enrollments && enrollments.length > 0) {
        return enrollments.map((e) => ({
          id: e.id,
          userId: e.userId,
          courseId: e.courseId,
          resourceId: e.resourceId,
          status: e.status,
          createdAt: e.enrolledAt,
          itemTitle: e.course?.title || e.resource?.title || 'Khóa học',
          itemCode: e.course?.code || `[RES-${e.resourceId?.slice(0, 4) || '00'}]`,
          thumbnail: e.course?.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
          driveFolderId: e.course?.code ? `drive_folder_${e.course.code.replace(/[^a-zA-Z0-9]/g, '')}` : undefined,
          progress: 15,
        }));
      }
    } catch (err: any) {
      console.warn('[UserRepository.getUserEnrollments] Fallback in-memory:', err?.message);
    }

    return Array.from(db.enrollments.values()).filter(
      (e) => e.userId === userId && e.status === 'ACTIVE'
    );
  }

  async getUserOrders(userId: string): Promise<any[]> {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: { course: true, resource: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return orders;
    } catch (err: any) {
      console.warn('[UserRepository.getUserOrders] Fallback in-memory:', err?.message);
      return Array.from(db.orders.values()).filter((o) => o.userId === userId);
    }
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const notifs = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      return notifs;
    } catch (err: any) {
      console.warn('[UserRepository.getUserNotifications] Notice:', err?.message);
      return [];
    }
  }

  async createCheckin(userId: string, creditsReward: number, pointsReward: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await prisma.checkinLog.upsert({
        where: { userId_checkinDate: { userId, checkinDate: todayStr } },
        update: {},
        create: {
          userId,
          checkinDate: todayStr,
          creditsRewarded: creditsReward,
          pointsRewarded: pointsReward,
        },
      });

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: creditsReward },
          points: { increment: pointsReward },
        },
      });

      return {
        creditsEarned: creditsReward,
        newBalance: updatedUser.credits,
        newPoints: updatedUser.points,
      };
    } catch (err: any) {
      console.warn('[UserRepository.createCheckin] Fallback:', err?.message);
      const user = await this.findById(userId);
      const newBal = (user?.creditsBalance || 0) + creditsReward;
      await this.updateUser(userId, { creditsBalance: newBal });
      return {
        creditsEarned: creditsReward,
        newBalance: newBal,
        newPoints: 100,
      };
    }
  }
}
