import { Course, Comment } from '../types';

export const getCourseOriginalUrl = (code: string, title?: string): string => {
  const c = (code || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (c.includes('yeej') || c.includes('01') || t.includes('candy') || t.includes('yeej') || t.includes('lighting')) {
    return 'https://coloso.global/en/products/illustrator-yeejchan-zh';
  }
  if (c.includes('mmong') || c.includes('02') || t.includes('七色') || t.includes('cầu vồng') || t.includes('mmong')) {
    return 'https://coloso.jp/products/illustrator-mmong-jp';
  }
  if (c.includes('pill9') || c.includes('03') || t.includes('male') || t.includes('pill9') || t.includes('poses')) {
    return 'https://coloso.global/en/products/illustrator-pill9-us';
  }
  return 'https://coloso.global/en/products/illustrator-yeejchan-zh';
};

const RAW_COURSES: Course[] = [
  // Khóa 1: Yeej Chan (Candy Style & 3D Lighting)
  {
    id: 'course-coloso-yeejchan',
    code: '[COLOSO-01]',
    title: 'Vibrant Candy Style Skillset With Efficient 3D Lighting Assistance',
    titleZh: 'Yeej Chan · 糖果感赛博幻想风插画与Blender 3D辅助布光全流程教学',
    subtitle: 'Yeej Chan · Kỹ thuật minh họa Anime phong cách kẹo ngọt rực rỡ kết hợp ánh sáng 3D Blender hiệu quả',
    category: 'character',
    instructor: 'Tổng Quản Trị Viên (Admin)',
    instructorRole: 'Tổng Quản Trị Viên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    thumbnail: 'https://cdn.day1company.io/prod/uploads/202605/140445-1440/og-illustrator-yeejchan-zh.webp',
    originalUrl: 'https://coloso.global/en/products/illustrator-yeejchan-zh',
    priceVnd: 300000,
    originalPrice: 60,
    goldPrice: 54,
    supremePrice: 42,
    commentsCount: 38,
    viewsCount: 2840,
    likesCount: 495,
    publishedTimeAgo: 'Vừa xong',
    eventDate: 'Coloso Masterclass · 2026 Edition',
    description: 'Khóa học độc quyền từ họa sĩ Yeej Chan trên Coloso: Khám phá bí quyết vẽ tranh Anime phong cách Candy Style rực rỡ, sử dụng Blender 3D để thiết lập góc chiếu sáng phức tạp, phối màu dạ quang cuốn hút và xử lý chất liệu bóng gương trong suốt.',
    tags: ['Coloso', 'Yeej Chan', 'Candy Style', 'Blender 3D', 'Anime Illustration', 'Lighting Assistance'],
    groupBuyStatus: {
      currentMembers: 16,
      targetMembers: 20,
      hoursLeft: 48,
      isCompleted: false,
    },
    chapters: [
      { id: 'yeej-ch-1', title: '1. Khái quát tư duy thẩm mỹ phong cách Candy Style & Khởi tạo dự án', duration: '28:15', isFreePreview: true },
      { id: 'yeej-ch-2', title: '2. Phác thảo ý tưởng nhân vật và phân tầng bố cục thị giác', duration: '45:30', isFreePreview: true },
      { id: 'yeej-ch-3', title: '3. Thiết lập cọ vẽ cá nhân hóa & Kỹ thuật hòa sắc Gradient rực rỡ', duration: '36:45', isFreePreview: false },
      { id: 'yeej-ch-4', title: '4. Dựng khối cơ bản trong Blender 3D để hỗ trợ bố cục', duration: '52:10', isFreePreview: false },
      { id: 'yeej-ch-5', title: '5. Thiết lập hệ thống đèn 3 điểm & Nguồn sáng đa sắc giả lập trong 3D', duration: '64:20', isFreePreview: false },
      { id: 'yeej-ch-6', title: '6. Trích xuất khối bóng và phối cảnh sang Photoshop / Clip Studio Paint', duration: '41:15', isFreePreview: false },
      { id: 'yeej-ch-7', title: '7. Đổ màu mảng cơ bản, phân tách Ambient Occlusion và Highlight dạ quang', duration: '58:40', isFreePreview: false },
      { id: 'yeej-ch-8', title: '8. Chi tiết chất liệu nhựa dẻo trong suốt, kim loại bóng gương & phụ kiện neon', duration: '72:30', isFreePreview: false },
      { id: 'yeej-ch-9', title: '9. Hậu kỳ màu sắc cuối cùng, hiệu ứng Glow huyền ảo & Xuất file in ấn', duration: '49:50', isFreePreview: false },
    ],
  },
  // Khóa 2: MMong (Color Sense & Fantasy 7 Colors)
  {
    id: 'course-coloso-mmong',
    code: '[COLOSO-02]',
    title: '色彩感覚を磨くための七色の幻想的なカラーイラスト',
    titleZh: 'MMong · 色彩感覚を磨くための七色の幻想的なカラーイラスト (Mài giũa cảm quan màu sắc 7 sắc cầu vồng)',
    subtitle: 'MMong · Mài giũa cảm quan màu sắc và phát triển tranh minh họa 7 sắc cầu vồng huyền ảo',
    category: 'color',
    instructor: 'Admin Hải Nam',
    instructorRole: 'Quản trị viên kỹ thuật',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    thumbnail: 'https://cdn.day1company.io/prod/uploads/202412/153209-1093/og-illustrator-mmong.jpg',
    originalUrl: 'https://coloso.jp/products/illustrator-mmong-jp',
    priceVnd: 250000,
    originalPrice: 50,
    goldPrice: 45,
    supremePrice: 35,
    commentsCount: 42,
    viewsCount: 3120,
    likesCount: 580,
    publishedTimeAgo: 'Hôm nay',
    eventDate: 'Coloso Japan · 2026 Special Class',
    description: 'Khóa học Coloso Japan từ Illustrator nổi tiếng MMong: Đột phá tư duy sử dụng màu sắc, làm chủ kỹ thuật phối màu 7 sắc cầu vồng không lo bết hay gắt mắt. Khai phóng khả năng sáng tạo không gian kỳ ảo, đưa người xem lạc vào thế giới mộng mơ lấp lánh.',
    tags: ['Coloso JP', 'MMong', 'Color Harmony', 'Fantasy Art', 'Digital Painting', 'Color Palette'],
    groupBuyStatus: {
      currentMembers: 18,
      targetMembers: 20,
      hoursLeft: 24,
      isCompleted: false,
    },
    chapters: [
      { id: 'mmong-ch-1', title: '1. Khái quát triết lý màu sắc của MMong & Ý nghĩa biểu cảm của 7 sắc màu', duration: '24:50', isFreePreview: true },
      { id: 'mmong-ch-2', title: '2. Nguyên lý bánh xe màu tương phản và bí quyết duy trì độ trong trẻo', duration: '38:15', isFreePreview: true },
      { id: 'mmong-ch-3', title: '3. Xây dựng Moodboard màu sắc khơi nguồn cảm xúc thần tiên', duration: '32:40', isFreePreview: false },
      { id: 'mmong-ch-4', title: '4. Phác thảo đường nét uyển chuyển và quy hoạch vùng sáng tối', duration: '46:20', isFreePreview: false },
      { id: 'mmong-ch-5', title: '5. Phối màu phông nền viễn cảnh & Kỹ thuật chuyển sắc quang phổ', duration: '55:30', isFreePreview: false },
      { id: 'mmong-ch-6', title: '6. Tương tác màu sắc giữa nhân vật chính và môi trường xung quanh', duration: '63:10', isFreePreview: false },
      { id: 'mmong-ch-7', title: '7. Tả chất liệu óng ánh: Mái tóc phát quang, đôi mắt pha lê và bọt nước', duration: '68:45', isFreePreview: false },
      { id: 'mmong-ch-8', title: '8. Kỹ thuật hòa trộn ánh sáng mềm Soft Light & Hạt bụi tiên lấp lánh', duration: '51:20', isFreePreview: false },
      { id: 'mmong-ch-9', title: '9. Chỉnh màu tổng thể (Curves & Color Balance) đạt độ hoàn thiện cao nhất', duration: '42:30', isFreePreview: false },
    ],
  },
  // Khóa 3: PILL9 (Dynamic Male Characters: 40 Exercises to Master 3D Poses)
  {
    id: 'course-coloso-pill9',
    code: '[COLOSO-03]',
    title: 'Dynamic Male Characters: 40 Exercises to Master 3D Poses',
    titleZh: 'PILL9 · 动态男性角色创作：40个核心训练攻克3D多角度动态姿势',
    subtitle: 'PILL9 · Làm chủ giải phẫu nhân vật nam động lực học với 40 bài tập tư thế 3D góc quay đa chiều',
    category: 'character',
    instructor: 'Tổng Quản Trị Viên (Admin)',
    instructorRole: 'Tổng Quản Trị Viên',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    thumbnail: 'https://cdn.day1company.io/prod/uploads/202504/173854-1554/og-illustrator-pill9.jpg',
    originalUrl: 'https://coloso.global/en/products/illustrator-pill9-us',
    priceVnd: 275000,
    originalPrice: 55,
    goldPrice: 49,
    supremePrice: 38,
    commentsCount: 56,
    viewsCount: 3980,
    likesCount: 620,
    publishedTimeAgo: 'Hôm qua',
    eventDate: 'Coloso Global · 2026 Masterclass',
    description: 'Khóa học Coloso Global từ Concept Artist PILL9: Giải quyết triệt để khó khăn khi vẽ nhân vật nam cơ bắp và tư thế góc quay khó. Trang bị 40 bài tập chuyên sâu từ tỷ lệ giải phẫu, Foreshortening phối cảnh 3D đến bố cục điện ảnh hoành tráng.',
    tags: ['Coloso', 'PILL9', 'Male Anatomy', 'Dynamic Poses', '3D Perspective', 'Figure Drawing'],
    groupBuyStatus: {
      currentMembers: 19,
      targetMembers: 20,
      hoursLeft: 12,
      isCompleted: false,
    },
    chapters: [
      { id: 'pill9-ch-1', title: '1. Định hướng lộ trình 40 bài tập và phương pháp tư duy hình học 3D', duration: '22:15', isFreePreview: true },
      { id: 'pill9-ch-2', title: '2. Tỷ lệ cơ thể chuẩn 8.5 đầu của nam giới và hệ trục xương que', duration: '35:40', isFreePreview: true },
      { id: 'pill9-ch-3', title: '3. Giải phẫu nhóm cơ thân trên: Vai, ngực, lưng xô và cơ bụng 6 múi', duration: '56:20', isFreePreview: false },
      { id: 'pill9-ch-4', title: '4. Giải phẫu chi: Bắp tay, cẳng tay gân guốc và khớp bàn tay chuyển động', duration: '62:30', isFreePreview: false },
      { id: 'pill9-ch-5', title: '5. Kỹ thuật Foreshortening: Thu ngắn phối cảnh tay đấm thẳng vào ống kính', duration: '68:10', isFreePreview: false },
      { id: 'pill9-ch-6', title: '6. Tư thế chiến đấu động lực học: Nhảy vọt, tiếp đất và xoay người vung vũ khí', duration: '74:50', isFreePreview: false },
      { id: 'pill9-ch-7', title: '7. Chiếu sáng cơ bắp: Kỹ thuật Rim Light và Hard Shadows nổi bật khối', duration: '58:30', isFreePreview: false },
      { id: 'pill9-ch-8', title: '8. Vẽ nếp gấp quần áo ôm sát khối cơ thể & Phụ kiện trang bị giáp trụ', duration: '65:15', isFreePreview: false },
      { id: 'pill9-ch-9', title: '9. Hoàn thiện bức vẽ nhân vật nam hành động chuẩn chất lượng Splash Art', duration: '80:00', isFreePreview: false },
    ],
  },
];

export const INITIAL_COURSES: Course[] = RAW_COURSES.map((course) => ({
  ...course,
  originalUrl: course.originalUrl || getCourseOriginalUrl(course.code, course.title),
}));

export const INITIAL_COMMENTS: Record<string, Comment[]> = {
  'course-coloso-yeejchan': [
    {
      id: 'c-1',
      courseId: 'course-coloso-yeejchan',
      userId: 'user-vip-1',
      userName: 'Trần Tử Hiên (Chen Zixuan)',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      userTier: 'supreme',
      content: 'Phong cách vẽ kẹo ngọt Candy Style của Yeej Chan kết hợp ánh sáng 3D Blender thực sự đột phá! File project chia sẻ rất chi tiết.',
      timestamp: '15 phút trước',
      createdAt: Date.now() - 15 * 60 * 1000,
      likes: 8,
      replies: [
        {
          id: 'r-1',
          userId: 'user-vip-2',
          userName: 'Lâm Tiểu Nguyệt (Coloso VIP)',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          userTier: 'gold',
          content: 'Đồng ý với bác, cọ vẽ gradient tặng kèm áp vào tóc và phụ kiện nhìn sáng rực rỡ!',
          timestamp: '8 phút trước',
          createdAt: Date.now() - 8 * 60 * 1000,
          likes: 3,
        },
      ],
    },
    {
      id: 'c-2',
      courseId: 'course-coloso-yeejchan',
      userId: 'user-norm-1',
      userName: 'Vương Đại Hạo (Wang Hao)',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      userTier: 'free',
      content: 'Kèo mua chung Coloso-01 sắp đủ 20 slot rồi nha mọi người, nhanh tay tham gia nhận giá kịch sàn 42 Credits!',
      timestamp: '32 phút trước',
      createdAt: Date.now() - 32 * 60 * 1000,
      likes: 5,
    },
  ],
  'course-coloso-mmong': [
    {
      id: 'c-3',
      courseId: 'course-coloso-mmong',
      userId: 'user-vip-3',
      userName: 'Hoàng Phong DP',
      userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      userTier: 'supreme',
      content: 'Khóa học của MMong từ Coloso Japan dạy phối 7 sắc màu không hề bị rối hay bết. Cảm giác tranh mộng mơ như truyện cổ tích.',
      timestamp: '1 giờ trước',
      createdAt: Date.now() - 60 * 60 * 1000,
      likes: 12,
    },
  ],
  'course-coloso-pill9': [
    {
      id: 'c-4',
      courseId: 'course-coloso-pill9',
      userId: 'user-vip-1',
      userName: 'Trần Tử Hiên (Chen Zixuan)',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      userTier: 'supreme',
      content: '40 bài tập vẽ dáng nam 3D của PILL9 rất thực chiến. Kỹ thuật Foreshortening giải thích cực kỳ dễ hiểu!',
      timestamp: '2 giờ trước',
      createdAt: Date.now() - 120 * 60 * 1000,
      likes: 15,
    },
  ],
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'n-1',
    type: 'group_buy' as const,
    title: '🔥 Kèo mua chung [COLOSO-01] Yeej Chan sắp hoàn tất!',
    message: 'Khóa học [COLOSO-01] Candy Style chỉ còn 4 slot nữa là hoàn thành đợt mua chung với giá 42 Credits.',
    timestamp: '10 phút trước',
    createdAt: Date.now() - 10 * 60 * 1000,
    read: false,
    courseId: 'course-coloso-yeejchan',
    linkText: 'Xem khóa học',
  },
  {
    id: 'n-2',
    type: 'comment' as const,
    title: '💬 Lâm Tiểu Nguyệt đã phản hồi bình luận của bạn',
    message: '"Đồng ý với bác, cọ vẽ gradient tặng kèm áp vào tóc và phụ kiện nhìn sáng rực rỡ..."',
    timestamp: '8 phút trước',
    createdAt: Date.now() - 8 * 60 * 1000,
    read: false,
    courseId: 'course-coloso-yeejchan',
    linkText: 'Xem thảo luận',
  },
  {
    id: 'n-3',
    type: 'credit' as const,
    title: '🎁 Thưởng điểm danh hôm nay +10 Credits',
    message: 'Bạn đã đăng nhập hàng ngày thành công và nhận được 10 Credits vào tài khoản.',
    timestamp: '2 giờ trước',
    createdAt: Date.now() - 120 * 60 * 1000,
    read: true,
  },
  {
    id: 'n-4',
    type: 'vip' as const,
    title: '👑 Đặc quyền Hội viên Supreme khả dụng',
    message: 'Bạn đang được hưởng mức chiết khấu 30% cho toàn bộ 3 khóa Coloso trên hệ thống Whale Platform.',
    timestamp: '1 ngày trước',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
  },
];

export const INITIAL_CHAT_MESSAGES = [
  {
    id: 'chat-1',
    userId: 'bot-admin',
    userName: 'Whale Quản Trị Viên',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    userTier: 'admin' as const,
    message: 'Chào mừng các bạn! Nền tảng vừa cập nhật 3 siêu phẩm Coloso Masterclass: Yeej Chan (Candy Style), MMong (Fantasy Color), và PILL9 (Dynamic Male Poses)!',
    timestamp: '10:00 AM',
    createdAt: Date.now() - 3600000,
    isAnnouncement: true,
  },
  {
    id: 'chat-2',
    userId: 'u-101',
    userName: 'Kỹ sư âm thanh Triệu',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    userTier: 'gold' as const,
    message: 'Khóa Yeej Chan với MMong hay quá, mình vừa tham gia cả 2 kèo mua chung rồi!',
    timestamp: '10:15 AM',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'chat-3',
    userId: 'u-102',
    userName: 'Diệp Hoài An',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    userTier: 'supreme' as const,
    message: 'PILL9 dạy giải phẫu 3D poses nhân vật nam đúng là đỉnh cao thật sự!',
    timestamp: '10:20 AM',
    createdAt: Date.now() - 1200000,
  },
];
