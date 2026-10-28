import { Router } from 'express';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { CourseRepository } from './courses.repository.js';
import { defaultDriveService } from '../drive/mock-drive.adapter.js';
import { checkCourseEntitlement } from '../../common/middleware/entitlement.middleware.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';
import { prisma } from '../../database/prisma.js';

export function createCoursesRouter(): Router {
  const router = Router();
  const repo = new CourseRepository();
  const service = new CoursesService(repo, defaultDriveService);
  const controller = new CoursesController(service);

  router.get('/', controller.listCourses);
  router.get('/:id', controller.getCourseDetail);

  // Endpoint xem bài học: Được bảo vệ bởi Entitlement Guard 2 lớp!
  router.get(
    '/:courseId/lessons/:lessonId/stream',
    optionalAuth,
    checkCourseEntitlement,
    controller.getLessonStream
  );

  // 1. Lấy danh sách bình luận khóa học từ PostgreSQL
  router.get('/:id/comments', async (req, res, next) => {
    try {
      const { id } = req.params;
      const comments = await prisma.courseComment.findMany({
        where: { courseId: id },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, tier: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true, tier: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = comments.map((c) => ({
        id: c.id,
        courseId: c.courseId,
        userId: c.userId,
        userName: c.user?.name || 'Học viên ẩn danh',
        userAvatar: c.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        userTier: c.user?.tier?.toLowerCase() || 'free',
        content: c.content,
        timestamp: new Date(c.createdAt).toLocaleDateString('vi-VN'),
        createdAt: new Date(c.createdAt).getTime(),
        likes: c.likesCount,
        hasLiked: false,
        replies: c.replies.map((r) => ({
          id: r.id,
          userId: r.userId,
          userName: r.user?.name || 'Học viên',
          userAvatar: r.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          userTier: r.user?.tier?.toLowerCase() || 'free',
          content: r.content,
          timestamp: new Date(r.createdAt).toLocaleDateString('vi-VN'),
          createdAt: new Date(r.createdAt).getTime(),
          likes: r.likesCount,
        })),
      }));

      res.json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  // 2. Đăng bình luận mới cho khóa học vào PostgreSQL
  router.post('/:id/comments', optionalAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!content || !content.trim()) {
        res.status(400).json({ error: { message: 'Nội dung bình luận không được để trống' } });
        return;
      }

      let userId = req.user?.sub;
      if (!userId) {
        const u = await prisma.user.findFirst({ where: { role: 'USER' } });
        userId = u?.id || '29b370ae-2c84-4a5d-ba31-0cf2c3ce4fcd';
      }

      const comment = await prisma.courseComment.create({
        data: {
          courseId: id,
          userId,
          content: content.trim(),
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, tier: true } },
        },
      });

      // Tăng commentsCount của khóa học
      await prisma.course.update({
        where: { id },
        data: { commentsCount: { increment: 1 } },
      }).catch(() => {});

      const formatted = {
        id: comment.id,
        courseId: comment.courseId,
        userId: comment.userId,
        userName: comment.user?.name || 'Học viên',
        userAvatar: comment.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        userTier: comment.user?.tier?.toLowerCase() || 'free',
        content: comment.content,
        timestamp: 'Vừa xong',
        createdAt: new Date(comment.createdAt).getTime(),
        likes: 0,
        hasLiked: false,
        replies: [],
      };

      res.status(201).json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  // 3. Phản hồi bình luận khóa học vào PostgreSQL
  router.post('/:id/comments/:commentId/replies', optionalAuth, async (req, res, next) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      if (!content || !content.trim()) {
        res.status(400).json({ error: { message: 'Nội dung phản hồi không được để trống' } });
        return;
      }

      let userId = req.user?.sub;
      if (!userId) {
        const u = await prisma.user.findFirst({ where: { role: 'USER' } });
        userId = u?.id || '29b370ae-2c84-4a5d-ba31-0cf2c3ce4fcd';
      }

      const reply = await prisma.commentReply.create({
        data: {
          parentCommentId: commentId,
          userId,
          content: content.trim(),
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, tier: true } },
        },
      });

      const formatted = {
        id: reply.id,
        userId: reply.userId,
        userName: reply.user?.name || 'Học viên',
        userAvatar: reply.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        userTier: reply.user?.tier?.toLowerCase() || 'free',
        content: reply.content,
        timestamp: 'Vừa xong',
        createdAt: new Date(reply.createdAt).getTime(),
        likes: 0,
      };

      res.status(201).json({ data: formatted });
    } catch (error) {
      next(error);
    }
  });

  // 4. Like khóa học trong PostgreSQL
  router.post('/:id/like', async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await prisma.course.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
        select: { id: true, likesCount: true },
      });
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
