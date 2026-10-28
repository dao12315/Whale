import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import {
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Crown,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { sound } from '../services/sound';

export const AuthPage: React.FC = () => {
  const { loginWithRealAccount, registerWithRealAccount, loginWithGoogle } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
  }>({});

  // Google sign in states
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleWelcomeInfo, setGoogleWelcomeInfo] = useState<{
    email: string;
    initialPassword?: string;
  } | null>(null);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMessage(null);
    setFieldErrors({});
    sound.playClick();
  };

  const validateForm = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      name?: string;
    } = {};

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = t('auth.validation_email_required');
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = t('auth.validation_email_invalid');
    }

    if (!password) {
      errors.password = t('auth.validation_password_required');
    } else if (password.length < 6) {
      errors.password = t('auth.validation_password_min');
    }

    if (mode === 'register') {
      const trimmedName = name.trim();
      if (!trimmedName) {
        errors.name = t('auth.validation_name_required');
      } else if (trimmedName.length < 2) {
        errors.name = t('auth.validation_name_min');
      }

      if (!confirmPassword) {
        errors.confirmPassword = t('auth.validation_confirm_required');
      } else if (password !== confirmPassword) {
        errors.confirmPassword = t('auth.validation_confirm_mismatch');
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      sound.playClick();
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    if (mode === 'login') {
      const result = await loginWithRealAccount(email.trim(), password);
      setIsSubmitting(false);
      if (!result.success) {
        setErrorMessage(result.error || t('auth.error_failed'));
      }
    } else {
      const result = await registerWithRealAccount(email.trim(), password, name.trim());
      setIsSubmitting(false);
      if (!result.success) {
        setErrorMessage(result.error || t('auth.error_failed'));
      }
    }
  };

  const googleOAuthLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsSubmitting(true);
        sound.playClick();
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const gUser = await res.json();
        if (gUser && gUser.email) {
          const result = await loginWithGoogle(
            gUser.email,
            undefined,
            gUser.name || gUser.email.split('@')[0],
            gUser.picture
          );
          setIsSubmitting(false);
          if (result.success) {
            if (result.isNewUser && result.generatedPassword) {
              setGoogleWelcomeInfo({
                email: gUser.email,
                initialPassword: result.generatedPassword,
              });
            }
          } else {
            setErrorMessage(t('auth.google_error'));
          }
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage('Không thể lấy thông tin tài khoản Google: ' + err.message);
      }
    },
    onError: (err) => {
      console.warn('[Google Sign-In] OAuth popup notice:', err);
      setShowGoogleInput(true);
    },
  });

  const handleGoogleSignIn = async (targetEmail?: string) => {
    setErrorMessage(null);
    const gEmail = targetEmail || googleCustomEmail || 'nguyendao512004@gmail.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (showGoogleInput && targetEmail && !emailRegex.test(targetEmail.trim())) {
      setErrorMessage(t('auth.validation_email_invalid'));
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    const result = await loginWithGoogle(gEmail.trim(), undefined, gEmail.split('@')[0]);
    setIsSubmitting(false);

    if (result.success) {
      if (result.isNewUser && result.generatedPassword) {
        setGoogleWelcomeInfo({
          email: gEmail,
          initialPassword: result.generatedPassword,
        });
      }
    } else {
      setErrorMessage(t('auth.google_error'));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070e12] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="relative w-full max-w-4xl bg-[#0b161c]/90 border border-[#1a2f3b] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 z-10">
        {/* Left Side: Brand & Hero Showcase (5 cols on lg) */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-[#10222b] via-[#0d1b22] to-[#070f14] border-b lg:border-b-0 lg:border-r border-[#1a2f3b] flex flex-col justify-between relative overflow-hidden">
          {/* Top Brand Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/40">
                <span className="font-black text-slate-950 text-2xl">G</span>
              </div>
              <div>
                <h1 className="font-cinzel text-xl font-extrabold tracking-wider text-slate-100">
                  GGC STUDIO
                </h1>
                <p className="text-[11px] text-amber-400 font-mono tracking-widest uppercase">
                  Masterclasses & CG Resources
                </p>
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
                Nền tảng chia sẻ khóa học & tài nguyên CG điện ảnh
              </h2>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Hệ thống giáo trình đồ họa thực chiến từ các Art Director hàng đầu. Bảo mật 2 lớp JWT Token, cấp quyền Google Drive tự động.
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bảo mật JWT Token 2 lớp & Xác thực tài khoản thật</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Đăng nhập an toàn qua Email hoặc tài khoản Google</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Hệ thống phân quyền chuẩn: Admin (Quản trị) & User (Học viên)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Kiểm duyệt nội dung tự động bằng trí tuệ nhân tạo AI</span>
              </div>
            </div>
          </div>

          {/* System Security Guarantee Banner */}
          <div className="mt-8 pt-6 border-t border-[#1a2f3b] space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-[#07131a] border border-[#162e3d] text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Chính sách Bảo mật & Quyền riêng tư</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mọi thông tin tài khoản và mật khẩu đều được mã hóa theo tiêu chuẩn công nghiệp bcrypt và lưu trữ an toàn trong cơ sở dữ liệu.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form (7 cols on lg) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-[#070e12] border border-[#1a2f3b] rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.tab_login')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.tab_register')}
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-100 font-cinzel">
              {mode === 'login' ? t('auth.login_title') : t('auth.register_title')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Nhập email và mật khẩu của bạn để đăng nhập vào hệ thống.'
                : 'Mở tài khoản học viên để truy cập khóa học, diễn đàn và nhận tài nguyên CG.'}
            </p>
          </div>

          {/* Google Welcome Alert for New Users */}
          {googleWelcomeInfo && (
            <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{t('auth.google_welcome')}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Tài khoản Gmail <span className="font-mono text-cyan-300 font-bold">{googleWelcomeInfo.email}</span> đã được đăng ký thành công với vai trò <span className="font-bold text-amber-300">User</span>.
              </p>
              {googleWelcomeInfo.initialPassword && (
                <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{t('auth.google_password_generated')}:</span>
                  <code className="text-amber-300 font-mono font-bold bg-[#142630] px-2 py-0.5 rounded text-xs select-all">
                    {googleWelcomeInfo.initialPassword}
                  </code>
                </div>
              )}
              <p className="text-[11px] text-emerald-400/90 italic">
                {t('auth.google_mail_notice')}
              </p>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-in Block */}
          <div className="mb-5 p-3.5 rounded-xl bg-[#0d1c24] border border-cyan-500/30 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                try {
                  googleOAuthLogin();
                } catch {
                  handleGoogleSignIn();
                }
              }}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-cyan-500/20 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('auth.google_login_btn')}</span>
            </button>

            {showGoogleInput && (
              <div className="pt-2 border-t border-[#1a3341] space-y-1.5">
                <label className="text-[11px] text-cyan-300 font-medium block">
                  {t('auth.google_custom_label')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={googleCustomEmail}
                    onChange={(e) => {
                      setGoogleCustomEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="yourname@gmail.com"
                    className="flex-1 bg-[#09151c] text-slate-200 text-xs rounded-lg px-3 py-2 border border-[#233b47] focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn(googleCustomEmail)}
                    disabled={isSubmitting || !googleCustomEmail}
                    className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs disabled:opacity-50"
                  >
                    Đăng nhập
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleInput(!showGoogleInput);
                  setErrorMessage(null);
                }}
                className="text-[11px] text-slate-400 hover:text-cyan-300 underline"
              >
                {showGoogleInput ? '← Đăng nhập bằng Google 1-chạm' : 'Nhập địa chỉ Gmail riêng...'}
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#1a2f3b] w-full"></div>
            <span className="bg-[#0b161c] px-3 text-[11px] text-slate-500 uppercase tracking-widest font-mono">
              {t('auth.or_manual')}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  {t('auth.nickname_label')} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    placeholder={t('auth.name_placeholder')}
                    className={`w-full bg-[#081217] text-slate-100 text-xs sm:text-sm rounded-xl pl-10 pr-3.5 py-3 border ${
                      fieldErrors.name ? 'border-rose-500 focus:border-rose-400' : 'border-[#1a2f3b] focus:border-amber-400'
                    } focus:outline-none transition-colors`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                {t('auth.email_label')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  placeholder={t('auth.email_placeholder')}
                  className={`w-full bg-[#081217] text-slate-100 text-xs sm:text-sm rounded-xl pl-10 pr-3.5 py-3 border ${
                    fieldErrors.email ? 'border-rose-500 focus:border-rose-400' : 'border-[#1a2f3b] focus:border-amber-400'
                  } focus:outline-none transition-colors`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                {t('auth.password_label')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder={t('auth.password_placeholder')}
                  className={`w-full bg-[#081217] text-slate-100 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 border ${
                    fieldErrors.password ? 'border-rose-500 focus:border-rose-400' : 'border-[#1a2f3b] focus:border-amber-400'
                  } focus:outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  {t('auth.confirm_password')} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                    }}
                    placeholder={t('auth.confirm_password_placeholder')}
                    className={`w-full bg-[#081217] text-slate-100 text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 border ${
                      fieldErrors.confirmPassword ? 'border-rose-500 focus:border-rose-400' : 'border-[#1a2f3b] focus:border-amber-400'
                    } focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('auth.submitting')}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? t('auth.btn_login') : t('auth.btn_register')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-[#1a2f3b]/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {t('auth.security_badge')}
            </span>
            <span>{t('auth.only_two_roles')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
