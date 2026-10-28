import React, { useState } from 'react';
import { ChevronRight, ChevronsRight } from 'lucide-react';
import { useI18n } from '../i18n';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { t } = useI18n();
  const [jumpPage, setJumpPage] = useState('');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage('');
    }
  };

  return (
    <div className="mt-12 mb-6 flex flex-wrap items-center justify-center gap-2 text-xs select-none">
      {/* Page 1 */}
      <button
        onClick={() => onPageChange(1)}
        className={`w-8 h-8 rounded-lg font-mono font-semibold transition-all shadow-sm ${
          currentPage === 1
            ? 'bg-amber-600 text-white dark:bg-[#1b3b4b] dark:text-cyan-300 border border-amber-600 dark:border-cyan-500/50'
            : 'bg-white dark:bg-[#12222b] text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-[#1a303d] border border-stone-300 dark:border-slate-700/50'
        }`}
      >
        1
      </button>

      {/* Page 2 */}
      <button
        onClick={() => onPageChange(2)}
        className={`w-8 h-8 rounded-lg font-mono font-semibold transition-all shadow-sm ${
          currentPage === 2
            ? 'bg-amber-600 text-white dark:bg-[#1b3b4b] dark:text-cyan-300 border border-amber-600 dark:border-cyan-500/50'
            : 'bg-white dark:bg-[#12222b] text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-[#1a303d] border border-stone-300 dark:border-slate-700/50'
        }`}
      >
        2
      </button>

      {/* Page 3 */}
      <button
        onClick={() => onPageChange(3)}
        className={`w-8 h-8 rounded-lg font-mono font-semibold transition-all shadow-sm ${
          currentPage === 3
            ? 'bg-amber-600 text-white dark:bg-[#1b3b4b] dark:text-cyan-300 border border-amber-600 dark:border-cyan-500/50'
            : 'bg-white dark:bg-[#12222b] text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-[#1a303d] border border-stone-300 dark:border-slate-700/50'
        }`}
      >
        3
      </button>

      {/* Ellipsis */}
      <span className="px-1 text-stone-400 dark:text-slate-500 font-bold">...</span>

      {/* Page 20 */}
      <button
        onClick={() => onPageChange(20)}
        className={`w-8 h-8 rounded-lg font-mono font-semibold transition-all shadow-sm ${
          currentPage === 20
            ? 'bg-amber-600 text-white dark:bg-[#1b3b4b] dark:text-cyan-300 border border-amber-600 dark:border-cyan-500/50'
            : 'bg-white dark:bg-[#12222b] text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-[#1a303d] border border-stone-300 dark:border-slate-700/50'
        }`}
      >
        20
      </button>

      {/* Next page > */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="px-3 h-8 rounded-lg bg-white dark:bg-[#12222b] hover:bg-stone-100 dark:hover:bg-[#1a303d] text-stone-700 dark:text-slate-300 border border-stone-300 dark:border-slate-700/50 flex items-center gap-1 font-medium transition-all shadow-sm"
      >
        <span>{t('common.next')}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Jump >> Form */}
      <form onSubmit={handleJump} className="flex items-center gap-1.5 ml-1">
        <input
          type="text"
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          placeholder={t('common.page')}
          className="w-12 h-8 bg-white dark:bg-[#12222b] text-stone-900 dark:text-slate-200 text-xs rounded-lg px-2 text-center border border-stone-300 dark:border-slate-700/50 focus:border-amber-500 focus:outline-none font-mono shadow-sm"
        />
        <button
          type="submit"
          className="px-2.5 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-[#142935] dark:hover:bg-[#1c3848] dark:text-amber-300 border border-transparent dark:border-amber-500/30 flex items-center gap-1 font-medium transition-all shadow-sm"
        >
          <span>{t('common.confirm')}</span>
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
