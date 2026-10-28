import { db } from '../database/database.store.js';
import { getSeedUsers, getSeedCourses, getSeedResources } from './seed-data.js';

export function seedDatabase(): void {
  console.log('[SEED] Đang khởi tạo dữ liệu mẫu cho hệ thống Whale...');

  // 1. Seed Users
  const users = getSeedUsers();
  for (const user of users) {
    db.users.set(user.id, user);
  }
  console.log(`[SEED] Đã tạo ${users.length} người dùng (Admin, Instructor, Student)`);

  // 2. Seed Courses & Lessons
  const { courses, lessons } = getSeedCourses();
  for (const course of courses) {
    db.courses.set(course.id, course);
  }
  for (const lesson of lessons) {
    db.lessons.set(lesson.id, lesson);
  }
  console.log(`[SEED] Đã tạo ${courses.length} khóa học và ${lessons.length} bài học`);

  // 3. Seed Resources
  const resources = getSeedResources();
  for (const res of resources) {
    db.resources.set(res.id, res);
  }
  console.log(`[SEED] Đã tạo ${resources.length} tài nguyên đồ họa (Cọ vẽ, Texture, PSD)`);

  console.log('[SEED] Hoàn tất nạp dữ liệu mẫu thành công!');
}

// Nếu chạy trực tiếp tệp này
if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase();
}
