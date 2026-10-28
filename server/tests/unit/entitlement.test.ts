import assert from 'assert';
import { db } from '../../src/database/database.store.js';
import { seedDatabase } from '../../src/seed/seed.js';
import { checkCourseEntitlement } from '../../src/common/middleware/entitlement.middleware.js';
import { Request, Response } from 'express';

export async function runEntitlementUnitTests(): Promise<void> {
  console.log('\n--- CHẠY UNIT TEST: LOGIC PHÂN QUYỀN & ENTITLEMENT ---');

  // Khởi tạo lại DB mẫu
  db.clear();
  seedDatabase();

  const mockRes = {} as Response;

  // Test 1: Bài học miễn phí (isFreePreview = true) cho phép xem mà không cần đăng nhập
  {
    let nextCalled = false;
    let nextError: any = null;
    const req = {
      params: { courseId: 'course-coloso-yeejchan', lessonId: 'les-yeej-1' },
      user: undefined,
    } as unknown as Request;

    checkCourseEntitlement(req, mockRes, (err?: any) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(nextCalled, true, 'Next phải được gọi');
    assert.strictEqual(nextError, undefined, 'Không được có lỗi với bài preview');
    console.log('✅ PASS: Bài học preview miễn phí cho phép truy cập không cần login');
  }

  // Test 2: Bài học trả phí (isFreePreview = false), người dùng chưa mua -> Bị chặn 403
  {
    let nextError: any = null;
    const req = {
      params: { courseId: 'course-coloso-yeejchan', lessonId: 'les-yeej-3' },
      user: { sub: 'usr_student', role: 'USER', tier: 'FREE' },
    } as unknown as Request;

    checkCourseEntitlement(req, mockRes, (err?: any) => {
      nextError = err;
    });

    assert.ok(nextError, 'Phải có lỗi khi chưa mua khóa học');
    assert.strictEqual(nextError.statusCode, 403, 'Mã lỗi phải là 403');
    assert.strictEqual(nextError.code, 'PAYMENT_REQUIRED', 'Mã code lỗi phải là PAYMENT_REQUIRED');
    console.log('✅ PASS: Người dùng chưa mua khóa học bị chặn 403 PAYMENT_REQUIRED');
  }

  // Test 3: Người dùng đã có Enrollment ACTIVE -> Cho phép truy cập thành công
  {
    // Thêm bản ghi enrollment ACTIVE
    db.enrollments.set('enr_test_1', {
      id: 'enr_test_1',
      userId: 'usr_student',
      courseId: 'course-coloso-yeejchan',
      status: 'ACTIVE',
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let nextCalled = false;
    let nextError: any = null;
    const req = {
      params: { courseId: 'course-coloso-yeejchan', lessonId: 'les-yeej-3' },
      user: { sub: 'usr_student', role: 'USER', tier: 'FREE' },
    } as unknown as Request;

    checkCourseEntitlement(req, mockRes, (err?: any) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(nextError, undefined, 'Phải cho phép học viên đã mua truy cập');
    console.log('✅ PASS: Học viên có enrollment ACTIVE được phép truy cập bài học trả phí');
  }

  // Test 4: Enrollment đã bị REVOKED (do hoàn tiền) -> Lập tức chặn lại
  {
    const enr = db.enrollments.get('enr_test_1')!;
    enr.status = 'REVOKED';

    let nextError: any = null;
    const req = {
      params: { courseId: 'course-coloso-yeejchan', lessonId: 'les-yeej-3' },
      user: { sub: 'usr_student', role: 'USER', tier: 'FREE' },
    } as unknown as Request;

    checkCourseEntitlement(req, mockRes, (err?: any) => {
      nextError = err;
    });

    assert.ok(nextError, 'Enrollment bị thu hồi phải bị chặn');
    assert.strictEqual(nextError.statusCode, 403);
    console.log('✅ PASS: Enrollment trạng thái REVOKED bị chặn 403');
  }

  // Test 5: Quản trị viên (ADMIN) có toàn quyền xem mọi bài học
  {
    let nextCalled = false;
    let nextError: any = null;
    const req = {
      params: { courseId: 'course-coloso-yeejchan', lessonId: 'les-yeej-3' },
      user: { sub: 'usr_admin', role: 'ADMIN', tier: 'SUPREME' },
    } as unknown as Request;

    checkCourseEntitlement(req, mockRes, (err?: any) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(nextError, undefined);
    console.log('✅ PASS: Quản trị viên ADMIN có quyền xem mọi bài học');
  }
}
