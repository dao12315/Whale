import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MembershipTier } from '../types';
import { notificationService } from '../services/notificationService';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginAs: (preset: 'free' | 'gold' | 'supreme') => void;
  loginWithCredentials: (email: string, name?: string) => void;
  logout: () => void;
  upgradeTier: (tier: MembershipTier) => void;
  addCredits: (amount: number) => void;
  claimDailyReward: () => boolean;
  purchaseCourse: (courseId: string, cost: number, courseTitle: string) => boolean;
  toggleWishlist: (courseId: string) => void;
  isWishlisted: (courseId: string) => boolean;
  hasPurchased: (courseId: string) => boolean;
}

const DEFAULT_USERS: Record<string, User> = {
  supreme: {
    id: 'user-meohamchoi',
    name: 'meohamchoi 🦝',
    email: 'fluoxetine1910@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    tier: 'supreme',
    credits: 320,
    purchasedCourseIds: ['course-478'],
    wishlistCourseIds: ['course-480'],
    roleBadge: 'Supreme Member • 30% Off',
    joinedDate: '2024-11-12',
    points: 489,
    balance: 0,
    bio: "This guy is lazy and doesn't write anything...",
    heat: 77,
    dailyCheckedIn: false,
    stats: {
      comments: 7,
      articles: 0,
      posts: 2,
      heat: 77,
      collections: 0,
      fans: 0,
    },
  },
  gold: {
    id: 'user-gold-curr',
    name: 'Lê Cẩm Tú (Li Jinxiu)',
    email: 'jinxiu.li@creators.org',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    tier: 'gold',
    credits: 150,
    purchasedCourseIds: [],
    wishlistCourseIds: ['course-479', 'course-480'],
    roleBadge: 'Gold Member • 10% Off',
    joinedDate: '2025-01-08',
    points: 210,
    balance: 0,
    bio: 'Digital artist & traditional folk culture enthusiast.',
    heat: 42,
    dailyCheckedIn: true,
    stats: {
      comments: 3,
      articles: 0,
      posts: 1,
      heat: 42,
      collections: 0,
      fans: 0,
    },
  },
  free: {
    id: 'user-free-curr',
    name: 'Nguyễn Minh Khang',
    email: 'khang.nguyen@graphic.dev',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    tier: 'free',
    credits: 60,
    purchasedCourseIds: [],
    wishlistCourseIds: [],
    roleBadge: 'Standard Member',
    joinedDate: '2025-03-01',
    points: 80,
    balance: 0,
    bio: 'Learning illustration and CGI.',
    heat: 15,
    dailyCheckedIn: false,
    stats: {
      comments: 1,
      articles: 0,
      posts: 0,
      heat: 15,
      collections: 0,
      fans: 0,
    },
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_USERS.supreme;
    try {
      const stored = localStorage.getItem('shanhai_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_USERS.supreme; // Default logged in for pleasant review experience
    } catch {
      return DEFAULT_USERS.supreme;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('shanhai_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('shanhai_auth_user');
      }
    }
  }, [user]);

  const loginAs = (preset: 'free' | 'gold' | 'supreme') => {
    const selected = DEFAULT_USERS[preset];
    setUser(selected);
    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'system',
      title: 'Đăng nhập thành công! 🌟',
      message: `Chào mừng trở lại, ${selected.name}! Bạn hiện đang ở cấp độ ${selected.tier.toUpperCase()}.`,
      timestamp: 'Vừa xong',
    });
  };

  const loginWithCredentials = (email: string, name?: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      tier: 'gold',
      credits: 100,
      purchasedCourseIds: [],
      wishlistCourseIds: [],
      roleBadge: 'Gold Member (Tân thủ tặng 100 Credits)',
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'system',
      title: 'Đăng nhập thành công!',
      message: `Chào mừng bạn đến với 一帧山海! Tặng ngay 100 Credits trải nghiệm.`,
      timestamp: 'Vừa xong',
    });
  };

  const logout = () => {
    setUser(null);
    sound.playClick();
    notificationService.sendPushNotification({
      type: 'system',
      title: 'Đã đăng xuất',
      message: 'Bạn đã đăng xuất khỏi phiên làm việc an toàn.',
      timestamp: 'Vừa xong',
    });
  };

  const upgradeTier = (tier: MembershipTier) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tier,
        roleBadge: tier === 'supreme' ? 'Supreme Member • 30% Off' : 'Gold Member • 10% Off',
      };
    });
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
    notificationService.sendPushNotification({
      type: 'vip',
      title: `👑 Chúc mừng thăng hạng ${tier === 'supreme' ? 'SUPREME' : 'GOLD'}!`,
      message: `Bạn hiện được hưởng mức chiết khấu cao nhất cho tất cả các gói tài nguyên mua chung.`,
      timestamp: 'Vừa xong',
    });
  };

  const addCredits = (amount: number) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        credits: prev.credits + amount,
      };
    });
    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'credit',
      title: `💰 Đã cộng +${amount} Credits vào ví`,
      message: `Số dư hiện tại của bạn là: ${(user.credits + amount)} Credits.`,
      timestamp: 'Vừa xong',
    });
  };

  const claimDailyReward = (): boolean => {
    if (!user) {
      sound.playClick();
      return false;
    }
    if (user.dailyCheckedIn) {
      sound.playClick();
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Hôm nay bạn đã điểm danh rồi!',
        message: 'Hãy quay lại vào ngày mai để tiếp tục nhận điểm danh và quà tặng nhé.',
        timestamp: 'Vừa xong',
      });
      return false;
    }

    const rewardPoints = 15;
    const rewardCredits = 5;

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        dailyCheckedIn: true,
        points: (prev.points ?? 489) + rewardPoints,
        credits: prev.credits + rewardCredits,
        heat: (prev.heat ?? 77) + 2,
      };
    });

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch {
      // Ignore
    }

    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'credit',
      title: '🎉 Điểm danh nhận thưởng thành công!',
      message: `Nhận ngay +${rewardPoints} Points và +${rewardCredits} Credits hôm nay. Chúc bạn một ngày sáng tạo tuyệt vời!`,
      timestamp: 'Vừa xong',
    });

    return true;
  };

  const purchaseCourse = (courseId: string, cost: number, courseTitle: string): boolean => {
    if (!user) {
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Vui lòng đăng nhập',
        message: 'Bạn cần đăng nhập để tham gia mua chung hoặc mở khóa tài nguyên.',
        timestamp: 'Vừa xong',
      });
      return false;
    }

    if (user.purchasedCourseIds.includes(courseId)) {
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Đã sở hữu',
        message: 'Bạn đã mở khóa tài nguyên này trước đó rồi! Có thể xem ngay bài học.',
        timestamp: 'Vừa xong',
      });
      return true;
    }

    if (user.credits < cost) {
      sound.playClick();
      notificationService.sendPushNotification({
        type: 'credit',
        title: 'Số dư Credits không đủ!',
        message: `Khóa học cần ${cost} Credits, số dư hiện tại của bạn là ${user.credits} Credits. Vui lòng nạp thêm.`,
        timestamp: 'Vừa xong',
      });
      return false;
    }

    // Deduct credits and add to purchased
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        credits: prev.credits - cost,
        purchasedCourseIds: [...prev.purchasedCourseIds, courseId],
      };
    });

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    sound.playSuccess();
    const orderCode = `GGC-${Date.now().toString().slice(-6)}`;
    notificationService.sendPushNotification({
      type: 'group_buy',
      title: `🎉 Đặt đơn thành công! [#${orderCode}]`,
      message: `Đơn hàng #${orderCode} đặt thành công khóa học "${courseTitle}". Đã thanh toán ${cost === 0 ? '0 Credits (Miễn phí)' : `${cost} Credits`}. Toàn bộ video và tài nguyên đính kèm đã sẵn sàng!`,
      timestamp: 'Vừa xong',
      courseId,
    });

    return true;
  };

  const toggleWishlist = (courseId: string) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return null;
      const isAlready = prev.wishlistCourseIds.includes(courseId);
      const nextList = isAlready
        ? prev.wishlistCourseIds.filter((id) => id !== courseId)
        : [...prev.wishlistCourseIds, courseId];
      return {
        ...prev,
        wishlistCourseIds: nextList,
      };
    });
    sound.playClick();
  };

  const isWishlisted = (courseId: string) => {
    return !!user?.wishlistCourseIds.includes(courseId);
  };

  const hasPurchased = (courseId: string) => {
    return !!user?.purchasedCourseIds.includes(courseId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginAs,
        loginWithCredentials,
        logout,
        upgradeTier,
        addCredits,
        claimDailyReward,
        purchaseCourse,
        toggleWishlist,
        isWishlisted,
        hasPurchased,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
