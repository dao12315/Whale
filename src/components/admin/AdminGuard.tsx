import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { ShieldAlert, ArrowLeft, KeyRound, UserCheck, Lock } from 'lucide-react';

interface AdminGuardProps {
  onBackToHome: () => void;
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ onBackToHome, children }) => {
  const { user, isAuthenticated, loginAs } = useAuth();
  const { t } = useI18n();

  // Kiểm tra quyền Admin (tier === 'admin' hoặc role === 'ADMIN')
  const isAdmin = isAuthenticated && (user?.tier === 'admin' || user?.role === 'ADMIN');

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full bg-white dark:bg-[#102029] rounded-2xl border border-red-500/30 dark:border-red-500/20 shadow-2xl p-6 sm:p-8 text-center animate-in fade-in duration-300">
          {/* Icon cảnh báo */}
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-500">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            403 Forbidden • Access Denied
          </span>

          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100 mt-4 mb-2">
            {t('admin.access_denied_title')}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400 mb-6 leading-relaxed">
            {t('admin.access_denied_desc')}
          </p>

          {/* Bài học bảo mật dành cho Junior */}
          <div className="bg-amber-500/10 dark:bg-amber-500/5 rounded-xl border border-amber-500/30 p-3.5 mb-6 text-left flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-stone-700 dark:text-slate-300 leading-normal">
              <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                Kiến thức kiến trúc (Senior note):
              </span>
              Màn hình chặn này chỉ là lớp bảo vệ UX. Bảo mật thực tế nằm ở tầng Backend API: Mọi request gửi lên máy chủ đều phải mang JWT token có vai trò <code className="bg-stone-200 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-700 dark:text-amber-300 font-mono">ADMIN</code>, nếu không sẽ bị từ chối ngay lập tức.
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onBackToHome}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang học tập</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Đã xác thực quyền Admin -> Cho phép render giao diện quản trị
  return <>{children}</>;
};
