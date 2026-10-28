import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MembershipTier } from '../types';
import { notificationService } from '../services/notificationService';
import { sound } from '../services/sound';
import { authApi } from '../services/authApi';
import confetti from 'canvas-confetti';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginAs: (preset: 'admin' | 'user' | string) => Promise<void> | void;
  loginWithCredentials?: (email: string, name?: string) => void;
  loginWithRealAccount: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerWithRealAccount: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (
    googleEmail?: string,
    idToken?: string,
    name?: string,
    avatarUrl?: string
  ) => Promise<{ success: boolean; isNewUser?: boolean; generatedPassword?: string }>;
  logout: () => void;
  upgradeTier: (tier: MembershipTier) => void;
  addCredits: (amount: number) => void;
  claimDailyReward: () => boolean;
  purchaseCourse: (courseId: string, cost: number, courseTitle: string) => boolean;
  toggleWishlist: (courseId: string) => void;
  isWishlisted: (courseId: string) => boolean;
  hasPurchased: (courseId: string) => boolean;
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // buffer 30 seconds
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}

const DEFAULT_USERS: Record<string, User> = {
  admin: {
    id: 'usr_admin',
    name: 'Tổng Quản Trị (Admin)',
    email: 'admin@shanhai.studio',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    tier: 'admin',
    role: 'ADMIN',
    googleEmail: 'admin.whale@gmail.com',
    credits: 99999,
    purchasedCourseIds: ['course-484', 'course-480'],
    wishlistCourseIds: [],
    roleBadge: '👑 Quản Trị Viên (Admin)',
    joinedDate: '2024-01-01',
    points: 9999,
    balance: 50000000,
    bio: 'Quản trị viên toàn quyền hệ thống Whale / GGC Studio.',
    heat: 999,
    dailyCheckedIn: true,
    stats: {
      comments: 99,
      articles: 15,
      posts: 28,
      heat: 999,
      collections: 50,
      fans: 1200,
    },
  },
  user: {
    id: 'user-free-curr',
    name: 'Nguyễn Minh Khang',
    email: 'user@shanhai.studio',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    tier: 'free',
    role: 'USER',
    credits: 100,
    purchasedCourseIds: [],
    wishlistCourseIds: [],
    roleBadge: '👤 Học Viên (User)',
    joinedDate: '2025-03-01',
    points: 100,
    balance: 0,
    bio: 'Thành viên học tập Digital Art & CG Masterclasses.',
    heat: 30,
    dailyCheckedIn: false,
    stats: {
      comments: 3,
      articles: 0,
      posts: 1,
      heat: 30,
      collections: 0,
      fans: 0,
    },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('shanhai_auth_user');
      const token =
        localStorage.getItem('whale_access_token') ||
        sessionStorage.getItem('whale_access_token') ||
        localStorage.getItem('shanhai_access_token');
      if (stored && token) {
        // Kiểm tra xem token còn hạn không khi vừa khởi tạo
        if (!isTokenExpired(token)) {
          return JSON.parse(stored);
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Kiểm tra tính hợp lệ của token khi khởi chạy và tự động refresh nếu cần
  useEffect(() => {
    const verifyAndRestoreSession = async () => {
      if (typeof window === 'undefined') return;
      const token =
        localStorage.getItem('whale_access_token') ||
        sessionStorage.getItem('whale_access_token') ||
        localStorage.getItem('shanhai_access_token');

      if (!token) return;

      if (isTokenExpired(token)) {
        console.log('[Auth] Access Token đã hết hạn khi mở lại trình duyệt. Đang tự động làm mới qua Refresh Token...');
        try {
          const res = await authApi.getMe();
          if (res?.data?.user) {
            const mapped = authApi.mapApiUserToFrontend(res.data.user);
            setUser(mapped);
            console.log('[Auth] Đã khôi phục phiên đăng nhập thành công!');
          }
        } catch {
          console.warn('[Auth] Phiên đăng nhập đã hết hạn hoàn toàn. Vui lòng đăng nhập lại.');
          setUser(null);
          localStorage.removeItem('shanhai_auth_user');
          localStorage.removeItem('whale_access_token');
          localStorage.removeItem('shanhai_access_token');
        }
      } else {
        // Token còn hạn, đồng bộ thông tin mới nhất từ máy chủ
        authApi
          .getMe()
          .then((res) => {
            if (res?.data?.user) {
              const mapped = authApi.mapApiUserToFrontend(res.data.user);
              setUser(mapped);
            }
          })
          .catch(() => {
            // Nếu offline, tiếp tục dùng cached user trong localStorage
          });
      }
    };

    verifyAndRestoreSession();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('shanhai_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('shanhai_auth_user');
      }
    }
  }, [user]);

  const loginWithRealAccount = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.login({ email, password });
      if (res?.data?.user) {
        const mapped = authApi.mapApiUserToFrontend(res.data.user);
        setUser(mapped);
        sound.playSuccess();
        notificationService.sendPushNotification({
          type: 'system',
          title: 'Đăng nhập thành công! 🌟',
          message: `Chào mừng ${mapped.name}! Phiên đăng nhập 24h đã được kích hoạt.`,
          timestamp: 'Vừa xong',
        });
        return { success: true };
      }
      return { success: false, error: 'Đăng nhập không thành công.' };
    } catch (err: any) {
      sound.playClick();
      const errMsg = err?.message || 'Email hoặc mật khẩu không chính xác.';
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Đăng nhập thất bại ⚠️',
        message: errMsg,
        timestamp: 'Vừa xong',
      });
      return { success: false, error: errMsg };
    }
  };

  const registerWithRealAccount = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.register({ email, password, nickname: name });
      if (res?.data?.user) {
        const mapped = authApi.mapApiUserToFrontend(res.data.user);
        setUser(mapped);
        sound.playSuccess();
        notificationService.sendPushNotification({
          type: 'system',
          title: 'Đăng ký thành công! 🎉',
          message: `Tài khoản ${mapped.email} đã được lưu vào cơ sở dữ liệu. Tặng bạn 50 Credits!`,
          timestamp: 'Vừa xong',
        });
        return { success: true };
      }
      return { success: false, error: 'Đăng ký không thành công.' };
    } catch (err: any) {
      sound.playClick();
      const errMsg = err?.message || 'Không thể tạo tài khoản mới.';
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Đăng ký thất bại ⚠️',
        message: errMsg,
        timestamp: 'Vừa xong',
      });
      return { success: false, error: errMsg };
    }
  };

  const loginWithGoogle = async (
    googleEmail?: string,
    idToken?: string,
    name?: string,
    avatarUrl?: string
  ): Promise<{ success: boolean; isNewUser?: boolean; generatedPassword?: string }> => {
    try {
      const res = await authApi.loginWithGoogle({
        googleEmail,
        idToken,
        nickname: name,
        avatarUrl,
      });

      if (res?.data?.user) {
        const mapped = authApi.mapApiUserToFrontend(res.data.user);
        setUser(mapped);
        sound.playSuccess();

        if (res.data.isNewUser) {
          notificationService.sendPushNotification({
            type: 'system',
            title: 'Tài khoản Google mới đã khởi tạo! 🎉',
            message: `Mật khẩu đăng nhập ban đầu đã được gửi về email ${mapped.email}. Vui lòng kiểm tra hộp thư!`,
            timestamp: 'Vừa xong',
          });
        } else {
          notificationService.sendPushNotification({
            type: 'system',
            title: 'Đăng nhập Google thành công! 🌟',
            message: `Chào mừng ${mapped.name} quay trở lại!`,
            timestamp: 'Vừa xong',
          });
        }

        return {
          success: true,
          isNewUser: res.data.isNewUser,
          generatedPassword: res.data.generatedPassword,
        };
      }
      return { success: false };
    } catch (err: any) {
      sound.playClick();
      notificationService.sendPushNotification({
        type: 'system',
        title: 'Đăng nhập Google thất bại ⚠️',
        message: err?.message || 'Không thể xác thực tài khoản Google.',
        timestamp: 'Vừa xong',
      });
      return { success: false };
    }
  };

  const loginAs = async (preset: 'admin' | 'user' | string) => {
    const credMap: Record<string, { email: string; pass: string }> = {
      admin: { email: 'admin@shanhai.studio', pass: 'AdminPassword123@' },
      user: { email: 'user@shanhai.studio', pass: 'UserPassword123@' },
      // Fallback
      admin2: { email: 'admin@shanhai.studio', pass: 'AdminPassword123@' },
      supreme: { email: 'admin@shanhai.studio', pass: 'AdminPassword123@' },
      gold: { email: 'user@shanhai.studio', pass: 'UserPassword123@' },
      free: { email: 'user@shanhai.studio', pass: 'UserPassword123@' },
    };

    const cred = credMap[preset] || credMap.user;
    if (cred) {
      await loginWithRealAccount(cred.email, cred.pass);
    }
  };

  const loginWithCredentials = (email: string, name?: string) => {
    loginWithRealAccount(email, 'UserPassword123@').then((success) => {
      if (!success) {
        registerWithRealAccount(email, 'UserPassword123@', name);
      }
    });
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shanhai_auth_user');
      localStorage.removeItem('whale_access_token');
      localStorage.removeItem('shanhai_access_token');
      sessionStorage.removeItem('whale_access_token');
    }
    sound.playClick();
    notificationService.sendPushNotification({
      type: 'system',
      title: 'Đã đăng xuất',
      message: 'Bạn đã đăng xuất và xóa phiên làm việc an toàn.',
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
        loginWithRealAccount,
        registerWithRealAccount,
        loginWithGoogle,
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
