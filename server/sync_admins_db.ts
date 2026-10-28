import { prisma } from './src/database/prisma.js';
import { CryptoUtil } from './src/common/utils/crypto.js';

async function main() {
  console.log('🔄 Đang đồng bộ hóa Admin và Khóa học trong PostgreSQL...');

  // 1. Upsert Admin 1
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@shanhai.studio' },
    update: {
      name: 'Tổng Quản Trị Viên (Admin)',
      role: 'ADMIN',
      tier: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    create: {
      email: 'admin@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('AdminPassword123@'),
      name: 'Tổng Quản Trị Viên (Admin)',
      role: 'ADMIN',
      tier: 'ADMIN',
      googleEmail: 'admin.whale@gmail.com',
      credits: 99999,
      points: 8888,
      balanceVnd: BigInt(150000000),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      bio: 'Quản trị viên toàn quyền hệ thống Whale / GGC Studio.',
    },
  });
  console.log('✅ Admin 1:', admin1.name, admin1.email);

  // 2. Upsert Admin 2
  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@shanhai.studio' },
    update: {
      name: 'Admin Hải Nam',
      role: 'ADMIN',
      tier: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    create: {
      email: 'admin2@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('AdminPassword123@'),
      name: 'Admin Hải Nam',
      role: 'ADMIN',
      tier: 'ADMIN',
      googleEmail: 'admin2.whale@gmail.com',
      credits: 88888,
      points: 7777,
      balanceVnd: BigInt(100000000),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      bio: 'Quản trị viên kỹ thuật & nội dung khóa học GGC Studio.',
    },
  });
  console.log('✅ Admin 2:', admin2.name, admin2.email);

  // 3. Cập nhật tất cả các khóa học trong PostgreSQL gán cho Admin 1 và Admin 2
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'asc' },
  });
  console.log(`📚 Đang cập nhật người sở hữu cho ${courses.length} khóa học...`);

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    // Chẵn: Admin 1, Lẻ: Admin 2
    // Đặc biệt [FREE-04]: Admin 2 (Admin Hải Nam)
    const isSpecialAdmin2 = c.code === '[FREE-04]' || c.code === '[480]' || c.code === '[FREE-02]';
    const isSpecialAdmin1 = c.code === '[FREE-01]' || c.code === '[484]' || c.code === '[FREE-03]';

    const assignToAdmin2 = isSpecialAdmin2 || (!isSpecialAdmin1 && i % 2 !== 0);

    const chosenAdmin = assignToAdmin2 ? admin2 : admin1;
    const chosenRole = assignToAdmin2 ? 'Quản trị viên kỹ thuật' : 'Tổng Quản Trị Viên';

    await prisma.course.update({
      where: { id: c.id },
      data: {
        instructorName: chosenAdmin.name,
        instructorRole: chosenRole,
        authorAvatarUrl: chosenAdmin.avatarUrl,
      },
    });
  }

  console.log('🎉 Hoàn tất đồng bộ toàn bộ khóa học gán cho Admin sở hữu trong PostgreSQL!');
}

main()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
  })
  .finally(() => prisma.$disconnect());
