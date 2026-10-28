import { Request, Response, NextFunction } from 'express';
import { db } from '../../database/database.store.js';
import { prisma } from '../../database/prisma.js';
import { PaymentRequiredError, NotFoundError } from '../errors/app-error.js';

/**
 * Entitlement Guard (Lớp 2: Kiểm tra quyền sở hữu nội dung)
 * Senior note: Tuyệt đối không tin cờ "hasPurchased" từ frontend!
 * Luôn truy vấn trực tiếp bảng enrollments tại server để xác thực quyền truy cập bài học/tài nguyên trả phí.
 */
export function checkCourseEntitlement(req: Request, _res: Response, next: NextFunction): void {
  const courseId = req.params.courseId || req.params.id;
  const lessonId = req.params.lessonId;
  const user = req.user;

  // 1. Kiểm tra nhanh trong in-memory store trước (cho mock data & synchronous unit tests)
  const memCourse = db.courses.get(courseId);
  if (memCourse) {
    if (lessonId) {
      const memLesson = db.lessons.get(lessonId);
      if (memLesson && memLesson.isFreePreview) {
        next();
        return;
      }
    }

    if (memCourse.originalPrice === 0 || memCourse.isFree) {
      next();
      return;
    }

    if (!user) {
      next(new PaymentRequiredError('Vui lòng đăng nhập và mở khóa khóa học để xem nội dung này'));
      return;
    }

    if (user.role === 'ADMIN') {
      next();
      return;
    }

    const hasActiveEnrollment = Array.from(db.enrollments.values()).some((enrollment) => {
      const matchesUser = enrollment.userId === user.sub;
      const matchesCourse = enrollment.courseId === courseId;
      const isActive = enrollment.status === 'ACTIVE';
      const notExpired = !enrollment.expiresAt || new Date(enrollment.expiresAt) > new Date();
      return matchesUser && matchesCourse && isActive && notExpired;
    });

    if (hasActiveEnrollment) {
      next();
      return;
    }

    if (!hasActiveEnrollment) {
      next(
        new PaymentRequiredError(
          'Bạn chưa mở khóa nội dung này. Vui lòng thanh toán qua VNPay, MoMo hoặc sử dụng Xu (Credits).'
        )
      );
      return;
    }
  }

  // 2. Nếu không có trong in-memory store, truy vấn PostgreSQL qua Prisma (Async)
  (async () => {
    try {
      let course: any = null;
      const isCourseUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
      course = await prisma.course.findFirst({
        where: isCourseUuid ? { OR: [{ id: courseId }, { code: courseId }] } : { code: courseId },
        include: { lessons: true },
      }).catch(() => null);

      if (!course) {
        next(new NotFoundError('Không tìm thấy khóa học'));
        return;
      }

      if (lessonId) {
        let lesson: any = null;
        const isLessonUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId);
        if (isLessonUuid) {
          lesson = await prisma.lesson.findUnique({ where: { id: lessonId } }).catch(() => null);
        }
        if (!lesson) {
          lesson = db.lessons.get(lessonId);
        }
        if (lesson && lesson.isFreePreview) {
          next();
          return;
        }
      }

      const isFree =
        course.isFree ||
        course.originalPrice === 0 ||
        (course.priceVnd !== undefined && Number(course.priceVnd) === 0 && course.originalCredits === 0);

      if (isFree) {
        next();
        return;
      }

      if (!user) {
        next(new PaymentRequiredError('Vui lòng đăng nhập và mở khóa khóa học để xem nội dung này'));
        return;
      }

      if (user.role === 'ADMIN') {
        next();
        return;
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: user.sub,
          courseId: course.id,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }).catch(() => null);

      if (enrollment) {
        next();
        return;
      }

      next(
        new PaymentRequiredError(
          'Bạn chưa mở khóa nội dung này. Vui lòng thanh toán qua VNPay, MoMo hoặc sử dụng Xu (Credits).'
        )
      );
    } catch (error) {
      next(error);
    }
  })();
}

/**
 * Entitlement Guard cho Tài nguyên (Resource)
 */
export function checkResourceEntitlement(req: Request, _res: Response, next: NextFunction): void {
  const resourceId = req.params.resourceId || req.params.id;
  const user = req.user;

  // 1. In-memory check
  const memResource = db.resources.get(resourceId);
  if (memResource) {
    if (memResource.isFree || memResource.priceCredits === 0) {
      next();
      return;
    }

    if (!user) {
      next(new PaymentRequiredError('Vui lòng đăng nhập và mở khóa tài nguyên để tải về'));
      return;
    }

    if (user.role === 'ADMIN') {
      next();
      return;
    }

    const hasActiveEnrollment = Array.from(db.enrollments.values()).some((enrollment) => {
      const matchesUser = enrollment.userId === user.sub;
      const matchesResource = enrollment.resourceId === resourceId;
      const isActive = enrollment.status === 'ACTIVE';
      const notExpired = !enrollment.expiresAt || new Date(enrollment.expiresAt) > new Date();
      return matchesUser && matchesResource && isActive && notExpired;
    });

    if (hasActiveEnrollment) {
      next();
      return;
    }

    if (!hasActiveEnrollment) {
      next(new PaymentRequiredError('Bạn chưa mở khóa tài nguyên này. Vui lòng sử dụng Xu (Credits) để tải.'));
      return;
    }
  }

  // 2. PostgreSQL check
  (async () => {
    try {
      let resource: any = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId);
      if (isUuid) {
        resource = await prisma.resource.findUnique({ where: { id: resourceId } }).catch(() => null);
      }

      if (!resource) {
        next(new NotFoundError('Không tìm thấy tài nguyên'));
        return;
      }

      const isFree =
        resource.isFree ||
        resource.priceCredits === 0 ||
        (resource.priceVnd !== undefined && Number(resource.priceVnd) === 0);

      if (isFree) {
        next();
        return;
      }

      if (!user) {
        next(new PaymentRequiredError('Vui lòng đăng nhập và mở khóa tài nguyên để tải về'));
        return;
      }

      if (user.role === 'ADMIN') {
        next();
        return;
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: user.sub,
          resourceId: resource.id,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }).catch(() => null);

      if (enrollment) {
        next();
        return;
      }

      next(new PaymentRequiredError('Bạn chưa mở khóa tài nguyên này. Vui lòng sử dụng Xu (Credits) để tải.'));
    } catch (error) {
      next(error);
    }
  })();
}


