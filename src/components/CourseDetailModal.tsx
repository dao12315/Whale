import React, { useState } from 'react';
import { Course } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import {
  X,
  Play,
  Share2,
  Heart,
  MessageSquare,
  ThumbsUp,
  Clock,
  Send,
  Users,
  CheckCircle,
  Crown,
  Sparkles,
  Download,
  AlertCircle,
  Radio,
  Bell,
} from 'lucide-react';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
  initialTab?: 'overview' | 'comments' | 'groupbuy';
  onOpenNotifications?: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  onClose,
  initialTab = 'overview',
  onOpenNotifications,
}) => {
  const { user, purchaseCourse, hasPurchased, toggleWishlist, isWishlisted } = useAuth();
  const { comments, addComment, addReply, likeComment, triggerSimulatedPeerActivity } = useRealtime();

  const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'groupbuy'>(initialTab);
  const [commentInput, setCommentInput] = useState('');
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    orderId: string;
    courseTitle: string;
    courseCode: string;
    cost: number;
    time: string;
  } | null>(null);

  if (!course) return null;

  const courseComments = comments[course.id] || [];
  const isUnlocked = hasPurchased(course.id);
  const wishlisted = isWishlisted(course.id);

  // Calculate user price based on tier
  const userPrice =
    user?.tier === 'supreme'
      ? course.supremePrice
      : user?.tier === 'gold'
      ? course.goldPrice
      : course.originalPrice;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(course.id, commentInput);
    setCommentInput('');
  };

  const handleSendReply = (parentCommentId: string) => {
    const text = replyInputMap[parentCommentId];
    if (!text || !text.trim()) return;
    addReply(course.id, parentCommentId, text);
    setReplyInputMap((prev) => ({ ...prev, [parentCommentId]: '' }));
    setActiveReplyId(null);
  };

  const handlePurchase = () => {
    const success = purchaseCourse(course.id, userPrice, course.title);
    if (success) {
      const orderId = `GGC-${Date.now().toString().slice(-6)}`;
      setOrderSuccessModal({
        orderId,
        courseTitle: course.title,
        courseCode: course.code,
        cost: userPrice,
        time: 'Vừa xong',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0f1d24] border border-[#233f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[#142630] border-b border-[#233b47] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm">{course.code}</span>
            <span className="text-slate-200 font-medium text-xs sm:text-sm truncate max-w-md">
              {course.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Top Video Preview & Hero info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Video Player Mockup */}
            <div className="lg:col-span-7 rounded-xl overflow-hidden bg-black relative aspect-video group">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-xs text-amber-200 font-chinese">
                  <span>{course.titleZh}</span>
                  <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                    4K ProRes
                  </span>
                </div>

                {isPlayingPreview ? (
                  <div className="bg-black/90 p-4 rounded-xl text-center space-y-2 border border-slate-700 animate-in fade-in">
                    <p className="text-xs text-amber-300 font-semibold">
                      Đang phát đoạn trích bài giảng mẫu (Preview 1080p)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Mở khóa toàn bộ bài giảng và file project DaVinci / LUTs bên dưới.
                    </p>
                    <button
                      onClick={() => setIsPlayingPreview(false)}
                      className="text-xs text-slate-300 underline"
                    >
                      Dừng xem thử
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => setIsPlayingPreview(true)}
                      className="w-14 h-14 rounded-full bg-amber-500/90 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all transform hover:scale-110"
                    >
                      <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                    </button>
                  </div>
                )}

                <div className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>{course.eventDate || 'Kho tư liệu văn hóa phi vật thể'}</span>
                  <span>{course.chapters?.length || 5} bài giảng chuyên sâu</span>
                </div>
              </div>
            </div>

            {/* Quick Purchase & Tier Pricing Details */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#13242e] p-4 rounded-xl border border-[#233a46]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {course.category}
                  </span>
                  <button
                    onClick={() => toggleWishlist(course.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{wishlisted ? 'Đã lưu' : 'Lưu lại'}</span>
                  </button>
                </div>

                <h2 className="mt-2 text-sm sm:text-base font-bold text-slate-100 leading-snug">
                  {course.title}
                </h2>

                <p className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>

                {/* Group buying progress */}
                {course.groupBuyStatus && (
                  <div className="mt-4 p-3 rounded-lg bg-[#0d181e] border border-amber-500/20">
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Users className="w-3.5 h-3.5" />
                        Tiến độ mua chung: {course.groupBuyStatus.currentMembers}/{course.groupBuyStatus.targetMembers} người
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {course.groupBuyStatus.isCompleted ? 'Hoàn thành' : `Còn ${course.groupBuyStatus.hoursLeft}h`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all"
                        style={{
                          width: `${(course.groupBuyStatus.currentMembers / course.groupBuyStatus.targetMembers) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Purchase Action */}
              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      {userPrice === 0 ? 'Quyền truy cập:' : 'Giá dành cho bạn:'}
                    </span>
                    {userPrice === 0 ? (
                      <span className="text-xl font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                        <span>Miễn phí 100%</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          0 Credits
                        </span>
                      </span>
                    ) : (
                      <span className="text-xl font-bold text-amber-300 font-mono">
                        {userPrice} <span className="text-xs text-slate-400 font-normal">Credits</span>
                      </span>
                    )}
                    {user?.tier !== 'free' && userPrice > 0 && (
                      <span className="ml-2 text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                        {user?.tier === 'supreme' ? 'Giảm 30% VIP' : 'Giảm 10% Gold'}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>{userPrice === 0 ? 'Khóa học cộng đồng' : `Giá gốc: ${course.originalPrice} Credits`}</div>
                    <div>Số dư của bạn: <span className="text-amber-400 font-bold">{user?.credits || 0} Credits</span></div>
                  </div>
                </div>

                {isUnlocked ? (
                  <div className="space-y-2">
                    <div className="w-full py-2.5 px-4 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Đã mở khóa toàn bộ khóa học & tài nguyên</span>
                    </div>
                    <button className="w-full py-2 px-3 bg-[#1d3544] hover:bg-[#254355] text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tải bộ LUTs & Project Files đính kèm</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePurchase}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                      userPrice === 0
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-950/40'
                        : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 shadow-amber-950/40'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>
                      {userPrice === 0
                        ? 'Mở khóa ngay miễn phí (0 Credits)'
                        : `Tham gia mua chung & Mở khóa (${userPrice} Credits)`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Modal content */}
          <div className="flex items-center gap-3 border-b border-slate-700/80">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative ${
                activeTab === 'overview'
                  ? 'text-amber-300 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nội dung bài giảng ({course.chapters?.length || 5})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 relative ${
                activeTab === 'comments'
                  ? 'text-amber-300 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Bình luận thời gian thực</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-900/60 text-cyan-300 font-mono">
                {courseComments.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Chapters & Resource list */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Giáo trình chi tiết
              </h4>
              <div className="divide-y divide-slate-800 rounded-xl bg-[#12222b] border border-[#203643] overflow-hidden">
                {course.chapters?.map((chap, idx) => (
                  <div
                    key={chap.id}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-[#162b37] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 w-5">0{idx + 1}</span>
                      <span className="text-slate-200 font-medium">{chap.title}</span>
                      {chap.isFreePreview && (
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                          Học thử miễn phí
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">{chap.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: REAL-TIME COMMENT SYSTEM */}
          {activeTab === 'comments' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Real-time peer simulation helper */}
              <div className="flex items-center justify-between bg-[#12242e] p-3 rounded-xl border border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="text-xs text-cyan-300 font-medium">
                    Kênh bình luận thời gian thực (Live Stream)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => triggerSimulatedPeerActivity(course.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c3543] hover:bg-[#254557] text-[11px] text-amber-300 border border-amber-500/30 transition-colors"
                >
                  <Radio className="w-3 h-3 text-amber-400" />
                  <span>Mô phỏng bạn học gửi bình luận</span>
                </button>
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleSendComment} className="space-y-2">
                <div className="relative">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Viết câu hỏi hoặc chia sẻ cảm nhận về khóa học này... (Bình luận hiển thị tức thì)"
                    rows={3}
                    className="w-full bg-[#112028] text-slate-200 text-xs rounded-xl p-3 border border-[#243e4e] focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 placeholder:text-slate-500 resize-none transition-all"
                  />
                  <div className="flex items-center justify-between mt-1 px-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-[11px]">Đăng với tên:</span>
                      <span className="text-amber-300 font-semibold">{user?.name || 'Khách'}</span>
                      {user?.tier && (
                        <span className="text-[9px] uppercase px-1 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                          {user.tier}
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi bình luận</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3.5">
                {courseComments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Chưa có bình luận nào cho khóa học này. Hãy là người đầu tiên trao đổi!
                  </div>
                ) : (
                  courseComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-xl bg-[#12222b] border border-[#203643] space-y-2.5 transition-all animate-in fade-in slide-in-from-top-1"
                    >
                      {/* Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-600"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-200">
                                {comment.userName}
                              </span>
                              {comment.userTier && (
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                                    comment.userTier === 'supreme'
                                      ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                                      : comment.userTier === 'gold'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {comment.userTier}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                          </div>
                        </div>

                        {/* Like button */}
                        <button
                          onClick={() => likeComment(course.id, comment.id)}
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                            comment.hasLiked
                              ? 'text-amber-400 bg-amber-950/40'
                              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span className="font-mono text-[11px]">{comment.likes}</span>
                        </button>
                      </div>

                      {/* Content */}
                      <p className="text-xs text-slate-300 leading-relaxed pl-9">
                        {comment.content}
                      </p>

                      {/* Action buttons (Reply toggle) */}
                      <div className="pl-9 flex items-center gap-3 text-[11px]">
                        <button
                          onClick={() =>
                            setActiveReplyId(activeReplyId === comment.id ? null : comment.id)
                          }
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Trả lời</span>
                        </button>
                      </div>

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-9 pt-2 space-y-2 border-l border-slate-700/60 ml-4">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="bg-[#0e1a21] p-2.5 rounded-lg border border-slate-800/80 space-y-1 animate-in fade-in"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={reply.userAvatar}
                                    alt={reply.userName}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                  <span className="text-xs font-medium text-slate-300">
                                    {reply.userName}
                                  </span>
                                  <span className="text-[9px] uppercase px-1 rounded bg-amber-950/50 text-amber-300 border border-amber-600/30">
                                    {reply.userTier}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {reply.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Reply Input */}
                      {activeReplyId === comment.id && (
                        <div className="pl-9 pt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={replyInputMap[comment.id] || ''}
                            onChange={(e) =>
                              setReplyInputMap((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            placeholder={`Trả lời ${comment.userName}...`}
                            className="flex-1 bg-[#0d181f] text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-cyan-400 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendReply(comment.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(comment.id)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                          >
                            Gửi
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🌟 ĐẶT ĐƠN HÀNG THÀNH CÔNG MODAL */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0e1c24] border border-amber-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5 text-center"
          >
            {/* Top decorative glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-transparent blur-3xl pointer-events-none"></div>

            {/* Success icon badge */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-amber-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="space-y-1.5 relative z-10">
              <span className="text-[11px] font-bold font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                XÁC NHẬN ĐƠN HÀNG
              </span>
              <h3 className="font-cinzel text-xl font-black text-slate-100 tracking-wide pt-1">
                Đặt Đơn Thành Công!
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Khóa học đã được mở khóa vào tài khoản của bạn. Đã gửi 1 thông báo đặt đơn thành công đến <span className="text-amber-400 font-semibold">biểu tượng Chuông 🔔</span>.
              </p>
            </div>

            {/* Order Receipt Card */}
            <div className="bg-[#132530] border border-[#223d4e] rounded-2xl p-4 text-xs space-y-2.5 text-left relative z-10">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                <span className="text-slate-400">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-amber-300">#{orderSuccessModal.orderId}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 shrink-0">Khóa học:</span>
                <span className="font-medium text-slate-200 text-right line-clamp-2">
                  <span className="text-amber-400 font-bold mr-1">{orderSuccessModal.courseCode}</span>
                  {orderSuccessModal.courseTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Thanh toán:</span>
                <span className="font-bold text-emerald-300 font-mono">
                  {orderSuccessModal.cost === 0 ? '0 Credits (Miễn phí 100%)' : `${orderSuccessModal.cost} Credits`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phương thức:</span>
                <span className="text-slate-300 font-medium">Trừ ví Credits GGC Studio</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                <span className="text-slate-400">Trạng thái:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                  ĐÃ KÍCH HOẠT & SẴN SÀNG HỌC
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 relative z-10">
              <button
                onClick={() => setOrderSuccessModal(null)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Bắt đầu học ngay</span>
              </button>

              <button
                onClick={() => {
                  setOrderSuccessModal(null);
                  if (onOpenNotifications) {
                    onOpenNotifications();
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-[#162e3c] hover:bg-[#1f3c4e] text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Xem thông báo tại Biểu tượng Chuông 🔔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
