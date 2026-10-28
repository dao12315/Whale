import React, { useState } from 'react';
import { Course } from '../types';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/ordersApi';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HardDrive,
  PlayCircle,
  FileCode2,
  Loader2,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../services/sound';

interface DirectCheckoutModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

export const DirectCheckoutModal: React.FC<DirectCheckoutModalProps> = ({
  isOpen,
  course,
  onClose,
  onSuccess,
}) => {
  const { user, purchaseCourse } = useAuth();
  const [googleEmail, setGoogleEmail] = useState(user?.googleEmail || user?.email || '');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !course) return null;

  const handleCompleteActivation = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // 1. Gọi API Backend thật lưu đơn hàng và cấp quyền Google Drive
      try {
        await ordersApi.checkout({
          itemType: 'COURSE',
          itemId: course.id,
          paymentMethod: 'FREE' as any,
          googleEmail: googleEmail.trim() || undefined,
        });
      } catch (err: any) {
        console.warn('[DirectCheckout] Backend checkout:', err?.message);
      }

      // 2. Kích hoạt quyền sở hữu tại Local State
      purchaseCourse(course.id, 0, course.title);

      // 3. Hiệu ứng chúc mừng
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}

      sound.playSuccess();
      setIsProcessing(false);
      onSuccess(course.id);
      onClose();
    } catch (e: any) {
      setIsProcessing(false);
      alert('Có lỗi xảy ra trong quá trình kích hoạt: ' + (e?.message || 'Vui lòng thử lại'));
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-[#0e1d25] border border-stone-200 dark:border-[#213a48] rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-default animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-[#12242e] border-b border-stone-200 dark:border-[#1d3542] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <span>Kích Hoạt Khóa Học & Cấp Link Drive</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                  Google Drive VIP
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Mở khóa trọn đời • Kích hoạt bài giảng & tài nguyên tức thì
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Tóm tắt khóa học */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-[#152a36] border border-amber-200/80 dark:border-[#264556] flex items-center gap-3.5">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-16 h-16 rounded-xl object-cover ring-1 ring-amber-400/40 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                {course.code} • {course.category}
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-slate-100 line-clamp-1">
                {course.title}
              </h4>
              <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1">
                Admin sở hữu: <span className="text-amber-600 dark:text-amber-400 font-semibold">👑 {course.instructor}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Quyền học trọn đời</span>
              </span>
            </div>
          </div>

          {/* Email nhận Google Drive */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Email Google Drive để nhận quyền xem tài nguyên & video:</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                Tự động cấp quyền Reader
              </span>
            </label>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="nhap.email.google@gmail.com"
              className="w-full bg-stone-50 dark:bg-[#12242e] text-xs text-stone-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 border border-stone-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quyền lợi học tập */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#12222b] border border-stone-200 dark:border-[#1e3846] space-y-2.5 text-xs">
            <div className="font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Đặc quyền sau khi kích hoạt:</span>
            </div>
            <div className="space-y-2 text-stone-600 dark:text-slate-300 text-[11px]">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Mở khóa toàn bộ video bài giảng HD trực tuyến không giới hạn thời gian.</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Cấp quyền truy cập Google Drive VIP chứa thư mục tài nguyên dự án.</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Hỗ trợ file project, brushes, plugins và asset thực hành chuyên nghiệp.</span>
              </div>
            </div>
          </div>

          {/* Nút kích hoạt */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCompleteActivation}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#804618] via-[#a35b23] to-[#804618] hover:from-[#94521f] hover:to-[#94521f] text-white font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 tracking-wide uppercase font-cinzel disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang kích hoạt quyền học tập...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Xác nhận kích hoạt • Mở khóa Google Drive ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
