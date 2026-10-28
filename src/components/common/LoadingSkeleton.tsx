import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'grid' | 'table' | 'detail';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'grid', count = 8 }) => {
  if (type === 'table') {
    return (
      <div className="w-full bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-slate-800 p-4 space-y-3 animate-pulse">
        <div className="h-8 bg-stone-200 dark:bg-slate-800 rounded-xl w-full"></div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-stone-100 dark:border-slate-800/60">
            <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded w-16"></div>
            <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded flex-1"></div>
            <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded w-24"></div>
            <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  // Card Skeleton Grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-[#102029] border border-stone-200/80 dark:border-[#1b313d] overflow-hidden shadow-sm animate-pulse"
        >
          {/* Thumbnail Skeleton */}
          <div className="h-48 bg-stone-200 dark:bg-slate-800 w-full relative">
            <div className="absolute top-3 left-3 w-16 h-5 rounded bg-stone-300 dark:bg-slate-700"></div>
          </div>

          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="h-3 bg-stone-200 dark:bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-stone-200 dark:bg-slate-800 rounded w-5/6"></div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-slate-800"></div>
                <div className="h-3 bg-stone-200 dark:bg-slate-800 rounded w-20"></div>
              </div>
              <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded w-14"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
