import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { ForumPost } from '../types';
import { FORUM_BOARDS } from '../data/forumData';
import { sound } from '../services/sound';
import { notificationService } from '../services/notificationService';
import confetti from 'canvas-confetti';
import {
  X,
  PlusCircle,
  Image,
  Upload,
  Lock,
  Sparkles,
  Send,
  LogIn,
  AlertCircle,
  Tag,
  CheckCircle,
  Trash2,
  FolderOpen,
  Link as LinkIcon,
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: ForumPost) => void;
  onRequireLogin: () => void;
  onOpenPostEditor?: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  onRequireLogin,
  onOpenPostEditor,
}) => {
  const { user, isAuthenticated, addCredits } = useAuth();
  const { addForumPost } = useRealtime();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [boardId, setBoardId] = useState('board-have-tutorial');
  const [category, setCategory] = useState<ForumPost['category']>('summary');
  const [tags, setTags] = useState('Blender, 3D Modeling, Tutorial');

  // Image upload mode: 'local' (upload from machine), 'preset' (gallery), 'url'
  const [imageTab, setImageTab] = useState<'local' | 'preset' | 'url'>('local');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery presets
  const PRESET_GALLERY = [
    { title: 'Designing Viral Illustrations', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80' },
    { title: 'Blender 3D Anime Style', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' },
    { title: 'Unreal Engine 5 Scene Lighting', url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80' },
    { title: 'ZBrush Character Sculpting', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80' },
  ];

  if (!isOpen) return null;

  // Handle local file selection from user's computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP...)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
      sound.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      onRequireLogin();
      return;
    }

    if (!title.trim() || !content.trim()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Final image source: uploaded from local machine, or chosen URL
    const finalImage = uploadedImage || (imageUrlInput.trim() ? imageUrlInput.trim() : undefined);

    const newPost: ForumPost = {
      id: `post_${Date.now()}`,
      boardId,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      authorBadge: user.tier === 'supreme' ? '👑 Supreme VIP' : user.tier === 'gold' ? '🌟 Gold VIP' : '⭐ Member',
      authorTier: user.tier,
      updatedTimeAgo: 'Vừa xong',
      readsCount: 1,
      likesCount: 0,
      commentsCount: 0,
      title: title.trim(),
      content: content.trim(),
      images: finalImage ? [finalImage] : undefined,
      tags: parsedTags.length > 0 ? parsedTags : ['Creative', 'Forum'],
      category,
      isFollowed: false,
      commentsList: [],
    };

    // Add to shared RealtimeContext so it instantly updates ForumHomepage
    addForumPost(newPost);

    // Reward user 5 credits for contributing
    addCredits(5);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'comment',
      title: '🎉 Đăng bài viết thảo luận thành công!',
      message: `Bài viết "${newPost.title}" đã được hiển thị trên Diễn đàn 一帧山海. Tặng bạn +5 Credits đóng góp.`,
      timestamp: 'Vừa xong',
    });

    onPostCreated(newPost);
    onClose();

    // Reset form
    setTitle('');
    setContent('');
    setUploadedImage(null);
    setImageUrlInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#0b161c] border border-[#233f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header directly matching Screenshot 1 */}
        <div className="px-5 py-4 bg-[#11212a] border-b border-[#233b47] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 font-cinzel">
                TẠO BÀI VIẾT THẢO LUẬN MỚI
              </h3>
              <p className="text-[10px] text-slate-400">Create New Forum Topic & Resource</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link to full post editor with local image upload & polls */}
        {onOpenPostEditor && (
          <div className="bg-[#0f1f28] px-5 py-2 border-b border-[#1c333f] flex items-center justify-between">
            <span className="text-[11px] text-slate-300">
              Cần tải nhiều ảnh từ máy, ảnh bìa lớn và tạo bình chọn?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPostEditor();
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
            >
              <span>Mở Trình soạn thảo chuyên sâu</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto p-5">
          {!isAuthenticated ? (
            <div className="p-6 rounded-xl bg-[#13222b] border border-amber-500/40 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Yêu Cầu Đăng Nhập
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Để đảm bảo chất lượng nội dung và an toàn cộng đồng, chỉ những thành viên đã đăng nhập mới có quyền đăng bài viết, chia sẻ assets hoặc đặt câu hỏi trên diễn đàn 一帧山海.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequireLogin();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập / Đăng Ký Ngay</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Author badge preview directly matching Screenshot 1 */}
              <div className="flex items-center justify-between bg-[#12222b] p-3 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono tracking-wide">
                      {user?.tier.toUpperCase()} MEMBER &bull; +5 Credits khi đăng bài
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Đã xác thực</span>
                </div>
              </div>

              {/* Board and Category Selectors directly matching Screenshot 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Chọn Chuyên Mục (Forum Board)
                  </label>
                  <select
                    value={boardId}
                    onChange={(e) => setBoardId(e.target.value)}
                    className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                  >
                    <option value="board-have-tutorial">I have tutorials (Có hướng dẫn)</option>
                    <option value="board-need-tutorial">I need a tutorial (Cần hướng dẫn)</option>
                    <option value="board-inspiration">Inspiration sharing (Cảm hứng sáng tạo)</option>
                    <option value="board-asset">Asset sharing (Chia sẻ tài nguyên)</option>
                    <option value="board-study">Study (Góc học tập & trao đổi)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Phân Loại Bài Viết (Filter Tag)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ForumPost['category'])}
                    className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                  >
                    <option value="summary">Tổng hợp (Summary)</option>
                    <option value="qa">Hỏi đáp (Q&A)</option>
                    <option value="voting">Bình chọn (Voting)</option>
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Tiêu Đề Bài Viết
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: [Chia sẻ] Kỹ thuật blendshapes cho mô hình 3D Anime trong Blender..."
                  className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nội Dung Thảo Luận
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Mô tả chi tiết giải pháp, kinh nghiệm hoặc câu hỏi kỹ thuật của bạn..."
                  className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl p-3 border border-[#233b47] focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              {/* Image Upload section directly supporting LOCAL FILE UPLOAD from machine */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Ảnh Bìa / Minh Họa (Tùy chọn)
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageTab('local')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        imageTab === 'local' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tải từ máy
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setImageTab('preset')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        imageTab === 'preset' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Thư viện mẫu
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        imageTab === 'url' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {/* TAB 1: LOCAL UPLOAD FROM COMPUTER */}
                {imageTab === 'local' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {uploadedImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-black max-h-48 group">
                        <img
                          src={uploadedImage}
                          alt="Uploaded from computer"
                          className="w-full h-44 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[10px] font-semibold backdrop-blur-md border border-white/20 transition-colors"
                          >
                            Đổi ảnh khác
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadedImage(null)}
                            className="p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-emerald-300 text-[10px] font-medium backdrop-blur-sm">
                          ✓ Đã tải ảnh từ máy tính thành công
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                          isDragging
                            ? 'border-amber-400 bg-amber-500/10'
                            : 'border-[#233b47] hover:border-amber-500/60 bg-[#12222b]/60 hover:bg-[#12222b]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-200">
                          Nhấp để tải ảnh từ máy tính hoặc kéo thả vào đây
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Hỗ trợ PNG, JPG, GIF, WebP (Ảnh sẽ được đính kèm vào bài thảo luận)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PRESET GALLERY */}
                {imageTab === 'preset' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_GALLERY.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setUploadedImage(item.url);
                          sound.playClick();
                        }}
                        className={`cursor-pointer rounded-lg overflow-hidden border transition-all h-20 relative group ${
                          uploadedImage === item.url ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[9px] text-white truncate">{item.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: DIRECT URL */}
                {imageTab === 'url' && (
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Tags Input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Thẻ Phân Loại (Tags, cách nhau bằng dấu phẩy)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Blender, 3D Modeling, Tutorial, Unreal Engine"
                    className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-[#233b47] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button directly matching Screenshot 1 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#e68a00] via-[#f59e0b] to-[#eab308] hover:from-[#d97706] hover:to-[#ca8a04] text-slate-950 font-bold text-xs sm:text-sm shadow-xl transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Đăng Bài Viết Ngay &bull; Nhận +5 Credits</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
