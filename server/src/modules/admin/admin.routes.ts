import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { defaultDriveService } from '../drive/mock-drive.adapter.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { requireRole } from '../../common/middleware/rbac.middleware.js';

export function createAdminRouter(): Router {
  const router = Router();
  const service = new AdminService(defaultDriveService);
  const controller = new AdminController(service);

  // Bảo vệ bằng RBAC Guard: Bắt buộc đăng nhập & Phải có Role ADMIN
  router.use(requireAuth, requireRole('ADMIN'));

  // 1. Thống kê Dashboard
  router.get('/dashboard', controller.getDashboard);
  router.get('/dashboard/stats', controller.getDashboard);

  // 2. Quản lý Đơn hàng & Hoàn tiền
  router.get('/orders', controller.listOrders);
  router.post('/orders/:id/refund', controller.refundOrder);

  // 3. Quản lý Khóa học & Bài học (CRUD)
  router.post('/courses', controller.createCourse);
  router.put('/courses/:id', controller.updateCourse);
  router.delete('/courses/:id', controller.deleteCourse);
  router.post('/courses/:id/sections', controller.addSection);
  router.post('/sections/:sectionId/lessons', controller.addLesson);

  // 4. Quản lý Tài nguyên vẽ tranh (CRUD)
  router.get('/resources', controller.listResources);
  router.post('/resources', controller.createResource);
  router.delete('/resources/:id', controller.deleteResource);

  // 5. Quản lý Người dùng & Quyền hạn
  router.get('/users', controller.listUsers);
  router.put('/users/:id/tier', controller.updateUserTier);
  router.put('/users/:id/role', controller.updateUserRole);
  router.post('/users/:id/ban', controller.banUser);
  router.post('/users/:id/grant-credits', controller.grantCredits);

  // 6. Quản lý Cấp / Thu hồi quyền Google Drive thủ công
  router.post('/drive/grant', controller.grantDrive);
  router.post('/drive/revoke', controller.revokeDrive);

  // 7. Nhật ký kiểm toán
  router.get('/audit-logs', controller.listAuditLogs);

  return router;
}
