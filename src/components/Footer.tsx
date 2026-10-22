import React from 'react';
import { Mail, MessageCircle, Send, QrCode } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  currentLang: Language;
}

export const Footer: React.FC<FooterProps> = ({ currentLang }) => {
  return (
    <footer className="relative mt-20 bg-stone-100 dark:bg-[#081216] border-t border-stone-200 dark:border-[#182c36] text-stone-600 dark:text-slate-400 overflow-hidden transition-colors">
      {/* Background ink mountain silhouette texture */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-400 via-transparent to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Brand description */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-400/50 flex items-center justify-center shadow-md">
                <span className="font-sans font-black text-xs text-slate-950">GGC</span>
              </div>
              <span className="font-cinzel text-lg font-bold text-stone-900 dark:text-slate-100">GGC STUDIO</span>
            </div>

            <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed max-w-sm">
              {currentLang === 'vi'
                ? 'GGC Studio là nền tảng chia sẻ khóa học và tài nguyên sinh ra vì cộng đồng nghệ sĩ CG, nhà làm phim và họa sĩ đồ họa. Thông qua cơ chế khóa miễn phí và khóa trả phí (donate), chúng tôi giúp mọi người tiếp cận tư liệu quốc tế chất lượng cao dễ dàng và tiết kiệm nhất.'
                : 'GGC Studio is a premier creative resource and masterclass sharing platform born for digital artists, 3D modelers, and filmmakers. We bring world-class tutorials, assets, and knowledge within reach for everyone.'}
            </p>
          </div>

          {/* Center Column: Links, Copyright, Social icons */}
          <div className="lg:col-span-5 space-y-4">
            {/* Friendly links */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-700 dark:text-slate-300">
              <a href="#links" className="hover:text-amber-300 transition-colors">
                Friend link application
              </a>
              <span>•</span>
              <a href="#disclaimer" className="hover:text-amber-300 transition-colors">
                Disclaimer
              </a>
              <span>•</span>
              <a href="#ads" className="hover:text-amber-300 transition-colors">
                Advertising cooperation
              </a>
              <span>•</span>
              <a href="#about" className="hover:text-amber-300 transition-colors">
                About us
              </a>
            </div>

            {/* Copyright */}
            <p className="text-[11px] text-slate-500 leading-normal">
              Copyright &copy; 2026 &middot; GGC Studio &middot; All Rights Reserved. Creative Masterclasses & Digital Assets.
            </p>

            {/* Social Icons row */}
            <div className="flex items-center gap-2.5 pt-2">
              {/* WeChat */}
              <div
                className="w-8 h-8 rounded-full bg-[#142631] hover:bg-[#1f3c4c] text-slate-300 hover:text-emerald-400 flex items-center justify-center cursor-pointer transition-colors"
                title="WeChat Community"
              >
                <MessageCircle className="w-4 h-4" />
              </div>

              {/* Email */}
              <a
                href="mailto:contact@shanhai.studio"
                className="w-8 h-8 rounded-full bg-[#142631] hover:bg-[#1f3c4c] text-slate-300 hover:text-amber-400 flex items-center justify-center cursor-pointer transition-colors"
                title="Email Support"
              >
                <Mail className="w-4 h-4" />
              </a>

              {/* QQ */}
              <div
                className="w-8 h-8 rounded-full bg-[#142631] hover:bg-[#1f3c4c] text-slate-300 hover:text-cyan-400 flex items-center justify-center cursor-pointer transition-colors font-bold text-xs"
                title="QQ Group"
              >
                QQ
              </div>

              {/* Bilibili */}
              <div
                className="w-8 h-8 rounded-full bg-[#142631] hover:bg-[#1f3c4c] text-slate-300 hover:text-pink-400 flex items-center justify-center cursor-pointer transition-colors font-bold text-xs"
                title="Bilibili Channel"
              >
                bili
              </div>
            </div>
          </div>

          {/* Right Column: QR Codes from Screenshot 3 */}
          <div className="lg:col-span-3 flex items-center sm:justify-end gap-4">
            {/* QQ Group QR card */}
            <div className="flex flex-col items-center p-2.5 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 w-32">
              {/* Simulated QR code graphic with blue branding */}
              <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center relative p-1">
                {/* SVG QR Code Pattern */}
                <svg className="w-full h-full text-cyan-600" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corners */}
                  <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="12" y="12" width="14" height="14" />
                  <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="74" y="12" width="14" height="14" />
                  <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="12" y="74" width="14" height="14" />
                  {/* Decorative dot matrix */}
                  <circle cx="45" cy="20" r="3" />
                  <circle cx="55" cy="15" r="3" />
                  <circle cx="48" cy="30" r="3" />
                  <circle cx="20" cy="48" r="3" />
                  <circle cx="50" cy="50" r="4" fill="#0284c7" />
                  <circle cx="80" cy="50" r="3" />
                  <circle cx="45" cy="75" r="3" />
                  <circle cx="70" cy="70" r="3" />
                  <circle cx="85" cy="85" r="3" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black bg-white px-1 rounded shadow text-cyan-700">QQ</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-600 mt-2 text-center leading-tight">
                Scan the QR code to join the QQ group
              </span>
            </div>

            {/* WeChat QR card */}
            <div className="flex flex-col items-center p-2.5 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 w-32">
              <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded flex items-center justify-center relative p-1">
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="12" y="12" width="14" height="14" />
                  <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="74" y="12" width="14" height="14" />
                  <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="12" y="74" width="14" height="14" />
                  <circle cx="45" cy="20" r="3" />
                  <circle cx="55" cy="35" r="3" />
                  <circle cx="40" cy="50" r="3" />
                  <circle cx="60" cy="50" r="3" />
                  <circle cx="80" cy="75" r="3" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black bg-white px-1 rounded shadow text-emerald-700">微信</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-600 mt-2 text-center leading-tight">
                Scan the code to add WeChat
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
