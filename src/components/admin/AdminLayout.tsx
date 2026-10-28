import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { AdminGuard } from './AdminGuard';
import { AdminDashboard } from './AdminDashboard';
import { AdminCoursesManager } from './AdminCoursesManager';
import { AdminResourcesManager } from './AdminResourcesManager';
import { AdminCategoriesManager } from './AdminCategoriesManager';
import { AdminUsersManager } from './AdminUsersManager';
import { AdminOrdersManager } from './AdminOrdersManager';
import { AdminPostsManager } from './AdminPostsManager';
import { AdminAuditLogs } from './AdminAuditLogs';
import {
  LayoutDashboard,
  BookOpen,
  Palette,
  FolderTree,
  Users,
  ShoppingBag,
  FileText,
  ArrowLeft,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  HardDrive,
  Sparkles,
} from 'lucide-react';

interface AdminLayoutProps {
  onBackToHome: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'courses'
  | 'resources'
  | 'categories'
  | 'users'
  | 'orders'
  | 'posts'
  | 'audit_logs';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const { user, loginAs } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const navigationItems = [
    { id: 'dashboard', label: t('admin.nav_dashboard'), icon: LayoutDashboard },
    { id: 'courses', label: t('admin.nav_courses'), icon: BookOpen },
    { id: 'resources', label: t('admin.nav_resources'), icon: Palette },
    { id: 'categories', label: t('admin.nav_categories'), icon: FolderTree },
    { id: 'users', label: t('admin.nav_users'), icon: Users },
    { id: 'orders', label: t('admin.nav_orders'), icon: ShoppingBag },
    { id: 'posts', label: t('admin.nav_posts'), icon: Sparkles },
    { id: 'audit_logs', label: t('admin.nav_audit_logs'), icon: FileText },
  ];

  return (
    <AdminGuard onBackToHome={onBackToHome}>
      <div className="min-h-screen bg-[#f5f2eb] dark:bg-[#0b161b] text-slate-800 dark:text-slate-200 flex flex-col transition-colors">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 w-full bg-[#fbf9f4]/95 dark:bg-[#0c181e]/95 backdrop-blur-md border-b border-[#e5dfd2] dark:border-[#1b2f3a]/80 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <div
                onClick={onBackToHome}
                className="flex items-center gap-2.5 cursor-pointer group select-none"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 flex items-center justify-center shadow-md">
                  <span className="text-[11px] font-black text-slate-950">GGC</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-stone-900 dark:text-slate-100 tracking-wider flex items-center gap-1.5">
                    GGC STUDIO <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">ADMIN PORTAL</span>
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    Hệ thống Quản trị Khóa học & Google Drive
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Logged-in Admin Identity Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-stone-200/80 dark:bg-[#142631] px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700/60 text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-stone-800 dark:text-slate-200">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold uppercase">
                  {user?.role || 'ADMIN'}
                </span>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title="Đổi giao diện Sáng / Tối"
                className="p-2 rounded-xl text-stone-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-[#162933] transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-800" />
                )}
              </button>

              {/* Back to main website button */}
              <button
                onClick={onBackToHome}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('admin.back_to_site')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Body with Sidebar & Content */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
          {/* Left Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] p-3 shadow-sm sticky top-24">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 border-b border-stone-200 dark:border-slate-800/80 mb-2">
                {t('admin.badge')}
              </div>

              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as AdminTab)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                          : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-[#162933] hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Status footer */}
              <div className="mt-4 pt-3 border-t border-stone-200 dark:border-slate-800/80 px-2 text-[11px] text-stone-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>RBAC & Drive Guard Active</span>
                </div>
                <p className="text-[10px] text-stone-400">
                  Phiên làm việc bảo mật cấp Quản trị viên
                </p>
              </div>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={(tab) => setActiveTab(tab as AdminTab)} />}
            {activeTab === 'courses' && <AdminCoursesManager />}
            {activeTab === 'resources' && <AdminResourcesManager />}
            {activeTab === 'categories' && <AdminCategoriesManager />}
            {activeTab === 'users' && <AdminUsersManager />}
            {activeTab === 'orders' && <AdminOrdersManager />}
            {activeTab === 'posts' && <AdminPostsManager />}
            {activeTab === 'audit_logs' && <AdminAuditLogs />}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
};
