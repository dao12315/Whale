import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { sound } from '../services/sound';
import { notificationService } from '../services/notificationService';
import confetti from 'canvas-confetti';
import {
  Camera,
  Video,
  Save,
  Send,
  Eye,
  EyeOff,
  ChevronRight,
  Bold,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Paperclip,
  Quote,
  Code,
  Maximize2,
  Lock,
  Globe,
  Tag,
  Hash,
  Box,
  BarChart2,
  HelpCircle,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Upload,
  Search,
  X,
} from 'lucide-react';
import { ForumPost } from '../types';

interface PostEditorPageProps {
  onBack: () => void;
  onPostCreated?: (post: ForumPost) => void;
}

interface PictureItem {
  id: string;
  title: string;
  url: string;
  isLocal?: boolean;
}

export const PostEditorPage: React.FC<PostEditorPageProps> = ({
  onBack,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const { addForumPost } = useRealtime();

  // Editor fields matching Screenshot 2, 3 & 4
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showMediaInputModal, setShowMediaInputModal] = useState(false);
  const [imageModalTab, setImageModalTab] = useState<'my_picture' | 'external_link'>('my_picture');
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [externalUrlInput, setExternalUrlInput] = useState('');

  // Local file input ref for uploading from computer (Screenshot 3)
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Picture Library matching Screenshot 3
  const [myPictures, setMyPictures] = useState<PictureItem[]>([
    {
      id: 'pic-1',
      title: 'Designing Viral Illustrations for Client Work',
      url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'pic-2',
      title: 'Blender 3D Anime Style Character',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'pic-3',
      title: 'Unreal Engine 5 Next-Gen Environment',
      url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'pic-4',
      title: 'ZBrush Creature Sculpting & Anatomy',
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'pic-5',
      title: 'DaVinci Resolve Film Color Keyframes',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'pic-6',
      title: 'Japanese Cyberpunk Gacha Character',
      url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    },
  ]);

  // Sidebar settings matching Screenshot 2, 3 & 4
  const [readingPermission, setReadingPermission] = useState<'public' | 'gold' | 'supreme' | 'password'>('public');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const [section, setSection] = useState<string>('I need a tutorial');
  const [showSectionModal, setShowSectionModal] = useState(false);

  const [topic, setTopic] = useState<string>('#Coloso');
  const [showTopicModal, setShowTopicModal] = useState(false);

  const [tags, setTags] = useState<string[]>(['Illustration', 'Characters', 'Blender']);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const [releaseType, setReleaseType] = useState<'standard' | 'ask_questions'>('standard');

  // Voting toggle & poll options matching Screenshot 2 & 4
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Phương án 1: Khóa học Coloso Masterclass',
    'Phương án 2: FastCampus Full Pack chuyên sâu',
  ]);
  const [newPollOption, setNewPollOption] = useState('');

  // Draft saved state
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const [isModalDragging, setIsModalDragging] = useState(false);

  // Handle local file upload from user's computer (Screenshot 3)
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      processSingleImageFile(files[i], i);
    }
    // reset input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const processSingleImageFile = (file: File, indexOffset = 0) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP, GIF...)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPic: PictureItem = {
        id: `local_pic_${Date.now()}_${indexOffset}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl,
        isLocal: true,
      };

      setMyPictures((prev) => [newPic, ...prev]);
      setCoverImage(dataUrl);
      sound.playSuccess();
      notificationService.sendPushNotification({
        type: 'system',
        title: '📷 Đã tải ảnh từ máy tính!',
        message: `Đã nạp ảnh "${file.name}" và đặt làm ảnh bìa bài viết.`,
        timestamp: 'Vừa xong',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePicture = (picId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playClick();
    setMyPictures((prev) => {
      const target = prev.find((p) => p.id === picId);
      if (target && coverImage === target.url) {
        setCoverImage(null);
      }
      return prev.filter((p) => p.id !== picId);
    });
  };

  const handleInsertImageIntoContent = (imageUrl: string, titleStr?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playClick();
    const mdImg = `\n\n![${titleStr || 'Hình ảnh bài viết'}](${imageUrl})\n\n`;
    setContent((prev) => prev + mdImg);
    notificationService.sendPushNotification({
      type: 'system',
      title: 'Đã chèn ảnh vào nội dung',
      message: `Đã chèn cú pháp ảnh vào vị trí soạn thảo.`,
      timestamp: 'Vừa xong',
    });
  };

  const handleApplyFormat = (tag: string) => {
    sound.playClick();
    if (tag === 'H2') {
      setContent((prev) => prev + '\n## ');
    } else if (tag === 'H3') {
      setContent((prev) => prev + '\n### ');
    } else if (tag === 'B') {
      setContent((prev) => prev + '**nội dung in đậm**');
    } else if (tag === 'BULLET') {
      setContent((prev) => prev + '\n- ');
    } else if (tag === 'NUMBER') {
      setContent((prev) => prev + '\n1. ');
    } else if (tag === 'QUOTE') {
      setContent((prev) => prev + '\n> ');
    } else if (tag === 'CODE') {
      setContent((prev) => prev + '\n```\n// code / script tại đây\n```\n');
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddPollOption = () => {
    if (newPollOption.trim()) {
      setPollOptions([...pollOptions, newPollOption.trim()]);
      setNewPollOption('');
    }
  };

  const handleRemovePollOption = (idx: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const handlePreserveDraft = () => {
    sound.playClick();
    setIsDraftSaved(true);
    notificationService.sendPushNotification({
      type: 'system',
      title: '💾 Đã lưu bản nháp',
      message: `Bản nháp "${title || 'Bài viết chưa đặt tên'}" đã được lưu an toàn trên máy.`,
      timestamp: 'Vừa xong',
    });
    setTimeout(() => setIsDraftSaved(false), 3000);
  };

  const handleSubmitForRelease = () => {
    if (!title.trim()) {
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Cần nhập tiêu đề',
        message: 'Vui lòng nhập tiêu đề bài viết trước khi xuất bản.',
        timestamp: 'Vừa xong',
      });
      return;
    }

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    sound.playSuccess();

    // Map section to boardId
    let boardId = 'board-have-tutorial';
    if (section.includes('need') || section.includes('cần')) {
      boardId = 'board-need-tutorial';
    } else if (section.includes('Inspiration') || section.includes('cảm hứng')) {
      boardId = 'board-inspiration';
    } else if (section.includes('Resource') || section.includes('tài nguyên')) {
      boardId = 'board-asset';
    }

    const newPost: ForumPost = {
      id: `post_${Date.now()}`,
      boardId,
      authorId: user?.id || 'user_current',
      authorName: user?.name || 'meohamchoi 🦝',
      authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      authorBadge: user?.tier === 'supreme' ? '至尊会员 Supreme VIP' : '🌟 Gold VIP',
      authorTier: user?.tier || 'supreme',
      updatedTimeAgo: 'Vừa xong',
      readsCount: 1,
      likesCount: 0,
      commentsCount: 0,
      title: title.trim(),
      content: content.trim() || 'Chia sẻ nội dung thảo luận và tài nguyên từ tác giả.',
      images: coverImage ? [coverImage] : undefined,
      tags: ['Thảo luận', 'Diễn đàn', 'GGC'],
      category: votingEnabled ? 'voting' : releaseType === 'ask_questions' ? 'qa' : 'summary',
      isFollowed: false,
      commentsList: [],
    };

    // Store in shared realtime state
    addForumPost(newPost);

    notificationService.sendPushNotification({
      type: 'comment',
      title: '🎉 Xuất bản bài viết thành công!',
      message: `Bài viết "${newPost.title}" đã được đăng lên Diễn đàn 一帧山海.`,
      timestamp: 'Vừa xong',
    });

    if (onPostCreated) {
      onPostCreated(newPost);
    }
  };

  const filteredPictures = myPictures.filter((p) =>
    p.title.toLowerCase().includes(imageSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
      {/* Hidden local file input for uploading from computer */}
      <input
        ref={localFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleLocalFileUpload}
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Diễn đàn (Forum)</span>
        </button>

        {isDraftSaved && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Bản nháp đã được lưu tự động</span>
          </span>
        )}
      </div>

      {/* Main 2-Column Editor Grid matching Screenshot 2 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Cover Banner (8 cols) */}
        <div className="lg:col-span-8 bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-sm p-4 sm:p-6 space-y-4">
          
          {/* Top Cover Banner Area directly matching Screenshot 2 & 4 */}
          {coverImage ? (
            /* Screenshot 4: Active Cover Banner with artwork overlay and camera/trash buttons */
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 h-64 sm:h-80 w-full group shadow-lg">
              <img
                src={coverImage}
                alt="Post cover"
                className="w-full h-full object-cover opacity-90 filter contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 pointer-events-none"></div>

              {/* Top-Right Action Buttons: Camera (Change) & Trash (Delete) matching Screenshot 4 */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => setShowMediaInputModal(true)}
                  className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow hover:scale-105"
                  title="Thay đổi ảnh bìa từ máy hoặc thư viện"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => localFileInputRef.current?.click()}
                  className="w-9 h-9 rounded-xl bg-black/60 hover:bg-cyan-700 text-cyan-300 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow hover:scale-105"
                  title="Tải ảnh mới từ máy tính ngay"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    sound.playClick();
                  }}
                  className="w-9 h-9 rounded-xl bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow hover:scale-105"
                  title="Xóa ảnh bìa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Center Artwork title overlay matching Screenshot 4 */}
              <div className="absolute inset-x-6 bottom-6 flex flex-col items-center text-center pointer-events-none">
                <div className="flex items-center gap-2 text-[11px] text-amber-300 font-mono tracking-widest uppercase mb-1">
                  <span>{section || 'Illustration • Characters'}</span>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-cinzel max-w-xl line-clamp-2 drop-shadow">
                  {title || 'Tiêu đề bài viết thảo luận'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  {tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/50 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Screenshot 2: Empty Cover Banner with Camera & Video icons + Drag and drop from computer */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsBannerDragging(true);
              }}
              onDragLeave={() => setIsBannerDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsBannerDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processSingleImageFile(file);
              }}
              className={`rounded-2xl border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center gap-3 relative ${
                isBannerDragging
                  ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                  : 'border-[#233f4e] bg-[#0c181f]/70 hover:bg-[#10222b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => localFileInputRef.current?.click()}
                  className="w-12 h-12 rounded-full bg-[#162c38] text-slate-300 hover:text-cyan-400 flex items-center justify-center border border-slate-700/60 shadow hover:scale-110 transition-transform"
                  title="Tải ảnh trực tiếp từ máy tính"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaInputModal(true)}
                  className="w-12 h-12 rounded-full bg-[#162c38] text-slate-300 hover:text-amber-400 flex items-center justify-center border border-slate-700/60 shadow hover:scale-110 transition-transform"
                  title="Mở thư viện ảnh & tải tệp"
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-200">
                  Nhấp để tải ảnh từ máy tính hoặc kéo thả ảnh vào đây
                </p>
                <p className="text-[11px] text-slate-400">
                  Hỗ trợ định dạng PNG, JPG, WEBP, GIF làm ảnh bìa bài viết (Ảnh máy tính cá nhân)
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => localFileInputRef.current?.click()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn tệp ảnh từ máy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaInputModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#172c38] hover:bg-[#1f3b4c] text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Thư viện ảnh mẫu
                </button>
              </div>
            </div>
          )}

          {/* Title Input matching Screenshot 2 & 4 */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Please enter the title (Vui lòng nhập tiêu đề bài viết...)"
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-base sm:text-lg font-bold border-none focus:outline-none"
            />
          </div>

          {/* Toolbar matching Screenshot 2, 3 & 4 */}
          <div className="flex flex-wrap items-center gap-1 py-1.5 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <button
              onClick={() => handleApplyFormat('H2')}
              className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition-colors"
              title="Tiêu đề H2"
            >
              H2
            </button>
            <button
              onClick={() => handleApplyFormat('H3')}
              className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition-colors"
              title="Tiêu đề H3"
            >
              H3
            </button>
            <button
              onClick={() => handleApplyFormat('B')}
              className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 font-bold transition-colors"
              title="In đậm (Bold)"
            >
              B
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button
              onClick={() => handleApplyFormat('BULLET')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Danh sách không thứ tự"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleApplyFormat('NUMBER')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Danh sách có thứ tự"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button
              onClick={() => sound.playClick()}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Căn trái"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => sound.playClick()}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Căn giữa"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => sound.playClick()}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Căn phải"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
            {/* Image icon opens Screenshot 3 modal */}
            <button
              onClick={() => setShowMediaInputModal(true)}
              className="p-1.5 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
              title="Chèn ảnh (Tải từ máy / Thư viện)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => localFileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-cyan-400"
              title="Tải ảnh từ máy tính (Upload)"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleApplyFormat('QUOTE')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Trích dẫn"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleApplyFormat('CODE')}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Khối mã lệnh (Code block)"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Content Textarea */}
          <div className="relative pt-2">
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Please enter your content (Vui lòng nhập nội dung bài viết, kiến thức, tài nguyên cần chia sẻ...)"
              className="w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 border-none focus:outline-none resize-y text-sm leading-relaxed"
            ></textarea>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Hỗ trợ định dạng Markdown</span>
              <span>{content.length} ký tự</span>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Sidebar (4 cols) matching Screenshot 2 & 4 */}
        <div className="lg:col-span-4 space-y-4">
          {/* Action Buttons: Preserve Draft & Submit for Release matching Screenshot 2 & 4 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreserveDraft}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
              title="Lưu bản nháp vào bộ nhớ"
            >
              <Save className="w-4 h-4 text-slate-300" />
              <span>Lưu bản nháp</span>
            </button>

            <button
              onClick={handleSubmitForRelease}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#216d55] to-[#2e8b62] hover:from-[#1b5b46] hover:to-[#267753] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md transform hover:scale-[1.02]"
              title="Đăng bài lên Diễn đàn ngay"
            >
              <Send className="w-4 h-4" />
              <span>Xuất bản bài viết</span>
            </button>
          </div>

          {/* Reading Permissions Card */}
          <div className="bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-sm p-4">
            <div
              onClick={() => setShowPermissionModal(!showPermissionModal)}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Globe className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span>Quyền xem (Permissions)</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 capitalize">
                <span className="font-medium text-amber-400">
                  {readingPermission === 'public'
                    ? 'Publicly (Công khai)'
                    : readingPermission === 'gold'
                    ? 'Gold VIP'
                    : readingPermission === 'supreme'
                    ? 'Supreme VIP'
                    : 'Mật khẩu'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {showPermissionModal && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                {(['public', 'gold', 'supreme', 'password'] as const).map((perm) => (
                  <button
                    key={perm}
                    onClick={() => {
                      setReadingPermission(perm);
                      setShowPermissionModal(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between capitalize transition-colors ${
                      readingPermission === perm
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{perm === 'public' ? 'Publicly (Công khai)' : perm === 'gold' ? 'Chỉ Hội viên Vàng' : perm === 'supreme' ? 'Chỉ 至尊会员 (Supreme)' : 'Bảo vệ bằng mật khẩu'}</span>
                    {readingPermission === perm && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section Selection Card matching Screenshot 4 with icon */}
          <div className="bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-sm p-4">
            <div
              onClick={() => setShowSectionModal(!showSectionModal)}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Box className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span>Chuyên mục (Section)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
                <span className="text-sm">🏯</span>
                <span className="font-medium text-amber-400">{section}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {showSectionModal && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                {[
                  { id: 'I need a tutorial', label: 'Tôi cần hướng dẫn (I need a tutorial)' },
                  { id: 'I have tutorials', label: 'Tôi có hướng dẫn (I have tutorials)' },
                  { id: 'Inspiration sharing', label: 'Chia sẻ cảm hứng (Inspiration)' },
                  { id: 'Asset sharing', label: 'Chia sẻ tài nguyên (Resource Sharing)' },
                  { id: 'Study', label: 'Góc học tập & trao đổi (Study)' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setSection(sec.id);
                      setShowSectionModal(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      section === sec.id
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{sec.label}</span>
                    {section === sec.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Topic Selection Card */}
          <div className="bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-sm p-4">
            <div
              onClick={() => setShowTopicModal(!showTopicModal)}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Hash className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span>Chủ đề (Topic)</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span className="text-amber-400 font-semibold">{topic}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {showTopicModal && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 text-xs">
                {['#Coloso', '#Blender', '#UnrealEngine5', '#CGMA', '#Underpaint', '#ColorGrading', '#ZBrush', '#Substance3D'].map((top) => (
                  <button
                    key={top}
                    onClick={() => {
                      setTopic(top);
                      setShowTopicModal(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-colors font-mono text-[11px] ${
                      topic === top ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {top}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags Selection Card */}
          <div className="bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-sm p-4">
            <div
              onClick={() => setShowTagInput(!showTagInput)}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Tag className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span>Thẻ phân loại (Tags)</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{tags.length} thẻ</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-500 font-bold text-xs"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            {showTagInput && (
              <form onSubmit={handleAddTag} className="flex gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Thêm thẻ mới (VD: ConceptArt)..."
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                >
                  Thêm
                </button>
              </form>
            )}
          </div>

          {/* Types of Release Segmented Control */}
          <div className="bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Hình thức đăng (Release)</span>
              </div>

              <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setReleaseType('standard')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    releaseType === 'standard'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Tiêu chuẩn (Standard)
                </button>
                <button
                  onClick={() => setReleaseType('ask_questions')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    releaseType === 'ask_questions'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Hỏi đáp (Q&A)
                </button>
              </div>
            </div>
          </div>

          {/* Voting Toggle matching Screenshot 2 & 4 */}
          <div className="bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <span>Bình chọn / Thăm dò (Voting)</span>
              </div>
              <button
                type="button"
                onClick={() => setVotingEnabled(!votingEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  votingEnabled ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    votingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {votingEnabled && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Lựa chọn bình chọn:
                </span>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...pollOptions];
                        copy[i] = e.target.value;
                        setPollOptions(copy);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => handleRemovePollOption(i)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newPollOption}
                    onChange={(e) => setNewPollOption(e.target.value)}
                    placeholder="Thêm lựa chọn khác..."
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    onClick={handleAddPollOption}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          IMAGE MANAGER MODAL - DIRECT REPLICA OF SCREENSHOT 3
         ========================================================================= */}
      {showMediaInputModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#14232c] border border-[#223d4e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
          >
            {/* Modal Header with 2 Tabs matching Screenshot 3: My picture vs External link image */}
            <div className="px-5 pt-4 pb-2 border-b border-[#1f3745] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setImageModalTab('my_picture')}
                  className={`pb-2 text-xs sm:text-sm font-semibold transition-all relative ${
                    imageModalTab === 'my_picture'
                      ? 'text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>My picture (Ảnh trên máy)</span>
                  {imageModalTab === 'my_picture' && (
                    <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setImageModalTab('external_link')}
                  className={`pb-2 text-xs sm:text-sm font-semibold transition-all relative ${
                    imageModalTab === 'external_link'
                      ? 'text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>External link image (Liên kết ngoài)</span>
                  {imageModalTab === 'external_link' && (
                    <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMediaInputModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB 1: MY PICTURE (SCREENSHOT 3) */}
            {imageModalTab === 'my_picture' && (
              <div className="p-5 overflow-y-auto space-y-3.5">
                {/* Search Bar + Help Icon + Upload Button matching Screenshot 3 */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm ảnh (Search)..."
                      className="w-full bg-[#101c24] text-slate-200 text-xs rounded-xl pl-4 pr-9 py-2 border border-[#233a46] focus:border-cyan-400 focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Help icon matching screenshot */}
                  <div
                    className="w-8 h-8 rounded-full bg-[#101c24] text-slate-400 flex items-center justify-center border border-[#233a46] cursor-help shrink-0"
                    title="Hỗ trợ tải ảnh định dạng PNG, JPG, GIF, WebP từ máy tính của bạn"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </div>

                  {/* ☁ Upload Button matching Screenshot 3 */}
                  <button
                    type="button"
                    onClick={() => localFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#173847] to-[#1e4b60] hover:from-[#1b4355] hover:to-[#245b74] text-cyan-200 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-300" />
                    <span>☁ Upload (Tải từ máy)</span>
                  </button>
                </div>

                {/* Drag-and-drop zone right inside modal */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsModalDragging(true);
                  }}
                  onDragLeave={() => setIsModalDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsModalDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processSingleImageFile(file);
                  }}
                  onClick={() => localFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                    isModalDragging
                      ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                      : 'border-[#223946] hover:border-cyan-500/60 bg-[#0e1a22]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold">Kéo & thả ảnh từ máy tính vào đây</span>
                    <span className="text-[10px] text-slate-500">hoặc nhấp để chọn file từ máy</span>
                  </div>
                </div>

                {/* Picture Cards Grid matching Screenshot 3 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {filteredPictures.map((pic) => {
                    const isSelected = coverImage === pic.url;
                    return (
                      <div
                        key={pic.id}
                        className={`group rounded-xl overflow-hidden border transition-all duration-200 relative bg-[#0d171e] hover:shadow-xl flex flex-col ${
                          isSelected
                            ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-[1.02]'
                            : 'border-[#223946] hover:border-cyan-500/60'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div
                          onClick={() => {
                            setCoverImage(pic.url);
                            setShowMediaInputModal(false);
                            sound.playClick();
                          }}
                          className="h-28 w-full bg-slate-900 overflow-hidden relative cursor-pointer"
                        >
                          <img
                            src={pic.url}
                            alt={pic.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {pic.isLocal && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 text-[9px] font-bold border border-emerald-500/40 shadow">
                              Máy tính
                            </span>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-cyan-900/40 flex items-center justify-center">
                              <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow">
                                ✓
                              </span>
                            </div>
                          )}

                          {/* Quick delete button on top right of thumbnail */}
                          <button
                            type="button"
                            onClick={(e) => handleDeletePicture(pic.id, e)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xóa khỏi danh sách"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Title caption & action buttons */}
                        <div className="p-2 border-t border-[#1b2f3b] flex flex-col gap-1.5">
                          <p className="text-[10px] text-slate-300 group-hover:text-cyan-300 font-medium truncate">
                            {pic.title}
                          </p>

                          <div className="grid grid-cols-2 gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCoverImage(pic.url);
                                setShowMediaInputModal(false);
                                sound.playClick();
                              }}
                              className="px-1.5 py-1 rounded bg-[#172f3d] hover:bg-cyan-700 text-cyan-200 text-[9px] font-semibold transition-colors text-center"
                            >
                              Đặt ảnh bìa
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleInsertImageIntoContent(pic.url, pic.title, e)}
                              className="px-1.5 py-1 rounded bg-[#162732] hover:bg-amber-600 text-slate-200 hover:text-white text-[9px] font-semibold transition-colors text-center"
                            >
                              Chèn vào bài
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: EXTERNAL LINK IMAGE */}
            {imageModalTab === 'external_link' && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nhập liên kết ảnh trực tiếp (URL)
                  </label>
                  <input
                    type="url"
                    value={externalUrlInput}
                    onChange={(e) => setExternalUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#101c24] text-slate-200 text-xs rounded-xl px-3.5 py-2.5 border border-[#233a46] focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {externalUrlInput.trim() && (
                  <div className="rounded-xl overflow-hidden border border-slate-700 bg-black h-40">
                    <img
                      src={externalUrlInput}
                      alt="External preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';
                      }}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaInputModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (externalUrlInput.trim()) {
                        setCoverImage(externalUrlInput.trim());
                        setShowMediaInputModal(false);
                        sound.playClick();
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                  >
                    Áp dụng ảnh này
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
