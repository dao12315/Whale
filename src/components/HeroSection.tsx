import React from 'react';
import { ArrowUpRight, Sparkles, Radio, Activity } from 'lucide-react';
import { Language } from '../types';

interface HeroSectionProps {
  currentTab: 'paid' | 'free';
  onTabChange: (tab: 'paid' | 'free') => void;
  currentLang: Language;
  onOpenCatalog: () => void;
  onTriggerSimulatedPeer: () => void;
  isSimulatingActive: boolean;
  onToggleSimulating: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentTab,
  onTabChange,
  currentLang,
  onOpenCatalog,
  onTriggerSimulatedPeer,
  isSimulatingActive,
  onToggleSimulating,
}) => {
  return (
    <div className="relative pt-8 pb-6 border-b border-stone-200 dark:border-[#1b2f3a]/80 transition-colors">
      {/* Background container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Hero Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Title with Red Diamond */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-red-600 rotate-45 shrink-0 shadow-sm shadow-red-500/50"></span>
              <h1 className="font-cinzel text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide text-stone-900 dark:text-slate-100 transition-colors">
                Group Buying & Direct Sales &bull; Special courses
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-300 font-medium tracking-wide pl-5 transition-colors">
              {currentLang === 'vi'
                ? 'Tổng hợp danh mục khóa học chọn lọc · Giá gốc và giá ưu đãi hội viên hiển thị trực tiếp trên thẻ'
                : (currentLang === 'zh-CN' || currentLang === 'zh-TW')
                ? '编号课程集中浏览 · 课程卡片显示原价与会员专享折扣价'
                : 'Centralized Browse of Numbered Courses · Original and member prices are shown on the course card'}
            </p>
          </div>

          {/* Right Action: Course catalog button */}
          <div className="flex items-center gap-2.5 self-start md:self-center">
            {/* Course catalog button matching screenshot */}
            <button
              onClick={onOpenCatalog}
              className="group flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-slate-300 dark:hover:bg-white dark:text-slate-900 text-xs sm:text-sm font-semibold tracking-wider font-cinzel transition-all shadow-md hover:shadow-stone-900/20"
            >
              <span>Course catalog</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs: Khóa trả phí và Khóa miễn phí */}
        <div className="mt-8 flex items-center justify-between border-b border-stone-200 dark:border-slate-800/80 transition-colors">
          <div className="flex items-center gap-6 sm:gap-10">
            {/* Khóa trả phí (Donate / Paid Courses) */}
            <button
              onClick={() => onTabChange('paid')}
              className={`pb-3 font-cinzel text-sm sm:text-base tracking-wider transition-all relative flex items-center gap-2 ${
                currentTab === 'paid'
                  ? 'text-amber-800 dark:text-amber-300 font-bold border-b-2 border-amber-600 dark:border-amber-400'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{currentLang === 'vi' ? 'Khóa trả phí (Donate)' : 'Paid Courses (Donate)'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold border transition-colors ${
                currentTab === 'paid'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                  : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700'
              }`}>
                VIP & Mua chung
              </span>
              {currentTab === 'paid' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
              )}
            </button>

            {/* Khóa miễn phí (Free Courses) */}
            <button
              onClick={() => onTabChange('free')}
              className={`pb-3 font-cinzel text-sm sm:text-base tracking-wider transition-all relative flex items-center gap-2 ${
                currentTab === 'free'
                  ? 'text-emerald-800 dark:text-emerald-300 font-bold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{currentLang === 'vi' ? 'Khóa miễn phí' : 'Free Courses'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold border transition-colors ${
                currentTab === 'free'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                  : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700'
              }`}>
                0 Credits
              </span>
              {currentTab === 'free' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              )}
            </button>
          </div>

          {/* Live sync status pill */}
          <div className="hidden sm:flex items-center gap-2 pb-2 text-[11px] text-stone-600 dark:text-slate-400 font-medium transition-colors">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Hệ thống trực tuyến: Đang đồng bộ bình luận</span>
          </div>
        </div>
      </div>
    </div>
  );
};
