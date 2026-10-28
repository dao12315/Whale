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
import { useI18n } from '../i18n';

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
  const { t } = useI18n();
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
      q: t('faq.faq_q1'),
      a: t('faq.faq_a1'),
    },
    {
      q: t('faq.faq_q2'),
      a: t('faq.faq_a2'),
    },
    {
      q: t('faq.faq_q3'),
      a: t('faq.faq_a3'),
    },
    {
      q: t('faq.faq_q4'),
      a: t('faq.faq_a4'),
    },
    {
      q: t('faq.faq_q5'),
      a: t('faq.faq_a5'),
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
      title: '🎯 ' + t('faq.request_success_title'),
      message: `${t('faq.request_success_desc')} (${courseName})`,
      timestamp: 'Vừa xong',
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
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t('faq.modal_title')}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('faq.modal_subtitle')}
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
            <span>{t('faq.tab_faq')}</span>
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
            <span>{t('faq.tab_request')}</span>
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
            <span>{t('faq.tab_guide')}</span>
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
            <span>{t('faq.tab_sponsor')}</span>
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
                  placeholder={t('faq.search_placeholder')}
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
                  <span>{t('faq.request_banner_title')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t('faq.request_banner_subtitle')}
                </p>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-950/80 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">{t('faq.request_success_title')}</h4>
                  <p className="text-xs text-slate-400">
                    {t('faq.request_success_desc')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('faq.course_name_label')}
                    </label>
                    <input
                      type="text"
                      required
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder={t('faq.course_name_placeholder')}
                      className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {t('faq.platform_label')}
                      </label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Coloso">{t('faq.platform_coloso')}</option>
                        <option value="Wingfox">{t('faq.platform_wingfox')}</option>
                        <option value="CGMA">{t('faq.platform_cgma')}</option>
                        <option value="Underpaint">{t('faq.platform_underpaint')}</option>
                        <option value="Gumroad">{t('faq.platform_gumroad')}</option>
                        <option value="Domestika">{t('faq.platform_domestika')}</option>
                        <option value="FastCampus">{t('faq.platform_fastcampus')}</option>
                        <option value="Other">{t('faq.platform_other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {t('faq.instructor_label')}
                      </label>
                      <input
                        type="text"
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        placeholder={t('faq.instructor_placeholder')}
                        className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('faq.url_label')}
                    </label>
                    <input
                      type="url"
                      value={requestLink}
                      onChange={(e) => setRequestLink(e.target.value)}
                      placeholder={t('faq.url_placeholder')}
                      className="w-full bg-[#13242e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('faq.submit_request_btn')}</span>
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
                  <h4 className="font-bold text-slate-100 text-sm">{t('faq.step1_title')}</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {t('faq.step1_desc')}
                  </p>
                </div>

                <div className="bg-[#12242e] p-4 rounded-xl border border-slate-700/60">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/40 text-amber-400 flex items-center justify-center mb-2 font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">{t('faq.step2_title')}</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {t('faq.step2_desc')}
                  </p>
                </div>

                <div className="bg-[#12242e] p-4 rounded-xl border border-slate-700/60">
                  <div className="w-8 h-8 rounded-lg bg-purple-900/40 text-purple-400 flex items-center justify-center mb-2 font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">{t('faq.step3_title')}</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {t('faq.step3_desc')}
                  </p>
                </div>
              </div>

              <div className="bg-[#10222c] p-4 rounded-xl border border-cyan-500/20 flex items-start gap-3">
                <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-100 text-xs">{t('faq.default_pwd_label')}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="px-2.5 py-1 bg-black/50 text-amber-300 font-mono text-sm rounded border border-amber-500/30 select-all">
                      ggcstudio
                    </code>
                    <span className="text-[11px] text-slate-400">{t('faq.or_text')}</span>
                    <code className="px-2.5 py-1 bg-black/50 text-amber-300 font-mono text-sm rounded border border-amber-500/30 select-all">
                      ggc.studio
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
                <h3 className="text-lg font-bold text-white">
                  {t('faq.sponsor_title')}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  {t('faq.sponsor_desc')}
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
                  {t('faq.upgrade_vip_btn')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
