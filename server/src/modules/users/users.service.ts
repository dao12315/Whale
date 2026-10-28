import { prisma } from '../../database/prisma.js';
import { NotFoundError, BadRequestError, AppError } from '../../common/errors/app-error.js';

export interface UpdateProfileDto {
  name?: string;
  nickname?: string;
  googleEmail?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
}

export class UsersService {
  async getFullProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const checkinToday = await prisma.checkinLog.findUnique({
      where: {
        userId_checkinDate: { userId, checkinDate: todayStr },
      },
    });

    // Thống kê stats: comments, articles, posts, collections (wishlists), fans
    const [commentsCount, forumCommentsCount, postsCount, wishlistsCount] = await Promise.all([
      prisma.courseComment.count({ where: { userId } }),
      prisma.forumComment.count({ where: { authorId: userId } }),
      prisma.forumPost.count({ where: { authorId: userId } }),
      prisma.wishlist.count({ where: { userId } }),
    ]);

    const totalComments = commentsCount + forumCommentsCount;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      googleEmail: user.googleEmail,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
      role: user.role,
      credits: user.credits,
      points: user.points,
      balanceVnd: Number(user.balanceVnd),
      bio: user.bio || 'This guy is lazy and does not write anything...',
      heat: user.heat,
      dailyCheckedIn: !!checkinToday,
      stats: {
        comments: totalComments,
        articles: 0,
        posts: postsCount,
        heat: user.heat,
        collections: wishlistsCount,
        fans: 0,
      },
    };
  }

  async updateGoogleEmail(userId: string, googleEmail: string) {
    if (!googleEmail || !googleEmail.includes('@')) {
      throw new BadRequestError('Địa chỉ email Google không hợp lệ', 'VALIDATION_FAILED');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { googleEmail: googleEmail.trim().toLowerCase() },
    });

    return {
      success: true,
      googleEmail: updated.googleEmail,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name || dto.nickname || undefined,
        googleEmail: dto.googleEmail ? dto.googleEmail.trim().toLowerCase() : undefined,
        avatarUrl: dto.avatarUrl || undefined,
        bio: dto.bio || undefined,
      },
    });

    return updated;
  }

  async dailyCheckin(userId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const existingCheckin = await prisma.checkinLog.findUnique({
      where: {
        userId_checkinDate: { userId, checkinDate: todayStr },
      },
    });

    if (existingCheckin) {
      throw new BadRequestError('Hôm nay bạn đã điểm danh rồi!', 'ALREADY_CHECKED_IN');
    }

    const rewardPoints = 15;
    const rewardCredits = 5;

    await prisma.checkinLog.create({
      data: {
        userId,
        checkinDate: todayStr,
        pointsRewarded: rewardPoints,
        creditsRewarded: rewardCredits,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: rewardPoints },
        credits: { increment: rewardCredits },
      },
    });

    return {
      success: true,
      message: 'Điểm danh thành công! Nhận ngay +15 Points và +5 Credits',
      rewardPoints,
      rewardCredits,
      currentCredits: updatedUser.credits,
      currentPoints: updatedUser.points,
    };
  }

  async toggleWishlist(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundError('Khóa học không tồn tại');
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: {
          userId_courseId: { userId, courseId },
        },
      });
      return { wishlisted: false };
    } else {
      await prisma.wishlist.create({
        data: {
          userId,
          courseId,
        },
      });
      return { wishlisted: true };
    }
  }

  async getWishlist(userId: string) {
    const list = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        course: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((w) => ({
      id: w.course.id,
      code: w.course.code,
      title: w.course.title,
      titleZh: w.course.titleZh,
      subtitle: w.course.subtitle,
      category: w.course.category?.slug,
      instructor: w.course.instructorName,
      thumbnail: w.course.thumbnailUrl,
      isFree: w.course.isFree,
      originalPrice: w.course.originalCredits,
      goldPrice: w.course.goldCredits,
      supremePrice: w.course.supremeCredits,
      priceVnd: Number(w.course.priceVnd),
      addedAt: w.createdAt,
    }));
  }

  async getMyEnrollments(userId: string) {
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

    return enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      courseId: e.courseId,
      resourceId: e.resourceId,
      status: e.status,
      enrolledAt: e.enrolledAt,
      course: e.course
        ? {
            id: e.course.id,
            code: e.course.code,
            title: e.course.title,
            thumbnail: e.course.thumbnailUrl,
            category: e.course.category?.slug,
            instructor: e.course.instructorName,
          }
        : null,
      resource: e.resource
        ? {
            id: e.resource.id,
            title: e.resource.title,
            fileType: e.resource.fileType,
          }
        : null,
    }));
  }

  async getMyOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: { course: true, resource: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = orders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      totalAmountVnd: Number(o.totalAmountVnd),
      discountAmountVnd: Number(o.discountAmountVnd),
      finalAmountVnd: Number(o.finalAmountVnd),
      totalCredits: o.totalCredits,
      paymentMethod: o.paymentMethod,
      status: o.status,
      createdAt: o.createdAt,
      items: o.orderItems.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        title: item.course?.title || item.resource?.title || 'Vật phẩm',
        code: item.course?.code,
        priceCredits: item.priceCredits,
        priceVnd: Number(item.priceVnd),
      })),
    }));

    return {
      data: formatted,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getMyNotifications(userId: string) {
    const notifs = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return notifs;
  }
}
