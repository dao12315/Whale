import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { errorHandler } from './common/middleware/error.middleware.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createCoursesRouter } from './modules/courses/courses.routes.js';
import { createLearningRouter } from './modules/learning/learning.routes.js';
import { createCategoriesRouter, createTagsRouter } from './modules/taxonomy/taxonomy.routes.js';
import { createResourcesRouter } from './modules/resources/resources.routes.js';
import { createOrdersRouter } from './modules/orders/orders.routes.js';
import { createPaymentsRouter } from './modules/payments/payments.routes.js';
import { createAdminRouter } from './modules/admin/admin.routes.js';
import { createPostsRouter } from './modules/posts/posts.routes.js';
import { createChatRouter } from './modules/chat/chat.routes.js';
import {
  createNotificationsRouter,
  createFaqRouter,
  createCourseRequestsRouter,
  createUploadRouter,
} from './modules/misc/misc.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Cấu hình CORS linh hoạt cho localhost, 127.0.0.1 và IP mạng nội bộ (172.x, 192.168.x...)
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Cho phép requests không có origin (như mobile apps, curl, Postman)
        if (!requestOrigin) return callback(null, true);

        // Chấp thuận localhost, 127.0.0.1, hoặc bất kỳ địa chỉ IP nội bộ nào
        const isLocalNetwork =
          requestOrigin.includes('localhost') ||
          requestOrigin.includes('127.0.0.1') ||
          requestOrigin.includes('172.') ||
          requestOrigin.includes('192.168.') ||
          requestOrigin.includes('10.') ||
          requestOrigin === ENV.APP_URL;

        if (isLocalNetwork || ENV.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 2. Cookie parser cho HttpOnly Refresh Token
  app.use(cookieParser());

  // 3. Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Healthcheck
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 5. Gắn các domain router chuẩn hóa theo docs/02-api.md & docs/openapi.yaml
  const prefix = ENV.API_PREFIX;

  // 5.1 Authentication (Đăng ký, Đăng nhập, Token Refresh, Logout, /me)
  app.use(`${prefix}/auth`, createAuthRouter());

  // 5.2 Users & Profile (Hồ sơ cá nhân, Google Email nhận Drive, Check-in, Wishlist, Lịch sử)
  app.use(`${prefix}/users`, createUsersRouter());

  // 5.3 Public Catalog (Khóa học, Bình luận, Like)
  app.use(`${prefix}/courses`, createCoursesRouter());

  // 5.4 Taxonomy (Danh mục Categories & Tags)
  app.use(`${prefix}/categories`, createCategoriesRouter());
  app.use(`${prefix}/tags`, createTagsRouter());

  // 5.5 Learning & Drive Protection (Entitlement, Signed Stream Token, Proxy Video 206, Drive Grant)
  app.use(`${prefix}/learning`, createLearningRouter());

  // 5.6 Resources (Tài nguyên đồ họa tải về)
  app.use(`${prefix}/resources`, createResourcesRouter());

  // 5.7 Orders & Checkout (Đơn hàng, Mua bằng Xu, VNPay Gateway URL)
  app.use(`${prefix}/orders`, createOrdersRouter());

  // 5.8 Payments & Webhook (VNPay IPN xác minh HMAC-SHA512)
  app.use(`${prefix}/payments`, createPaymentsRouter());

  // 5.9 Admin Management (Thống kê Dashboard, CRUD Khóa học, Tài nguyên, Người dùng, Drive Grant/Revoke, Audit Logs)
  app.use(`${prefix}/admin`, createAdminRouter());

  // 5.10 Community Forum (Boards, Thảo luận, Bình luận, PK Polls)
  const postsRouter = createPostsRouter();
  app.use(`${prefix}/posts`, postsRouter);
  app.use(`${prefix}/forum`, postsRouter);

  // 5.11 Realtime Chat Community
  app.use(`${prefix}/chat`, createChatRouter());

  // 5.12 Notifications, FAQ, Course Requests & Uploads
  app.use(`${prefix}/notifications`, createNotificationsRouter());
  app.use(`${prefix}/faq`, createFaqRouter());
  app.use(`${prefix}/course-requests`, createCourseRequestsRouter());
  app.use(`${prefix}/upload`, createUploadRouter());

  // 6. Xử lý lỗi toàn cục chuẩn hóa
  app.use(errorHandler);

  return app;
}
