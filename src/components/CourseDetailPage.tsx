import React, { useState } from 'react';
import { Course, Language, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useTheme } from '../context/ThemeContext';
import { sound } from '../services/sound';
import { notificationService } from '../services/notificationService';
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

  const isUnlocked = hasPurchased(course.id);
  const wishlisted = isWishlisted(course.id);

  // Calculate pricing based on membership tier
  const userPrice =
    user?.tier === 'supreme'
      ? course.supremePrice
      : user?.tier === 'gold'
      ? course.goldPrice
      : course.originalPrice;

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
        title: next ? `🌟 Đã theo dõi tác giả ${course.instructor}` : `Đã hủy theo dõi`,
        message: next
          ? `Bạn sẽ nhận được thông báo khi tác giả này đăng tải khóa học mới.`
          : `Bạn đã ngừng theo dõi tác giả ${course.instructor}.`,
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
      title: `✉ Đã gửi tin nhắn riêng tới ${course.instructor}`,
      message: `Hệ thống đã chuyển lời nhắn của bạn đến hộp thư của giảng viên.`,
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
            <span>Quay lại (Back)</span>
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
                    src={course.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                    alt="Author"
                    className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/40 ring-2 ring-slate-100 dark:ring-slate-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {course.instructor || 'Yuan Dian'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Giảng viên
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {course.publishedTimeAgo || 'Published 2 hours ago'}
                    </span>
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
                    <span>{isFollowingAuthor ? 'Đang theo dõi' : '♡ Attention'}</span>
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

                    <button
                      type="button"
                      className="absolute bottom-2 inset-x-2 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-sm text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-300" />
                      <span>View the original course page</span>
                    </button>
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

                    {/* Pricing matching Screenshot 1 */}
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-500 font-medium">Credits</span>
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                          {course.originalPrice === 0 ? '0' : course.originalPrice}
                        </span>
                        {course.originalPrice === 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold font-mono">
                            MIỄN PHÍ 100%
                          </span>
                        )}
                      </div>

                      {/* Gold & Supreme member discount pills */}
                      {course.originalPrice > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-amber-50 dark:bg-[#1a271e]/70 border border-amber-300/60 dark:border-amber-600/40 flex items-center justify-between">
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 flex items-center gap-1">
                              👑 Gold member
                            </span>
                            <span className="font-bold font-mono text-amber-700 dark:text-amber-300">
                              Credits {course.goldPrice}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-purple-50 dark:bg-[#25172d]/70 border border-purple-300/60 dark:border-purple-500/40 flex items-center justify-between">
                            <span className="text-[10px] text-purple-800 dark:text-purple-300 flex items-center gap-1">
                              💎 Supreme member
                            </span>
                            <span className="font-bold font-mono text-purple-700 dark:text-purple-300">
                              Credits {course.supremePrice}
                            </span>
                          </div>
                        </div>
                      )}

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
                            <span>{course.originalPrice === 0 ? 'Vào học ngay • Tải tài nguyên miễn phí' : `Vào học ngay (${userPrice} Credits)`}</span>
                          </button>
                        )}
                      </div>
                    </div>
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <div className="font-chinese text-2xl sm:text-4xl font-extrabold tracking-wide drop-shadow-md">
                    {course.titleZh || '都江堰放水节 2026.04.04'}
                  </div>
                  <div className="font-serif text-xs sm:text-sm text-amber-200/90 mt-1">
                    {course.eventDate || '农历丙午年二月十七 · 星期六'}
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-slate-200 max-w-xl font-light line-clamp-2">
                    {course.subtitle ||
                      'Khóa học trọn bộ kỹ thuật số, phân tích bối cảnh phim điện ảnh, kỹ xảo Unreal Engine và tư liệu văn hóa nghệ thuật.'}
                  </p>
                </div>
              </div>

              {/* ARTICLE CURRICULUM SECTIONS MATCHING SCREENSHOT 2 */}
              <div className="space-y-6 pt-2">
                {/* Section 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-red-700 rounded-full"></span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                      Dujiangyan Water Release Festival • Traditional Chinese culture
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                    The Sichuan Dujiangyan Water Release Festival originates from the ancient custom of opening the sluice gates after annual repairs to release water and honor Li Bing and his son. It is held annually around Qingming at the head of the Dujiangyan Canal, including rituals, cutting rafts to release water, and parades, symbolizing the start of the year's agricultural water supply.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-red-700 rounded-full"></span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                      Folklore and daily life
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                    On the day of the water release, people watched the ceremony around Yuzui and Baopingkou. Minjiang River water flowed through Neijiang into the irrigation area, and farmers in the western Sichuan plain prayed for favorable weather and abundant harvests. The specific times and rituals of festivals vary by region, so local records prevail.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Cultural references: China Intangible Cultural Heritage Network. The images are expressions of traditional culture and art; dates and ceremonies are subject to local records.
                  </p>
                </div>

                {/* Section 3: Baby Returns Home Public Welfare Family Search Notice Card */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-red-700 rounded-full"></span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-serif">
                      Baby Returns Home Public Welfare Family Search
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                    The following information comes from the Public Family Search Files of the Baby Home Volunteer Association. If you have relevant clues, please verify and contact through official channels; Please refer to the latest records on the official website for case status.
                  </p>

                  {/* Public Welfare Archive Card matching Screenshot 2 */}
                  <div className="border-2 border-teal-500/70 rounded-2xl overflow-hidden bg-white dark:bg-[#0f1d24] shadow-md">
                    <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 w-full" />
                    <div className="p-4 sm:p-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                          <span>[610751] 林金灶烈士</span>
                        </h4>
                        <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold tracking-wide">
                          烈士寻根 / Homeless or wandering person
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-5 items-start pt-2 border-t border-slate-200 dark:border-slate-800">
                        {/* Gray silhouette placeholder matching Screenshot 2 */}
                        <div className="w-28 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                          <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center mb-1">
                            <span className="text-xl text-slate-500">👤</span>
                          </div>
                          <span className="text-[10px] text-slate-400">暂无照片</span>
                        </div>

                        {/* Metadata Details */}
                        <div className="flex-1 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 min-w-[130px]">寻亲类别 / Category:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">烈士寻根</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 min-w-[130px]">寻根编号:</span>
                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">610751</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 min-w-[130px]">烈士姓名 / Martyr name:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">林金灶烈士</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 min-w-[130px]">性别 / Sex:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">男</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 min-w-[130px]">身高 / Height:</span>
                            <span className="text-slate-500 font-mono">未知CM</span>
                          </div>
                        </div>
                      </div>

                      {/* Official Archive Source Footer matching Screenshot 2 */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                        <p>来源: 宝贝回家志愿者协会官网 | 快照日期: 2026-08-30 | 以官网最新状态为准</p>
                        <p className="font-mono text-teal-600 dark:text-teal-400 hover:underline break-all">
                          https://www.baobeihuijia.com/bbhj/contents/18/166914.html
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Source & Copyright Notice matching Screenshot 3 */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-light">
                <p>Source: The Baby Home Volunteer Association has published archives on its official website</p>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">© Copyright Notice: </span>
                  <span>The copyright of this article belongs to the author. Please do not reprint without permission.</span>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2 text-slate-400">
                  <span className="h-[1px] w-20 bg-slate-300 dark:bg-slate-700"></span>
                  <span className="text-[10px] uppercase font-mono tracking-widest">THE END</span>
                  <span className="h-[1px] w-20 bg-slate-300 dark:bg-slate-700"></span>
                </div>

                {/* Course Tags matching Screenshot 3 */}
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {['coloso', 'colsoo', 'Comprehensive course category', 'Special tutorial - Colo'].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#142633] text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      <span>📁</span>
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>

                {/* User interaction bar matching Screenshot 3 */}
                <div className="pt-6 pb-2 text-center space-y-3">
                  <p className="text-xs text-slate-500 font-medium italic">
                    If you like it, please show your support
                  </p>
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
                      <span>Thumbs up {likesCount}</span>
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
                      <span>Share</span>
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
                      <span>{wishlisted ? 'Saved' : 'Collection'}</span>
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
            {/* WIDGET 1: FLOATING PURCHASE CARD MATCHING SCREENSHOT 1 */}
            <div className="bg-[#ffffff] dark:bg-[#102029]/95 border border-[#e8e2d4] dark:border-[#1d3847] rounded-3xl p-5 shadow-xl space-y-4 text-center transition-colors">
              {/* Badge */}
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded bg-amber-900/90 text-amber-200 text-[10px] font-bold tracking-wider shadow">
                <Download className="w-3 h-3" />
                <span>{course.originalPrice === 0 ? 'Free resources' : 'Paid resources'}</span>
              </div>

              {/* Price Banner with warm gradient */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#f9f2e3] to-[#f4ead5] dark:from-[#213328] dark:to-[#12221b] border border-amber-300/60 dark:border-emerald-600/30 text-center">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">Credits</span>
                <span className="text-4xl font-extrabold text-[#99521e] dark:text-amber-400 font-mono tracking-tight">
                  {course.originalPrice === 0 ? '0' : course.originalPrice}
                </span>
                {course.originalPrice === 0 && (
                  <span className="block mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    MIỄN PHÍ 100%
                  </span>
                )}
              </div>

              {/* Member tier breakdown */}
              {course.originalPrice > 0 && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-[#1a271e]/70 border border-amber-300/60 dark:border-amber-600/40 text-center">
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 block font-medium">
                      👑 Gold member
                    </span>
                    <span className="font-bold font-mono text-amber-700 dark:text-amber-200">
                      Credits {course.goldPrice}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-[#25172d]/70 border border-purple-300/60 dark:border-purple-500/40 text-center">
                    <span className="text-[10px] text-purple-800 dark:text-purple-300 block font-medium">
                      💎 Supreme member
                    </span>
                    <span className="font-bold font-mono text-purple-700 dark:text-purple-200">
                      Credits {course.supremePrice}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons matching Screenshot 1 */}
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
                    <span>{course.originalPrice === 0 ? 'Tải tài nguyên • Vào học ngay' : `Vào học ngay (${userPrice} Credits)`}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#162e3d] hover:bg-slate-200 dark:hover:bg-[#1d3b4d] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                  <span>View the original course page</span>
                </button>
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
    </div>
  );
};
