import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { seedDatabase } from './seed/seed.js';

async function bootstrap() {
  console.log('='.repeat(60));
  console.log('  WHALE / SHANHAI STUDIO BACKEND API SERVER');
  console.log('='.repeat(60));

  // Tự động nạp dữ liệu mẫu ban đầu
  seedDatabase();

  const app = createApp();

  const server = app.listen(ENV.PORT, () => {
    console.log(`\n🚀 Server đang chạy tại: http://localhost:${ENV.PORT}`);
    console.log(`📡 API Base URL:       http://localhost:${ENV.PORT}${ENV.API_PREFIX}`);
    console.log(`🩺 Health Check:       http://localhost:${ENV.PORT}/health\n`);
    console.log('Tài khoản mẫu để kiểm thử:');
    console.log('1. Admin 1:   admin@shanhai.studio      / AdminPassword123@ (Tổng Quản Trị Viên)');
    console.log('2. Admin 2:   admin2@shanhai.studio     / AdminPassword123@ (Admin Hải Nam)');
    console.log('3. Student:   user@shanhai.studio       / UserPassword123@ (Số dư: 300 xu)');
    console.log('='.repeat(60));
  });

  process.on('SIGTERM', () => {
    console.log('Đang tắt server an toàn...');
    server.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error('Lỗi khởi động server:', err);
  process.exit(1);
});
