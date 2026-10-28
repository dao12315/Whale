import React from 'react';
import { HelpCircle, Search, Video, Heart, ArrowUpRight } from 'lucide-react';
import { sound } from '../services/sound';
import { FaqModalTab } from './FaqGuideModal';
import { useI18n } from '../i18n';

interface QuickServicesBannerProps {
  onOpenService: (tab: FaqModalTab) => void;
}

export const QuickServicesBanner: React.FC<QuickServicesBannerProps> = ({ onOpenService }) => {
  const { t } = useI18n();

  const cards: {
    tab: FaqModalTab;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    badge?: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      tab: 'faq',
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
      title: t('courses.quick_services_faq'),
      subtitle: t('courses.quick_services_faq_desc'),
      bgColor: 'hover:bg-[#132733]',
      borderColor: 'border-[#1e3b4d]',
    },
    {
      tab: 'request',
      icon: <Search className="w-5 h-5 text-cyan-400" />,
      title: t('courses.quick_services_vip'),
      subtitle: t('courses.quick_services_vip_desc'),
      badge: 'VIP',
      bgColor: 'hover:bg-[#112a33]',
      borderColor: 'border-[#1b3d4a]',
    },
    {
      tab: 'guide',
      icon: <Video className="w-5 h-5 text-emerald-400" />,
      title: t('courses.quick_services_drive'),
      subtitle: t('courses.quick_services_drive_desc'),
      bgColor: 'hover:bg-[#112a2b]',
      borderColor: 'border-[#1b3f3b]',
    },
    {
      tab: 'sponsor',
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      title: t('courses.quick_services_support'),
      subtitle: t('courses.quick_services_support_desc'),
      bgColor: 'hover:bg-[#2b1823]',
      borderColor: 'border-[#422233]',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => {
              sound.playClick();
              onOpenService(card.tab);
            }}
            className={`cursor-pointer group relative p-4 rounded-2xl bg-white dark:bg-[#0f1f28]/80 backdrop-blur-md border border-stone-200 dark:border-slate-800 hover:border-amber-500/60 transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-[#162d3a] flex items-center justify-center border border-stone-200 dark:border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <div className="flex items-center gap-1.5">
                {card.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 font-medium">
                    {card.badge}
                  </span>
                )}
                <ArrowUpRight className="w-4 h-4 text-stone-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="font-chinese font-bold text-sm text-stone-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors">
                {card.title}
              </h3>
              <p className="text-[11px] text-stone-600 dark:text-slate-400 mt-1 line-clamp-1 leading-normal">
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
