import React from 'react';
import { Course } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { MessageSquare, Eye, ThumbsUp, Heart, CheckCircle2, Crown } from 'lucide-react';
import { getCourseVndPrices } from '../utils/currency';
import { useI18n } from '../i18n';

interface CourseCardProps {
  course: Course;
  onOpenDetails: (course: Course) => void;
  onOpenComments: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onOpenDetails,
  onOpenComments,
}) => {
  const { user, isWishlisted, toggleWishlist, hasPurchased } = useAuth();
  const { likeCourse, getCommentsForCourse } = useRealtime();
  const { t } = useI18n();

  const commentsList = getCommentsForCourse(course.id);
  const liveCommentCount = Math.max(course.commentsCount, commentsList.length);
  const isUnlocked = hasPurchased(course.id);
  const wishlisted = isWishlisted(course.id);

  // Tính toán học phí VND và trạng thái miễn phí
  const coursePrices = getCourseVndPrices(course);

  return (
    <div
      onClick={() => onOpenDetails(course)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-[#112028] hover:bg-stone-50 dark:hover:bg-[#152731] border border-stone-200 dark:border-[#213744] hover:border-amber-500 dark:hover:border-amber-400/50 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    >
      {/* Thumbnail with overlay text matching screenshot */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>

        {/* Festival Title Chinese Overlay in the top-left */}
        <div className="absolute top-3 left-3 text-left max-w-[80%] drop-shadow-md">
          <div className="text-white font-chinese font-bold text-xs sm:text-sm tracking-wide line-clamp-1">
            {course.titleZh.split('|')[0] || course.titleZh}
          </div>
          {course.eventDate && (
            <div className="text-[10px] text-amber-200/90 font-serif tracking-wider">
              {course.eventDate}
            </div>
          )}
        </div>

        {/* Group buy status badge or Purchased badge */}
        {isUnlocked ? (
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-emerald-400/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã sở hữu</span>
          </div>
        ) : course.groupBuyStatus ? (
          <div
            className={`absolute top-3 right-3 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md ${
              course.groupBuyStatus.isCompleted
                ? 'bg-emerald-600/80 border border-emerald-400/40'
                : 'bg-amber-600/90 border border-amber-400/40'
            }`}
          >
            <span>
              {course.groupBuyStatus.isCompleted
                ? 'Đã chốt kèo'
                : `Mua chung ${course.groupBuyStatus.currentMembers}/${course.groupBuyStatus.targetMembers}`}
            </span>
          </div>
        ) : null}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(course.id);
          }}
          className={`absolute bottom-3 right-3 p-1.5 rounded-full backdrop-blur-md transition-all ${
            wishlisted
              ? 'bg-red-500/80 text-white shadow-lg'
              : 'bg-black/40 text-slate-300 hover:text-white hover:bg-black/70'
          }`}
          title="Lưu vào danh sách quan tâm"
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Card Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Course Title */}
          <h3 className="font-bold text-stone-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors">
            <span className="text-amber-600 dark:text-amber-400 font-bold mr-1">{course.code}</span>
            {course.title}
          </h3>

          {/* Category / Admin Creator Tag */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 lowercase tracking-wide">
              {course.category}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
              • <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
              <span>{course.instructor}</span>
            </span>
          </div>
        </div>

        {/* Author Avatar & Meta Stats row */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400">
            {/* Left: Avatar + Published Time Ago */}
            <div className="flex items-center gap-2">
              <img
                src={course.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                alt={course.instructor || 'Admin'}
                className="w-5 h-5 rounded-full object-cover border border-amber-500/40"
              />
              <span className="text-[11px] text-stone-500 dark:text-slate-400 font-light">{course.publishedTimeAgo}</span>
            </div>

            {/* Right: Stats (Comments, Views, Likes) */}
            <div className="flex items-center gap-2.5">
              {/* Clickable real-time comments icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComments(course);
                }}
                className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-cyan-400 transition-colors group/c"
                title="Xem và gửi bình luận trực tiếp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400 group-hover/c:text-amber-600 dark:group-hover/c:text-cyan-400" />
                <span className="font-mono text-[11px] text-stone-600 dark:text-slate-300 group-hover/c:text-amber-600 dark:group-hover/c:text-cyan-400 font-medium">
                  {liveCommentCount}
                </span>
              </button>

              {/* Views */}
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400" />
                <span className="font-mono text-[11px] text-stone-600 dark:text-slate-300 font-medium">{course.viewsCount}</span>
              </div>

              {/* Likes */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  likeCourse(course.id);
                }}
                className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group/l"
                title="Thích khóa học này"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400 group-hover/l:text-amber-600 dark:group-hover/l:text-amber-400" />
                <span className="font-mono text-[11px] text-stone-600 dark:text-slate-300 group-hover/l:text-amber-600 dark:group-hover/l:text-amber-400 font-medium">
                  {course.likesCount}
                </span>
              </button>
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="my-3 border-t border-dotted border-stone-200 dark:border-slate-700/70"></div>

          {/* Course Access / Learning Information (No Price Display) */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>Quyền học trọn đời</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700/60 text-teal-800 dark:text-teal-300 font-semibold">
              Google Drive VIP
            </span>
          </div>

          {/* Curriculum & Resources info pills */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-stone-50 dark:bg-[#152732] border border-stone-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 font-medium">Giáo trình</span>
              <span className="text-xs font-bold text-stone-900 dark:text-slate-100 font-mono">
                {course.chapters && course.chapters.length > 0 ? `${course.chapters.length} bài giảng` : 'Toàn bộ bài học'}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-stone-50 dark:bg-[#152732] border border-stone-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 font-medium">Tài nguyên dự án</span>
              <span className="text-xs font-bold text-stone-900 dark:text-slate-100 font-mono">
                Video HD & Project
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
