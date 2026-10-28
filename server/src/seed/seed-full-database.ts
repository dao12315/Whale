import { prisma } from '../database/prisma.js';
import { CryptoUtil } from '../common/utils/crypto.js';
import { INITIAL_COURSES, INITIAL_COMMENTS, INITIAL_NOTIFICATIONS } from '../../../src/data/coursesData.js';
import { FORUM_BOARDS, INITIAL_FORUM_POSTS, MORE_FORUM_POSTS } from '../../../src/data/forumData.js';

export async function seedFullDatabase(): Promise<void> {
  console.log('========================================================================');
  console.log('🏛️ BẮT ĐẦU SEED TOÀN DIỆN 21 BẢNG POSTGRESQL THEO SCHEMA.PRISMA...');
  console.log('========================================================================');

  // 1. SEED CATEGORIES (7 Danh mục)
  console.log('1. Đang nạp Categories...');
  const categoryDefs = [
    { slug: 'coloso', name: 'Coloso Masterclass', description: 'Khóa học thực chiến kỹ xảo, concept art chất lượng cao', sortOrder: 1 },
    { slug: 'blender', name: 'Blender 3D Modeling & Animation', description: 'Mô hình hóa, tạo chất liệu và render 3D chuyên sâu', sortOrder: 2 },
    { slug: 'color', name: 'Color Grading & DaVinci Resolve', description: 'Chỉnh màu điện ảnh, phim tài liệu và phân phối chuẩn màu', sortOrder: 3 },
    { slug: 'character', name: 'Character Art & Anatomy', description: 'Giải phẫu học nhân vật, thiết kế trang phục và dynamic poses', sortOrder: 4 },
    { slug: 'unreal', name: 'Unreal Engine 5 Cinematic', description: 'Dựng môi trường thế giới mở Nanite, Lumen và tương tác thời gian thực', sortOrder: 5 },
    { slug: 'landscape', name: 'Landscape & Environment Painting', description: 'Hội họa bối cảnh cổ phong, thủy mặc và kiến trúc cổ', sortOrder: 6 },
    { slug: 'photoshop', name: 'Photoshop Digital Art', description: 'Kỹ thuật cọ vẽ số, matte painting và đổ bóng cấp tốc', sortOrder: 7 },
  ];

  const catMap = new Map<string, string>();
  for (const c of categoryDefs) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
    catMap.set(c.slug, cat.id);
  }

  // 2. SEED TAGS (12 Tags)
  console.log('2. Đang nạp Tags...');
  const tagSlugs = [
    'concept-art', 'digital-painting', 'blender-3d', 'davinci-resolve',
    'unreal-engine', 'character-design', 'environment-art', 'color-grading',
    'free-tutorial', 'luts-collection', 'brush-pack', 'anatomy-guide'
  ];
  const tagMap = new Map<string, string>();
  for (const slug of tagSlugs) {
    const tagName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name: tagName },
      create: { slug, name: tagName },
    });
    tagMap.set(slug, tag.id);
  }

  // 3. SEED USERS (5 Người dùng đại diện cho RBAC & VIP Tiers)
  console.log('3. Đang nạp Users...');
  const usersData = [
    {
      id: '2b10255f-c330-4518-8065-14a97cbcb475',
      email: 'admin@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('AdminPassword123@'),
      name: 'Tổng Quản Trị Viên (Admin)',
      role: 'ADMIN' as const,
      tier: 'ADMIN' as const,
      googleEmail: 'admin.whale@gmail.com',
      credits: 99999,
      points: 8888,
      balanceVnd: BigInt(150000000),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      bio: 'Quản trị viên toàn quyền nền tảng Yizhen Shanhai / Whale Platform.',
      heat: 999,
    },
    {
      id: 'f10e8e5f-2005-421e-b694-758c5722f102',
      email: 'instructor@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('Instructor123@'),
      name: 'Master Tan Zhen (Đàm Chấn)',
      role: 'INSTRUCTOR' as const,
      tier: 'GOLD' as const,
      googleEmail: 'tan.zhen@gmail.com',
      credits: 2500,
      points: 1200,
      balanceVnd: BigInt(25000000),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      bio: 'Đạo diễn phim tài liệu & Giảng viên nhiếp ảnh màu điện ảnh.',
      heat: 520,
    },
    {
      id: '29b370ae-2c84-4a5d-ba31-0cf2c3ce4fcd',
      email: 'user@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('UserPassword123@'),
      name: 'Vân Du Họa Sĩ (Học viên)',
      role: 'USER' as const,
      tier: 'FREE' as const,
      googleEmail: 'student.whale@gmail.com',
      credits: 300,
      points: 250,
      balanceVnd: BigInt(0),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      bio: 'Đang theo học khóa học vẽ kỹ xảo và dựng hình 3D cổ phong.',
      heat: 77,
    },
    {
      id: '3c8290ae-4d84-4b5d-ba31-0cf2c3ce4fc1',
      email: 'art_student@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('UserPassword123@'),
      name: 'Lê Cẩm Tú (Li Jinxiu)',
      role: 'USER' as const,
      tier: 'GOLD' as const,
      googleEmail: 'jinxiu.li@gmail.com',
      credits: 150,
      points: 400,
      balanceVnd: BigInt(0),
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      bio: 'Concept artist & Người đam mê văn hóa nghệ thuật truyền thống.',
      heat: 142,
    },
    {
      id: '4d8290ae-5d84-4c5d-ba31-0cf2c3ce4fc2',
      email: 'concept_lead@shanhai.studio',
      passwordHash: CryptoUtil.hashPassword('UserPassword123@'),
      name: 'Nguyễn Minh Khang (Alex)',
      role: 'USER' as const,
      tier: 'SUPREME' as const,
      googleEmail: 'alex.khang@gmail.com',
      credits: 650,
      points: 980,
      balanceVnd: BigInt(500000),
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      bio: 'Senior 3D Artist & Unreal Engine 5 Developer.',
      heat: 380,
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        tier: u.tier,
        credits: u.credits,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
      },
      create: u,
    });
  }

  // 4. SEED COURSES & LESSONS (40 Khóa học và 150+ bài giảng)
  console.log('4. Đang nạp Courses, Sections, Lessons & Tags...');
  const userAdmin = usersData[0];
  const userStudent = usersData[2];

  for (const c of INITIAL_COURSES) {
    const catId = catMap.get(c.category) || catMap.get('coloso')!;
    
    const existing = await prisma.course.findUnique({ where: { code: c.code } });
    let courseId = existing?.id;

    if (!existing) {
      const created = await prisma.course.create({
        data: {
          code: c.code,
          title: c.title,
          titleZh: c.titleZh || null,
          subtitle: c.subtitle || null,
          description: c.description || 'Khóa học thực chiến kỹ xảo, concept art và tài nguyên đồ họa chất lượng cao.',
          categoryId: catId,
          instructorName: c.instructor || 'Whale Master Artist',
          instructorRole: c.instructorRole || 'Senior Digital Painter',
          authorAvatarUrl: c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          thumbnailUrl: c.thumbnail,
          isFree: c.originalPrice === 0,
          originalCredits: c.originalPrice,
          goldCredits: c.goldPrice,
          supremeCredits: c.supremePrice,
          viewsCount: c.viewsCount || 240,
          likesCount: c.likesCount || 35,
          commentsCount: c.commentsCount || 5,
          eventDate: c.eventDate || null,
          groupBuyTarget: c.groupBuyStatus?.targetMembers || 20,
          groupBuyCurrent: c.groupBuyStatus?.currentMembers || 14,
          status: 'PUBLISHED',
        },
      });
      courseId = created.id;
    }

    // Tạo CourseSection & Lessons
    const chapters = c.chapters && c.chapters.length > 0 ? c.chapters : [
      { id: `${c.code}-ch1`, title: '1. Khái quát tư duy & Kỹ thuật cốt lõi', duration: '20:15', isFreePreview: true },
      { id: `${c.code}-ch2`, title: '2. Quy trình phác thảo và phân bổ giá trị sáng tối', duration: '35:40', isFreePreview: false },
      { id: `${c.code}-ch3`, title: '3. Đi nét chi tiết, tô màu và đổ bóng điện ảnh', duration: '45:10', isFreePreview: false },
      { id: `${c.code}-ch4`, title: '4. Tinh chỉnh màu sắc cuối cùng & Xuất file in ấn', duration: '25:30', isFreePreview: false },
    ];

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const exLesson = await prisma.lesson.findFirst({
        where: { courseId: courseId!, title: ch.title },
      });

      if (!exLesson) {
        await prisma.lesson.create({
          data: {
            courseId: courseId!,
            title: ch.title,
            duration: ch.duration || '25:00',
            sortOrder: i + 1,
            isFreePreview: !!ch.isFreePreview,
            driveFileId: `drive_file_${c.code.replace(/[^a-zA-Z0-9]/g, '')}_${i + 1}`,
          },
        });
      }
    }

    // Tạo CourseMedia Preview
    const exMedia = await prisma.courseMedia.findFirst({ where: { courseId: courseId! } });
    if (!exMedia) {
      await prisma.courseMedia.create({
        data: {
          courseId: courseId!,
          mediaType: 'IMAGE',
          url: c.thumbnail,
          caption: `Banner khóa học ${c.code}`,
          sortOrder: 1,
        },
      });
    }

    // Tạo CourseComment mẫu
    const exComment = await prisma.courseComment.findFirst({ where: { courseId: courseId! } });
    if (!exComment) {
      await prisma.courseComment.create({
        data: {
          courseId: courseId!,
          userId: userStudent.id,
          content: 'Khóa học tuyệt vời! Quy trình hướng dẫn cọ vẽ và ánh sáng rất chi tiết, áp dụng ngay được vào dự án.',
          likesCount: 12,
        },
      });
    }
  }

  // 5. SEED RESOURCES (Tài nguyên đồ họa bán lẻ / tặng kèm)
  console.log('5. Đang nạp Resources...');
  const resourcesData = [
    {
      title: 'Bộ Cọ Vẽ Digital Sơn Dầu & Màu Nước Đậm Đặc 2026',
      description: 'Gói 85 cọ vẽ Photoshop và Procreate mô phỏng chất sơn dầu Canvas chân thực.',
      fileType: 'ABR',
      fileSizeBytes: BigInt(250000000), // 250MB
      driveFileId: 'drive_brush_oil_2026',
      isFree: true,
      priceCredits: 0,
      downloadsCount: 1420,
    },
    {
      title: 'Gói 50+ LUTs Rec.709 & Log Điện Ảnh Phim Nhựa Kodak 2383',
      description: 'Preset màu phim tài liệu, cinematic tone ấm và da người tự nhiên cho DaVinci Resolve & Premiere.',
      fileType: 'CUBE',
      fileSizeBytes: BigInt(85000000), // 85MB
      driveFileId: 'drive_luts_kodak_2383',
      isFree: false,
      priceCredits: 25,
      downloadsCount: 890,
    },
    {
      title: 'File PSD Phân Lớp Đầy Đủ: Bối Cảnh Hẻm Núi Tây Lăng Khổ Lớn 8K',
      description: 'Bản vẽ concept art gốc phân 40 layer: Phác thảo, bố cục, ánh sáng môi trường và hiệu ứng sương mù.',
      fileType: 'PSD',
      fileSizeBytes: BigInt(1450000000), // 1.45GB
      driveFileId: 'drive_psd_xiling_gorge_8k',
      isFree: false,
      priceCredits: 50,
      downloadsCount: 420,
    },
    {
      title: 'Mô Hình 3D Blender Thuyền Rồng Tỉ Quy Kèm Textures PBR 4K',
      description: 'Model 3D chuẩn hóa topology, không lỗi pháp tuyến, sẵn sàng gắn xương animation và đưa vào Unreal Engine 5.',
      fileType: 'BLEND',
      fileSizeBytes: BigInt(650000000), // 650MB
      driveFileId: 'drive_blend_dragon_boat_4k',
      isFree: false,
      priceCredits: 75,
      downloadsCount: 310,
    },
  ];

  for (const r of resourcesData) {
    const ex = await prisma.resource.findFirst({ where: { title: r.title } });
    if (!ex) {
      await prisma.resource.create({
        data: {
          ...r,
          categoryId: catMap.get('color') || undefined,
        },
      });
    }
  }

  // 6. SEED ORDERS, ENROLLMENTS & DRIVE GRANTS (Cho userStudent đã mua khóa FREE-01 và [484])
  console.log('6. Đang nạp Orders, Enrollments & Drive Access Grants...');
  const firstCourse = await prisma.course.findFirst({ where: { code: '[484]' } });
  if (firstCourse) {
    const exOrder = await prisma.order.findFirst({ where: { orderCode: 'ORD-DEMO-484' } });
    let orderId = exOrder?.id;

    if (!exOrder) {
      const order = await prisma.order.create({
        data: {
          orderCode: 'ORD-DEMO-484',
          userId: userStudent.id,
          totalAmountVnd: BigInt(0),
          totalCredits: 50,
          paymentMethod: 'CREDITS',
          status: 'COMPLETED',
          notes: 'Đơn hàng mua khóa học 484 bằng Credits',
        },
      });
      orderId = order.id;

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          itemType: 'COURSE',
          courseId: firstCourse.id,
          priceCredits: 50,
        },
      });

      // Tạo Enrollment ACTIVE
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: userStudent.id,
          courseId: firstCourse.id,
          orderId: order.id,
          status: 'ACTIVE',
        },
      });

      // Tạo Drive Access Grant
      await prisma.driveAccessGrant.create({
        data: {
          userId: userStudent.id,
          courseId: firstCourse.id,
          googleEmail: userStudent.googleEmail || 'student.whale@gmail.com',
          driveFileId: 'drive_folder_paid_484',
          permissionId: 'perm_drive_demo_484',
          status: 'GRANTED',
        },
      });
    }
  }

  // 7. SEED FORUM BOARDS, POSTS, POLLS & COMMENTS
  console.log('7. Đang nạp Forum Boards, Posts, Polls & Comments...');
  for (const b of FORUM_BOARDS) {
    await prisma.forumBoard.upsert({
      where: { id: b.id },
      update: { title: b.title, description: b.description },
      create: {
        id: b.id,
        title: b.title,
        description: b.description,
        iconType: b.iconType,
        postsCount: b.postsCount || 10,
        heatCount: b.heatCount || 120,
        isLocked: !!b.isLocked,
        hasFlameBadge: !!b.hasFlameBadge,
      },
    });
  }

  const allForumPosts = [...INITIAL_FORUM_POSTS, ...MORE_FORUM_POSTS];
  for (const post of allForumPosts) {
    const isVoting = post.category === 'voting' || post.title.includes('Bình chọn') || post.title.includes('Voting');
    let exPost = await prisma.forumPost.findFirst({ where: { title: post.title } });

    if (!exPost) {
      exPost = await prisma.forumPost.create({
        data: {
          boardId: post.boardId || 'board-inspiration',
          authorId: userStudent.id,
          title: post.title,
          content: post.content || 'Nội dung chia sẻ kỹ thuật vẽ tranh số và tư liệu nghệ thuật từ Whale Community.',
          coverImageUrl: post.images?.[0] || null,
          images: post.images || [],
          tags: post.tags || ['3D Art', 'Tutorial'],
          category: (post.category ? post.category.toUpperCase() : 'SUMMARY') as any,
          readsCount: post.readsCount || 85,
          likesCount: post.likesCount || 24,
          commentsCount: post.commentsCount || 6,
          isVotingEnabled: isVoting,
          status: 'PUBLISHED',
        },
      });
    } else {
      await prisma.forumPost.update({
        where: { id: exPost.id },
        data: {
          coverImageUrl: post.images?.[0] || exPost.coverImageUrl,
          images: post.images || [],
          tags: post.tags || ['3D Art', 'Tutorial'],
          category: (post.category ? post.category.toUpperCase() : 'SUMMARY') as any,
          isVotingEnabled: isVoting,
        },
      });
    }

    // Đảm bảo bài viết có Poll Options nếu isVoting
    if (isVoting) {
      const existingPolls = await prisma.pollOption.findMany({ where: { postId: exPost.id } });
      if (existingPolls.length === 0) {
        await prisma.pollOption.createMany({
          data: [
            { postId: exPost.id, optionText: 'Rất muốn mở khóa học này (Really want it)', votesCount: 28, sortOrder: 1 },
            { postId: exPost.id, optionText: 'Chưa cần thiết lúc này (No need now)', votesCount: 5, sortOrder: 2 },
          ],
        });
      }
    }

    // Đảm bảo bài viết có bình luận
    const existingComments = await prisma.forumComment.findMany({ where: { postId: exPost.id } });
    if (existingComments.length === 0) {
      await prisma.forumComment.createMany({
        data: [
          {
            postId: exPost.id,
            authorId: userAdmin.id,
            content: 'Bài viết phân tích rất có giá trị! Đã ghim lên mục tinh hoa để các bạn đồng môn cùng học hỏi.',
            likesCount: 12,
          },
          {
            postId: exPost.id,
            authorId: userStudent.id,
            content: 'Cảm ơn admin đã chia sẻ, mình áp dụng vào đồ án thấy kết quả cải thiện rõ rệt!',
            likesCount: 5,
          },
        ],
      });
    }
  }

  // 7.5 SEED KHÓA HỌC COMMENTS TỪ INITIAL_COMMENTS
  console.log('7.5 Đang nạp Course Comments & Replies...');
  for (const [courseKey, commentsList] of Object.entries(INITIAL_COMMENTS)) {
    const codeNum = courseKey.replace('course-', '');
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ code: `[${codeNum}]` }, { code: courseKey }, { code: codeNum }],
      },
    });

    if (course) {
      for (const c of commentsList) {
        const exComment = await prisma.courseComment.findFirst({
          where: { courseId: course.id, content: c.content },
        });

        if (!exComment) {
          const createdComment = await prisma.courseComment.create({
            data: {
              courseId: course.id,
              userId: userStudent.id,
              content: c.content,
              likesCount: c.likes || 4,
            },
          });

          if (c.replies && c.replies.length > 0) {
            for (const r of c.replies) {
              await prisma.commentReply.create({
                data: {
                  parentCommentId: createdComment.id,
                  userId: userAdmin.id,
                  content: r.content,
                  likesCount: r.likes || 2,
                },
              });
            }
          }
        }
      }
    }
  }

  // 8. SEED CHAT MESSAGES (Cộng đồng Live Community)
  console.log('8. Đang nạp Chat Messages cộng đồng...');
  const chatMessagesData = [
    { userId: userAdmin.id, message: '🎉 Chào mừng các họa sĩ và nghệ sĩ 3D đã gia nhập hệ sinh thái 一帧山海 (Whale Studio)!', isAnnouncement: true },
    { userId: userStudent.id, message: 'Chào cả nhà! Cho mình hỏi bộ cọ sơn dầu mới import vào Photoshop 2026 có bị lỗi lag nét không?', isAnnouncement: false },
    { userId: usersData[1].id, message: 'Bộ cọ 2026 đã tối ưu GPU acceleration rồi nhé bạn, vẽ ở khổ 8K vẫn mượt mà 60 FPS.', isAnnouncement: false },
    { userId: usersData[3].id, message: 'Vừa hoàn thành xong bài tập ánh sáng hẻm núi Tây Lăng, cảm ơn thầy Tan Zhen!', isAnnouncement: false },
    { userId: usersData[4].id, message: 'Ai đang làm đồ án tốt nghiệp bằng UE5 Nanite cần tài liệu PBR textures thì ới mình nhé.', isAnnouncement: false },
  ];

  for (const cm of chatMessagesData) {
    await prisma.chatMessage.create({
      data: cm,
    });
  }

  // 9. SEED NOTIFICATIONS & CHECKIN LOGS
  console.log('9. Đang nạp Notifications & Checkin Logs...');
  await prisma.notification.createMany({
    data: [
      {
        userId: userStudent.id,
        type: 'SYSTEM',
        title: '🌟 Chào mừng gia nhập Whale Studio',
        message: 'Bạn đã đăng ký tài khoản thành công. Tặng bạn 300 Xu Credits trải nghiệm khóa học đầu tiên!',
        isRead: false,
      },
      {
        userId: userStudent.id,
        type: 'ORDER',
        title: '✅ Đơn hàng [484] kích hoạt thành công',
        message: 'Khóa học Tết Đoan Ngọ và thư mục Google Drive tài nguyên đã sẵn sàng trong phòng học.',
        isRead: true,
      },
      {
        userId: userStudent.id,
        type: 'COMMENT',
        title: '💬 Thầy Đàm Chấn vừa phản hồi bài viết của bạn',
        message: 'Bố cục ánh sáng bạn phân tích rất tốt, chú ý thêm độ chuyển vùng tối của vệt nước.',
        isRead: false,
      },
    ],
  });

  // Checkin logs 3 ngày gần nhất
  const todayStr = new Date().toISOString().split('T')[0];
  await prisma.checkinLog.upsert({
    where: { userId_checkinDate: { userId: userStudent.id, checkinDate: todayStr } },
    update: {},
    create: {
      userId: userStudent.id,
      checkinDate: todayStr,
      pointsRewarded: 20,
      creditsRewarded: 5,
    },
  });

  // 10. SEED AUDIT LOGS (Nhật ký quản trị)
  console.log('10. Đang nạp Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: userAdmin.id,
        action: 'GRANT_DRIVE_PERMISSION',
        targetType: 'ENROLLMENT',
        targetId: firstCourse?.id || 'course-484',
        newValues: { status: 'GRANTED', googleEmail: 'student.whale@gmail.com' },
        ipAddress: '127.0.0.1',
      },
      {
        userId: userAdmin.id,
        action: 'PUBLISH_COURSE',
        targetType: 'COURSE',
        targetId: firstCourse?.id || 'course-484',
        newValues: { code: '[484]', isPublished: true, originalCredits: 50 },
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('========================================================================');
  console.log('✨ HOÀN TẤT SEED TOÀN BỘ 21 BẢNG TRONG POSTGRESQL THÀNH CÔNG RỰC RỠ!');
  console.log('========================================================================');
}

if (process.argv[1]?.includes('seed-full-database.ts')) {
  seedFullDatabase()
    .catch((err) => {
      console.error('Lỗi khi seed toàn diện:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
