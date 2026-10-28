import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Sparkles,
  CalendarCheck,
  ChevronRight,
  User as UserIcon,
  ShoppingBag,
  Edit3,
  LogOut,
  Flame,
  MessageCircle,
  FileText,
  MessageSquare,
  Check,
} from 'lucide-react';
import { sound } from '../services/sound';
import { useI18n } from '../i18n';

interface UserDropdownProps {
  onClose: () => void;
  onOpenUserCenter: () => void;
  onOpenMyOrders: () => void;
  onOpenPublish: () => void;
  onOpenVip: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  onClose,
  onOpenUserCenter,
  onOpenMyOrders,
  onOpenPublish,
  onOpenVip,
  onOpenNotifications,
  unreadCount,
}) => {
  const { user, logout, claimDailyReward } = useAuth();
  const { t } = useI18n();

  if (!user) return null;

  const handleCheckIn = () => {
    claimDailyReward();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#ffffff] dark:bg-[#112028] border border-[#e8e4d9] dark:border-[#223946] shadow-2xl p-4 text-slate-800 dark:text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Top Header: Avatar, Name, Bio, Notification Icon */}
      <div className="flex items-start justify-between gap-2.5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400/60 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          </div>
          <div className="flex flex-col max-w-[140px]">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {user.name}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user.bio || "This guy is lazy and doesn't write anything..."}
            </span>
          </div>
        </div>

        {/* Top-Right Notification Button with Badge matching Screenshot 10 */}
        <button
          onClick={() => {
            onClose();
            onOpenNotifications();
          }}
          className="relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Membership Card Banner matching Screenshot 10 */}
      <div
        onClick={() => {
          onClose();
          onOpenVip();
        }}
        className="cursor-pointer group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#9a5823] via-[#b87333] to-[#7f461b] text-white p-2.5 shadow-md hover:brightness-105 transition-all mb-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💎</span>
            <span className="font-semibold text-xs tracking-wide">
              {user.tier === 'supreme' ? 'Supreme member...' : 'Activate Supreme VIP...'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-200 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Daily Check-in Button matching Screenshot 10 */}
      <button
        onClick={handleCheckIn}
        disabled={user.dailyCheckedIn}
        className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all mb-3 ${
          user.dailyCheckedIn
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border-amber-300/80 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 shadow-sm'
        }`}
      >
        {user.dailyCheckedIn ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Checked in today (+15 pts)</span>
          </>
        ) : (
          <>
            <CalendarCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Check in to claim today's rewards</span>
          </>
        )}
      </button>

      {/* Wallet Balance Cards (Balance & Points) matching Screenshot 10 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Balance Card */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#162933] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>{t('userCenter.balance')}</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {user.balance ?? 0}
            </span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.2 rounded">
              ¥
            </span>
          </div>
        </div>

        {/* Points Card */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#162933] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>{t('userCenter.points')}</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-bold text-amber-700 dark:text-amber-300">
              {user.points ?? 489}
            </span>
            <span className="text-xs">🪙</span>
          </div>
        </div>
      </div>

      {/* Stats Counter Row matching Screenshot 10 (7 comments, 0 articles, 2 posts, 77 heat) */}
      <div className="grid grid-cols-4 gap-1 py-2 px-1 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 text-center mb-3">
        <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <MessageCircle className="w-3 h-3 text-slate-400" />
          <span>{user.stats?.comments ?? 7}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <FileText className="w-3 h-3 text-slate-400" />
          <span>{user.stats?.articles ?? 0}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <MessageSquare className="w-3 h-3 text-slate-400" />
          <span>{user.stats?.posts ?? 2}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <Flame className="w-3 h-3" />
          <span>{user.heat ?? 77}</span>
        </div>
      </div>

      {/* 4-Item Action Grid matching Screenshot 10 */}
      <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-center text-[10px]">
        {/* User Center */}
        <button
          onClick={() => {
            onClose();
            onOpenUserCenter();
          }}
          className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span>{t('userCenter.user_center')}</span>
        </button>

        {/* My order */}
        <button
          onClick={() => {
            onClose();
            onOpenMyOrders();
          }}
          className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <span>{t('userCenter.my_orders')}</span>
        </button>

        {/* Role-based action: Admin quản lý/đăng tải, User xem khóa học của tôi */}
        {user.role === 'ADMIN' ? (
          <button
            onClick={() => {
              onClose();
              onOpenPublish();
            }}
            className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 transition-colors"
            title="Đăng tải khóa học mới (Quyền Admin)"
          >
            <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">{t('userCenter.publish_course')}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              onClose();
              onOpenUserCenter();
            }}
            className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Xem các khóa học đã mua và bài học của bạn"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <span>{t('userCenter.my_courses')}</span>
          </button>
        )}

        {/* Logged out */}
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          <span>{t('userCenter.logged_out')}</span>
        </button>
      </div>
    </div>
  );
};
