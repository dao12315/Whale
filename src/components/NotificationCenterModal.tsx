import React, { useState, useEffect } from 'react';
import { PushNotification, NotificationType } from '../types';
import { notificationService } from '../services/notificationService';
import {
  Bell,
  MessageSquare,
  Flame,
  Crown,
  Coins,
  CheckCheck,
  X,
  Volume2,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { sound } from '../services/sound';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCourse: (courseId: string) => void;
  onRefreshUnread: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenCourse,
  onRefreshUnread,
}) => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'comment' | 'group_buy' | 'system'>('all');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const loadNotifications = () => {
    const list = notificationService.getStoredNotifications();
    setNotifications(list);
    setPermission(notificationService.getPermissionStatus());
    onRefreshUnread();
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestPushPermission();
    setPermission(perm);
    if (perm === 'granted') {
      notificationService.sendPushNotification({
        type: 'system',
        title: '🔔 Đã kích hoạt Thông Báo Đẩy Thành Công!',
        message: 'Từ bây giờ bạn sẽ nhận thông báo khi có người trả lời bình luận hoặc khi khóa học đạt mục tiêu mua chung.',
        timestamp: 'Vừa xong',
      });
      loadNotifications();
    }
  };

  const handleTestPush = () => {
    notificationService.sendPushNotification({
      type: 'comment',
      title: '💬 Nhất Trinh Sơn Hải: Phản hồi mới!',
      message: 'Một đồng môn vừa trao đổi thêm về kỹ thuật chỉnh màu phim lễ hội Mi Châu [480].',
      timestamp: 'Vừa xong',
      courseId: 'course-480',
    });
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    sound.playClick();
    loadNotifications();
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'comment') return n.type === 'comment';
    if (activeTab === 'group_buy') return n.type === 'group_buy';
    if (activeTab === 'system') return n.type === 'system' || n.type === 'vip' || n.type === 'credit';
    return true;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'group_buy':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'vip':
        return <Crown className="w-4 h-4 text-purple-400" />;
      case 'credit':
        return <Coins className="w-4 h-4 text-yellow-400" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0e1b22] border border-[#233f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#142630] border-b border-[#233b47] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Trung Tâm Thông Báo Đẩy</h3>
              <p className="text-[10px] text-slate-400">Push Notifications & Live Updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Banner */}
        <div className="p-3.5 bg-[#12232d] border-b border-[#1f3745] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className={`w-4 h-4 ${permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <span className="text-slate-200 font-medium block">
                {permission === 'granted'
                  ? 'Trình duyệt: Đã cấp quyền thông báo đẩy'
                  : 'Bật thông báo đẩy trên trình duyệt'}
              </span>
              <span className="text-[10px] text-slate-400">
                {permission === 'granted'
                  ? 'Bạn sẽ nhận thông báo âm thanh & pop-up ngay cả khi chuyển tab'
                  : 'Nhận tin nhắn bình luận và cảnh báo mua chung tức thì'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition-colors"
              >
                Cấp quyền
              </button>
            ) : (
              <button
                onClick={handleTestPush}
                className="px-2.5 py-1 bg-[#1d3848] hover:bg-[#25465a] text-cyan-300 font-medium text-xs rounded-lg border border-cyan-500/30 transition-colors flex items-center gap-1"
                title="Kiểm tra âm thanh chuông và thông báo trình duyệt"
              >
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Bắn thử</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters & Mark All Read */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('comment')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'comment'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bình luận
            </button>
            <button
              onClick={() => setActiveTab('group_buy')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'group_buy'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mua chung
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'system'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hệ thống
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc hết</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2.5 divide-y divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Không có thông báo nào trong mục này.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  notificationService.markAsRead(item.id);
                  if (item.courseId) {
                    onOpenCourse(item.courseId);
                    onClose();
                  }
                  loadNotifications();
                }}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all cursor-pointer hover:bg-[#132631] flex items-start gap-3 ${
                  item.title.includes('Đặt đơn')
                    ? 'bg-gradient-to-r from-[#0e2722] to-[#12222b] border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                    : !item.read
                    ? 'bg-[#12222b] border border-amber-500/20'
                    : 'opacity-85'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 border ${
                  item.title.includes('Đặt đơn')
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                    : 'bg-[#192f3c] border-slate-700/60'
                }`}>
                  {item.title.includes('Đặt đơn') ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    getIcon(item.type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap">
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      )}
                      <span>{item.title}</span>
                      {item.title.includes('Đặt đơn') && (
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                          ĐƠN HÀNG MỚI
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {item.message}
                  </p>

                  {item.courseId && (
                    <div className="mt-2 text-[11px] text-amber-300 font-semibold hover:underline flex items-center gap-1">
                      <span>{item.linkText || 'Vào học ngay & xem tài nguyên'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-[#12222b] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Âm thanh thông báo Web Audio đã sẵn sàng</span>
          </span>
          <button
            onClick={handleTestPush}
            className="text-amber-300 hover:underline font-semibold"
          >
            + Test thông báo
          </button>
        </div>
      </div>
    </div>
  );
};
