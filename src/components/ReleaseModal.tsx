import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { sound } from '../services/sound';
import { X, Upload, Plus, Film, Tag, Sparkles } from 'lucide-react';

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated?: () => void;
}

export const ReleaseModal: React.FC<ReleaseModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [category, setCategory] = useState('coloso');
  const [price, setPrice] = useState('50');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'group_buy',
      title: '🚀 Bạn đã mở đợt Mua chung mới thành công!',
      message: `Khóa học "${title}" đã được đăng tải và mở cổng đăng ký mua chung cho toàn bộ hội viên.`,
      timestamp: 'Vừa xong',
    });

    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0e1c24] border border-[#233f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-default"
      >
        <div className="px-5 py-4 bg-[#142630] border-b border-[#233b47] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40">
              <Film className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Đăng Tải Khóa Học / Mua Chung</h3>
              <p className="text-[10px] text-slate-400">Release Creator Resource & Group Buying</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Tiêu đề khóa học (Tiếng Việt / Quốc tế)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: [481] Hoàng Sơn Mây Trắng | Nhiếp ảnh phong cảnh & Hậu kỳ DaVinci"
              className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Phụ đề / Tiêu đề phụ (Hiển thị thẻ bìa)
            </label>
            <input
              type="text"
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              placeholder="VD: Unreal Engine 5 Cinematic Lighting & Rendering Masterclass"
              className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Đơn vị / Nền tảng
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none"
              >
                <option value="coloso">coloso</option>
                <option value="wingfox">wingfox</option>
                <option value="ggc_exclusive">GGC Studio Độc quyền</option>
                <option value="artstation">artstation learning</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Giá gốc (Credits)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-[#233b47] focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Mô tả chi tiết & Bộ tài nguyên đi kèm
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Bao gồm project file DaVinci, video 4K 60fps, bộ 12 LUTs điện ảnh phương Đông..."
              className="w-full bg-[#12222b] text-slate-200 text-xs rounded-xl p-3 border border-[#233b47] focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
            >
              Phát Hành & Khởi Tạo Đợt Mua Chung
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
