import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ChevronDown,
  Sparkles,
  Coins,
  LogOut,
  User as UserIcon,
  BookOpen,
  PlusCircle,
  Globe,
  Settings,
  Flame,
  Check,
  Sun,
  Moon,
  Shield,
  LogIn,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n, SupportedLanguage } from '../i18n';

import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAuth: () => void;
  onOpenVip: () => void;
  onOpenNotifications: () => void;
  onOpenReleaseModal: () => void;
  onOpenCreatePostModal?: () => void;
  onOpenUserCenter?: () => void;
  onOpenPublish?: () => void;
  unreadCount: number;
  currentLang?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onOpenVip,
  onOpenNotifications,
  onOpenReleaseModal,
  onOpenCreatePostModal,
  onOpenUserCenter,
  onOpenPublish,
  unreadCount,
  currentLang,
  onLanguageChange,
  activeNavTab,
  setActiveNavTab,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentLang: ctxLang, setLanguage, t } = useI18n();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const activeLang = (currentLang || ctxLang) as SupportedLanguage;
  const handleLangChange = (code: SupportedLanguage) => {
    setLanguage(code);
    if (onLanguageChange) onLanguageChange(code);
  };

  // 2 Languages: Tiếng Việt & English
  const languagesList: { code: SupportedLanguage; label: string; flag: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fbf9f4]/95 dark:bg-[#0c181e]/95 backdrop-blur-md border-b border-[#e5dfd2] dark:border-[#1b2f3a]/80 shadow-sm dark:shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Main Nav */}
        <div className="flex items-center gap-6">
          {/* Brand Logo - GGC STUDIO */}
          <div
            onClick={() => setActiveNavTab('group_buy')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 border border-amber-400/60 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-amber-300 transition-all">
              <span className="text-xs font-black tracking-tighter text-slate-950 font-sans">GGC</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="font-cinzel text-lg tracking-wider font-extrabold text-stone-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  GGC STUDIO
                </span>
              </div>
              <span className="text-[10px] text-amber-800 dark:text-amber-400/90 tracking-tight font-medium">
                Digital Art & CG Masterclasses
              </span>
            </div>
          </div>

          {/* Navigation Links: Exactly 2 tabs - Mua chung & Diễn đàn */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {/* Group Buying Tab */}
            <button
              onClick={() => setActiveNavTab('group_buy')}
              className={`relative px-3.5 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeNavTab === 'group_buy' || activeNavTab === 'course_detail'
                  ? 'text-amber-800 dark:text-amber-300 font-bold'
                  : 'text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#152732] rounded-lg'
              }`}
            >
              <span>{t('header.nav_group_buy')}</span>
              {(activeNavTab === 'group_buy' || activeNavTab === 'course_detail') && (
                <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] rounded-full animate-in fade-in"></span>
              )}
            </button>

            {/* Forum homepage Tab */}
            <button
              onClick={() => setActiveNavTab('forum')}
              className={`relative px-3.5 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeNavTab === 'forum'
                  ? 'text-amber-800 dark:text-amber-300 font-bold'
                  : 'text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#152732] rounded-lg'
              }`}
            >
              <span className="text-amber-600 dark:text-amber-400 text-xs">💬</span>
              <span>{t('header.nav_forum')}</span>
              {activeNavTab === 'forum' && (
                <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] rounded-full animate-in fade-in"></span>
              )}
            </button>

            {/* Admin Portal Tab - CHỈ HIỂN THỊ KHI ĐĂNG NHẬP VỚI TƯ CÁCH ADMIN */}
            {isAuthenticated && (user?.role === 'ADMIN' || user?.tier === 'admin') && (
              <button
                onClick={() => setActiveNavTab('admin')}
                className={`relative px-3.5 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeNavTab === 'admin'
                    ? 'text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#152732] rounded-lg'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                <span>{t('header.nav_admin')}</span>
                <span className="text-[9px] uppercase px-1 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-bold">
                  {t('header.nav_admin_portal')}
                </span>
                {activeNavTab === 'admin' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] rounded-full animate-in fade-in"></span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Center / Right: Search Bar */}
        <div className="flex-1 max-w-xs md:max-w-sm mx-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                activeNavTab === 'forum'
                  ? t('header.search_placeholder_forum')
                  : t('header.search_placeholder_courses')
              }
              className="w-full bg-white dark:bg-[#12222b] text-stone-900 dark:text-slate-200 text-xs rounded-full pl-4 pr-9 py-2 border border-stone-300 dark:border-[#233a46] focus:border-amber-600 dark:focus:border-amber-400/80 focus:outline-none focus:ring-1 focus:ring-amber-500/40 placeholder:text-stone-400 dark:placeholder:text-slate-500 transition-all shadow-inner dark:shadow-none"
            />
            <Search className="w-4 h-4 text-stone-400 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle (Light & Dark) */}
          <button
            onClick={toggleTheme}
            title={t('header.switch_theme')}
            className="p-2 rounded-xl text-stone-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-200/80 dark:hover:bg-[#162933] transition-colors flex items-center justify-center border border-stone-200/80 dark:border-transparent"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-stone-800 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="p-1.5 rounded-lg text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/80 dark:hover:bg-[#162933] text-xs font-medium flex items-center gap-1.5 transition-colors"
              title={t('header.switch_language')}
            >
              <Globe className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
              <span className="text-[11px] uppercase font-bold text-stone-800 dark:text-slate-200">{activeLang}</span>
              <ChevronDown className="w-3 h-3 text-stone-500 dark:text-slate-400" />
            </button>

            {showLangDropdown && (
              <div
                onMouseLeave={() => setShowLangDropdown(false)}
                className="absolute top-full right-0 mt-1 w-44 bg-white/95 dark:bg-[#102029]/95 backdrop-blur-xl border border-stone-200 dark:border-[#233f4e] rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in"
              >
                <div className="px-3 py-1 text-[10px] text-stone-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-stone-200 dark:border-slate-800">
                  {t('header.language_select')}
                </div>
                {languagesList.map((langItem) => (
                  <button
                    key={langItem.code}
                    onClick={() => {
                      handleLangChange(langItem.code);
                      setShowLangDropdown(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-[#18313f] hover:text-amber-700 dark:hover:text-amber-300 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{langItem.flag}</span>
                      <span>{langItem.label}</span>
                    </span>
                    {activeLang === langItem.code && <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Auth Section with UserDropdown matching Screenshot 10 */}
          {!isAuthenticated ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('header.login_register')}</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full bg-[#13242e] hover:bg-[#1a313e] border border-slate-700/60 transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-amber-400 font-bold hidden md:inline">
                    {user?.credits} <span className="text-[10px] text-slate-400 font-normal">Credits</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase hidden sm:inline ${
                      user?.tier === 'supreme'
                        ? 'bg-purple-900/70 text-purple-300 border border-purple-500/40'
                        : user?.tier === 'gold'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {user?.tier}
                  </span>
                </div>
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/50"
                />
              </button>

              {/* Mounted UserDropdown directly matching Screenshot 10 */}
              {showUserDropdown && (
                <UserDropdown
                  onClose={() => setShowUserDropdown(false)}
                  onOpenUserCenter={() => {
                    setShowUserDropdown(false);
                    if (onOpenUserCenter) {
                      onOpenUserCenter();
                    }
                  }}
                  onOpenMyOrders={() => {
                    setShowUserDropdown(false);
                    if (onOpenUserCenter) {
                      onOpenUserCenter();
                    }
                  }}
                  onOpenPublish={() => {
                    setShowUserDropdown(false);
                    if (onOpenPublish) {
                      onOpenPublish();
                    }
                  }}
                  onOpenVip={() => {
                    setShowUserDropdown(false);
                    onOpenVip();
                  }}
                  onOpenNotifications={() => {
                    setShowUserDropdown(false);
                    onOpenNotifications();
                  }}
                  unreadCount={unreadCount}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
