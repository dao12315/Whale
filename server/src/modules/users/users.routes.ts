import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';

export function createUsersRouter(): Router {
  const router = Router();
  const service = new UsersService();
  const controller = new UsersController(service);

  router.use(requireAuth);

  // 1. Hồ sơ người dùng & Thống kê ví
  router.get('/profile', controller.getProfile);
  router.get('/me', controller.getProfile);
  router.patch('/me', controller.updateMe);
  router.put('/profile', controller.updateMe);

  // 2. Cập nhật Google Email nhận Drive
  router.put('/google-email', controller.updateGoogleEmail);

  // 3. Điểm danh nhận thưởng hàng ngày
  router.post('/checkin', controller.checkin);
  router.post('/me/checkin', controller.checkin);

  // 4. Danh sách & Bật/tắt Yêu thích (Wishlist)
  router.get('/wishlist', controller.getWishlist);
  router.post('/wishlist/:courseId', controller.toggleWishlist);

  // 5. Ghi danh & Lịch sử đơn hàng
  router.get('/enrollments', controller.getMyEnrollments);
  router.get('/me/enrollments', controller.getMyEnrollments);

  router.get('/orders', controller.getMyOrders);
  router.get('/me/orders', controller.getMyOrders);

  // 6. Thông báo
  router.get('/notifications', controller.getMyNotifications);
  router.get('/me/notifications', controller.getMyNotifications);

  return router;
}
