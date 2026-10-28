import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Plus,
  ArrowUp,
  MessageCircle,
} from 'lucide-react';
import { sound } from '../services/sound';
import { useI18n } from '../i18n';

import { Language } from '../types';

interface FloatingSidebarProps {
  onOpenNotifications: () => void;
  onOpenVip: () => void;
  onOpenChat: () => void;
  onOpenPublishArticle?: () => void;
  onOpenCreateTopic?: () => void;
  onOpenCreateSection?: () => void;
  onOpenPost: () => void;
  unreadCount: number;
  currentLang?: Language;
}

export const FloatingSidebar: React.FC<FloatingSidebarProps> = ({
  onOpenNotifications,
  onOpenVip,
  onOpenChat,
  onOpenPublishArticle,
  onOpenCreateTopic,
  onOpenCreateSection,
  onOpenPost,
  unreadCount,
  currentLang = 'vi',
}) => {
  const { t } = useI18n();
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Close plus menu when clicking outside
  useEffect(() => {
    if (!isPlusMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPlusMenuOpen]);

  const scrollToTop = () => {
    sound.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTogglePlusMenu = () => {
    sound.playClick();
    setIsPlusMenuOpen(!isPlusMenuOpen);
  };

  return (
    <>
      <div className="fixed right-3 sm:right-6 bottom-20 z-40 flex flex-col items-end gap-2.5">
        {/* Floating Stack matching Screenshot 12 */}
        <div className="flex flex-col gap-2.5 relative items-center">
          {/* 1. Notification Bell Button (Top) matching Screenshot 12 */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenNotifications();
            }}
            className="w-11 h-11 rounded-2xl bg-[#ffffff] dark:bg-[#12232c] hover:bg-slate-50 dark:hover:bg-[#18313e] text-slate-700 dark:text-slate-200 border border-[#e8e4d9] dark:border-[#223946] shadow-xl flex items-center justify-center transition-all hover:scale-105 group relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-700 dark:text-slate-200" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>


          {/* 3. Plus (+) Button with Flyout Popover matching Screenshot 12 */}
          <div ref={plusMenuRef} className="relative">
            <button
              onClick={handleTogglePlusMenu}
              className={`w-11 h-11 rounded-2xl border shadow-xl flex items-center justify-center transition-all hover:scale-105 ${
                isPlusMenuOpen
                  ? 'bg-amber-600 border-amber-500 text-white rotate-45'
                  : 'bg-[#ffffff] dark:bg-[#12232c] hover:bg-slate-50 dark:hover:bg-[#18313e] text-slate-700 dark:text-slate-200 border-[#e8e4d9] dark:border-[#223946]'
              }`}
              title="Quick actions"
            >
              <Plus className="w-5 h-5 transition-transform" />
            </button>

            {/* Flyout Popover Card to the left matching Screenshot 12 */}
            {isPlusMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-14 bottom-0 w-48 rounded-2xl bg-[#ffffff] dark:bg-[#12232c] border border-[#e5dec9] dark:border-[#223946] shadow-2xl p-2.5 text-slate-800 dark:text-slate-200 z-50 animate-in fade-in slide-in-from-right-4 duration-150"
              >
                {/* Right Arrow Indicator pointing to (+) button */}
                <div className="absolute right-[-6px] bottom-3.5 w-3 h-3 bg-[#ffffff] dark:bg-[#12232c] border-r border-t border-[#e5dec9] dark:border-[#223946] transform rotate-45"></div>

                <div className="flex flex-col gap-1.5 relative z-10 text-xs">
                  {/* Post a post - opens post editor */}
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenPost();
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1e4444] text-cyan-200 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {t('forum.btn_create_post')}
                      </span>
                      <span className="text-[10px] text-amber-400">
                        {t('forum.editor_title')}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Scroll To Top Button */}
          <button
            onClick={scrollToTop}
            className="w-8 h-8 rounded-xl bg-[#ffffff]/80 dark:bg-[#12232c]/80 hover:bg-slate-100 dark:hover:bg-[#18313e] text-slate-500 dark:text-slate-400 border border-[#e8e4d9] dark:border-[#223946] shadow-md flex items-center justify-center transition-colors"
            title="Scroll to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
