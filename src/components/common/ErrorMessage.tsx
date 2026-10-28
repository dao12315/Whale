import React from 'react';
import { AlertCircle, RotateCcw, WifiOff } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  code?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Không thể tải dữ liệu',
  message = 'Đã xảy ra lỗi khi kết nối với máy chủ API. Vui lòng kiểm tra lại đường truyền mạng hoặc thử lại.',
  onRetry,
  code,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto my-12 p-6 rounded-2xl bg-white dark:bg-[#102029] border border-red-500/20 shadow-lg text-center animate-in fade-in">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>

      {code && (
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-500 mb-2 inline-block">
          Mã lỗi: {code}
        </span>
      )}

      <h3 className="text-base font-bold text-stone-900 dark:text-slate-100 mb-1.5">
        {title}
      </h3>

      <p className="text-xs text-stone-600 dark:text-slate-400 mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thử lại ngay</span>
        </button>
      )}
    </div>
  );
};
