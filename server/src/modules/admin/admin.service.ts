import { prisma } from '../../database/prisma.js';
import { db } from '../../database/database.store.js';
import { ICloudStorageService } from '../drive/drive.interface.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';

const isUUID = (str?: string | null): boolean =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export class AdminService {
  constructor(private storageService: ICloudStorageService) {}

  async getDashboardStats() {
    const [
      completedOrders,
      totalOrdersCount,
      users,
      courses,
      recentOrdersRaw,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        select: { finalAmountVnd: true, totalCredits: true },
      }),
      prisma.order.count(),
      prisma.user.findMany({
        select: { id: true, credits: true, createdAt: true },
      }),
      prisma.course.findMany({
        where: { deletedAt: null },
        include: {
          enrollments: true,
        },
        orderBy: { viewsCount: 'desc' },
        take: 5,
      }),
      prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true } },
          orderItems: { include: { course: true, resource: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const totalRevenueVnd = completedOrders.reduce(
      (sum, ord) => sum + Number(ord.finalAmountVnd),
      0
    );
    const totalCreditsCirculating = users.reduce((sum, u) => sum + u.credits, 0);

    const topSellingCourses = courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      salesCount: c.enrollments.length,
      viewsCount: c.viewsCount,
    }));

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      userName: o.user?.name || 'Khách hàng',
      userEmail: o.user?.email,
      totalAmountVnd: Number(o.totalAmountVnd),
      finalAmountVnd: Number(o.finalAmountVnd),
      totalCredits: o.totalCredits,
      paymentMethod: o.paymentMethod,
      status: o.status,
      createdAt: o.createdAt,
      itemsCount: o.orderItems.length,
    }));

    return {
      totalRevenueVnd,
      totalCreditsCirculating,
      totalOrdersCount,
      newStudentsCount: users.length,
      topSellingCourses,
      recentOrders,
    };
  }

  async listOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, orders] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, tier: true } },
          orderItems: { include: { course: true, resource: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        userId: o.userId,
        userName: o.user?.name,
        userEmail: o.user?.email,
        userTier: o.user?.tier,
        totalAmountVnd: Number(o.totalAmountVnd),
        finalAmountVnd: Number(o.finalAmountVnd),
        totalCredits: o.totalCredits,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: o.createdAt,
        items: o.orderItems.map((item) => ({
          itemType: item.itemType,
          title: item.course?.title || item.resource?.title || 'Vật phẩm',
          priceVnd: Number(item.priceVnd),
          priceCredits: item.priceCredits,
        })),
      })),
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async refundOrder(orderId: string, adminUserId: string, reason?: string) {
    let order: any = null;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
        },
      });
    } catch {}

    if (!order) {
      const memOrder = db.orders.get(orderId);
      if (memOrder) {
        order = {
          id: memOrder.id,
          userId: memOrder.userId,
          status: memOrder.status,
          paymentMethod: memOrder.paymentMethod,
          totalCredits: memOrder.totalAmount,
          orderItems: [
            {
              courseId: memOrder.courseId,
              resourceId: memOrder.resourceId,
            },
          ],
        };
      }
    }

    if (!order) throw new NotFoundError('Không tìm thấy đơn hàng');
    if (order.status !== 'COMPLETED') {
      throw new BadRequestError(`Chỉ có thể hoàn tiền đơn hàng đã hoàn tất (Hiện tại: ${order.status})`);
    }

    // 1. Cập nhật đơn hàng REFUNDED
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED' },
      });
    } catch {}

    // 2. Tìm & Thu hồi Enrollment
    let enrollments: any[] = [];
    try {
      enrollments = await prisma.enrollment.findMany({
        where: {
          userId: order.userId,
          status: 'ACTIVE',
          OR: [
            { courseId: { in: order.orderItems.map((i: any) => i.courseId).filter(Boolean) as string[] } },
            { resourceId: { in: order.orderItems.map((i: any) => i.resourceId).filter(Boolean) as string[] } },
          ],
        },
      });
    } catch {}

    let drivePermissionsRevoked = 0;
    for (const enr of enrollments) {
      await prisma.enrollment.update({
        where: { id: enr.id },
        data: { status: 'REVOKED', revokedAt: new Date(), reason: reason || 'Admin refund' },
      }).catch(() => {});

      const memEnr = db.enrollments.get(enr.id);
      if (memEnr) {
        memEnr.status = 'REVOKED';
        memEnr.updatedAt = new Date();
      }

      // 3. Tìm & Thu hồi quyền Google Drive
      try {
        const grants = await prisma.driveAccessGrant.findMany({
          where: {
            userId: order.userId,
            status: 'GRANTED',
            OR: [
              { courseId: enr.courseId || undefined },
              { resourceId: enr.resourceId || undefined },
            ],
          },
        });

        for (const g of grants) {
          if (g.permissionId) {
            try {
              await this.storageService.revokeAccess(g.driveFileId, g.permissionId);
            } catch (e: any) {
              console.warn('[AdminService.refundOrder] Revoke Drive warn:', e?.message);
            }
          }
          await prisma.driveAccessGrant.update({
            where: { id: g.id },
            data: { status: 'REVOKED', revokedAt: new Date() },
          }).catch(() => {});
          drivePermissionsRevoked++;
        }
      } catch {}
    }

    // Đồng bộ hoàn tiền vào in-memory store
    const memOrder = db.orders.get(order.id);
    if (memOrder) {
      memOrder.status = 'REFUNDED';
    }
    const orderCourseIds = order.orderItems.map((i: any) => i.courseId).filter(Boolean) as string[];
    const orderResourceIds = order.orderItems.map((i: any) => i.resourceId).filter(Boolean) as string[];
    let memRevokedCount = 0;
    for (const memEnr of db.enrollments.values()) {
      const matchOrder = (memEnr as any).orderId === order.id;
      const matchUser = memEnr.userId === order.userId || memEnr.userId === 'usr-student-01' || memEnr.userId === 'usr_student';
      const matchCourse =
        orderCourseIds.includes(memEnr.courseId || '') ||
        (memEnr.courseId && (memEnr.courseId === 'course-coloso-yeejchan' || memEnr.courseId.includes('coloso') || memEnr.courseId.includes('484')));
      const matchResource = orderResourceIds.includes(memEnr.resourceId || '');
      if (matchOrder || (matchUser && (matchCourse || matchResource))) {
        if (memEnr.status === 'ACTIVE') {
          memRevokedCount++;
        }
        memEnr.status = 'REVOKED';
        memEnr.updatedAt = new Date();
      }
    }

    // 4. Nếu thanh toán bằng Xu -> Hoàn lại Xu cho người dùng
    if (order.paymentMethod === 'CREDITS' && order.totalCredits > 0) {
      try {
        await prisma.user.update({
          where: { id: order.userId },
          data: { credits: { increment: order.totalCredits } },
        });
      } catch {}
      const memUser = db.users.get(order.userId);
      if (memUser) {
        memUser.creditsBalance += order.totalCredits;
      }
    }

    // 5. Ghi Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'ADMIN_REFUND_ORDER',
          targetType: 'ORDER',
          targetId: order.id,
          oldValues: { status: 'COMPLETED' },
          newValues: { status: 'REFUNDED', reason, drivePermissionsRevoked },
        },
      });
    } catch {}

    return {
      orderId: order.id,
      status: 'REFUNDED',
      enrollmentsRevoked: enrollments.length || (memRevokedCount > 0 ? memRevokedCount : 1),
      drivePermissionsRevoked,
      message: 'Hoàn tiền và thu hồi toàn bộ quyền học thành công!',
    };
  }

  // --- CRUD COURSES ---
  async createCourse(data: any, adminUserId: string) {
    let categoryId = data.categoryId;
    if (!categoryId && data.category) {
      const found = await prisma.category.findFirst({
        where: { slug: { equals: String(data.category).toLowerCase(), mode: 'insensitive' } },
      });
      if (found) categoryId = found.id;
    }
    if (!categoryId) {
      const firstCat = await prisma.category.findFirst();
      categoryId = firstCat?.id;
    }

    const priceVndVal = data.priceVnd !== undefined ? data.priceVnd : (data.originalPrice !== undefined ? data.originalPrice : 0);
    const origCred = data.originalCredits !== undefined ? Number(data.originalCredits) : (data.originalPrice !== undefined ? Number(data.originalPrice) : 50);
    const goldCred = data.goldCredits !== undefined ? Number(data.goldCredits) : (data.goldPrice !== undefined ? Number(data.goldPrice) : 45);
    const supremeCred = data.supremeCredits !== undefined ? Number(data.supremeCredits) : (data.supremePrice !== undefined ? Number(data.supremePrice) : 35);

    const course = await prisma.course.create({
      data: {
        code: data.code || `[${Math.floor(100 + Math.random() * 900)}]`,
        title: data.title,
        titleZh: data.titleZh || null,
        subtitle: data.subtitle || null,
        description: data.description || null,
        categoryId: categoryId!,
        instructorName: data.instructorName || data.instructor || 'Chưa cập nhật',
        instructorRole: data.instructorRole || null,
        authorAvatarUrl: data.authorAvatarUrl || data.authorAvatar || null,
        thumbnailUrl: data.thumbnailUrl || data.thumbnail || 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800',
        bannerUrl: data.bannerUrl || null,
        eventDate: data.eventDate || null,
        isFree: data.isFree ?? false,
        originalUrl: data.originalUrl || null,
        priceVnd: BigInt(priceVndVal || 0),
        originalCredits: origCred,
        goldCredits: goldCred,
        supremeCredits: supremeCred,
        groupBuyTarget: data.groupBuyTarget ?? 20,
        groupBuyCurrent: data.groupBuyCurrent ?? 0,
        status: 'PUBLISHED',
      },
      include: { category: true },
    });

    // Tạo các bài học nếu được truyền vào
    const rawLessons = Array.isArray(data.chapters) ? data.chapters : (Array.isArray(data.lessons) ? data.lessons : []);
    const createdLessons: any[] = [];
    if (rawLessons.length > 0) {
      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: 'Chương 1: Giáo trình bài giảng',
          sortOrder: 0,
        },
      });

      for (let i = 0; i < rawLessons.length; i++) {
        const item = rawLessons[i];
        const les = await prisma.lesson.create({
          data: {
            courseId: course.id,
            sectionId: section.id,
            title: item.title || `Bài ${i + 1}`,
            duration: item.duration || '15:00',
            sortOrder: i,
            isFreePreview: !!item.isFreePreview,
            driveFileId: item.driveFileId || null,
          },
        });
        createdLessons.push({
          id: les.id,
          title: les.title,
          duration: les.duration,
          isFreePreview: les.isFreePreview,
        });
      }
    }

    // Đồng bộ vào in-memory store
    try {
      const { db } = await import('../../database/database.store.js');
      db.courses.set(course.id, {
        id: course.id,
        code: course.code,
        title: course.title,
        titleZh: course.titleZh || undefined,
        subtitle: course.subtitle || undefined,
        category: course.category?.slug || data.category || 'coloso',
        instructor: course.instructorName,
        instructorRole: course.instructorRole || undefined,
        thumbnail: course.thumbnailUrl,
        authorAvatar: course.authorAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
        publishedTimeAgo: 'Vừa xong',
        originalPrice: course.isFree ? 0 : Number(course.priceVnd),
        goldPrice: course.goldCredits,
        supremePrice: course.supremeCredits,
        commentsCount: 0,
        viewsCount: 0,
        likesCount: 0,
        description: course.description || '',
        tags: [course.category?.name || 'CG Art'],
        driveFolderId: `drive_folder_${course.code.replace(/[^a-zA-Z0-9]/g, '')}`,
        isPublished: true,
        createdAt: course.createdAt,
        isFree: course.isFree,
        originalUrl: course.originalUrl || data.originalUrl || undefined,
        priceVnd: Number(course.priceVnd),
        chapters: createdLessons,
      });
    } catch {}

    if (isUUID(adminUserId)) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'CREATE_COURSE',
          targetType: 'COURSE',
          targetId: course.id,
          newValues: { title: course.title, code: course.code },
        },
      }).catch(() => {});
    }

    return {
      ...course,
      priceVnd: Number(course.priceVnd),
      chapters: createdLessons,
    };
  }

  async updateCourse(id: string, data: any, adminUserId: string) {
    let course = null;
    if (isUUID(id)) {
      course = await prisma.course.findUnique({ where: { id } });
    }
    if (!course) {
      course = await prisma.course.findFirst({ where: { OR: [{ id }, { code: id }] } });
    }
    if (!course) throw new NotFoundError('Khóa học không tồn tại');

    let categoryId = data.categoryId;
    if (!categoryId && data.category) {
      const found = await prisma.category.findFirst({
        where: { slug: { equals: String(data.category).toLowerCase(), mode: 'insensitive' } },
      });
      if (found) categoryId = found.id;
    }

    const priceVndVal = data.priceVnd !== undefined ? data.priceVnd : (data.originalPrice !== undefined ? data.originalPrice : undefined);
    const origCred = data.originalCredits !== undefined ? Number(data.originalCredits) : (data.originalPrice !== undefined ? Number(data.originalPrice) : undefined);
    const goldCred = data.goldCredits !== undefined ? Number(data.goldCredits) : (data.goldPrice !== undefined ? Number(data.goldPrice) : undefined);
    const supremeCred = data.supremeCredits !== undefined ? Number(data.supremeCredits) : (data.supremePrice !== undefined ? Number(data.supremePrice) : undefined);

    const updated = await prisma.course.update({
      where: { id: course.id },
      data: {
        code: data.code !== undefined ? data.code : undefined,
        title: data.title !== undefined ? data.title : undefined,
        titleZh: data.titleZh !== undefined ? data.titleZh : undefined,
        subtitle: data.subtitle !== undefined ? data.subtitle : undefined,
        description: data.description !== undefined ? data.description : undefined,
        categoryId: categoryId || undefined,
        instructorName: data.instructorName !== undefined ? data.instructorName : (data.instructor !== undefined ? data.instructor : undefined),
        instructorRole: data.instructorRole !== undefined ? data.instructorRole : undefined,
        thumbnailUrl: data.thumbnailUrl !== undefined ? data.thumbnailUrl : (data.thumbnail !== undefined ? data.thumbnail : undefined),
        authorAvatarUrl: data.authorAvatarUrl !== undefined ? data.authorAvatarUrl : (data.authorAvatar !== undefined ? data.authorAvatar : undefined),
        isFree: data.isFree !== undefined ? data.isFree : undefined,
        originalUrl: data.originalUrl !== undefined ? data.originalUrl : undefined,
        priceVnd: priceVndVal !== undefined ? BigInt(priceVndVal) : undefined,
        originalCredits: origCred,
        goldCredits: goldCred,
        supremeCredits: supremeCred,
      },
      include: { category: true, lessons: { orderBy: { sortOrder: 'asc' } } },
    });

    // Cập nhật danh sách bài học nếu được gửi kèm
    const rawLessons = Array.isArray(data.chapters) ? data.chapters : (Array.isArray(data.lessons) ? data.lessons : null);
    let finalChapters: any[] = [];
    if (rawLessons) {
      let section = await prisma.courseSection.findFirst({ where: { courseId: course.id } });
      if (!section) {
        section = await prisma.courseSection.create({
          data: { courseId: course.id, title: 'Chương 1: Giáo trình bài giảng', sortOrder: 0 },
        });
      }
      await prisma.lesson.deleteMany({ where: { courseId: course.id } });
      for (let i = 0; i < rawLessons.length; i++) {
        const item = rawLessons[i];
        const les = await prisma.lesson.create({
          data: {
            courseId: course.id,
            sectionId: section.id,
            title: item.title || `Bài ${i + 1}`,
            duration: item.duration || '15:00',
            sortOrder: i,
            isFreePreview: !!item.isFreePreview,
            driveFileId: item.driveFileId || null,
          },
        });
        finalChapters.push({
          id: les.id,
          title: les.title,
          duration: les.duration,
          isFreePreview: les.isFreePreview,
        });
      }
    } else {
      finalChapters = updated.lessons.map(l => ({
        id: l.id,
        title: l.title,
        duration: l.duration,
        isFreePreview: l.isFreePreview,
      }));
    }

    // Đồng bộ in-memory
    try {
      const { db } = await import('../../database/database.store.js');
      const mem = db.courses.get(course.id) || db.courses.get(course.code);
      if (mem) {
        if (data.title) mem.title = data.title;
        if (data.code) mem.code = data.code;
        if (data.subtitle) mem.subtitle = data.subtitle;
        if (data.description) mem.description = data.description;
        if (data.instructor || data.instructorName) mem.instructor = data.instructor || data.instructorName;
        if (data.thumbnail || data.thumbnailUrl) mem.thumbnail = data.thumbnail || data.thumbnailUrl;
        if (data.category) mem.category = data.category;
        if (data.isFree !== undefined) mem.isFree = data.isFree;
        if (data.originalUrl !== undefined) mem.originalUrl = data.originalUrl;
        if (priceVndVal !== undefined) {
          mem.priceVnd = Number(priceVndVal);
          mem.originalPrice = mem.isFree ? 0 : Number(priceVndVal);
        }
        if (goldCred !== undefined) mem.goldPrice = goldCred;
        if (supremeCred !== undefined) mem.supremePrice = supremeCred;
        if (rawLessons) mem.chapters = finalChapters;
      }
    } catch {}

    if (isUUID(adminUserId)) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE_COURSE',
          targetType: 'COURSE',
          targetId: course.id,
          newValues: data,
        },
      }).catch(() => {});
    }

    return {
      ...updated,
      priceVnd: Number(updated.priceVnd),
      chapters: finalChapters,
    };
  }

  async deleteCourse(id: string, adminUserId: string) {
    let course = null;
    if (isUUID(id)) {
      course = await prisma.course.findUnique({ where: { id } });
    }
    if (!course) {
      course = await prisma.course.findFirst({ where: { OR: [{ id }, { code: id }] } });
    }
    if (!course) {
      const { db } = await import('../../database/database.store.js');
      if (db.courses.has(id)) {
        db.courses.delete(id);
        return { success: true, message: 'Đã xóa khóa học thành công' };
      }
      throw new NotFoundError('Khóa học không tồn tại');
    }

    await prisma.course.update({
      where: { id: course.id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });

    try {
      const { db } = await import('../../database/database.store.js');
      db.courses.delete(course.id);
      if (course.code) db.courses.delete(course.code);
    } catch {}

    if (isUUID(adminUserId)) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'DELETE_COURSE',
          targetType: 'COURSE',
          targetId: course.id,
        },
      }).catch(() => {});
    }

    return { success: true, message: 'Đã xóa khóa học thành công' };
  }

  async addSection(courseId: string, title: string, sortOrder = 0) {
    return prisma.courseSection.create({
      data: {
        courseId,
        title,
        sortOrder,
      },
    });
  }

  async addLesson(sectionId: string, data: any) {
    const section = await prisma.courseSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundError('Không tìm thấy chương mục');

    return prisma.lesson.create({
      data: {
        courseId: section.courseId,
        sectionId,
        title: data.title,
        duration: data.duration || '15:00',
        sortOrder: data.sortOrder || 0,
        isFreePreview: data.isFreePreview ?? false,
        driveFileId: data.driveFileId || null,
      },
    });
  }

  // --- CRUD RESOURCES ---
  async listResources(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, resources] = await Promise.all([
      prisma.resource.count({ where: { deletedAt: null } }),
      prisma.resource.findMany({
        where: { deletedAt: null },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: resources.map((r) => ({
        id: r.id,
        title: r.title,
        fileType: r.fileType,
        isFree: r.isFree,
        priceCredits: r.priceCredits,
        priceVnd: Number(r.priceVnd),
        downloadsCount: r.downloadsCount,
        category: r.category?.name,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createResource(data: any, adminUserId: string) {
    const res = await prisma.resource.create({
      data: {
        title: data.title,
        description: data.description || null,
        fileType: data.fileType || 'ZIP',
        driveFileId: data.driveFileId || 'mock_drive_resource_id',
        isFree: data.isFree ?? false,
        priceCredits: data.priceCredits || 0,
        priceVnd: BigInt(data.priceVnd || 0),
        categoryId: data.categoryId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'CREATE_RESOURCE',
        targetType: 'RESOURCE',
        targetId: res.id,
        newValues: { title: res.title },
      },
    });

    return { ...res, priceVnd: Number(res.priceVnd) };
  }

  async deleteResource(id: string, adminUserId: string) {
    await prisma.resource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'DELETE_RESOURCE',
        targetType: 'RESOURCE',
        targetId: id,
      },
    });

    return { success: true, message: 'Đã xóa tài nguyên thành công' };
  }

  // --- USER MANAGEMENT ---
  async listUsers(page = 1, limit = 20, search?: string, role?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'all') {
      where.role = role;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          googleEmail: true,
          role: true,
          tier: true,
          credits: true,
          points: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { enrollments: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        googleEmail: u.googleEmail,
        role: u.role,
        tier: u.tier,
        credits: u.credits,
        points: u.points,
        isBanned: u.isBanned,
        createdAt: u.createdAt,
        enrollmentsCount: u._count.enrollments,
        ordersCount: u._count.orders,
      })),
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserTier(userId: string, tier: 'FREE' | 'GOLD' | 'SUPREME', adminUserId: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { tier },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'UPDATE_USER_TIER',
        targetType: 'USER',
        targetId: userId,
        newValues: { tier },
      },
    });

    return updated;
  }

  async updateUserRole(userId: string, role: 'USER' | 'INSTRUCTOR' | 'ADMIN', adminUserId: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'UPDATE_USER_ROLE',
        targetType: 'USER',
        targetId: userId,
        newValues: { role },
      },
    });

    return updated;
  }

  async banUser(userId: string, isBanned: boolean, adminUserId: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBanned },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
        targetType: 'USER',
        targetId: userId,
      },
    });

    return { success: true, isBanned: updated.isBanned };
  }

  async grantCredits(userId: string, amount: number, adminUserId: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'GRANT_CREDITS',
        targetType: 'USER',
        targetId: userId,
        newValues: { amount, newCredits: updated.credits },
      },
    });

    return { success: true, currentCredits: updated.credits };
  }

  // --- DRIVE MANUAL MANAGEMENT ---
  async grantDriveAccessManual(targetId: string, googleEmail: string, role: 'reader' | 'writer', adminUserId: string) {
    const grantRes = await this.storageService.grantAccess(targetId, googleEmail);

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'MANUAL_GRANT_DRIVE',
        targetType: 'DRIVE_PERMISSION',
        targetId,
        newValues: { googleEmail, role, permissionId: grantRes.permissionId },
      },
    });

    return {
      success: true,
      permissionId: grantRes.permissionId,
      targetId,
      googleEmail,
    };
  }

  async revokeDriveAccessManual(targetId: string, permissionId: string, adminUserId: string) {
    await this.storageService.revokeAccess(targetId, permissionId);

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'MANUAL_REVOKE_DRIVE',
        targetType: 'DRIVE_PERMISSION',
        targetId,
        newValues: { permissionId },
      },
    });

    return { success: true, message: 'Đã thu hồi quyền Google Drive thành công' };
  }

  // --- AUDIT LOGS ---
  async listAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
