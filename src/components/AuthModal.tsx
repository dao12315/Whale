import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Sparkles, Shield, Crown, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginAs, loginWithCredentials, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    loginWithCredentials(email, name || undefined);
    onClose();
  };

  const handleSelectPreset = (preset: 'supreme' | 'gold' | 'free') => {
    loginAs(preset);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0e1c24] border border-[#233f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#142630] border-b border-[#233b47] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <span className="font-chinese font-bold text-amber-300 text-lg">海</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-cinzel">
                {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản'}
              </h3>
              <p className="text-[10px] text-slate-400">一帧山海 · Yizhen Shanhai Account</p>
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
        <div className="p-5 space-y-5">
          {/* Quick Demo Switcher (Highly convenient for testing) */}
          <div className="p-3 rounded-xl bg-[#12232c] border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Đăng nhập nhanh với tài khoản mẫu (Demo):
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Supreme Preset */}
              <button
                type="button"
                onClick={() => handleSelectPreset('supreme')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  user?.tier === 'supreme'
                    ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md'
                    : 'bg-[#182b36] border-purple-500/30 hover:border-purple-400 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-purple-300">
                  <Crown className="w-3 h-3 text-purple-400" />
                  <span>Supreme VIP</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">320 Credits</div>
              </button>

              {/* Gold Preset */}
              <button
                type="button"
                onClick={() => handleSelectPreset('gold')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  user?.tier === 'gold'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-md'
                    : 'bg-[#182b36] border-amber-500/30 hover:border-amber-400 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-300">
                  <span>Gold VIP</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">150 Credits</div>
              </button>

              {/* Free Preset */}
              <button
                type="button"
                onClick={() => handleSelectPreset('free')}
                className={`p-2 rounded-lg border text-center transition-all ${
                  user?.tier === 'free'
                    ? 'bg-slate-800 border-slate-400 text-white shadow-md'
                    : 'bg-[#182b36] border-slate-700 hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-200">Chuẩn / Free</div>
                <div className="text-[9px] text-slate-400 mt-0.5">60 Credits</div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-mono">
              Hoặc nhập thông tin riêng
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Họ và tên / Biệt danh nghệ thuật
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Hoàng Long DP"
                    className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              {mode === 'login' ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản & Nhận 100 Credits'}
            </button>
          </form>

          {/* Toggle login/register */}
          <div className="text-center text-xs text-slate-400 pt-1">
            {mode === 'login' ? (
              <span>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Đăng ký miễn phí
                </button>
              </span>
            ) : (
              <span>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Đăng nhập
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
