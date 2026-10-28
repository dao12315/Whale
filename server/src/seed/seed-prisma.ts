import { prisma } from '../database/prisma.js';
import { CryptoUtil } from '../common/utils/crypto.js';
import { INITIAL_COURSES } from '../../../src/data/coursesData.js';
import { FORUM_BOARDS, INITIAL_FORUM_POSTS } from '../../../src/data/forumData.js';

export async function seedPrismaDatabase(): Promise<void> {
  console.log('============================================================');
  console.log('🐘 BẮT ĐẦU NẠP DỮ LIỆU VÀO POSTGRESQL THỰC TẾ QUA PRISMA...');
  console.log('============================================================');

  // 1. Tạo Users mẫu
  console.log('1. Đang nạp danh sách Người Dùng (Users)...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shanhai.studio' },
    update: {},
    create: {
      email: 'admin@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('AdminPassword123@'),
      name: 'Tổng Quản Trị Viên (Admin)',
      role: 'ADMIN',
      tier: 'SUPREME',
      googleEmail: 'admin.whale@gmail.com',
      credits: 99999,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: 'instructor@shanhai.studio' },
    update: {},
    create: {
      email: 'instructor@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('Instructor123@'),
      name: 'Master Tan Zhen',
      role: 'INSTRUCTOR',
      tier: 'GOLD',
      googleEmail: 'tan.zhen@gmail.com',
      credits: 2500,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'user@shanhai.studio' },
    update: {},
    create: {
      email: 'user@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('UserPassword123@'),
      name: 'Vân Du Họa Sĩ',
      role: 'USER',
      tier: 'FREE',
      googleEmail: 'student.whale@gmail.com',
      credits: 300,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    },
  });

  console.log(`   -> Đã tạo/đồng bộ 3 người dùng: ${adminUser.email}, ${instructorUser.email}, ${studentUser.email}`);

  // 2. Tạo Danh mục (Categories)
  console.log('2. Đang nạp danh mục Khóa học (Categories)...');
  const categoriesMap = new Map<string, string>();
  const categoryDefs = [
    { slug: 'coloso', name: 'Coloso Masterclass', sortOrder: 1 },
    { slug: 'blender', name: 'Blender 3D Modeling & Animation', sortOrder: 2 },
    { slug: 'color', name: 'Color Grading & DaVinci Resolve', sortOrder: 3 },
    { slug: 'character', name: 'Character Art & Anatomy', sortOrder: 4 },
    { slug: 'unreal', name: 'Unreal Engine 5 Cinematic', sortOrder: 5 },
    { slug: 'landscape', name: 'Landscape & Environment Painting', sortOrder: 6 },
    { slug: 'photoshop', name: 'Photoshop Digital Art', sortOrder: 7 },
  ];

  for (const cat of categoryDefs) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder },
    });
    categoriesMap.set(cat.slug, saved.id);
  }

  // 3. Nạp danh sách Khóa học & Bài học từ coursesData.ts
  console.log('3. Đang nạp toàn bộ Khóa Học & Bài Học vào PostgreSQL...');
  let courseCount = 0;
  let lessonCount = 0;

  for (const c of INITIAL_COURSES) {
    const categoryId = categoriesMap.get(c.category) || categoriesMap.get('coloso')!;
    
    // Tìm hoặc tạo khóa học
    const existingCourse = await prisma.course.findUnique({ where: { code: c.code } });
    let courseId = existingCourse?.id;

    if (!existingCourse) {
      const created = await prisma.course.create({
        data: {
          code: c.code,
          title: c.title,
          titleZh: c.titleZh || null,
          subtitle: c.subtitle || null,
          description: c.description || null,
          categoryId,
          instructorName: c.instructor || 'Whale Master Artist',
          instructorRole: c.instructorRole || 'Senior Digital Painter',
          authorAvatarUrl: c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          thumbnailUrl: c.thumbnail,
          isFree: c.originalPrice === 0,
          originalUrl: c.originalUrl || null,
          originalCredits: c.originalPrice,
          goldCredits: c.goldPrice,
          supremeCredits: c.supremePrice,
          viewsCount: c.viewsCount || 100,
          likesCount: c.likesCount || 10,
          commentsCount: c.commentsCount || 0,
          eventDate: c.eventDate || null,
          status: 'PUBLISHED',
        },
      });
      courseId = created.id;
      courseCount++;
    }

    // Nạp danh sách bài học (Lessons)
    const chapters = c.chapters && c.chapters.length > 0 ? c.chapters : [
      { id: `${c.code}-ch1`, title: '1. Khái quát tư duy & Kỹ thuật cốt lõi', duration: '20:15', isFreePreview: true },
      { id: `${c.code}-ch2`, title: '2. Quy trình phác thảo và phân bổ giá trị sáng tối', duration: '35:40', isFreePreview: false },
      { id: `${c.code}-ch3`, title: '3. Đi nét chi tiết, tô màu và đổ bóng điện ảnh', duration: '45:10', isFreePreview: false },
      { id: `${c.code}-ch4`, title: '4. Tinh chỉnh màu sắc cuối cùng & Xuất file in ấn', duration: '25:30', isFreePreview: false },
    ];

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const lessonTitle = ch.title;
      const existingLesson = await prisma.lesson.findFirst({
        where: { courseId: courseId!, title: lessonTitle },
      });

      if (!existingLesson) {
        await prisma.lesson.create({
          data: {
            courseId: courseId!,
            title: lessonTitle,
            duration: ch.duration || '25:00',
            sortOrder: i + 1,
            isFreePreview: !!ch.isFreePreview,
            driveFileId: `drive_file_${c.code.replace(/[^a-zA-Z0-9]/g, '')}_${i + 1}`,
          },
        });
        lessonCount++;
      }
    }
  }

  console.log(`   -> Đã đồng bộ ${INITIAL_COURSES.length} khóa học và ${lessonCount} bài giảng vào PostgreSQL!`);

  // 4. Nạp Diễn đàn (Forum Boards & Posts)
  console.log('4. Đang nạp Diễn Đàn & Bài Viết vào PostgreSQL...');
  for (const b of FORUM_BOARDS) {
    await prisma.forumBoard.upsert({
      where: { id: b.id },
      update: { title: b.title, description: b.description },
      create: {
        id: b.id,
        title: b.title,
        description: b.description,
        iconType: b.iconType,
        postsCount: b.postsCount || 0,
        heatCount: b.heatCount || 0,
        isLocked: !!b.isLocked,
        hasFlameBadge: !!b.hasFlameBadge,
      },
    });
  }

  for (const post of INITIAL_FORUM_POSTS) {
    const existingPost = await prisma.forumPost.findFirst({ where: { title: post.title } });
    if (!existingPost) {
      await prisma.forumPost.create({
        data: {
          boardId: post.boardId || 'board-inspiration',
          authorId: studentUser.id,
          title: post.title,
          content: post.content || 'Nội dung chia sẻ tài liệu và kinh nghiệm kỹ xảo vẽ tranh số.',
          coverImageUrl: post.images?.[0] || null,
          readsCount: post.readsCount || 50,
          likesCount: post.likesCount || 10,
          commentsCount: post.commentsCount || 0,
          status: 'PUBLISHED',
        },
      });
    }
  }

  console.log(`   -> Đã đồng bộ ${FORUM_BOARDS.length} chuyên mục và ${INITIAL_FORUM_POSTS.length} bài viết diễn đàn!`);
  console.log('============================================================');
  console.log('✅ HOÀN TẤT SEED CSDL POSTGRESQL THÀNH CÔNG RỰC RỠ!');
  console.log('============================================================');
}

if (process.argv[1]?.includes('seed-prisma.ts')) {
  seedPrismaDatabase()
    .catch((err) => {
      console.error('Lỗi khi seed Prisma:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
