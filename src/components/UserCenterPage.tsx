import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import {
  Bell,
  MoreHorizontal,
  Flame,
  Award,
  BookOpen,
  MessageCircle,
  FileText,
  Users,
  FolderOpen,
  ArrowRight,
  Clock,
  ThumbsUp,
  Share2,
  Sparkles,
} from 'lucide-react';
import { sound } from '../services/sound';

interface UserCenterPageProps {
  onBackToHome: () => void;
  onOpenNotifications: () => void;
  onOpenPublish: () => void;
  unreadCount: number;
}

export const UserCenterPage: React.FC<UserCenterPageProps> = ({
  onBackToHome,
  onOpenNotifications,
  onOpenPublish,
  unreadCount,
}) => {
  const { user } = useAuth();
  const { courses } = useRealtime();

  const [activeTab, setActiveTab] = useState<'collection' | 'commentary' | 'section' | 'post' | 'fans'>('collection');
  const [collectionSubTab, setCollectionSubTab] = useState<'article' | 'post'>('article');
  const [sortOption, setSortOption] = useState<'newest' | 'popular'>('newest');

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <p className="text-base text-slate-600 dark:text-slate-300">
          Please log in to view your User Center.
        </p>
        <button
          onClick={onBackToHome}
          className="mt-4 px-5 py-2 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
      {/* Top Banner Card matching Screenshot 7 & 8 */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#e5dec9] dark:border-[#223946] mb-6">
        {/* Banner Image with Red-Cloaked Warrior and Chinese Calligraphy */}
        <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden bg-slate-900">
          <img
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop"
            alt="Mountains and seas landscape banner"
            className="w-full h-full object-cover opacity-80 filter contrast-110"
          />
          {/* Subtle misty gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/75"></div>

          {/* Left Vertical Poetry Calligraphy matching Screenshot 7 & 8 */}
          <div className="absolute left-8 sm:left-12 top-8 bottom-8 flex flex-col justify-center pointer-events-none text-white select-none">
            <div className="flex gap-4">
              {/* Line 1 */}
              <div
                className="font-chinese text-sm sm:text-base tracking-[0.3em] font-light text-slate-200/90 [writing-mode:vertical-rl]"
              >
                一帧之间，山海为境
              </div>
              {/* Line 2 */}
              <div
                className="font-chinese text-sm sm:text-base tracking-[0.3em] font-light text-slate-200/90 [writing-mode:vertical-rl]"
              >
                聚山海之势，成一帧之美
              </div>
            </div>
          </div>

          {/* Top Right Badges: Red Seal & Heat 77 & More matching Screenshot 7 & 8 */}
          <div className="absolute top-4 right-4 flex items-center gap-2.5">
            {/* Vermilion Stamp Seal */}
            <div className="seal-stamp-square w-7 h-7 text-xs shadow-md">
              元点
            </div>

            {/* Fire Heat Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>{user.heat ?? 77}</span>
            </div>

            {/* More options button */}
            <button
              onClick={() => sound.playClick()}
              className="p-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Watermark Logo bottom right */}
          <div className="absolute bottom-4 right-6 font-chinese text-lg font-bold text-white/40 tracking-widest select-none pointer-events-none">
            一帧山海
          </div>
        </div>

        {/* User Info Bar at bottom of banner matching Screenshot 7 & 8 */}
        <div className="bg-[#ffffff] dark:bg-[#12232c] px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#eee9dc] dark:border-[#1d3542]">
          {/* Avatar and Details */}
          <div className="flex items-center gap-4">
            {/* Big Rounded Avatar with frame */}
            <div className="-mt-14 sm:-mt-16 relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-[#12232c] shadow-xl bg-amber-50">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name, Tier & Bio */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-chinese text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="text-base">💎</span>
                  <span>{user.name}</span>
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  {user.tier === 'supreme' ? 'Supreme Member' : 'Gold Member'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                {user.bio || "This guy is lazy and doesn't write anything..."}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              onClick={() => sound.playClick()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>User Center</span>
            </button>

            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Row matching Screenshot 7 & 8 */}
      <div className="bg-[#ffffff] dark:bg-[#12232c] rounded-2xl border border-[#e5dec9] dark:border-[#223946] shadow-md p-5">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3 gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 text-sm font-semibold">
            {/* Collection 0 */}
            <button
              onClick={() => {
                setActiveTab('collection');
                sound.playClick();
              }}
              className={`relative pb-3 transition-colors ${
                activeTab === 'collection'
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>Collection {user.stats?.collections ?? 0}</span>
              {activeTab === 'collection' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-amber-400 rounded-full"></span>
              )}
            </button>

            {/* Commentary 2 */}
            <button
              onClick={() => {
                setActiveTab('commentary');
                sound.playClick();
              }}
              className={`relative pb-3 transition-colors ${
                activeTab === 'commentary'
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>Commentary {user.stats?.comments ?? 2}</span>
              {activeTab === 'commentary' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-amber-400 rounded-full"></span>
              )}
            </button>

            {/* Section 0 */}
            <button
              onClick={() => {
                setActiveTab('section');
                sound.playClick();
              }}
              className={`relative pb-3 transition-colors ${
                activeTab === 'section'
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>Section 0</span>
              {activeTab === 'section' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-amber-400 rounded-full"></span>
              )}
            </button>

            {/* Post 7 */}
            <button
              onClick={() => {
                setActiveTab('post');
                sound.playClick();
              }}
              className={`relative pb-3 transition-colors ${
                activeTab === 'post'
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>Post 7</span>
              {activeTab === 'post' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-amber-400 rounded-full"></span>
              )}
            </button>

            {/* Fans 0 */}
            <button
              onClick={() => {
                setActiveTab('fans');
                sound.playClick();
              }}
              className={`relative pb-3 transition-colors ${
                activeTab === 'fans'
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>Fans {user.stats?.fans ?? 0}</span>
              {activeTab === 'fans' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-amber-400 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Sub-bar for Collection */}
        {activeTab === 'collection' && (
          <div className="flex items-center justify-between pt-4 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCollectionSubTab('article')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  collectionSubTab === 'article'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Article 0
              </button>
              <button
                onClick={() => setCollectionSubTab('post')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  collectionSubTab === 'post'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Post 0
              </button>
            </div>

            {/* Sorting Filter matching Screenshot 7 */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="cursor-pointer hover:text-slate-800 dark:hover:text-slate-200">
                Sorting ▾
              </span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'collection' && (
            /* Empty State matching Screenshot 7 & 8 */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-48 h-36 relative mb-4 flex items-center justify-center">
                {/* Clean SVG Illustration of workstation desk matching screenshot */}
                <svg
                  viewBox="0 0 200 150"
                  className="w-full h-full text-slate-300 dark:text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {/* Monitor & Desk */}
                  <rect x="40" y="30" width="120" height="75" rx="6" className="fill-slate-50 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-600" />
                  <rect x="48" y="38" width="104" height="59" rx="3" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700" />
                  <path d="M100 105 L100 125 M80 125 L120 125" strokeLinecap="round" />
                  {/* Decorative atoms & person silhouette */}
                  <circle cx="150" cy="40" r="12" className="stroke-indigo-400/60" strokeDasharray="3 3" />
                  <circle cx="150" cy="40" r="4" className="fill-indigo-400" />
                  <circle cx="35" cy="80" r="8" className="stroke-amber-400/60" strokeDasharray="2 2" />
                  <path d="M60 55 L90 55 M60 65 L80 65 M60 75 L110 75" stroke="#94a3b8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No collection content yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Explore courses and click the bookmark icon to save your favorites here.
              </p>
              <button
                onClick={onBackToHome}
                className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
              >
                Browse course catalog
              </button>
            </div>
          )}

          {activeTab === 'commentary' && (
            <div className="space-y-4 max-w-3xl">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    [480] Meizhou Mazu Spring Festival | Documentary Photography
                  </span>
                  <span>15 minutes ago</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  "Khóa học này về lễ tế Mi Châu Mạ Tổ thực sự rất đỉnh! Phần phân tích dải sáng ánh đèn dầu và khói nhang trong chùa cổ giúp mình giải quyết được lỗi bết màu khi quay đêm."
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    [478] Quanzhou Lantern Festival Parade | Tracking shots
                  </span>
                  <span>1 hour ago</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  "Cú máy lướt qua đám rước đèn lồng hoa Tuyền Châu quả là đỉnh cao điều khiển Steadicam. Tiết tấu nhịp điệu rất hòa hợp với nhạc cụ dân gian."
                </p>
              </div>
            </div>
          )}

          {activeTab === 'post' && (
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-500">Your published discussions and resources</span>
                <button
                  onClick={onOpenPublish}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  + Create new post
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[10px]">
                    #Inspiration
                  </span>
                  <span>Updated 2 hours ago</span>
                  <span>• 154 reads</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  [Chia sẻ] Trải nghiệm dùng máy quay Sony A7S3 quay lễ rước kiệu đêm: Đánh giá độ nhạy sáng ISO
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  Tại dải ISO 12800 cơ chế Dual Native ISO phát huy tác dụng cực tốt khi bắt trọn ánh lửa đuốc mà không cần thêm đèn trợ sáng phụ...
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 font-semibold text-[10px]">
                    #Asset Sharing
                  </span>
                  <span>Updated yesterday</span>
                  <span>• 320 reads</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tổng hợp bộ LUTs phong cách điện ảnh Đông Phương DaVinci Resolve cho cảnh quay đêm đèn lồng
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  Bộ LUTs giả lập tông màu phim 35mm ấm áp của Kodak Vision3, giữ lại chi tiết vùng tối khi quay trong chùa cổ hoặc ngõ phố đêm...
                </p>
              </div>
            </div>
          )}

          {activeTab === 'section' && (
            <div className="text-center py-10 text-slate-500 text-xs">
              No sections created yet. You can create a section from the floating action menu.
            </div>
          )}

          {activeTab === 'fans' && (
            <div className="text-center py-10 text-slate-500 text-xs">
              0 followers so far. Publish interesting articles to gain readers and followers!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
