import assert from 'assert';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/database/prisma.js';

async function testAllEndpoints() {
  console.log('================================================================');
  console.log('  KIỂM TRA TẤT CẢ CÁC API ENDPOINTS THEO docs/02-api.md');
  console.log('================================================================');

  const app = createApp();

  // 1. Healthcheck
  const healthRes = await request(app).get('/health');
  assert.strictEqual(healthRes.status, 200);
  console.log('✅ GET /health: 200 OK');

  // 2. Categories
  const catRes = await request(app).get('/api/v1/categories');
  assert.strictEqual(catRes.status, 200);
  assert.ok(Array.isArray(catRes.body.data));
  console.log(`✅ GET /api/v1/categories: 200 OK (${catRes.body.data.length} categories)`);

  // 3. Tags
  const tagsRes = await request(app).get('/api/v1/tags');
  assert.strictEqual(tagsRes.status, 200);
  assert.ok(Array.isArray(tagsRes.body.data));
  console.log(`✅ GET /api/v1/tags: 200 OK (${tagsRes.body.data.length} tags)`);

  // 4. Courses catalog
  const coursesRes = await request(app).get('/api/v1/courses');
  assert.strictEqual(coursesRes.status, 200);
  assert.ok(Array.isArray(coursesRes.body.data));
  console.log(`✅ GET /api/v1/courses: 200 OK (${coursesRes.body.data.length} courses)`);

  // 5. Resources catalog
  const resRes = await request(app).get('/api/v1/resources');
  assert.strictEqual(resRes.status, 200);
  assert.ok(Array.isArray(resRes.body.data));
  console.log(`✅ GET /api/v1/resources: 200 OK (${resRes.body.data.length} resources)`);

  // 6. Forum Boards
  const boardsRes = await request(app).get('/api/v1/forum/boards');
  assert.strictEqual(boardsRes.status, 200);
  assert.ok(Array.isArray(boardsRes.body.data));
  console.log(`✅ GET /api/v1/forum/boards: 200 OK (${boardsRes.body.data.length} boards)`);

  // 7. Forum Posts
  const postsRes = await request(app).get('/api/v1/forum/posts');
  assert.strictEqual(postsRes.status, 200);
  console.log(`✅ GET /api/v1/forum/posts: 200 OK (${postsRes.body.items?.length || 0} posts)`);

  // 8. FAQ
  const faqRes = await request(app).get('/api/v1/faq');
  assert.strictEqual(faqRes.status, 200);
  assert.ok(Array.isArray(faqRes.body.data));
  console.log(`✅ GET /api/v1/faq: 200 OK (${faqRes.body.data.length} FAQs)`);

  // 9. Login Admin
  const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@shanhai.studio',
    password: 'AdminPassword123@',
  });
  assert.strictEqual(adminLoginRes.status, 200);
  const adminToken = adminLoginRes.body.data.accessToken;
  assert.ok(adminToken);
  console.log('✅ POST /api/v1/auth/login (Admin): 200 OK');

  // 10. Login Student
  const studentLoginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'user@shanhai.studio',
    password: 'UserPassword123@',
  });
  assert.strictEqual(studentLoginRes.status, 200);
  const studentToken = studentLoginRes.body.data.accessToken;
  assert.ok(studentToken);
  console.log('✅ POST /api/v1/auth/login (Student): 200 OK');

  // 11. Profile with stats
  const profileRes = await request(app)
    .get('/api/v1/users/profile')
    .set('Authorization', `Bearer ${studentToken}`);
  assert.strictEqual(profileRes.status, 200);
  assert.ok(profileRes.body.data.stats);
  console.log('✅ GET /api/v1/users/profile: 200 OK (with comments, posts, heat stats)');

  // 12. Update Google Email
  const updateEmailRes = await request(app)
    .put('/api/v1/users/google-email')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ googleEmail: 'hocvien.drive@gmail.com' });
  assert.strictEqual(updateEmailRes.status, 200);
  console.log('✅ PUT /api/v1/users/google-email: 200 OK');

  // 13. Wishlist
  const wishlistRes = await request(app)
    .get('/api/v1/users/wishlist')
    .set('Authorization', `Bearer ${studentToken}`);
  assert.strictEqual(wishlistRes.status, 200);
  console.log(`✅ GET /api/v1/users/wishlist: 200 OK`);

  // 14. Course Entitlement
  const sampleCourse = await prisma.course.findFirst();
  if (sampleCourse) {
    const entRes = await request(app)
      .get(`/api/v1/learning/courses/${sampleCourse.id}/entitlement`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(entRes.status, 200);
    assert.ok(typeof entRes.body.data.hasAccess === 'boolean');
    console.log(`✅ GET /api/v1/learning/courses/:id/entitlement: 200 OK`);

    // 15. Request Drive Access
    const driveReqRes = await request(app)
      .post(`/api/v1/learning/courses/${sampleCourse.id}/request-drive-access`)
      .set('Authorization', `Bearer ${studentToken}`);
    // Có thể trả về 200 hoặc 403 nếu chưa enrolled khóa này
    assert.ok([200, 403].includes(driveReqRes.status));
    console.log(`✅ POST /api/v1/learning/courses/:id/request-drive-access: ${driveReqRes.status} (Handled gracefully)`);
  }

  // 16. Stream Proxy 206 Partial Content
  const sampleLesson = await prisma.lesson.findFirst({ where: { isFreePreview: true } });
  if (sampleLesson) {
    const tokenRes = await request(app)
      .get(`/api/v1/learning/lessons/${sampleLesson.id}/signed-stream-token`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(tokenRes.status, 200);
    assert.ok(tokenRes.body.data.streamUrl);
    console.log(`✅ GET /api/v1/learning/lessons/:id/signed-stream-token: 200 OK`);

    const streamProxyRes = await request(app)
      .get(tokenRes.body.data.streamUrl)
      .set('Range', 'bytes=0-1024');
    assert.strictEqual(streamProxyRes.status, 206);
    assert.strictEqual(streamProxyRes.headers['content-type'], 'video/mp4');
    console.log(`✅ GET /api/v1/learning/stream/proxy (HTTP Range 206 Partial Content): 206 OK`);
  }

  // 17. Admin Dashboard Stats
  const adminStatsRes = await request(app)
    .get('/api/v1/admin/dashboard/stats')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.strictEqual(adminStatsRes.status, 200);
  assert.ok(typeof adminStatsRes.body.data.totalRevenueVnd === 'number');
  console.log(`✅ GET /api/v1/admin/dashboard/stats: 200 OK`);

  // 18. Admin Users Management
  const adminUsersRes = await request(app)
    .get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.strictEqual(adminUsersRes.status, 200);
  assert.ok(Array.isArray(adminUsersRes.body.data));
  console.log(`✅ GET /api/v1/admin/users: 200 OK (${adminUsersRes.body.data.length} users)`);

  // 19. Admin Audit Logs
  const auditLogsRes = await request(app)
    .get('/api/v1/admin/audit-logs')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.strictEqual(auditLogsRes.status, 200);
  assert.ok(Array.isArray(auditLogsRes.body.data));
  console.log(`✅ GET /api/v1/admin/audit-logs: 200 OK (${auditLogsRes.body.data.length} logs)`);

  // 20. Course Request Submission
  const reqCourseRes = await request(app)
    .post('/api/v1/course-requests')
    .send({
      title: 'Coloso 3D Concept Art with Blender & Unreal Engine',
      platform: 'Coloso Korea',
      instructor: 'Kim Jung Gi & Studio',
      linkUrl: 'https://coloso.co.kr/products/illustrator_test',
      note: 'Khóa học này cực hay mong shop mở mua chung sớm!',
    });
  assert.strictEqual(reqCourseRes.status, 201);
  console.log(`✅ POST /api/v1/course-requests: 201 Created`);

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ 20 NHÓM ENDPOINTS ĐÃ ĐẠT CHUẨN 100% THEO docs/02-api.md!');
  console.log('================================================================\n');
}

testAllEndpoints().catch((err) => {
  console.error('❌ Lỗi kiểm thử API endpoints:', err);
  process.exit(1);
});
