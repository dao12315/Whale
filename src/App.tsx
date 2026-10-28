import React, { useState, useMemo, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { Course, Language, ForumPost } from './types';
import { notificationService } from './services/notificationService';

// Components
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CourseCard } from './components/CourseCard';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AuthModal } from './components/AuthModal';
import { VipModal } from './components/VipModal';
import { LiveCommunityDrawer } from './components/LiveCommunityDrawer';
import { ReleaseModal } from './components/ReleaseModal';
import { CreatePostModal } from './components/CreatePostModal';
import { ForumHomepage } from './components/ForumHomepage';
import { FloatingSidebar } from './components/FloatingSidebar';
import { Pagination } from './components/Pagination';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { UserCenterPage } from './components/UserCenterPage';
import { PostEditorPage } from './components/PostEditorPage';
import { ThemeProvider } from './context/ThemeContext';
import { CourseDetailPage } from './components/CourseDetailPage';
import { QuickServicesBanner } from './components/QuickServicesBanner';
import { FaqGuideModal, FaqModalTab } from './components/FaqGuideModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { ErrorMessage } from './components/common/ErrorMessage';
import { EmptyState } from './components/common/EmptyState';
import { DirectCheckoutModal } from './components/DirectCheckoutModal';
import { coursesApi } from './services/coursesApi';
import { ordersApi } from './services/ordersApi';
import { I18nProvider, useI18n } from './i18n';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, purchaseCourse } = useAuth();
  const { courses } = useRealtime();
  const { currentLang, setLanguage, t } = useI18n();

  // Search & Navigation state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'paid' | 'free'>('paid');
  const [activeNavTab, setActiveNavTab] = useState<'group_buy' | 'forum' | 'faq' | 'user_center' | 'post_editor' | 'course_detail' | 'admin'>('group_buy');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<'overview' | 'comments' | 'groupbuy'>('overview');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isVipOpen, setIsVipOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqModalTab, setFaqModalTab] = useState<FaqModalTab>('faq');
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Phase 6: Loading & Error states for API data
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [apiCourses, setApiCourses] = useState<Course[]>(courses);

  const fetchCoursesFromBackend = async () => {
    setIsLoadingCourses(true);
    setCoursesError(null);
    try {
      const res = await coursesApi.getCourses({ limit: 100 });
      if (res?.data && res.data.length > 0) {
        setApiCourses(res.data);
      } else {
        setApiCourses(courses);
      }
    } catch (err: any) {
      console.log('[Phase 6 Frontend] Dùng fallback data khóa học (Backend dev/offline mode):', err?.message);
      setApiCourses(courses);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCoursesFromBackend();
  }, []);

  const handleDirectPurchase = async (course: Course) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }

    // TRƯỜNG HỢP 1: KHÓA HỌC MIỄN PHÍ -> Tự động kích hoạt ngay không mất phí
    if (course.originalPrice === 0 || course.isFree) {
      try {
        await ordersApi.checkout({
          itemType: 'COURSE',
          itemId: course.id,
          paymentMethod: 'FREE' as any,
        });
      } catch (e: any) {
        console.log('[Free Course] Direct enroll:', e.message);
      }

      purchaseCourse(course.id, 0, course.title);
      refreshUnread();
      return;
    }

    // TRƯỜNG HỢP 2: KHÓA HỌC TRẢ PHÍ -> Mở Modal Thanh Toán Trực Tiếp (Tiền mặt VND qua VNPay / VietQR)
    setCheckoutCourse(course);
    setIsCheckoutOpen(true);
  };

  // Unread notifications count
  const [unreadCount, setUnreadCount] = useState(() => {
    return notificationService.getStoredNotifications().filter((n) => !n.read).length;
  });

  const refreshUnread = () => {
    setUnreadCount(notificationService.getStoredNotifications().filter((n) => !n.read).length);
  };

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getStoredNotifications().filter((n) => !n.read).length);
    });
    return unsubscribe;
  }, []);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    let result = [...apiCourses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.titleZh.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tab filter: Khóa trả phí (Donate) vs Khóa miễn phí (kèm bài học xem trước)
    if (currentTab === 'paid') {
      result = result.filter((c) => (c.originalPrice > 0 || Number(c.priceVnd) > 0) && !c.isFree);
    } else if (currentTab === 'free') {
      result = result.filter((c) => c.originalPrice === 0 || c.isFree || c.chapters?.some((ch) => ch.isFreePreview));
    }

    return result;
  }, [apiCourses, searchQuery, currentTab]);

  const paidCount = useMemo(
    () => apiCourses.filter((c) => (c.originalPrice > 0 || Number(c.priceVnd) > 0) && !c.isFree).length,
    [apiCourses]
  );
  const freeCount = useMemo(
    () => apiCourses.filter((c) => c.originalPrice === 0 || c.isFree || c.chapters?.some((ch) => ch.isFreePreview)).length,
    [apiCourses]
  );

  const handleOpenCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setInitialModalTab('overview');
    setActiveNavTab('course_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCourseComments = (course: Course) => {
    setSelectedCourse(course);
    setInitialModalTab('comments');
    setActiveNavTab('course_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCourseById = (courseId: string) => {
    const found = courses.find((c) => c.id === courseId);
    if (found) {
      setSelectedCourse(found);
      setInitialModalTab('comments');
      setActiveNavTab('course_detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f2eb] dark:bg-[#0b161b] text-slate-800 dark:text-slate-200 selection:bg-amber-500/30 selection:text-amber-200 transition-colors">
      {/* Real-time Toast Notifications */}
      <ToastContainer
        onOpenCourse={handleOpenCourseById}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Header matching screenshot with Group Buying vs Forum tabs */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenVip={() => setIsVipOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenReleaseModal={() => setIsReleaseOpen(true)}
        onOpenCreatePostModal={() => setIsCreatePostOpen(true)}
        onOpenUserCenter={() => setActiveNavTab('user_center')}
        onOpenPublish={() => setActiveNavTab('post_editor')}
        unreadCount={unreadCount}
        currentLang={currentLang}
        onLanguageChange={setLanguage}
        activeNavTab={activeNavTab}
        setActiveNavTab={(tab) => {
          if (tab === 'faq') {
            setFaqModalTab('faq');
            setIsFaqModalOpen(true);
          } else {
            setActiveNavTab(tab as any);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeNavTab === 'admin' ? (
          /* Admin Management Portal (Phase 5) */
          <AdminLayout onBackToHome={() => setActiveNavTab('group_buy')} />
        ) : activeNavTab === 'user_center' ? (
          /* User Center / Profile Screen directly matching Screenshot 7 & 8 */
          <UserCenterPage
            onBackToHome={() => setActiveNavTab('group_buy')}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenPublish={() => setActiveNavTab('post_editor')}
            unreadCount={unreadCount}
          />
        ) : activeNavTab === 'post_editor' ? (
          /* Full Post / Article Editor matching Screenshot 9 & 13 */
          <PostEditorPage
            onBack={() => setActiveNavTab('forum')}
            onPostCreated={() => {
              setActiveNavTab('forum');
            }}
          />
        ) : activeNavTab === 'course_detail' && selectedCourse ? (
          /* Course Detail Page matching the 3 screenshots provided by user */
          <CourseDetailPage
            course={selectedCourse}
            onBack={() => setActiveNavTab('group_buy')}
            onBuyNow={handleDirectPurchase}
            currentLang={currentLang}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenVip={() => setIsVipOpen(true)}
            onOpenPostEditor={() => setActiveNavTab('post_editor')}
            onOpenUserCenter={() => setActiveNavTab('user_center')}
          />
        ) : activeNavTab === 'forum' ? (
          /* Forum Homepage Screen matching user's uploaded Screenshot 4 */
          <ForumHomepage
            currentLang={currentLang}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenNewPostModal={() => setIsCreatePostOpen(true)}
            onOpenPostEditor={() => setActiveNavTab('post_editor')}
          />
        ) : (
          /* Group Buying Courses Screen directly matching Screenshots 1 & 2 */
          <>
            {/* Hero Section matching screenshot typography */}
            <HeroSection
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              currentLang={currentLang}
              paidCount={paidCount}
              freeCount={freeCount}
              onOpenCatalog={() => {
                setSearchQuery('');
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
            />

            {/* 4-Column Course Cards Grid directly matching Screenshots 1 & 2 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
              {isLoadingCourses ? (
                <div className="py-6 space-y-4">
                  <div className="text-center">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                      {t('hero.syncing_courses')}
                    </span>
                  </div>
                  <LoadingSkeleton type="grid" count={8} />
                </div>
              ) : coursesError ? (
                <ErrorMessage
                  title={t('common.error')}
                  message={coursesError}
                  onRetry={fetchCoursesFromBackend}
                />
              ) : filteredCourses.length === 0 ? (
                <EmptyState
                  title={t('hero.empty_title', { query: searchQuery })}
                  description={t('hero.empty_desc')}
                  actionText={t('hero.empty_action')}
                  onAction={() => setSearchQuery('')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onOpenDetails={handleOpenCourseDetails}
                      onOpenComments={handleOpenCourseComments}
                    />
                  ))}
                </div>
              )}

              {/* Pagination matching Screenshot 2 */}
              <Pagination
                currentPage={currentPage}
                totalPages={20}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 250, behavior: 'smooth' });
                }}
              />

              {/* 4 Feature Service Cards matching Screenshot 3 */}
              <QuickServicesBanner
                onOpenService={(tab) => {
                  setFaqModalTab(tab);
                  setIsFaqModalOpen(true);
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* Floating Action Bar on the right */}
      <FloatingSidebar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenVip={() => setIsVipOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenPublishArticle={() => setActiveNavTab('post_editor')}
        onOpenCreateTopic={() => setActiveNavTab('post_editor')}
        onOpenCreateSection={() => setActiveNavTab('post_editor')}
        onOpenPost={() => setActiveNavTab('post_editor')}
        unreadCount={unreadCount}
        currentLang={currentLang}
      />

      {/* Footer matching Screenshot 3 */}
      <Footer currentLang={currentLang} />

      {/* Modals & Drawers */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          refreshUnread();
        }}
        onOpenCourse={handleOpenCourseById}
        onRefreshUnread={refreshUnread}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <VipModal
        isOpen={isVipOpen}
        onClose={() => setIsVipOpen(false)}
      />

      <LiveCommunityDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Release & Activity Modal matching Screenshot 14 */}
      <ReleaseModal
        isOpen={isReleaseOpen}
        onClose={() => setIsReleaseOpen(false)}
      />

      {/* Create Post Modal requiring Authentication */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onRequireLogin={() => setIsAuthOpen(true)}
        onOpenPostEditor={() => {
          setIsCreatePostOpen(false);
          setActiveNavTab('post_editor');
        }}
        onPostCreated={(newPost) => {
          setActiveNavTab('forum');
        }}
      />

      {/* FAQ, Course Request, Tutorials and Sponsor Modal */}
      <FaqGuideModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        initialTab={faqModalTab}
        onOpenVip={() => setIsVipOpen(true)}
      />

      {/* Direct Cash Checkout Modal (VNPay & VietQR) */}
      <DirectCheckoutModal
        isOpen={isCheckoutOpen}
        course={checkoutCourse}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(courseId) => {
          refreshUnread();
        }}
      />
    </div>
  );
};

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '1088746249488-8qqu37n670g7v3a7p0f0bkk2l4g2ck2o.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
            <I18nProvider>
              <MainAppContent />
            </I18nProvider>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
