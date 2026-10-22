import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Video,
  Heart,
  X,
  Search,
  ChevronDown,
  Download,
  Key,
  ShieldAlert,
  Send,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react';
import { sound } from '../services/sound';
import { notificationService } from '../services/notificationService';

export type FaqModalTab = 'faq' | 'request' | 'guide' | 'sponsor';

interface FaqGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: FaqModalTab;
  onOpenVip: () => void;
}

export const FaqGuideModal: React.FC<FaqGuideModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'faq',
  onOpenVip,
}) => {
  const [activeTab, setActiveTab] = useState<FaqModalTab>(initialTab);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Course Request form state
  const [courseName, setCourseName] = useState('');
  const [platform, setPlatform] = useState('Coloso');
  const [instructor, setInstructor] = useState('');
  const [requestLink, setRequestLink] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const faqs = [
    {
      q: '网站课程资源是如何发货与下载的？',
      a: '所有团购和已购课程资源均存储于百度网盘、夸克网盘、123云盘与海外 Google Drive 高速线路中。在课程详情页兑换/购买后，下载链接与提取码将立即在页面解锁，同时同步至个人中心【我的订单】。',
    },
    {
      q: '下载后的压缩包解压密码是什么？',
      a: '全站通用解压密码为：yizhenshanhai 或 shanhai.studio（小写无空格）。部分特殊讲师分卷如有专属密码，会在下载链接旁标明。',
    },
    {
      q: '解压提示“文件已损坏”或“分卷缺失”怎么办？',
      a: '大体积 CG 高清课程均使用分卷压缩（如 .part1.rar, .part2.rar）。请确保下载完全部分卷文件并保存在同一文件夹下。推荐使用最新版 WinRAR 6.x 或 7-Zip 进行解压。若仍报错，请使用 WinRAR 自带的“工具 - 修复压缩文件”功能。',
    },
    {
      q: '至尊会员 (Supreme VIP) 有哪些专属权益？',
      a: '至尊会员享受全站所有课程 0 积分免费下载无限次、新发布大师课首发体验、高速网盘备用链接、专属私密求课加速通道以及 24 小时社群技术答疑服务。',
    },
    {
      q: '如何联系客服或处理账号充值问题？',
      a: '如遇支付延迟未到账或资源链接失效，可点击右下角微信图标扫描客服二维码，或在论坛【站务反馈】板块发帖，管理员将在 15 分钟内为您补单或更新补档。',
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    sound.playSuccess();
    setIsSubmitted(true);
    notificationService.sendPushNotification({
      type: 'system',
      title: '🎯 求课需求已提交成功',
      message: `已收到您关于《${courseName}》的求课心愿，我们将在 24 小时内寻源并更新进度！`,
      timestamp: '刚刚',
    });

    setTimeout(() => {
      setIsSubmitted(false);
      setCourseName('');
      setInstructor('');
      setRequestLink('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#0f1d24] border border-[#223d4e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#142631] border-b border-[#203947] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-chinese text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>一帧山海 · 帮助与支持中心</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                FAQ, tutorials, course requests, and community support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation matching Screenshot 3 & 13 */}
        <div className="flex items-center border-b border-[#1f3745] bg-[#0c181f] px-6 gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>常见问题 (FAQ)</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'request'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>求教程专区</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>网站解压与播放指南</span>
          </button>

          <button
            onClick={() => setActiveTab('sponsor')}
            className={`py-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sponsor'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <span>赞助与支持</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200 text-xs sm:text-sm">
          {/* TAB 1: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="搜索问题，如：解压密码、网盘下载、分卷损坏..."
                  className="w-full bg-[#13242e] border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="border border-[#1e3847] rounded-xl overflow-hidden bg-[#12222b] transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full px-4 py-3 text-left font-medium text-slate-100 flex items-center justify-between hover:text-amber-300 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>{faq.q}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedFaq === idx ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === idx && (
                      <div className="px-4 pb-4 pt-1 text-slate-300 border-t border-[#1a313e] bg-[#0f1d24]/80 text-xs leading-relaxed animate-in fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: COURSE REQUEST */}
          {activeTab === 'request' && (
            <div>
              <div className="bg-[#142833] border border-amber-500/20 rounded-xl p-4 mb-5">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>提交您心仪的 CG 课程，我们来众筹寻源！</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  支持 Coloso, Wingfox, CGMA, Gumroad, ArtStation 等海外大师课。收到需求后，我们将第一时间发起众筹采购。
                </p>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-950/80 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">需求提交成功！</h4>
                  <p className="text-xs text-slate-400">
                    我们已记录您的求课意向，后续将在论坛和公告中通知进度。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      课程名称 *
                    </label>
                    <input
                      type="text"
                      required
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="如：Coloso - 顶级动漫角色概念插画工作流"
                      className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        所属机构 / 平台
                      </label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Coloso">Coloso (韩国大师课)</option>
                        <option value="Wingfox">Wingfox (翼狐)</option>
                        <option value="CGMA">CGMA</option>
                        <option value="Underpaint">Underpaint Academy</option>
                        <option value="Gumroad">Gumroad 独立画师</option>
                        <option value="Domestika">Domestika</option>
                        <option value="FastCampus">FastCampus</option>
                        <option value="Other">其他机构</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        讲师名字 (可选)
                      </label>
                      <input
                        type="text"
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        placeholder="如：Mogun, Fuwari, Kim Jung Gi"
                        className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      官方原链接 (可选)
                    </label>
                    <input
                      type="url"
                      value={requestLink}
                      onChange={(e) => setRequestLink(e.target.value)}
                      placeholder="https://coloso.global/..."
                      className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>立即提交心愿</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: GUIDE & DECOMPRESSION */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#12242e] p-4 rounded-xl border border-slate-700/60">
                  <div className="w-8 h-8 rounded-lg bg-cyan-900/40 text-cyan-400 flex items-center justify-center mb-2 font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">完整下载分卷</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    如课程包含 part1 ~ part5，必须全部下载完成并放在同一文件夹中，不能缺漏或重命名。
                  </p>
                </div>

                <div className="bg-[#12242e] p-4 rounded-xl border border-slate-700/60">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/40 text-amber-400 flex items-center justify-center mb-2 font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">解压软件推荐</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Windows 推荐 WinRAR 6.2+ 或 7-Zip；Mac 推荐使用 Keka 或 The Unarchiver。系统自带解压可能报错。
                  </p>
                </div>

                <div className="bg-[#12242e] p-4 rounded-xl border border-slate-700/60">
                  <div className="w-8 h-8 rounded-lg bg-purple-900/40 text-purple-400 flex items-center justify-center mb-2 font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">视频播放器</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    推荐使用 PotPlayer 或 VLC Media Player，完美支持 4K 10-bit HDR、多轨韩语/英语及中文字幕外挂。
                  </p>
                </div>
              </div>

              <div className="bg-[#10222c] p-4 rounded-xl border border-cyan-500/20 flex items-start gap-3">
                <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-100 text-xs">默认全站解压密码：</div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="px-2.5 py-1 bg-black/50 text-amber-300 font-mono text-sm rounded border border-amber-500/30 select-all">
                      yizhenshanhai
                    </code>
                    <span className="text-[11px] text-slate-400">或</span>
                    <code className="px-2.5 py-1 bg-black/50 text-amber-300 font-mono text-sm rounded border border-amber-500/30 select-all">
                      shanhai.studio
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SPONSOR */}
          {activeTab === 'sponsor' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg">
                <Heart className="w-8 h-8 fill-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-chinese">
                  感谢每一位与山海同行的创作者
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  您的每一次赞助与开通会员，都直接用于海外课程众筹采购、高速服务器与网盘存储维护。
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenVip();
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-lg transition-transform hover:scale-105"
                >
                  开通至尊 VIP 会员
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
