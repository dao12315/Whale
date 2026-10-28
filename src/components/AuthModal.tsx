import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Check, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { sound } from '../services/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
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
  const [authError, setAuthError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset errors when mode changes
  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setAuthError(null);
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
    setAuthError(null);

    if (!validateForm()) {
      sound.playClick();
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    if (mode === 'login') {
      const result = await loginWithRealAccount(email.trim(), password);
      setIsSubmitting(false);
      if (result.success) {
        onClose();
      } else {
        setAuthError(result.error || t('auth.error_failed'));
      }
    } else {
      const result = await registerWithRealAccount(email.trim(), password, name.trim());
      setIsSubmitting(false);
      if (result.success) {
        onClose();
      } else {
        setAuthError(result.error || t('auth.error_failed'));
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
            } else {
              onClose();
            }
          } else {
            setAuthError(t('auth.google_error'));
          }
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setAuthError('Không thể lấy thông tin tài khoản Google: ' + err.message);
      }
    },
    onError: (err) => {
      console.warn('[Google Sign-In] OAuth popup notice:', err);
      setShowGoogleInput(true);
    },
  });

  const handleGoogleSignIn = async (targetEmail?: string) => {
    setAuthError(null);
    const gEmail = targetEmail || googleCustomEmail || 'nguyendao512004@gmail.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (showGoogleInput && targetEmail && !emailRegex.test(targetEmail.trim())) {
      setAuthError(t('auth.validation_email_invalid'));
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
      } else {
        onClose();
      }
    } else {
      setAuthError(t('auth.google_error'));
    }
  };

  if (!isOpen) return null;

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <span className="font-bold text-amber-300 text-lg">G</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-cinzel">
                {mode === 'login' ? t('auth.login_title') : t('auth.register_title')}
              </h3>
              <p className="text-[10px] text-slate-400">GGC Studio & Whale Platform</p>
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
        <div className="p-5 space-y-4">
          {/* Google Welcome New Account Notice */}
          {googleWelcomeInfo ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-left space-y-2.5 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{t('auth.google_welcome')}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tài khoản Gmail <strong className="text-cyan-300">{googleWelcomeInfo.email}</strong> đã được khởi tạo thành công với vai trò <strong>User</strong>.
              </p>
              <div className="p-2.5 rounded-lg bg-[#0b1820] border border-amber-500/40 text-xs">
                <div className="text-[11px] text-slate-400 mb-1">{t('auth.google_password_generated')}:</div>
                <div className="font-mono text-amber-300 font-bold tracking-wider select-all">
                  {googleWelcomeInfo.initialPassword}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                📧 {t('auth.google_mail_notice')}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                Vào học ngay ✨
              </button>
            </div>
          ) : (
            <>
              {/* Google Sign-In Section */}
              <div className="space-y-2">
                {!showGoogleInput ? (
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
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 shadow-md flex items-center justify-center gap-2.5 transition-all group hover:scale-[1.01] disabled:opacity-50"
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
                    <span>{t('auth.login_with_google')}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-[#12232c] border border-cyan-500/40 space-y-2 text-left">
                    <label className="text-[11px] font-medium text-slate-300 block">
                      {t('auth.google_custom_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={googleCustomEmail}
                        onChange={(e) => {
                          setGoogleCustomEmail(e.target.value);
                          setAuthError(null);
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
                      setAuthError(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-cyan-300 underline"
                  >
                    {showGoogleInput ? '← Đăng nhập bằng Google 1-chạm' : 'Nhập địa chỉ Gmail riêng...'}
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                  {t('auth.or_manual')}
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
            </>
          )}

          {/* Error Message Alert */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  {t('auth.name')} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    placeholder={t('auth.name_placeholder')}
                    className={`w-full bg-[#12232c] text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 border ${
                      fieldErrors.name ? 'border-rose-500 focus:border-rose-400' : 'border-[#233f4f] focus:border-amber-400'
                    } focus:outline-none transition-colors`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                {t('auth.email')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  placeholder={t('auth.email_placeholder')}
                  className={`w-full bg-[#12232c] text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 border ${
                    fieldErrors.email ? 'border-rose-500 focus:border-rose-400' : 'border-[#233f4f] focus:border-amber-400'
                  } focus:outline-none transition-colors`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                {t('auth.password')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  placeholder={t('auth.password_placeholder')}
                  className={`w-full bg-[#12232c] text-slate-100 text-xs rounded-xl pl-9 pr-9 py-2.5 border ${
                    fieldErrors.password ? 'border-rose-500 focus:border-rose-400' : 'border-[#233f4f] focus:border-amber-400'
                  } focus:outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  {t('auth.confirm_password')} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                    }}
                    placeholder={t('auth.confirm_password_placeholder')}
                    className={`w-full bg-[#12232c] text-slate-100 text-xs rounded-xl pl-9 pr-9 py-2.5 border ${
                      fieldErrors.confirmPassword ? 'border-rose-500 focus:border-rose-400' : 'border-[#233f4f] focus:border-amber-400'
                    } focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('auth.submitting')}</span>
                </>
              ) : (
                <span>{mode === 'login' ? t('auth.submit_login') : t('auth.submit_register')}</span>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
            {mode === 'login' ? (
              <span>
                {t('auth.no_account')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  {t('auth.switch_to_register')}
                </button>
              </span>
            ) : (
              <span>
                {t('auth.have_account')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  {t('auth.switch_to_login')}
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
