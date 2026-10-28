import React, { useState, useEffect } from 'react';
import { postsApi } from '../../services/postsApi';
import { ForumPost } from '../../types';
import {
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Sparkles,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  Eye,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../../i18n';

export const AdminPostsManager: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [pendingPosts, setPendingPosts] = useState<ForumPost[]>([]);
  const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPendingPosts = async () => {
    setIsLoading(true);
    try {
      const res = await postsApi.getPendingPosts();
      setPendingPosts(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải bài viết chờ duyệt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPosts = async () => {
    setIsLoading(true);
    try {
      const res = await postsApi.getPosts({ status: 'ALL', search: searchQuery });
      setAllPosts(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách bài viết:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingPosts();
    } else {
      fetchAllPosts();
    }
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    try {
      await postsApi.approvePost(id);
      setActionMessage({ type: 'success', text: 'Đã phê duyệt và xuất bản bài viết thành công!' });
      if (activeTab === 'pending') {
        setPendingPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        fetchAllPosts();
      }
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Lỗi khi duyệt bài viết.' });
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Nhập lý do từ chối bài viết (tùy chọn):', 'Nội dung chưa phù hợp với quy chuẩn cộng đồng');
    if (reason === null) return;

    try {
      await postsApi.rejectPost(id, reason);
      setActionMessage({ type: 'success', text: 'Đã từ chối và chuyển bài viết vào lưu trữ.' });
      if (activeTab === 'pending') {
        setPendingPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        fetchAllPosts();
      }
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Lỗi khi từ chối bài viết.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn không?')) return;

    try {
      await postsApi.deletePost(id);
      setActionMessage({ type: 'success', text: 'Đã xóa bài viết khỏi cơ sở dữ liệu.' });
      setPendingPosts((prev) => prev.filter((p) => p.id !== id));
      setAllPosts((prev) => prev.filter((p) => p.id !== id));
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Lỗi khi xóa bài viết.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#102029] p-5 rounded-2xl border border-stone-200 dark:border-[#1b313d] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Quản Lý & Kiểm Duyệt Bài Viết Diễn Đàn</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
            Kiểm duyệt nội dung tự động bằng AI và phê duyệt thủ công bài viết từ cộng đồng học viên
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-[#0c181f] p-1 rounded-xl border border-stone-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ duyệt (AI/Admin)</span>
            {pendingPosts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {pendingPosts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tất cả bài viết</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab: Pending Moderation */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-stone-600 dark:text-slate-300">
              Có <strong className="text-amber-500">{pendingPosts.length}</strong> bài viết đang chờ phê duyệt
            </span>
            <button
              onClick={fetchPendingPosts}
              className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {pendingPosts.length === 0 ? (
            <div className="bg-white dark:bg-[#102029] p-12 rounded-2xl border border-stone-200 dark:border-[#1b313d] text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-slate-200">
                Hàng đợi duyệt trống
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto">
                Tất cả bài viết hợp lệ đã được hệ thống AI tự động duyệt hoặc đã được Admin xử lý xong.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-[#102029] p-5 rounded-2xl border border-stone-200 dark:border-[#1b313d] shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Chờ Admin Duyệt</span>
                        </span>
                        <span className="text-xs text-stone-400 font-medium">
                          Tác giả: <strong className="text-slate-200">{post.author?.name || post.authorName || 'Thành viên'}</strong>
                        </span>
                        <span className="text-stone-500 text-xs">•</span>
                        <span className="text-[11px] text-stone-500">
                          {post.createdAt ? new Date(post.createdAt).toLocaleString('vi-VN') : post.updatedTimeAgo || 'Mới đăng'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-stone-900 dark:text-slate-100">
                        {post.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(post.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        title="Duyệt và xuất bản ngay"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Duyệt bài</span>
                      </button>
                      <button
                        onClick={() => handleReject(post.id)}
                        className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-500/10 text-stone-700 dark:text-rose-300 hover:text-rose-400 border border-stone-300 dark:border-rose-500/30 font-medium text-xs flex items-center gap-1 transition-all"
                        title="Từ chối bài viết"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: All Posts */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAllPosts()}
                placeholder="Tìm kiếm bài viết theo tiêu đề hoặc nội dung..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#102029] border border-stone-200 dark:border-[#1b313d] text-xs text-stone-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={fetchAllPosts}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>

          {/* Posts list */}
          <div className="bg-white dark:bg-[#102029] rounded-2xl border border-stone-200 dark:border-[#1b313d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-[#0c181f] text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">Tiêu đề bài viết</th>
                    <th className="p-3.5 font-bold">Tác giả</th>
                    <th className="p-3.5 font-bold">Trạng thái</th>
                    <th className="p-3.5 font-bold">Lượt xem / Thích</th>
                    <th className="p-3.5 font-bold">Ngày tạo</th>
                    <th className="p-3.5 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 text-stone-700 dark:text-slate-300">
                  {allPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-stone-50 dark:hover:bg-[#142631]/40 transition-colors">
                      <td className="p-3.5 font-bold text-stone-900 dark:text-slate-100 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="p-3.5 text-stone-500">
                        {post.author?.name || post.authorName || 'Ẩn danh'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            post.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : post.status === 'DRAFT'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {post.status === 'PUBLISHED' ? 'Đã xuất bản' : post.status === 'DRAFT' ? 'Chờ duyệt' : 'Đã từ chối'}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-500 font-mono">
                        {post.viewsCount ?? post.readsCount ?? 0} / {post.likesCount || 0}
                      </td>
                      <td className="p-3.5 text-stone-500">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : post.updatedTimeAgo || 'Gần đây'}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {post.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            title="Duyệt bài"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
