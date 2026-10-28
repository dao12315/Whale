import assert from 'assert';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/database/database.store.js';
import { seedDatabase } from '../../src/seed/seed.js';

export async function runPurchaseFlowE2ETest(): Promise<void> {
  console.log('\n--- CHẠY E2E TEST: LUỒNG MUA -> ĐƯỢC TRUY CẬP -> HOÀN TIỀN -> MẤT QUYỀN ---');

  // Reset và seed lại DB
  db.clear();
  seedDatabase();
  try {
    const { prisma } = await import('../../src/database/prisma.js');
    await prisma.enrollment.deleteMany({
      where: {
        user: { email: 'user@shanhai.studio' },
        course: { code: '[484]' },
      },
    }).catch(() => {});
  } catch {}

  const app = createApp();

  // BƯỚC 1: Học viên đăng nhập vào hệ thống
  console.log('1. Đăng nhập tài khoản học viên (user@shanhai.studio)...');
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'user@shanhai.studio',
      password: 'UserPassword123@',
    });

  assert.strictEqual(loginRes.status, 200, 'Đăng nhập phải thành công');
  const userToken = loginRes.body.data.accessToken;
  assert.ok(userToken, 'Phải nhận được Access Token');
  console.log('   -> Đăng nhập thành công, nhận Access Token JWT');

  // BƯỚC 2: Học viên thử truy cập bài học trả phí (les-yeej-3) khi chưa mua
  console.log('2. Học viên truy cập bài học trả phí khi chưa mua...');
  const beforeBuyRes = await request(app)
    .get('/api/v1/courses/course-coloso-yeejchan/lessons/les-yeej-3/stream')
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(beforeBuyRes.status, 403, 'Phải bị chặn 403 Forbidden');
  assert.strictEqual(beforeBuyRes.body.error.code, 'PAYMENT_REQUIRED');
  console.log('   -> Bị chặn 403 PAYMENT_REQUIRED chính xác như thiết kế!');

  // BƯỚC 3: Học viên thực hiện mua khóa học bằng Xu (Credits)
  console.log('3. Học viên bấm mua khóa học bằng Xu (Credits)...');
  const checkoutRes = await request(app)
    .post('/api/v1/orders/checkout')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      itemType: 'COURSE',
      itemId: 'course-coloso-yeejchan',
      paymentMethod: 'CREDITS',
    });

  assert.strictEqual(checkoutRes.status, 201, 'Tạo đơn hàng phải thành công 201');
  assert.strictEqual(checkoutRes.body.data.status, 'COMPLETED');
  const orderId = checkoutRes.body.data.orderId;
  assert.ok(orderId, 'Phải nhận được orderId');
  console.log(`   -> Thanh toán thành công đơn hàng: ${orderId}, quyền học đã được kích hoạt!`);

  // BƯỚC 4: Học viên truy cập lại bài học trả phí sau khi mua
  console.log('4. Học viên truy cập lại bài học trả phí sau khi thanh toán...');
  const afterBuyRes = await request(app)
    .get('/api/v1/courses/course-coloso-yeejchan/lessons/les-yeej-3/stream')
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(afterBuyRes.status, 200, 'Phải truy cập thành công 200 OK');
  assert.ok(afterBuyRes.body.data.streamToken, 'Phải nhận được Signed Stream Token');
  assert.ok(afterBuyRes.body.data.streamUrl, 'Phải nhận được URL xem video');
  console.log('   -> Mở khóa thành công! Nhận Signed Stream Token và URL phát video');

  // BƯỚC 5: Quản trị viên (Admin) đăng nhập và thực hiện hoàn tiền đơn hàng
  console.log('5. Admin đăng nhập và tiến hành Hoàn tiền (Refund) đơn hàng...');
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'admin@shanhai.studio',
      password: 'AdminPassword123@',
    });

  const adminToken = adminLoginRes.body.data.accessToken;

  const refundRes = await request(app)
    .post(`/api/v1/admin/orders/${orderId}/refund`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      reason: 'Học viên yêu cầu hoàn tiền do đăng ký nhầm lớp',
    });

  assert.strictEqual(refundRes.status, 200, 'Hoàn tiền phải thành công 200 OK');
  assert.strictEqual(refundRes.body.data.status, 'REFUNDED');
  assert.strictEqual(refundRes.body.data.enrollmentsRevoked, 1, 'Phải thu hồi đúng 1 enrollment');
  console.log('   -> Admin hoàn tiền thành công: Đơn hàng REFUNDED, Enrollment REVOKED, Drive thu hồi');

  // BƯỚC 6: Học viên cố gắng truy cập lại bài học sau khi đã bị hoàn tiền -> Mất quyền!
  console.log('6. Học viên cố gắng truy cập lại bài học sau khi đã hoàn tiền...');
  const afterRefundRes = await request(app)
    .get('/api/v1/courses/course-coloso-yeejchan/lessons/les-yeej-3/stream')
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(afterRefundRes.status, 403, 'Phải bị chặn 403 Forbidden trở lại');
  assert.strictEqual(afterRefundRes.body.error.code, 'PAYMENT_REQUIRED');
  console.log('   -> LẬP TỨC BỊ CHẶN 403 PAYMENT_REQUIRED: Học viên đã mất quyền truy cập hoàn toàn!');

  console.log('\n🎉 TOÀN BỘ LUỒNG E2E TEST: MUA -> TRUY CẬP -> HOÀN TIỀN -> MẤT QUYỀN ĐÃ PASS 100%!');
}
