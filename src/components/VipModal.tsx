import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Crown, Check, Sparkles, Zap, Shield, Gift } from 'lucide-react';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VipModal: React.FC<VipModalProps> = ({ isOpen, onClose }) => {
  const { user, upgradeTier } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0f1d24] border border-[#233f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#142630] border-b border-[#233b47] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 font-cinzel">
                Nâng Cấp Hội Viên Đặc Quyền 一帧山海
              </h3>
              <p className="text-[10px] text-slate-400">Membership Tiers & VIP Benefits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-300 text-center max-w-lg mx-auto">
            Hội viên VIP được hưởng mức giá mua chung ưu đãi độc quyền trên mọi khóa học và tài nguyên số. Giá được tự động áp dụng ngay khi đăng nhập.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gold Member */}
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                user?.tier === 'gold'
                  ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40'
                  : 'bg-[#12222b] border-amber-600/30 hover:border-amber-500/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Gold Member
                  </span>
                  {user?.tier === 'gold' && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                      Cấp hiện tại
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-100 font-mono">45 Credits</span>
                  <span className="text-xs text-slate-400 font-light">/ khóa học (Gốc 50)</span>
                </div>
                <div className="text-[11px] text-amber-300/80 font-medium mt-0.5">
                  Chiết khấu cố định 10%
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Giảm giá trực tiếp còn 45 Credits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Tặng 150 Credits ban đầu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Quyền ưu tiên tham gia mua chung</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Huy hiệu thành viên Gold lấp lánh</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  upgradeTier('gold');
                  onClose();
                }}
                disabled={user?.tier === 'gold'}
                className="mt-6 w-full py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow transition-all"
              >
                {user?.tier === 'gold' ? 'Đang sở hữu gói Gold' : 'Kích hoạt Gold Member'}
              </button>
            </div>

            {/* Supreme Member */}
            <div
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                user?.tier === 'supreme'
                  ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/40'
                  : 'bg-[#171c2a] border-purple-500/40 hover:border-purple-400'
              }`}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    Supreme Member
                  </span>
                  <span className="text-[10px] bg-gradient-to-r from-purple-500 to-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    Khuyên dùng
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-100 font-mono">35 Credits</span>
                  <span className="text-xs text-slate-400 font-light">/ khóa học (Gốc 50)</span>
                </div>
                <div className="text-[11px] text-purple-300 font-medium mt-0.5">
                  Chiết khấu tối đa 30% VIP
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Mức giá kịch sàn: chỉ 35 Credits / khóa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Tặng 350 Credits trải nghiệm kho tài nguyên</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Truy cập trước 24h các bản số hóa Coloso</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Huy hiệu Supreme vương miện tím nổi bật</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  upgradeTier('supreme');
                  onClose();
                }}
                disabled={user?.tier === 'supreme'}
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 hover:from-purple-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-950/40 transition-all"
              >
                {user?.tier === 'supreme' ? 'Đang sở hữu gói Supreme' : 'Nâng cấp Supreme VIP (350 Credits)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
