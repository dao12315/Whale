import React, { useEffect, useState } from 'react';
import { PushNotification } from '../types';
import { notificationService } from '../services/notificationService';
import { Bell, MessageSquare, Flame, Crown, Coins, X, Check } from 'lucide-react';

interface ToastContainerProps {
  onOpenCourse?: (courseId: string) => void;
  onOpenNotifications?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  onOpenCourse,
  onOpenNotifications,
}) => {
  const [toasts, setToasts] = useState<PushNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notif) => {
      setToasts((prev) => [notif, ...prev.slice(0, 3)]); // Keep max 4 active toasts

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== notif.id));
      }, 6000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const dismissToast = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: PushNotification['type']) => {
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

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => {
            if (toast.courseId && onOpenCourse) {
              onOpenCourse(toast.courseId);
            } else if (onOpenNotifications) {
              onOpenNotifications();
            }
          }}
          className="pointer-events-auto cursor-pointer group bg-[#11212a]/95 backdrop-blur-md border border-amber-500/30 hover:border-amber-400 shadow-2xl rounded-xl p-3.5 transition-all duration-300 transform hover:-translate-y-0.5 animate-in slide-in-from-right-5 fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#182e3a] border border-slate-700/60 shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <h4 className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  {toast.title}
                </h4>
                <button
                  onClick={(e) => dismissToast(toast.id, e)}
                  className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-[10px] text-amber-300/80 font-medium">
                  {toast.timestamp || 'Vừa xong'}
                </span>
                <span className="text-[11px] text-cyan-400 group-hover:underline flex items-center gap-0.5">
                  Xem ngay &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
