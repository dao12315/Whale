import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Clock,
  Eye,
  ChevronDown,
  ChevronRight,
  User,
  HardDrive,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

interface AuditLogItem {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load real audit logs from PostgreSQL Database
  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getAuditLogs({ limit: 50 })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setLogs(
            res.data.map((l: any) => ({
              id: l.id,
              actorEmail: l.actorEmail || l.adminEmail || 'admin@shanhai.studio',
              action: l.action,
              targetType: l.targetType,
              targetId: l.targetId || 'N/A',
              oldValues: l.oldValues,
              newValues: l.newValues,
              ipAddress: l.ipAddress || '127.0.0.1',
              createdAt: l.createdAt || l.timestamp || new Date().toLocaleString('vi-VN'),
            }))
          );
        }
      })
      .catch((err) => {
        console.log('[AdminAuditLogs] Dùng fallback logs:', err?.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
        </h2>
        <p className="text-xs text-stone-500 dark:text-slate-400">
          Ghi vết tự động mọi hành động của Quản trị viên, Webhook thanh toán và lệnh can thiệp Google Drive
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] p-4 flex items-center gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo hành động, người thực hiện hoặc ID đối tượng..."
            className="w-full bg-stone-50 dark:bg-[#142631] text-xs text-stone-900 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 border border-stone-300 dark:border-slate-700/80 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
          Hiển thị {filtered.length} bản ghi
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 dark:bg-[#0c181e] text-stone-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-stone-200 dark:border-[#1b313d]">
              <tr>
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện (Actor)</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Đối tượng tác động</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800/60 font-mono">
              {filtered.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="hover:bg-stone-50/80 dark:hover:bg-[#142631]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-stone-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-amber-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-stone-500 dark:text-slate-400 whitespace-nowrap">
                        {log.createdAt}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-stone-900 dark:text-slate-100">
                        <span className="bg-stone-100 dark:bg-[#162933] px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700/60 text-xs">
                          {log.actorEmail}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            log.action.includes('REFUND')
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : log.action.includes('PAYMENT')
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-stone-800 dark:text-slate-200 font-medium">
                        <span className="text-[10px] font-bold text-stone-400 font-mono mr-1">
                          [{log.targetType}]
                        </span>
                        {log.targetId}
                      </td>
                      <td className="py-3 px-4 text-stone-500 dark:text-slate-400 text-[11px]">
                        {log.ipAddress}
                      </td>
                    </tr>

                    {/* Dòng mở rộng hiển thị JSON Diff (Old Values vs New Values) */}
                    {isExpanded && (
                      <tr className="bg-stone-50/90 dark:bg-[#0c181e]/90 font-sans">
                        <td colSpan={6} className="py-4 px-6 border-b border-stone-200 dark:border-slate-800">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {log.oldValues && (
                              <div className="bg-white dark:bg-[#142631] p-3 rounded-xl border border-stone-200 dark:border-slate-800">
                                <span className="text-[10px] uppercase font-bold text-red-500 block mb-1">
                                  Dữ liệu trước thay đổi (Old Values)
                                </span>
                                <pre className="font-mono text-[11px] text-stone-700 dark:text-slate-300 overflow-x-auto p-2 bg-stone-50 dark:bg-[#0c181e] rounded-lg">
                                  {JSON.stringify(log.oldValues, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.newValues && (
                              <div className="bg-white dark:bg-[#142631] p-3 rounded-xl border border-stone-200 dark:border-slate-800">
                                <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-1">
                                  Dữ liệu sau thay đổi (New Values)
                                </span>
                                <pre className="font-mono text-[11px] text-stone-700 dark:text-slate-300 overflow-x-auto p-2 bg-stone-50 dark:bg-[#0c181e] rounded-lg">
                                  {JSON.stringify(log.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
