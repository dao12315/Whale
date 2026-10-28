import React, { useState, useEffect } from 'react';
import { ForumBoard, ForumPost, Language } from '../types';
import { postsApi } from '../services/postsApi';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { sound } from '../services/sound';
import { notificationService } from '../services/notificationService';
import { useI18n } from '../i18n';
import {
  FileText,
  Flame,
  Lock,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Mail,
  Search,
  LogIn,
  UserPlus,
  Loader2,
  Check,
  Send,
  PlusCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Shield,
  Trash2,
  X,
  Upload,
} from 'lucide-react';

interface ForumHomepageProps {
  currentLang: Language;
  onOpenAuth: () => void;
  onOpenNewPostModal: () => void;
  onOpenPostEditor?: () => void;
}

export const ForumHomepage: React.FC<ForumHomepageProps> = ({
  currentLang,
  onOpenAuth,
  onOpenNewPostModal,
  onOpenPostEditor,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { forumPosts, addForumComment, likeForumPost } = useRealtime();
  const { t } = useI18n();

  // Boards fetched from PostgreSQL Database
  const [boards, setBoards] = useState<ForumBoard[]>([]);

  useEffect(() => {
    postsApi
      .getBoards()
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setBoards(res.data);
        }
      })
      .catch((err) => {
        console.log('[ForumHomepage] Dùng fallback boards:', err?.message);
      });
  }, []);

  // Active filter category on left sidebar
  const [activeCategory, setActiveCategory] = useState<string>('summary');

  // Selected board filter
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Local state for load more extra dynamically generated posts
  const [extraPosts, setExtraPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(2);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [forumSearch, setForumSearch] = useState('');

  // Selected post for viewing details/comments
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [postCommentInput, setPostCommentInput] = useState('');
  const [commentImageUpload, setCommentImageUpload] = useState<string | null>(null);
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);

  const [privateMsgRecipient, setPrivateMsgRecipient] = useState<string | null>(null);
  const [privateMsgText, setPrivateMsgText] = useState('');

  // Followed authors
  const [followedAuthors, setFollowedAuthors] = useState<Set<string>>(new Set());

  // Moderation state & filter tab
  const isAdmin = user?.role === 'ADMIN';
  const [postFilterTab, setPostFilterTab] = useState<'all' | 'my' | 'pending'>('all');
  const [pendingPosts, setPendingPosts] = useState<ForumPost[]>([]);

  const fetchPendingPosts = () => {
    if (isAdmin) {
      postsApi
        .getPendingPosts()
        .then((res) => {
          if (res?.data) {
            setPendingPosts(res.data);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingPosts();
    }
  }, [isAdmin]);

  const handleApprove = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSuccess();
    try {
      await postsApi.approvePost(postId);
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
      setExtraPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: 'PUBLISHED', moderationStatus: 'APPROVED', moderationBadge: '✨ Đã duyệt bởi Admin' }
            : p
        )
      );
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Duyệt bài thành công! ✅',
        message: 'Bài viết đã được phê duyệt và xuất bản công khai.',
        timestamp: 'Vừa xong',
      });
    } catch (err: any) {
      console.warn('[Forum] Lỗi duyệt bài:', err?.message);
    }
  };

  const handleReject = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    try {
      await postsApi.rejectPost(postId, 'Nội dung chưa đạt quy định cộng đồng.');
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
      setExtraPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, status: 'ARCHIVED', moderationStatus: 'REJECTED', moderationBadge: '🚫 Đã từ chối' }
            : p
        )
      );
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Đã từ chối bài viết',
        message: 'Bài viết đã được đánh dấu từ chối.',
        timestamp: 'Vừa xong',
      });
    } catch (err: any) {
      console.warn('[Forum] Lỗi từ chối bài:', err?.message);
    }
  };

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    try {
      await postsApi.deletePost(postId);
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId));
      setExtraPosts((prev) => prev.filter((p) => p.id !== postId));
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Đã xóa bài viết',
        message: 'Bài viết đã được gỡ bỏ khỏi hệ thống.',
        timestamp: 'Vừa xong',
      });
    } catch (err: any) {
      console.warn('[Forum] Lỗi xóa bài:', err?.message);
    }
  };

  // Combined posts: real-time shared posts + extra loaded
  const allPosts = React.useMemo(() => {
    if (postFilterTab === 'pending') {
      return pendingPosts;
    }
    const combined = [...forumPosts, ...extraPosts];
    if (postFilterTab === 'my' && user) {
      return combined.filter((p) => p.authorId === user.id || p.authorName === user.name);
    }
    if (postFilterTab === 'all') {
      return combined.filter((p) => p.status !== 'DRAFT');
    }
    return combined;
  }, [forumPosts, extraPosts, pendingPosts, postFilterTab, user]);

  const activeViewingPost = React.useMemo(() => {
    if (!viewingPostId) return null;
    return allPosts.find((p) => p.id === viewingPostId) || null;
  }, [allPosts, viewingPostId]);

  const handleToggleFollow = (authorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setFollowedAuthors((prev) => {
      const next = new Set(prev);
      if (next.has(authorName)) {
        next.delete(authorName);
        notificationService.sendPushNotification({
          type: 'system',
          title: `Đã bỏ theo dõi`,
          message: `Bạn đã hủy theo dõi tác giả ${authorName}.`,
          timestamp: 'Vừa xong',
        });
      } else {
        next.add(authorName);
        notificationService.sendPushNotification({
          type: 'system',
          title: `Đã theo dõi ${authorName} 🌟`,
          message: `Bạn sẽ nhận được thông báo khi tác giả này đăng bài viết hoặc chia sẻ tài nguyên mới.`,
          timestamp: 'Vừa xong',
        });
      }
      return next;
    });
  };

  const handleLikePost = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    likeForumPost(postId);
  };

  // Load more posts handler requested by user:
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    sound.playClick();

    postsApi
      .getPosts({ page, limit: 10, boardId: selectedBoardId || undefined })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setExtraPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = res.data.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
          setPage((p) => p + 1);
          if (res.data.length < 10) setHasMore(false);
        } else {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.log('[ForumHomepage] Lỗi khi load more:', err?.message);
        setHasMore(false);
      })
      .finally(() => {
        setIsLoadingMore(false);
        sound.playNotification();
      });
  };

  // Handle local comment image upload from machine
  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP...)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCommentImageUpload(event.target?.result as string);
        sound.playClick();
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeViewingPost) return;
    if (!postCommentInput.trim() && !commentImageUpload) return;

    addForumComment(activeViewingPost.id, postCommentInput, commentImageUpload || undefined);

    // Ghi comment vào PostgreSQL qua REST API
    postsApi
      .createComment(activeViewingPost.id, {
        text: postCommentInput.trim(),
        image: commentImageUpload || undefined,
      })
      .catch((err) => {
        console.log('[ForumHomepage] Lưu comment vào PostgreSQL notice:', err?.message);
      });

    setPostCommentInput('');
    setCommentImageUpload(null);
    sound.playSuccess();
  };

  // Send private message modal
  const handleSendPrivateMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateMsgText.trim() || !privateMsgRecipient) return;

    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'comment',
      title: `✉ Đã gửi tin nhắn riêng tới ${privateMsgRecipient}`,
      message: `Nội dung: "${privateMsgText}"`,
      timestamp: 'Vừa xong',
    });
    setPrivateMsgRecipient(null);
    setPrivateMsgText('');
  };

  // Filtered posts based on sidebar and search
  const filteredPosts = allPosts.filter((post) => {
    if (selectedBoardId && post.boardId !== selectedBoardId) {
      return false;
    }
    if (activeCategory === 'summary') {
      // Show all posts in Tổng hợp (Summary)
    } else if (activeCategory === 'qa') {
      if (post.category !== 'qa' && !post.tags.some((t) => t.toLowerCase().includes('q&a') || t.toLowerCase().includes('hỏi đáp') || t.toLowerCase().includes('question'))) return false;
    } else if (activeCategory === 'voting') {
      if (post.category !== 'voting' && !post.tags.some((t) => t.toLowerCase().includes('bình chọn') || t.toLowerCase().includes('voting') || t.toLowerCase().includes('poll'))) return false;
    } else if (post.category !== activeCategory) {
      return false;
    }

    if (forumSearch.trim()) {
      const q = forumSearch.toLowerCase().trim();
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Render board icon helper
  const renderBoardIcon = (type: ForumBoard['iconType']) => {
    switch (type) {
      case 'inspiration':
        return (
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-600/60 flex items-center justify-center text-cyan-300">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      case 'asset':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <span className="text-lg">🐉</span>
          </div>
        );
      case 'need_tutorial':
        return (
          <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-300">
            <span className="text-lg">🏯</span>
          </div>
        );
      case 'have_tutorial':
        return (
          <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <span className="text-lg">🦌</span>
          </div>
        );
      case 'study':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <span className="text-lg">🍁</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in">
      {/* Hidden input for local image attachment in comment from machine */}
      <input
        ref={commentFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCommentFileChange}
        className="hidden"
      />

      {/* 1. TOP FORUM BOARDS (Exact replica of the 5 cards from Screenshot 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boards.map((board) => {
          const isSelected = selectedBoardId === board.id;
          return (
            <div
              key={board.id}
              onClick={() => {
                sound.playClick();
                setSelectedBoardId(isSelected ? null : board.id);
              }}
              className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-[#152a35] border-amber-400 ring-1 ring-amber-400/40 shadow-xl'
                  : 'bg-[#102029]/90 hover:bg-[#152733] border-[#1d3544] hover:border-slate-500'
              }`}
            >
              {/* Flame badge for "I need a tutorial" matching screenshot */}
              {board.hasFlameBadge && (
                <div className="absolute top-2 right-2 p-1 rounded-full bg-cyan-500/20 text-cyan-400">
                  <Flame className="w-4 h-4 fill-cyan-400" />
                </div>
              )}

              <div className="flex items-start gap-3.5">
                {/* Board Custom Icon */}
                <div className="shrink-0">{renderBoardIcon(board.iconType)}</div>

                {/* Board Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-cinzel text-sm sm:text-base font-bold text-slate-100 tracking-wide">
                      {board.title}
                    </h3>
                    {board.isLocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>

                  <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {board.description}
                  </p>

                  {/* Board Stats matching screenshot icons */}
                  <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-400 font-mono">
                    {board.isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{board.postsCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400/90">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{board.heatCount}</span>
                    </div>
                    {board.likesCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-slate-400" />
                        <span>{board.likesCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected board filter badge notice */}
      {selectedBoardId && (
        <div className="flex items-center justify-between bg-[#12242e] p-3 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <span>Đang lọc theo chuyên mục:</span>
            <span className="font-bold underline">
              {boards.find((b) => b.id === selectedBoardId)?.title}
            </span>
          </div>
          <button
            onClick={() => setSelectedBoardId(null)}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Hiện tất cả chuyên mục
          </button>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN FORUM LAYOUT (Exact replica of Screenshot 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Navigation Tabs Sidebar - Exactly 3 categories matching user screenshot: Tổng hợp, Hỏi đáp, Bình chọn */}
        <div className="lg:col-span-3 xl:col-span-2 bg-[#0a1820]/95 border border-[#1b3443] rounded-2xl p-2 shadow-xl divide-y divide-[#172d3a]/60">
          {[
            { id: 'summary', labelVi: 'Tổng hợp', labelEn: 'Summary' },
            { id: 'qa', labelVi: 'Hỏi đáp', labelEn: 'Q&A' },
            { id: 'voting', labelVi: 'Bình chọn', labelEn: 'Voting' },
          ].map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <div key={item.id} className="pt-1 first:pt-0 pb-1 last:pb-0">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveCategory(item.id);
                  }}
                  className={`w-full py-3 px-3.5 text-left text-[13px] font-medium tracking-wide transition-all duration-200 flex items-center justify-between rounded-xl ${
                    isActive
                      ? 'bg-[#132c3a] text-white font-bold shadow-md border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#10232f]/80'
                  }`}
                >
                  <span className="truncate">
                    {item.id === 'summary'
                      ? t('forum.category_summary')
                      : item.id === 'qa'
                      ? t('forum.category_qa')
                      : t('forum.category_voting')}
                  </span>
                  {isActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,1)] shrink-0 ml-2"></span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Center Column: Feed of Forum Posts + LOAD MORE BUTTON */}
        <div className="lg:col-span-7 space-y-4">
          {/* Post Action Banner linking Forum to Post Editor with Local Image Upload */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#11242e] via-[#152e3b] to-[#12242e] border border-[#224458] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>{t('forum.title')}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    +5 Credits
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {t('forum.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (onOpenPostEditor) {
                    onOpenPostEditor();
                  } else {
                    onOpenNewPostModal();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('forum.btn_create_post')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenNewPostModal();
                }}
                className="px-3 py-2 rounded-xl bg-[#162e3c] hover:bg-[#1d3b4d] text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                title="Mở hộp thoại đăng nhanh"
              >
                Đăng nhanh
              </button>
            </div>
          </div>

          {/* Sub-tab Filter Bar: Tất cả, Bài của tôi, Chờ duyệt */}
          <div className="flex items-center justify-between border-b border-[#1c3848] pb-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setPostFilterTab('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  postFilterTab === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#142834]'
                }`}
              >
                {t('forum.tab_all_posts')}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPostFilterTab('my');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    postFilterTab === 'my'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-[#142834]'
                  }`}
                >
                  {t('forum.tab_my_posts')}
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPostFilterTab('pending');
                    fetchPendingPosts();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    postFilterTab === 'pending'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-purple-300 hover:text-white hover:bg-[#201836]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('forum.tab_pending_moderation')}</span>
                  {pendingPosts.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                      {pendingPosts.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              {filteredPosts.length} bài viết
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-[#102029]/80 rounded-xl border border-slate-800 space-y-2">
              <p className="text-sm text-slate-300">Không có bài viết nào trong mục này</p>
              {activeCategory === 'attention' && (
                <p className="text-xs text-slate-500">
                  Hãy nhấn nút "Attention" trên các bài viết để theo dõi tác giả yêu thích của bạn!
                </p>
              )}
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isFollowed = followedAuthors.has(post.authorName);
              const isPending = post.status === 'DRAFT' || post.moderationStatus === 'PENDING';
              const isRejected = post.status === 'ARCHIVED' || post.moderationStatus === 'REJECTED';

              return (
                <div
                  key={post.id}
                  onClick={() => setViewingPostId(post.id)}
                  className="p-4 sm:p-5 rounded-xl bg-[#102029] hover:bg-[#132530] border border-[#1c3544] hover:border-amber-500/40 shadow-xl transition-all duration-200 cursor-pointer space-y-3.5 group relative"
                >
                  {/* Author Header Row matching screenshot */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/40 ring-1 ring-black"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm group-hover:text-amber-200 transition-colors">
                            {post.authorName}
                          </span>
                          {post.authorBadge && (
                            <span className="text-[10px] text-amber-300 font-mono bg-[#182e3a] px-1.5 py-0.2 rounded border border-amber-500/30">
                              {post.authorBadge}
                            </span>
                          )}
                          {/* Moderation Badge */}
                          {isPending ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-semibold flex items-center gap-1">
                              ⏳ {t('forum.moderation_status_pending')}
                            </span>
                          ) : isRejected ? (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40 font-semibold flex items-center gap-1">
                              🚫 {t('forum.moderation_status_rejected')}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium flex items-center gap-1">
                              ✨ {t('forum.moderation_status_approved')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-light mt-0.5">
                          {post.updatedTimeAgo} &bull; {post.readsCount} reads
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Admin Moderation Actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 mr-2" onClick={(e) => e.stopPropagation()}>
                          {isPending && (
                            <button
                              type="button"
                              onClick={(e) => handleApprove(post.id, e)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition-all flex items-center gap-1"
                              title="Duyệt bài viết này"
                            >
                              <Check className="w-3 h-3" />
                              <span>{t('forum.btn_approve')}</span>
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              type="button"
                              onClick={(e) => handleReject(post.id, e)}
                              className="px-2 py-1 rounded-lg bg-orange-600/80 hover:bg-orange-500 text-white text-[11px] font-semibold transition-all flex items-center gap-1"
                              title="Từ chối bài viết"
                            >
                              <X className="w-3 h-3" />
                              <span>{t('forum.btn_reject')}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(post.id, e)}
                            className="px-2 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-[11px] transition-all"
                            title="Xóa bài viết vĩnh viễn"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={(e) => handleToggleFollow(post.authorName, e)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isFollowed
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-[#152a36] hover:bg-[#1d3748] text-slate-200 border-slate-700/60 hover:border-slate-500'
                        }`}
                      >
                        {isFollowed ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>Đang theo dõi</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-3.5 h-3.5 text-slate-400" />
                            <span>Attention</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrivateMsgRecipient(post.authorName);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#152a36] hover:bg-[#1d3748] text-slate-200 border border-slate-700/60 hover:border-slate-500 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Private message</span>
                      </button>
                    </div>
                  </div>

                  {/* Post Title */}
                  <h4 className="font-semibold text-slate-100 text-sm sm:text-base leading-snug group-hover:text-amber-200 transition-colors">
                    {post.title}
                  </h4>

                  {/* Post Content excerpt */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {post.content}
                  </p>

                  {/* Post Image Banner (matching the 3D anime character banner in user's screenshot) */}
                  {post.images && post.images.length > 0 && (
                    <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[16/9] border border-slate-800/80 group/img">
                      <img
                        src={post.images[0]}
                        alt="Post media"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Exact Korean Overlay badges from user screenshot for JKER post */}
                      {post.id === 'post-1' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-yellow-400/20 to-transparent flex items-center justify-start p-6 pointer-events-none">
                          <div className="space-y-2 drop-shadow-2xl">
                            <div className="inline-block px-3 py-1 bg-white/95 text-pink-600 font-black text-sm sm:text-base rounded-md shadow-lg border border-pink-200 tracking-wider">
                              3D 모델링
                            </div>
                            <div className="block">
                              <span className="inline-block px-3 py-1 bg-pink-500/95 text-white font-black text-sm sm:text-base rounded-md shadow-lg border border-pink-400 tracking-wider">
                                버튜버
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags & Interaction stats */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-[#162a36] text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleLikePost(post.id, e)}
                        className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span className="font-mono text-[11px]">{post.likesCount}</span>
                      </button>

                      <div className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono text-[11px]">{post.commentsCount}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-mono text-[11px]">{post.readsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* LOAD MORE BUTTON (Requested by user: "chức là load more cho các bài viết tiếp theo") */}
          <div className="pt-4 pb-8 flex flex-col items-center justify-center gap-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2.5 rounded-full bg-[#142834] hover:bg-[#1c3848] border border-[#254355] hover:border-amber-400/50 text-slate-200 text-xs font-semibold tracking-wider transition-all shadow-md flex items-center gap-2 group disabled:opacity-60"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Đang tải thêm bài viết tiếp theo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>Tải thêm bài viết tiếp theo (Load More)</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Hiển thị {filteredPosts.length} bài viết thảo luận
            </span>
          </div>
        </div>

        {/* Right Column: User Auth Banner & Widgets (Exact replica of Screenshot 4) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Widget 1: Oriental Landscape Hero Login Widget */}
          <div className="rounded-xl overflow-hidden bg-[#102029] border border-[#1e3746] shadow-xl">
            {/* Ink wash red warrior banner matching screenshot */}
            <div className="relative h-28 bg-gradient-to-r from-red-950 via-slate-900 to-black overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80"
                alt="Banner"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#102029]"></div>
            </div>

            {/* Profile Avatar overlapping banner */}
            <div className="px-5 pb-5 pt-0 relative flex flex-col items-center text-center -mt-10">
              <img
                src={
                  isAuthenticated
                    ? user?.avatar
                    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
                }
                alt="User"
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-xl bg-slate-900"
              />

              {isAuthenticated ? (
                <div className="mt-2.5 space-y-1 w-full">
                  <h4 className="font-bold text-slate-100 text-sm">{user?.name}</h4>
                  <div className="text-[11px] text-amber-400 font-mono">
                    {user?.credits} Credits &bull; {user?.tier.toUpperCase()}
                  </div>
                  <div className="pt-2 space-y-1.5">
                    <button
                      onClick={() => {
                        sound.playClick();
                        if (onOpenPostEditor) {
                          onOpenPostEditor();
                        } else {
                          onOpenNewPostModal();
                        }
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Viết bài mới (Tải ảnh từ máy)</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenNewPostModal();
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#142834] hover:bg-[#1a3444] text-slate-300 text-xs font-medium border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>⚡ Đăng nhanh (Quick Post)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3 w-full">
                  <div className="text-sm font-semibold text-slate-200">
                    Xin chào! Vui lòng đăng nhập
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Log in Button matching cyan-slate button in screenshot */}
                    <button
                      onClick={onOpenAuth}
                      className="py-2 px-3 rounded-lg bg-[#193240] hover:bg-[#214154] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/60 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Đăng nhập</span>
                    </button>

                    {/* Register Button matching orange button in screenshot */}
                    <button
                      onClick={onOpenAuth}
                      className="py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Đăng ký</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Widget 2: Search Forum matching screenshot */}
          <div className="p-4 rounded-xl bg-[#102029] border border-[#1e3746] space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-cinzel">
              Search
            </h4>
            <div className="relative">
              <input
                type="text"
                value={forumSearch}
                onChange={(e) => setForumSearch(e.target.value)}
                placeholder={t('forum.search_placeholder')}
                className="w-full bg-[#132530] text-slate-200 text-xs rounded-lg pl-3 pr-8 py-2 border border-[#223d4e] focus:border-amber-400 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Widget 3: Forum Rules & Notice */}
          <div className="p-4 rounded-xl bg-[#102029] border border-[#1e3746] space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{t('forum.rules_title')}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t('forum.rules_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Private Message Modal */}
      {privateMsgRecipient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0e1c24] border border-[#233f4f] rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Gửi tin nhắn riêng tới @{privateMsgRecipient}
                </h3>
              </div>
              <button
                onClick={() => setPrivateMsgRecipient(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendPrivateMsg} className="space-y-3">
              <textarea
                rows={4}
                required
                value={privateMsgText}
                onChange={(e) => setPrivateMsgText(e.target.value)}
                placeholder="Nhập nội dung trao đổi tài nguyên, xin hướng dẫn hoặc làm quen..."
                className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl p-3 border border-slate-700 focus:border-amber-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPrivateMsgRecipient(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi tin nhắn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          POST DETAILS & COMPLETE DISCUSSION MODAL WITH LOCAL IMAGE UPLOAD
         ========================================================================= */}
      {activeViewingPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0f1d24] border border-[#233f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#142630] border-b border-[#233b47] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  Thảo luận bài viết
                </span>
                <span className="text-slate-400 text-xs">&bull; {activeViewingPost.authorName}</span>
              </div>
              <button
                onClick={() => setViewingPostId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-5 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {activeViewingPost.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-400 pb-2 border-b border-slate-800">
                <img
                  src={activeViewingPost.authorAvatar}
                  alt={activeViewingPost.authorName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400"
                />
                <span className="text-slate-200 font-medium">{activeViewingPost.authorName}</span>
                <span>{activeViewingPost.updatedTimeAgo}</span>
                <span>{activeViewingPost.readsCount} lượt đọc</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {activeViewingPost.content}
              </p>

              {/* Attached Images */}
              {activeViewingPost.images && activeViewingPost.images.length > 0 && (
                <div className="space-y-2">
                  {activeViewingPost.images.map((imgSrc, i) => (
                    <div key={i} className="rounded-xl overflow-hidden bg-black border border-slate-800">
                      <img
                        src={imgSrc}
                        alt={`Attachment ${i + 1}`}
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* =========================================================================
                  DISCUSSION & COMMENTS SECTION WITH LOCAL PHOTO UPLOAD
                 ========================================================================= */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Thảo luận & Bình luận ({activeViewingPost.commentsCount})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Được tải ảnh minh họa trực tiếp từ máy tính
                  </span>
                </h4>

                {/* Comment Input Form with local image upload */}
                <form onSubmit={handlePostCommentSubmit} className="space-y-2 bg-[#12222b] p-3.5 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop'}
                      alt="Me"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-semibold text-slate-200">{user?.name || 'Đồng môn'}</span>
                  </div>

                  <textarea
                    rows={2}
                    value={postCommentInput}
                    onChange={(e) => setPostCommentInput(e.target.value)}
                    placeholder="Viết phản hồi thảo luận, chia sẻ kinh nghiệm hoặc đặt câu hỏi..."
                    className="w-full bg-[#0d171e] text-slate-200 text-xs rounded-lg p-2.5 border border-slate-700 focus:border-cyan-400 focus:outline-none resize-none"
                  />

                  {/* Uploaded local image preview in comment */}
                  {commentImageUpload && (
                    <div className="relative inline-block rounded-lg overflow-hidden border border-cyan-400/50 bg-black">
                      <img
                        src={commentImageUpload}
                        alt="Comment attachment"
                        className="h-20 w-auto object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCommentImageUpload(null)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-600 text-white text-[10px] hover:bg-rose-700"
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {/* Upload from machine button */}
                    <button
                      type="button"
                      onClick={() => commentFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18313f] hover:bg-[#204255] text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                      title="Chọn ảnh minh họa từ máy tính của bạn"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{commentImageUpload ? 'Đổi ảnh khác' : 'Tải ảnh từ máy'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={!postCommentInput.trim() && !commentImageUpload}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi thảo luận</span>
                    </button>
                  </div>
                </form>

                {/* List of comments */}
                <div className="space-y-3">
                  {/* Dynamic user submitted comments */}
                  {activeViewingPost.commentsList && activeViewingPost.commentsList.map((comm) => (
                    <div key={comm.id} className="p-3 bg-[#12222b] rounded-xl border border-slate-800 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={comm.authorAvatar}
                            alt={comm.authorName}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-400/50"
                          />
                          <span className="text-xs font-semibold text-slate-200">{comm.authorName}</span>
                          <span className="text-[10px] text-slate-500">{comm.timeAgo}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 pl-8 leading-relaxed whitespace-pre-line">
                        {comm.text}
                      </p>
                      {comm.image && (
                        <div className="pl-8 pt-1">
                          <img
                            src={comm.image}
                            alt="Attached from computer"
                            className="max-h-48 rounded-lg border border-slate-700 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Default sample comment */}
                  <div className="p-3 bg-[#12222b] rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                        alt="User"
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-400/40"
                      />
                      <span className="text-xs font-semibold text-slate-300">Minh Hạo CG</span>
                      <span className="text-[10px] text-slate-500">1 ngày trước</span>
                    </div>
                    <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                      Cảm ơn tác giả đã chia sẻ bài phân tích blendshapes này, phần setup ARKit vào Blender tiết kiệm được rất nhiều thời gian làm việc!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

