import { Router } from 'express';
import { LearningService } from './learning.service.js';
import { LearningController } from './learning.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';

export function createLearningRouter(): Router {
  const router = Router();
  const service = new LearningService();
  const controller = new LearningController(service);

  // 1. Kiểm tra quyền sở hữu nội dung khóa học
  router.get('/courses/:courseId/entitlement', requireAuth, controller.getCourseEntitlement);

  // 2. Lấy Signed Token ngắn hạn để stream video bài học
  router.get('/lessons/:lessonId/signed-stream-token', requireAuth, controller.getSignedStreamToken);

  // 3. Proxy Stream video hỗ trợ HTTP Range 206 (ẩn link Drive thật)
  router.get('/stream/proxy', controller.proxyStreamVideo);

  // 4. Yêu cầu cấp quyền Google Drive Reader cho email học viên
  router.post('/courses/:courseId/request-drive-access', requireAuth, controller.requestDriveAccess);
  router.post('/courses/:courseId/request-drive-permission', requireAuth, controller.requestDriveAccess);

  return router;
}
