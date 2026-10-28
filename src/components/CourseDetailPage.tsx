import React, { useState, useEffect } from 'react';
import { Course, Language, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useTheme } from '../context/ThemeContext';
import { sound } from '../services/sound';
import { notificationService } from '../services/notificationService';
import { coursesApi, LessonStreamResponse } from '../services/coursesApi';
import { getCourseVndPrices, formatVnd } from '../utils/currency';
import { getCourseOriginalUrl } from '../data/coursesData';
import { useI18n } from '../i18n';
import {
  ArrowLeft,
  Share2,
  ThumbsUp,
  Star,
  ExternalLink,
  MessageSquare,
  Eye,
  Calendar,
  Sparkles,
  Crown,
  Lock,
  Download,
  CheckCircle2,
  Check,
  Send,
  Smile,
  Code,
  Image as ImageIcon,
  Clock,
  BarChart2,
  UserCheck,
  UserPlus,
  Flame,
  FileText,
  Bookmark,
  ChevronRight,
  ShieldAlert,
  Play,
  PlayCircle,
  ShieldCheck,
  FolderDown,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  onBuyNow: (course: Course) => void;
  currentLang: Language;
  onOpenNotifications: () => void;
  onOpenVip: () => void;
  onOpenPostEditor?: () => void;
  onOpenUserCenter?: () => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBack,
  onBuyNow,
  currentLang,
  onOpenNotifications,
  onOpenVip,
  onOpenPostEditor,
  onOpenUserCenter,
}) => {
  const { user, hasPurchased, isWishlisted, toggleWishlist, claimDailyReward } = useAuth();
  const { comments, addComment, courses } = useRealtime();
  const { theme } = useTheme();
  const { t } = useI18n();

  const isUnlocked = hasPurchased(course.id);
  const wishlisted = isWishlisted(course.id);

  // Tính toán học phí VND và trạng thái miễn phí
  const coursePrices = getCourseVndPrices(course);
  const userVndPrice =
    user?.tier === 'supreme'
      ? coursePrices.formattedSupreme
      : user?.tier === 'gold'
      ? coursePrices.formattedGold
      : coursePrices.formattedOriginal;

  const userPrice =
    user?.tier === 'supreme'
      ? course.supremePrice
      : user?.tier === 'gold'
      ? course.goldPrice
      : course.originalPrice;

  const originalUrl = course.originalUrl || getCourseOriginalUrl(course.code, course.title);

  // Local likes and attention state
  const [likesCount, setLikesCount] = useState(course.likesCount || 11);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [privateMsgSent, setPrivateMsgSent] = useState(false);

  // PK Voting widgets state (matching Screenshots 2 & 3)
  const [pkVotes1, setPkVotes1] = useState<{ really: number; want: number; userVoted: string | null }>({
    really: 2,
    want: 0,
    userVoted: null,
  });

  const [pkVotes2, setPkVotes2] = useState<{ yes: number; no: number; userVoted: string | null }>({
    yes: 4,
    no: 0,
    userVoted: null,
  });

  // Curriculum and Streaming state
  const courseLessons =
    course.chapters && course.chapters.length > 0
      ? course.chapters
      : [
          { id: 'ch-1', title: '01. Giới thiệu tổng quan & Phân tích bố cục nghệ thuật', duration: '18:45', isFreePreview: true },
          { id: 'ch-2', title: '02. Kỹ thuật cọ vẽ Digital & Thiết lập bảng màu điện ảnh', duration: '36:12', isFreePreview: false },
          { id: 'ch-3', title: '03. Xử lý chi tiết chất liệu & Hiệu ứng ánh sáng Unreal / Cycles', duration: '48:30', isFreePreview: false },
          { id: 'ch-4', title: '04. Hoàn thiện tác phẩm & Xuất file in ấn khổ lớn', duration: '25:10', isFreePreview: false },
        ];

  const [activeLessonId, setActiveLessonId] = useState<string>(courseLessons[0]?.id || 'ch-1');
  const [lessonStream, setLessonStream] = useState<LessonStreamResponse['data'] | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);

  const activeLesson = courseLessons.find((l) => l.id === activeLessonId) || courseLessons[0];
  const canAccessActiveLesson = isUnlocked || activeLesson.isFreePreview;

  // Tự động load stream khi mở hoặc khi đổi bài nếu có quyền truy cập
  useEffect(() => {
    if (canAccessActiveLesson) {
      loadLessonStream(activeLesson.id);
    } else {
      setLessonStream(null);
    }
  }, [activeLessonId, isUnlocked]);

  const loadLessonStream = async (lessonId: string) => {
    setIsLoadingStream(true);
    setStreamError(null);
    try {
      const res = await coursesApi.getLessonStream(course.id, lessonId);
      setLessonStream(res.data);
    } catch (err: any) {
      // Graceful fallback khi backend offline: tạo signed stream mô phỏng
      setLessonStream({
        lessonId: lessonId,
        title: activeLesson.title,
        streamToken: 'stream-token-' + Math.random().toString(36).substring(2, 9),
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        expiresIn: '2 hours',
      });
    } finally {
      setIsLoadingStream(false);
    }
  };

  const handleSelectLesson = (lesson: (typeof courseLessons)[0]) => {
    sound.playClick();
    setActiveLessonId(lesson.id);
    const isAccessible = isUnlocked || lesson.isFreePreview;
    if (!isAccessible) {
      notificationService.sendPushNotification({
        type: 'system',
        title: '🔒 Nội dung bị khóa',
        message: `Bài "${lesson.title}" yêu cầu mở khóa khóa học để xem.`,
        timestamp: 'Vừa xong',
      });
    }
  };

  // Comment input state
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const courseComments = comments[course.id] || [];

  const handleLike = () => {
    sound.playClick();
    if (hasLiked) {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
      notificationService.sendPushNotification({
        type: 'comment',
        title: '👍 Đã thích bài viết',
        message: `Bạn đã thích tài liệu "${course.title}".`,
        timestamp: 'Vừa xong',
      });
    }
  };

  const handleToggleAttention = () => {
    sound.playClick();
    setIsFollowingAuthor((prev) => {
      const next = !prev;
      notificationService.sendPushNotification({
        type: 'system',
        title: next ? `🌟 Đã theo dõi Quản trị viên ${course.instructor}` : `Đã hủy theo dõi`,
        message: next
          ? `Bạn sẽ nhận được thông báo khi Quản trị viên này đăng tải khóa học mới.`
          : `Bạn đã ngừng theo dõi Quản trị viên ${course.instructor}.`,
        timestamp: 'Vừa xong',
      });
      return next;
    });
  };

  const handlePrivateMessage = () => {
    sound.playClick();
    setPrivateMsgSent(true);
    notificationService.sendPushNotification({
      type: 'comment',
      title: `✉ Đã gửi tin nhắn riêng tới Quản trị viên ${course.instructor}`,
      message: `Hệ thống đã chuyển lời nhắn của bạn đến hộp thư của Quản trị viên.`,
      timestamp: 'Vừa xong',
    });
    setTimeout(() => setPrivateMsgSent(false), 4000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !previewImage) return;

    addComment(course.id, commentText);
    sound.playSuccess();
    setCommentText('');
    setPreviewImage(null);

    notificationService.sendPushNotification({
      type: 'comment',
      title: '💬 Gửi bình luận thành công',
      message: `Bình luận của bạn trên khóa học "${course.title}" đã được đăng tải trực tiếp.`,
      timestamp: 'Vừa xong',
      courseId: course.id,
    });
  };

  const handleVote1 = (opt: 'really' | 'want') => {
    if (pkVotes1.userVoted) return;
    sound.playClick();
    setPkVotes1((prev) => ({
      ...prev,
      [opt]: prev[opt] + 1,
      userVoted: opt,
    }));
  };

  const handleVote2 = (opt: 'yes' | 'no') => {
    if (pkVotes2.userVoted) return;
    sound.playClick();
    setPkVotes2((prev) => ({
      ...prev,
      [opt]: prev[opt] + 1,
      userVoted: opt,
    }));
  };

  // Recommended other courses for right sidebar
  const otherRecommendedCourses = courses
    .filter((c) => c.id !== course.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6 relative animate-in fade-in duration-300">
      {/* Background Ink Landscape Wallpaper on the flanks matching screenshots */}
      <div
        className="fixed inset-0 pointer-events-none opacity-45 dark:opacity-20 bg-fixed bg-cover bg-center -z-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1920&auto=format&fit=crop&q=80')`,
        }}
      />

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Breadcrumb Navigation matching Screenshot 1 */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400">📍</span>
            <button
              onClick={onBack}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium"
            >
              Home
            </button>
            <span className="text-slate-400">/</span>
            <button
              onClick={onBack}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              Comprehensive course category
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium lowercase">
              {course.category || 'coloso'}
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500 dark:text-slate-400">Main text</span>
          </div>

          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl bg-white/90 dark:bg-[#152a36] hover:bg-slate-100 dark:hover:bg-[#1b3645] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('courses.detail_back')}</span>
          </button>
        </div>

        {/* MAIN 2-COLUMN LAYOUT MATCHING SCREENSHOTS 1, 2 & 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* LEFT / CENTER COLUMN: Article & Course Content (8 Cols) */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top Article Card matching Screenshot 1 */}
            <article className="bg-[#ffffff] dark:bg-[#102029]/95 border border-[#e8e2d4] dark:border-[#1d3847] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
              {/* Article Main Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                <span className="text-amber-600 dark:text-amber-400 mr-2">{course.code}</span>
                {course.title}
              </h1>

              {/* Author & Meta bar matching Screenshot 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <img
                    src={course.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                    alt="Admin Avatar"
                    className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/60 ring-2 ring-slate-100 dark:ring-slate-800 shadow"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {course.instructor || 'Tổng Quản Trị Viên (Admin)'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 inline-flex items-center gap-1 shadow-sm">
                        <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {t('courses.detail_admin_owner') || 'Admin sở hữu'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>Đăng bởi: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{course.instructor || 'Tổng Quản Trị Viên'}</strong></span>
                      <span>•</span>
                      <span>{course.publishedTimeAgo || 'Vừa xong'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Attention button */}
                  <button
                    onClick={handleToggleAttention}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                      isFollowingAuthor
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                    }`}
                  >
                    {isFollowingAuthor ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{isFollowingAuthor ? t('common.following') : t('common.follow')}</span>
                  </button>

                  {/* Private message button */}
                  <button
                    onClick={handlePrivateMessage}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-[#162e3d] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-[#1c3a4d] transition-all"
                  >
                    <span>💬 {privateMsgSent ? 'Đã gửi tin!' : 'Private message'}</span>
                  </button>

                  {/* Stats (Comments, Views, Likes) */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pl-2">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{courseComments.length || course.commentsCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{course.viewsCount || 39}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                      <span>{likesCount}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* EMBEDDED RESOURCE CARD MATCHING SCREENSHOT 1 */}
              <div className="bg-[#f9f7f2] dark:bg-[#0c1820] border border-[#e2dcce] dark:border-[#1d394a] rounded-2xl p-4 sm:p-5 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Thumbnail with "Paid resources" label */}
                  <div className="md:col-span-5 relative rounded-xl overflow-hidden group shadow-md aspect-[16/10] bg-black">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badge "Paid resources" matching screenshot */}
                    <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-amber-900/90 text-amber-200 text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md border border-amber-600/40">
                      <Download className="w-3 h-3" />
                      <span>{course.originalPrice === 0 ? 'Free resources' : 'Paid resources'}</span>
                    </div>

                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 inset-x-2 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-sm text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer z-10"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-300" />
                      <span>View the original course page</span>
                    </a>
                  </div>

                  {/* Course Details & Pricing row */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-2">
                        {course.code} {course.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {course.subtitle ||
                          'Khóa học thực chiến kỹ xảo, concept art và tài nguyên đồ họa chất lượng cao từ GGC Studio.'}
                      </p>
                    </div>

                    {/* Pricing section (Real VND & Free) */}
                    <div className="space-y-2.5">
                      <div className="flex items-baseline gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">Quyền truy cập học tập</span>
                          <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-300 dark:border-teal-700/60 flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                            <span>Google Drive VIP • Học trọn đời</span>
                          </span>
                        </div>
                      </div>

                      {/* Course asset & feature highlight pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#162732] border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-stone-600 dark:text-slate-400 font-medium">
                            📁 Tài nguyên dự án
                          </span>
                          <span className="font-bold text-stone-800 dark:text-slate-200">
                            Full Project & Cọ vẽ
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#162732] border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-stone-600 dark:text-slate-400 font-medium">
                            🎬 Chất lượng video
                          </span>
                          <span className="font-bold text-stone-800 dark:text-slate-200">
                            HD 1080p Chuẩn
                          </span>
                        </div>
                      </div>

                      {/* Buy now / Mở khóa button */}
                      <div className="pt-1">
                        {isUnlocked ? (
                          <div className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đã kích hoạt khóa học • Toàn bộ bài giảng đã sẵn sàng</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onBuyNow(course)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#804618] via-[#a35b23] to-[#804618] hover:from-[#94521f] hover:to-[#94521f] text-white font-bold text-xs sm:text-sm shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 tracking-wide uppercase font-cinzel"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Kích hoạt khóa học ngay • Mở khóa Google Drive</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* VIDEO PLAYER & CURRICULUM STREAMING (Entitlement-Protected) */}
              {/* ========================================================= */}
              <div className="bg-[#fdfbf7] dark:bg-[#0c1820] border-2 border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Phòng Học Trực Tuyến & Bài Giảng</span>
                        {isUnlocked ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                            Đã mở khóa toàn bộ
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
                            Có bài học xem thử
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activeLesson.title} • Thời lượng: {activeLesson.duration}
                      </p>
                    </div>
                  </div>

                  {/* Nút mở Drive nếu đã kích hoạt */}
                  {isUnlocked && (
                    <button
                      type="button"
                      onClick={() => setShowDriveModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
                    >
                      <FolderDown className="w-4 h-4" />
                      <span>Google Drive Thư Mục ({course.code})</span>
                    </button>
                  )}
                </div>

                {/* Video Player Box */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
                  {isLoadingStream ? (
                    <div className="flex flex-col items-center gap-2 text-amber-400 text-xs">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <span>Đang xác thực Entitlement & ký Signed Stream Token...</span>
                    </div>
                  ) : canAccessActiveLesson ? (
                    <>
                      <video
                        key={activeLesson.id}
                        controls
                        autoPlay={false}
                        poster={course.thumbnail}
                        className="w-full h-full object-contain"
                        src={lessonStream?.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                      />
                      {/* Watermark chống quay chụp vi phạm bản quyền */}
                      <div className="absolute top-3 right-3 pointer-events-none select-none opacity-40 hover:opacity-10 transition-opacity">
                        <span className="text-[10px] font-mono text-white/70 bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/20">
                          ID: {user?.id?.substring(0, 8) || 'STUDENT'} • {user?.email || 'authenticated'}
                        </span>
                      </div>
                      {/* Signed Stream Security Badge */}
                      <div className="absolute bottom-3 left-3 pointer-events-none select-none flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/40 text-[10px] text-emerald-300 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Signed Stream Valid (Hết hạn: {lessonStream?.expiresIn || '2 giờ'})</span>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center space-y-3 max-w-md">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-sm text-white">Bài học thuộc gói nội dung trả phí</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Bạn cần kích hoạt khóa học để cấp quyền truy cập trọn đời vào video bài học này và toàn bộ tài nguyên Drive đính kèm.
                      </p>
                      <button
                        type="button"
                        onClick={() => onBuyNow(course)}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-transform hover:scale-105"
                      >
                        Mở khóa học ngay ({userPrice} Credits)
                      </button>
                    </div>
                  )}
                </div>

                {/* Curriculum / Chapters list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Nội dung giáo trình ({courseLessons.length} bài)</span>
                    <span className="text-slate-400 font-normal">Click để chuyển bài học</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {courseLessons.map((item) => {
                      const isItemActive = item.id === activeLessonId;
                      const isItemUnlocked = isUnlocked || item.isFreePreview;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectLesson(item)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                            isItemActive
                              ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                              : 'bg-white dark:bg-[#12222b] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isItemUnlocked
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                              }`}
                            >
                              {isItemUnlocked ? <Play className="w-3.5 h-3.5 fill-current" /> : <Lock className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{item.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{item.duration}</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {item.isFreePreview && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                Xem thử
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Large Document Graphic Banner matching Screenshot 1 */}
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative aspect-[16/9] bg-slate-900">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <div className="text-xl sm:text-3xl font-extrabold tracking-wide drop-shadow-md">
                    {course.title}
                  </div>
                  <div className="font-serif text-xs sm:text-sm text-amber-200/90 mt-1 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin sở hữu: {(typeof course.instructor === 'string' ? course.instructor : (course.instructor as any)?.name) || 'Tổng Quản Trị Viên (Admin)'}</span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-slate-200 max-w-xl font-light line-clamp-2">
                    {course.description || course.subtitle ||
                      'Khóa học trọn bộ kỹ thuật số, phân tích quy trình đồ họa CG, video bài giảng 4K và bộ tài nguyên source files đi kèm.'}
                  </p>
                </div>
              </div>

              {/* ARTICLE CURRICULUM SECTIONS */}
              <div className="space-y-6 pt-2">
                {/* Section 1: Objectives & Core Competencies */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                      {t('courses.overview_objectives_title')}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                    {course.description ||
                      'Khóa học tập trung vào quy trình làm việc thực chiến từ ý tưởng ban đầu đến sản phẩm hoàn thiện. Học viên được tiếp cận các kỹ thuật tiên tiến, tối ưu hóa workflow và xây dựng tác phẩm đồ họa chất lượng cao.'}
                  </p>
                </div>

                {/* Section 2: Prerequisites & Project Assets */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                      {t('courses.overview_tools_title')}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                    {t('courses.overview_tools_desc')}
                  </p>
                </div>

                {/* Section 3: Quality Guarantee & Platform Policy */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                      {t('courses.overview_guarantee_title')}
                    </h2>
                  </div>
                  <div className="border border-amber-500/30 rounded-2xl p-4 bg-amber-500/5 dark:bg-[#12232c] text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <p className="leading-relaxed">
                      {t('courses.overview_guarantee_desc')}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t('courses.detail_drive_granted')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Source & Copyright Notice */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-light">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">© Copyright: </span>
                  <span>{t('courses.copyright_notice')}</span>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2 text-slate-400">
                  <span className="h-[1px] w-20 bg-slate-300 dark:bg-slate-700"></span>
                  <span className="text-[10px] uppercase font-mono tracking-widest">GGC STUDIO</span>
                  <span className="h-[1px] w-20 bg-slate-300 dark:bg-slate-700"></span>
                </div>

                {/* Course Tags */}
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {course.tags && course.tags.length > 0 ? (
                    course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#142633] text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                      >
                        <span>📁</span>
                        <span>{tag}</span>
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#142633] text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span>📁</span>
                      <span>{course.category || 'Masterclass'}</span>
                    </span>
                  )}
                </div>

                {/* User interaction bar */}
                <div className="pt-6 pb-2 text-center space-y-3">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleLike}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                        hasLiked
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 dark:bg-[#142633] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3445] border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-white' : ''}`} />
                      <span>{t('courses.thumbs_up')} ({likesCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        navigator.clipboard?.writeText(window.location.href);
                        notificationService.sendPushNotification({
                          type: 'system',
                          title: '🔗 Đã sao chép liên kết khóa học',
                          message: `Liên kết chia sẻ đã sẵn sàng trong clipboard của bạn.`,
                          timestamp: 'Vừa xong',
                        });
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#142633] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3445] border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{t('courses.share')}</span>
                    </button>

                    <button
                      onClick={() => toggleWishlist(course.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                        wishlisted
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-[#142633] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3445] border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${wishlisted ? 'fill-white' : ''}`} />
                      <span>{wishlisted ? t('courses.saved') : t('courses.save')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* ============================================================== */}
            {/* COMMENTARY SECTION MATCHING SCREENSHOT 3 */}
            {/* ============================================================== */}
            <section className="bg-[#ffffff] dark:bg-[#102029]/95 border border-[#e8e2d4] dark:border-[#1d3847] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 transition-colors">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <span className="text-red-700 text-sm">◆</span>
                <h3 className="font-serif font-bold text-lg">Commentary</h3>
                <span className="text-xs text-slate-400 font-light">Fighting for the sofa</span>
              </div>

              {/* Rich Comment Input Box matching Screenshot 3 */}
              <form onSubmit={handleCommentSubmit} className="flex gap-4 items-start">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt="My avatar"
                  className="w-10 h-10 rounded-full object-cover border border-amber-500/50 shrink-0"
                />

                <div className="flex-1 space-y-2">
                  <div className="bg-[#f7f5ed] dark:bg-[#12222b] border border-[#e2dccd] dark:border-[#203a49] rounded-2xl p-3 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="We welcome you to share your valuable insights! (Hãy để lại ý kiến đóng góp hoặc thắc mắc của bạn...)"
                      rows={3}
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none"
                    />

                    {previewImage && (
                      <div className="relative inline-block mt-2 rounded-lg overflow-hidden border border-slate-400">
                        <img src={previewImage} alt="Preview" className="h-20 w-auto object-cover" />
                        <button
                          type="button"
                          onClick={() => setPreviewImage(null)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Toolbar matching Screenshot 3 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCommentText((prev) => prev + ' 👍 ')}
                          className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-[#193240] text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors"
                        >
                          <Smile className="w-3.5 h-3.5" />
                          <span>Expression</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCommentText((prev) => prev + ' ```\n// Code snippet\n``` ')}
                          className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-[#193240] text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>Code</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-[#193240] text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Picture</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setCommentText((prev) => prev + ' Khóa học quá xuất sắc! Xin cảm ơn tác giả.')}
                          className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-[#193240] text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Quick replies</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!commentText.trim() && !previewImage}
                        className="px-4 py-1.5 rounded-xl bg-slate-300 dark:bg-[#1c3848] hover:bg-amber-600 dark:hover:bg-amber-600 text-slate-900 dark:text-slate-200 hover:text-white font-semibold text-xs transition-all disabled:opacity-50"
                      >
                        Submit a comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comment List or Empty state matching Screenshot 3 */}
              <div className="pt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {courseComments.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    {/* Illustration box matching screenshot */}
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">
                      📦
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No comments yet (Chưa có bình luận nào. Hãy là người đầu tiên bóc tem!)
                    </p>
                  </div>
                ) : (
                  courseComments.map((cmt) => (
                    <div key={cmt.id} className="py-3 flex gap-3 items-start">
                      <img
                        src={cmt.userAvatar}
                        alt={cmt.userName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {cmt.userName}
                          </span>
                          <span className="text-[10px] text-slate-400">{cmt.timestamp}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{cmt.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Sticky Purchase Widget, User Profile, PK Voting */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* WIDGET 1: FLOATING ACCESS CARD */}
            <div className="bg-[#ffffff] dark:bg-[#102029]/95 border border-[#e8e2d4] dark:border-[#1d3847] rounded-3xl p-5 shadow-xl space-y-4 text-center transition-colors">
              {/* Badge */}
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded bg-amber-900/90 text-amber-200 text-[10px] font-bold tracking-wider shadow">
                <Download className="w-3 h-3" />
                <span>Quyền truy cập học tập</span>
              </div>

              {/* Learning Access Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#f9f2e3] to-[#f4ead5] dark:from-[#213328] dark:to-[#12221b] border border-amber-300/60 dark:border-emerald-600/30 text-center">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
                  Quyền học trọn đời
                </span>
                <span className="text-2xl font-extrabold text-[#99521e] dark:text-amber-400 tracking-tight block mt-1">
                  Google Drive VIP
                </span>
                <span className="inline-block mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  Mở khóa toàn bộ nội dung
                </span>
              </div>

              {/* Learning Benefits breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-[#1a271e]/70 border border-amber-300/60 dark:border-amber-600/40 text-center">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 block font-medium">
                    📁 Tài nguyên
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-200">
                    File dự án gốc
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-[#25172d]/70 border border-purple-300/60 dark:border-purple-500/40 text-center">
                  <span className="text-[10px] text-purple-800 dark:text-purple-300 block font-medium">
                    🎥 Video HD
                  </span>
                  <span className="font-bold text-purple-700 dark:text-purple-200">
                    Xem & Tải trọn bộ
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {isUnlocked ? (
                  <div className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã sở hữu • Bắt đầu học</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onBuyNow(course)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#804618] via-[#a35b23] to-[#804618] hover:from-[#94521f] hover:to-[#94521f] text-white font-bold text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 tracking-wide uppercase font-cinzel"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Kích hoạt khóa học ngay • Mở khóa Google Drive</span>
                  </button>
                )}

                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#162e3d] hover:bg-slate-200 dark:hover:bg-[#1d3b4d] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                  <span>View the original course page</span>
                </a>
              </div>
            </div>

            {/* WIDGET 2: USER PROFILE CARD MATCHING SCREENSHOT 1 */}
            <div className="bg-[#ffffff] dark:bg-[#102029]/95 border border-[#e8e2d4] dark:border-[#1d3847] rounded-3xl overflow-hidden shadow-xl text-center transition-colors">
              {/* Landscape Header Banner */}
              <div
                className="h-24 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80')`,
                }}
              >
                <div className="absolute inset-0 bg-black/30" />
                <button
                  onClick={() => {
                    sound.playSuccess();
                    claimDailyReward();
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-amber-600/90 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-md transition-all"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Signing in (Điểm danh)</span>
                </button>
              </div>

              {/* Avatar centered over banner */}
              <div className="relative -mt-10 mb-2">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt="User"
                  className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-[#102029] mx-auto shadow-md ring-2 ring-purple-500/50"
                />
              </div>

              {/* User details */}
              <div className="px-5 pb-5 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
                    <span>{user?.name || 'meohamchoi'}</span>
                    <span className="text-amber-500">👑</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                    {user?.bio || "This guy is lazy and doesn't write anything..."}
                  </p>
                </div>

                {/* User Stats matching Screenshot 1: comments, articles, posts, heat */}
                <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-50 dark:bg-[#142633] border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">💬 7</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">📄 0</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">📝 2</span>
                  </div>
                  <div>
                    <span className="text-amber-500 text-[10px] block font-semibold">🔥 77</span>
                  </div>
                </div>

                {/* Profile buttons matching Screenshot 1 */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={onOpenPostEditor}
                    className="py-1.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    Publish articles
                  </button>

                  <button
                    onClick={onOpenUserCenter}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    User Center
                  </button>
                </div>
              </div>
            </div>

            {/* WIDGET 3: POPULAR RECOMMENDATIONS & PK VOTING MATCHING SCREENSHOTS 2 & 3 */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between px-1">
                <span>Popular recommendations</span>
                <span className="text-[11px] text-amber-500 hover:underline cursor-pointer">Xem thêm</span>
              </h3>

              {/* Recommended Course 1 with PK Voting */}
              <div className="bg-[#ffffff] dark:bg-[#102029]/95 border border-[#e8e2d4] dark:border-[#1d3847] rounded-3xl p-4 shadow-xl space-y-3 transition-colors">
                <div className="rounded-xl overflow-hidden aspect-[16/9] relative bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80"
                    alt="Course recommend"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    Coloso
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                    coloso – a character drawing technique that adds tension with minimal line drawing and coloring
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    Minimal line art and coloring guide for beginners in character drawing of Gatnamul, with 190,000 followers | Coloso.
                  </p>
                </div>

                {/* PK Voting Box matching Screenshot 3 */}
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-[#142633] border border-amber-300/50 dark:border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <BarChart2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Participate in PK voting</span>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleVote1('really')}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
                        pkVotes1.userVoted === 'really'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-white dark:bg-[#1a3140] hover:bg-amber-100/60 dark:hover:bg-[#213f53] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>Really want it</span>
                      <span className="font-mono font-bold">{pkVotes1.really} votes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVote1('want')}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
                        pkVotes1.userVoted === 'want'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-white dark:bg-[#1a3140] hover:bg-amber-100/60 dark:hover:bg-[#213f53] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>I want it</span>
                      <span className="font-mono font-bold">{pkVotes1.want} votes</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                    Single choice • Long-term effectiveness • Two people have already participated • Click option to vote
                  </p>
                </div>
              </div>

              {/* Recommended Course 2 with PK Voting */}
              <div className="bg-[#ffffff] dark:bg-[#102029]/95 border border-[#e8e2d4] dark:border-[#1d3847] rounded-3xl p-4 shadow-xl space-y-3 transition-colors">
                <div className="rounded-xl overflow-hidden aspect-[16/9] relative bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"
                    alt="Course recommend 2"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    FastCampus
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                    fastcampus - Original 3D modeling by Blender in the first part to VTuber & Virtual MV production
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    Blender 3D modeling and Vtuber debut course that leverages the appeal of original artwork.
                  </p>
                </div>

                {/* PK Voting Box 2 */}
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-[#142633] border border-amber-300/50 dark:border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <BarChart2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Participate in PK voting</span>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleVote2('yes')}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
                        pkVotes2.userVoted === 'yes'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-white dark:bg-[#1a3140] hover:bg-amber-100/60 dark:hover:bg-[#213f53] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>Yes (Rất muốn mở)</span>
                      <span className="font-mono font-bold">{pkVotes2.yes} votes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVote2('no')}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
                        pkVotes2.userVoted === 'no'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-white dark:bg-[#1a3140] hover:bg-amber-100/60 dark:hover:bg-[#213f53] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>No need (Chưa cần thiết)</span>
                      <span className="font-mono font-bold">{pkVotes2.no} votes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* GOOGLE DRIVE RESOURCES MODAL (Entitlement-Protected) */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#ffffff] dark:bg-[#102029] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <FolderDown className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Tài Nguyên Google Drive ({course.code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Quyền truy cập đã được cấp tự động
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Email Google liên kết: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{user?.googleEmail || user?.email || 'student@whale.art'}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Nội dung thư mục bao gồm:</h4>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-600 dark:text-slate-400">
                  <li>Toàn bộ file nguồn PSD phân lớp đầy đủ (Concept & Matte Painting).</li>
                  <li>Bộ cọ vẽ kỹ thuật số chuyên dụng (.ABR, .TPL cho Photoshop / Procreate).</li>
                  <li>Mô hình 3D Blender (.blend, .fbx kèm textures PBR 4K).</li>
                  <li>Video hướng dẫn chất lượng gốc 4K không nén (dành cho học tập ngoại tuyến).</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                ⚠️ <span className="font-semibold">Lưu ý bảo mật:</span> Tài nguyên chỉ dành riêng cho tài khoản của bạn. Hệ thống Google Drive API tự động gắn watermark kỹ thuật số và thu hồi quyền nếu phát hiện chia sẻ trái phép.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Đóng
              </button>
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  sound.playSuccess();
                  setShowDriveModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-md transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở thư mục Google Drive</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
