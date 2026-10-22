import React, { useState, useMemo, useEffect } from 'react';
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

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, purchaseCourse } = useAuth();
  const { courses, triggerSimulatedPeerActivity, isSimulatingActive, setIsSimulatingActive } = useRealtime();

  // Search & Navigation state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'paid' | 'free'>('paid');
  const [activeNavTab, setActiveNavTab] = useState<'group_buy' | 'forum' | 'faq' | 'user_center' | 'post_editor' | 'course_detail'>('group_buy');
  const [currentLang, setCurrentLang] = useState<Language>('vi');
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

  const handleDirectPurchase = (course: Course) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    const cost =
      user?.tier === 'supreme'
        ? course.supremePrice
        : user?.tier === 'gold'
        ? course.goldPrice
        : course.originalPrice;

    purchaseCourse(course.id, cost, course.title);
    refreshUnread();
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
    let result = [...courses];

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

    // Tab filter: Khóa trả phí (Donate) vs Khóa miễn phí
    if (currentTab === 'paid') {
      result = result.filter((c) => c.originalPrice > 0);
    } else if (currentTab === 'free') {
      result = result.filter((c) => c.originalPrice === 0);
    }

    return result;
  }, [courses, searchQuery, currentTab]);

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
        onLanguageChange={setCurrentLang}
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
        {activeNavTab === 'user_center' ? (
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
              onOpenCatalog={() => {
                setSearchQuery('');
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
              onTriggerSimulatedPeer={() => triggerSimulatedPeerActivity()}
              isSimulatingActive={isSimulatingActive}
              onToggleSimulating={() => setIsSimulatingActive(!isSimulatingActive)}
            />

            {/* 4-Column Course Cards Grid directly matching Screenshots 1 & 2 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-[#102029]/60 rounded-2xl border border-slate-800">
                  <p className="text-base text-slate-300 font-medium">
                    Không tìm thấy khóa học nào phù hợp với từ khóa "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs text-amber-400 hover:underline"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                </div>
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
          // Switch to forum tab if not already on it
          setActiveNavTab('forum');
        }}
      />

      {/* FAQ, Course Request, Tutorials and Sponsor Modal matching Screenshot 3 & 13 */}
      <FaqGuideModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        initialTab={faqModalTab}
        onOpenVip={() => setIsVipOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <MainAppContent />
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
