import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { X, Send, MessageSquare, Sparkles, Radio, Users } from 'lucide-react';

interface LiveCommunityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveCommunityDrawer: React.FC<LiveCommunityDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { chatMessages, sendChatMessage } = useRealtime();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const quickPrompts = [
    '🔥 Ai đang gom nhóm [480] không cho mình vào với?',
    'Cho mình hỏi bộ LUT [478] có dùng được trên Premiere không?',
    'Đã test video DaVinci Resolve, hướng dẫn chi tiết lắm!',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-[#0d1921] border-l border-[#233f4f] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 bg-[#12242e] border-b border-[#233b47] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-100">Phòng Đàm Đạo Trực Tuyến</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-400">Trao đổi mua chung & kỹ thuật sáng tạo 24/7</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Online peers banner */}
      <div className="px-4 py-2 bg-[#102029] border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <Users className="w-3.5 h-3.5" />
          <span>128 nhà sáng tạo đang online</span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Đồng bộ đa tab</span>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-1 ${
              msg.isAnnouncement ? 'bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl' : ''
            }`}
          >
            <img
              src={msg.userAvatar}
              alt={msg.userName}
              className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {msg.userName}
                  </span>
                  {msg.userTier && (
                    <span
                      className={`text-[8px] uppercase px-1 rounded font-bold ${
                        msg.userTier === 'supreme'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : msg.userTier === 'gold'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : msg.userTier === 'admin'
                          ? 'bg-red-950 text-red-300 border border-red-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {msg.userTier}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 font-mono shrink-0">
                  {msg.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#142631] p-2.5 rounded-xl rounded-tl-sm border border-[#203746]">
                {msg.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="p-2.5 bg-[#102029] border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInputText(prompt)}
            className="text-[10px] text-slate-300 bg-[#172c38] hover:bg-[#203c4c] px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 border border-slate-700/60 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-[#12232c] border-t border-[#233b47]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Nhắn tin với tên: ${user?.name || 'Khách'}...`}
            className="flex-1 bg-[#0c181f] text-slate-200 text-xs rounded-xl px-3 py-2.5 border border-[#233a46] focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold transition-all shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
