import React from 'react';
import { Inbox, Search, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu',
  description = 'Không tìm thấy mục nào phù hợp với tiêu chí lọc hiện tại.',
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div className="w-full max-w-md mx-auto my-14 p-8 text-center rounded-2xl bg-white/60 dark:bg-[#102029]/60 border border-stone-200/80 dark:border-slate-800/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-stone-900 dark:text-slate-100 mb-1.5">
        {title}
      </h3>

      <p className="text-xs text-stone-500 dark:text-slate-400 mb-5 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-900 dark:text-slate-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
        >
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
