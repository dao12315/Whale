import { prisma } from './src/database/prisma.js';
import { INITIAL_COURSES, INITIAL_COMMENTS } from '../src/data/coursesData.js';

async function resetTo3ColosoCourses() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU XÓA SẠCH KHÓA CŨ VÀ NẠP ĐÚNG 3 KHÓA COLOSO VÀO POSTGRESQL');
  console.log('================================================================');

  // 1. Xóa các dữ liệu phụ thuộc của khóa học cũ
  console.log('1. Đang dọn dẹp toàn bộ dữ liệu khóa học cũ trong PostgreSQL...');
  await prisma.commentReply.deleteMany({});
  await prisma.courseComment.deleteMany({});
  await prisma.courseLike.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.driveAccessGrant.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.courseTag.deleteMany({});
  await prisma.courseMedia.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.courseSection.deleteMany({});
  await prisma.resource.updateMany({
    where: { courseId: { not: null } },
    data: { courseId: null },
  });

  const deleteResult = await prisma.course.deleteMany({});
  console.log(`   -> Đã xóa thành công ${deleteResult.count} khóa học cũ khỏi database!`);

  // 2. Đảm bảo các Categories cần thiết tồn tại
  console.log('2. Đồng bộ các danh mục (Categories)...');
  const categoryDefs = [
    { slug: 'coloso', name: 'Coloso Masterclass', sortOrder: 1 },
    { slug: 'character', name: 'Character Art & Anatomy', sortOrder: 2 },
    { slug: 'color', name: 'Color Sense & Grading', sortOrder: 3 },
    { slug: 'blender', name: 'Blender 3D Modeling', sortOrder: 4 },
  ];

  const catMap = new Map<string, string>();
  for (const cat of categoryDefs) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder },
    });
    catMap.set(cat.slug, saved.id);
  }

  // 3. Tìm hoặc tạo người dùng admin
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });
  const normalUser = await prisma.user.findFirst({
    where: { role: 'USER' },
  });

  // 4. Nạp 3 khóa học Coloso mới
  console.log('3. Đang nạp đúng 3 khóa học Coloso...');
  for (const c of INITIAL_COURSES) {
    const categoryId = catMap.get(c.category) || catMap.get('coloso')!;

    const course = await prisma.course.create({
      data: {
        code: c.code,
        title: c.title,
        titleZh: c.titleZh || null,
        subtitle: c.subtitle || null,
        description: c.description || null,
        categoryId,
        instructorName: c.instructor,
        instructorRole: c.instructorRole || 'Quản trị viên',
        authorAvatarUrl: c.authorAvatar,
        thumbnailUrl: c.thumbnail,
        bannerUrl: c.thumbnail,
        isFree: c.isFree || c.originalPrice === 0,
        originalUrl: c.originalUrl,
        priceVnd: BigInt(c.priceVnd || 0),
        originalCredits: c.originalPrice,
        goldCredits: c.goldPrice,
        supremeCredits: c.supremePrice,
        viewsCount: c.viewsCount || 1000,
        likesCount: c.likesCount || 100,
        commentsCount: c.commentsCount || 10,
        eventDate: c.eventDate || null,
        status: 'PUBLISHED',
      },
    });

    console.log(`   + Đã tạo khóa: ${course.code} - ${course.title}`);
    console.log(`     Link gốc Coloso: ${course.originalUrl}`);
    console.log(`     Người phụ trách: ${course.instructorName}`);

    // Tạo các Section & Lessons
    const defaultChapters = c.chapters || [];
    for (let i = 0; i < defaultChapters.length; i++) {
      const ch = defaultChapters[i];
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: ch.title,
          duration: ch.duration,
          sortOrder: i + 1,
          isFreePreview: !!ch.isFreePreview,
          driveFileId: `drive_file_${c.code.replace(/[^a-zA-Z0-9]/g, '')}_${i + 1}`,
        },
      });
    }
    console.log(`     -> Đã thêm ${defaultChapters.length} bài học`);

    // Gán Tags
    for (const tagText of c.tags) {
      const tagSlug = tagText.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: { name: tagText },
        create: { slug: tagSlug, name: tagText },
      });
      await prisma.courseTag.create({
        data: { courseId: course.id, tagId: tag.id },
      });
    }

    // Nạp bình luận mẫu
    const comments = INITIAL_COMMENTS[c.id] || [];
    for (const comm of comments) {
      if (adminUser || normalUser) {
        await prisma.courseComment.create({
          data: {
            courseId: course.id,
            userId: comm.userTier === 'supreme' || comm.userTier === 'admin' ? adminUser?.id || normalUser!.id : normalUser?.id || adminUser!.id,
            content: comm.content,
            likesCount: comm.likes,
          },
        });
      }
    }
  }

  // 5. Kiểm tra kết quả trong Database
  const finalCourses = await prisma.course.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      originalUrl: true,
      instructorName: true,
      originalCredits: true,
      priceVnd: true,
      isFree: true,
      _count: { select: { lessons: true } },
    },
    orderBy: { code: 'asc' },
  });

  console.log('\n================================================================');
  console.log(`🎉 HOÀN TẤT! HIỆN TẠI HỆ THỐNG CHỈ CÒN ĐÚNG ${finalCourses.length} KHÓA HỌC:`);
  console.log('================================================================');
  finalCourses.forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.code}] ${c.title}`);
    console.log(`   - Link gốc: ${c.originalUrl}`);
    console.log(`   - Người đăng: ${c.instructorName}`);
    console.log(`   - Giá: ${c.originalCredits} xu | VND: ${Number(c.priceVnd).toLocaleString('vi-VN')} đ`);
    console.log(`   - Số bài học: ${c._count.lessons} bài\n`);
  });
}

resetTo3ColosoCourses()
  .catch((err) => {
    console.error('❌ Lỗi khi cập nhật database:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
