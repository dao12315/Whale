import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  Coins,
  Ban,
  CheckCircle,
  MoreVertical,
  Mail,
  HardDrive,
  Edit,
  ArrowUpDown,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { adminApi, AdminUserItem } from '../../services/adminApi';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  googleEmail: string;
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
  tier: 'free' | 'gold' | 'supreme' | 'admin';
  credits: number;
  purchasedCount: number;
  isActive: boolean;
  joinedDate: string;
}

export const AdminUsersManager: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Nạp danh sách người dùng thật từ cơ sở dữ liệu PostgreSQL
  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getUsers({ limit: 100 })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setUsers(
            res.data.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              googleEmail: u.googleEmail || u.email,
              role: u.role || 'USER',
              tier: (u.tier?.toLowerCase() || 'free') as any,
              credits: u.credits || 0,
              purchasedCount: u.enrollmentsCount || u.purchasedCount || 0,
              isActive: u.isActive !== undefined ? u.isActive : !u.isBanned,
              joinedDate: u.joinedDate || new Date(u.createdAt || Date.now()).toISOString().split('T')[0],
            }))
          );
        }
      })
      .catch((err) => {
        console.log('[AdminUsersManager] Dùng fallback users:', err?.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.googleEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleToggleRole = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newRole: 'ADMIN' | 'USER' = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const newTier = newRole === 'ADMIN' ? 'admin' : 'free';

    try {
      await adminApi.updateUserRole(userId, newRole);
    } catch (err: any) {
      console.warn('[AdminUsersManager] Update role API notice:', err?.message);
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, role: newRole, tier: newTier as any };
        }
        return u;
      })
    );
  };

  const handleToggleBan = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newActiveState = !targetUser.isActive;

    try {
      await adminApi.toggleBanUser(userId, !newActiveState, 'Admin thực hiện khóa/mở tài khoản');
    } catch (err: any) {
      console.warn('[AdminUsersManager] Toggle ban API notice:', err?.message);
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, isActive: newActiveState };
        }
        return u;
      })
    );
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    try {
      await adminApi.grantCredits(userId, amount, 'Cộng điểm chuyên cần từ Admin');
    } catch (err: any) {
      console.warn('[AdminUsersManager] Grant credits API notice:', err?.message);
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, credits: u.credits + amount };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Quản Lý Người Dùng, Vai Trò & Google Drive Email
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Kiểm tra vai trò (USER, INSTRUCTOR, ADMIN), cấp xu thủ công và kiểm tra email Google nhận quyền
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
            {users.filter((u) => u.role === 'ADMIN').length} Admin
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
            {users.filter((u) => u.role === 'INSTRUCTOR').length} Giảng viên
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
            {users.filter((u) => u.role === 'USER').length} Học viên
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email tài khoản hoặc Google Email..."
            className="w-full bg-stone-50 dark:bg-[#142631] text-xs text-stone-900 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 border border-stone-300 dark:border-slate-700/80 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto bg-stone-50 dark:bg-[#142631] text-xs text-stone-800 dark:text-slate-200 rounded-xl px-3 py-2 border border-stone-300 dark:border-slate-700/80 focus:outline-none focus:border-amber-500"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên (ADMIN)</option>
          <option value="INSTRUCTOR">Giảng viên (INSTRUCTOR)</option>
          <option value="USER">Học viên (USER)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 dark:bg-[#0c181e] text-stone-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-stone-200 dark:border-[#1b313d]">
              <tr>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Google Drive Email</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Hạng thành viên</th>
                <th className="py-3 px-4">Số dư Xu</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-slate-800/60">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-stone-50/80 dark:hover:bg-[#142631]/60 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 dark:text-slate-100">{u.name}</div>
                        <div className="text-[11px] text-stone-500 dark:text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      <HardDrive className="w-3.5 h-3.5 shrink-0" />
                      <span>{u.googleEmail || 'Chưa liên kết'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : u.role === 'INSTRUCTOR'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-transparent'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="uppercase text-[10px] font-bold text-stone-800 dark:text-slate-200">
                      {u.tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-500">
                    {u.credits.toLocaleString()} Xu
                  </td>
                  <td className="py-3 px-4">
                    {u.isActive ? (
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        Bị khóa
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Thưởng +50 xu */}
                      <button
                        onClick={() => handleAddCredits(u.id, 50)}
                        title="Tặng +50 xu thưởng"
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center gap-0.5"
                      >
                        <Coins className="w-3 h-3" />
                        +50 Xu
                      </button>

                      {/* Đổi vai trò Admin */}
                      <button
                        onClick={() => handleToggleRole(u.id)}
                        title={u.role === 'ADMIN' ? 'Hạ quyền xuống User' : 'Nâng quyền lên ADMIN'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            : 'hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-400'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>

                      {/* Khóa/Mở khóa */}
                      <button
                        onClick={() => handleToggleBan(u.id)}
                        title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          !u.isActive
                            ? 'bg-red-500/20 text-red-500'
                            : 'hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-400 hover:text-red-500'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
