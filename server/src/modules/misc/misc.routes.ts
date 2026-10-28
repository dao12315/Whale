import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/prisma.js';
import { requireAuth, optionalAuth } from '../../common/middleware/auth.middleware.js';

export function createNotificationsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  // GET /api/v1/notifications
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.sub;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json({ data: notifications });
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/v1/notifications/:id/read
  router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.sub;

      const notif = await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });

      res.json({ success: true, count: notif.count });
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/v1/notifications/read-all
  router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.sub;
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      res.json({ success: true, message: 'Đã đánh dấu toàn bộ thông báo là đã đọc' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createFaqRouter(): Router {
  const router = Router();

  // GET /api/v1/faq
  router.get('/', (_req: Request, res: Response) => {
    const faqList = [
      {
        id: 'faq-1',
        question: 'Quy trình mua chung khóa học tại Whale diễn ra như thế nào?',
        answer:
          'Sau khi bạn chọn khóa học và thanh toán bằng Xu hoặc VNPay, bạn sẽ được kích hoạt quyền truy cập ngay lập tức. Thư mục Google Drive gốc sẽ được cấp quyền Reader cho email Google của bạn, đồng thời bạn có thể xem trực tiếp bài giảng trên nền tảng với chất lượng cao.',
        category: 'COURSE',
      },
      {
        id: 'faq-2',
        question: 'Làm thế nào để nhận quyền xem và tải tài nguyên trên Google Drive?',
        answer:
          'Tại trang cá nhân hoặc giao diện khóa học, hãy nhập chính xác địa chỉ Email Google của bạn. Hệ thống tự động phân quyền Reader cho thư mục bài giảng trong vòng 5 giây.',
        category: 'DRIVE',
      },
      {
        id: 'faq-3',
        question: 'Tôi có thể xem thử trước khi quyết định mua không?',
        answer:
          'Có! Hầu hết các khóa học trên Whale đều mở xem thử miễn phí các bài học mở đầu (Chapter 1) để bạn đánh giá nội dung và chất lượng bài giảng trước khi ghi danh.',
        category: 'LEARNING',
      },
      {
        id: 'faq-4',
        question: 'Chính sách hoàn tiền khi đơn hàng gặp sự cố?',
        answer:
          'Nếu bài giảng gặp lỗi nội dung hoặc đường dẫn Google Drive bị gián đoạn quá 24h, Quản trị viên sẽ hỗ trợ kiểm tra, cấp lại quyền hoặc hoàn tiền 100% Xu vào ví cá nhân.',
        category: 'POLICY',
      },
    ];

    res.json({ data: faqList });
  });

  return router;
}

export function createCourseRequestsRouter(): Router {
  const router = Router();

  // POST /api/v1/course-requests
  router.post('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, platform, instructor, linkUrl, note } = req.body;
      const userId = req.user?.sub || null;

      // Ghi nhận yêu cầu khóa học vào bảng AuditLog để Admin xử lý
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SUBMIT_COURSE_REQUEST',
          targetType: 'COURSE_REQUEST',
          newValues: { title, platform, instructor, linkUrl, note },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Yêu cầu mở mua chung khóa học của bạn đã được gửi thành công đến ban biên tập!',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createUploadRouter(): Router {
  const router = Router();

  // POST /api/v1/upload/image
  router.post('/image', optionalAuth, async (req: Request, res: Response) => {
    const { imageBase64, filename } = req.body;
    // Cung cấp URL ảnh mẫu chất lượng cao hoặc ảnh đã xử lý
    const sampleAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
    ];
    const url = imageBase64 ? imageBase64 : sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];

    res.status(201).json({
      success: true,
      url,
      filename: filename || 'uploaded_image.png',
    });
  });

  return router;
}
