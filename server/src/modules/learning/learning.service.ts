import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma.js';
import { ENV } from '../../config/env.js';
import { defaultDriveService } from '../drive/mock-drive.adapter.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
} from '../../common/errors/app-error.js';

export interface StreamTokenPayload {
  userId: string;
  lessonId: string;
  driveFileId?: string | null;
  ipAddress?: string;
}

export class LearningService {
  async getCourseEntitlement(userId: string, courseId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleEmail: true },
    });

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });

    const driveGrant = await prisma.driveAccessGrant.findFirst({
      where: {
        userId,
        courseId,
        status: 'GRANTED',
      },
    });

    return {
      hasAccess: !!enrollment,
      status: enrollment ? enrollment.status : 'NONE',
      enrolledAt: enrollment?.enrolledAt ? enrollment.enrolledAt.toISOString() : null,
      googleEmail: user?.googleEmail || null,
      driveGrantStatus: driveGrant ? 'GRANTED' : enrollment ? 'PENDING' : 'NONE',
    };
  }

  async generateSignedStreamToken(userId: string, lessonId: string, ipAddress?: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: true,
      },
    });

    if (!lesson) {
      throw new NotFoundError('Không tìm thấy bài học tương ứng');
    }

    // Nếu không phải xem thử miễn phí thì kiểm tra xem user đã mua khóa học chưa
    if (!lesson.isFreePreview) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: lesson.courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        throw new ForbiddenError(
          'Bạn chưa mua khóa học này hoặc quyền truy cập chưa được kích hoạt'
        );
      }
    }

    const payload: StreamTokenPayload = {
      userId,
      lessonId: lesson.id,
      driveFileId: lesson.driveFileId,
      ipAddress,
    };

    const token = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return {
      streamUrl: `${ENV.API_PREFIX}/learning/stream/proxy?token=${token}`,
      expiresAt,
    };
  }

  verifyStreamToken(token: string): StreamTokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as StreamTokenPayload;
    } catch {
      throw new UnauthorizedError('Token stream đã hết hạn hoặc không hợp lệ');
    }
  }

  async requestDriveAccess(userId: string, courseId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại');
    }

    if (!user.googleEmail) {
      throw new BadRequestError(
        'Vui lòng cập nhật email Google trước khi nhận quyền truy cập Drive'
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenError('Bạn chưa sở hữu khóa học này');
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Khóa học không tồn tại');
    }

    const targetFolderId = course.code || course.id;
    const grantResult = await defaultDriveService.grantAccess(targetFolderId, user.googleEmail);

    await prisma.driveAccessGrant.create({
      data: {
        userId: user.id,
        courseId: course.id,
        googleEmail: user.googleEmail,
        driveFileId: targetFolderId,
        permissionId: grantResult.permissionId,
        role: 'reader',
        status: 'GRANTED',
      },
    });

    return {
      success: true,
      googleEmail: user.googleEmail,
      message:
        "Thư mục Google Drive đã được cấp quyền Reader cho email của bạn. Hãy kiểm tra hộp thư hoặc mục 'Được chia sẻ với tôi' trên Drive.",
    };
  }
}
