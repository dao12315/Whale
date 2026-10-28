import { apiClient } from './apiClient';
import { User, MembershipTier } from '../types';

export interface AuthResponse {
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      nickname: string;
      role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
      tier: 'FREE' | 'GOLD' | 'SUPREME';
      creditsBalance: number;
      googleEmail: string | null;
      avatarUrl: string;
    };
  };
}

export interface GoogleAuthResponse {
  data: {
    accessToken: string;
    user: AuthResponse['data']['user'];
    isNewUser?: boolean;
    generatedPassword?: string;
    emailSent?: boolean;
  };
}

export const authApi = {
  /**
   * Đăng nhập tài khoản thật vào Backend API & nhận JWT Access Token
   */
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (res?.data?.accessToken) {
      apiClient.setAccessToken(res.data.accessToken);
    }
    return res;
  },

  /**
   * Đăng ký tài khoản mới trong cơ sở dữ liệu PostgreSQL
   */
  async register(data: { email: string; password: string; nickname?: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      nickname: data.nickname || data.email.split('@')[0],
    });
    if (res?.data?.accessToken) {
      apiClient.setAccessToken(res.data.accessToken);
    }
    return res;
  },

  /**
   * Đăng nhập / Đăng ký tự động qua tài khoản Google
   */
  async loginWithGoogle(data: {
    googleEmail?: string;
    idToken?: string;
    nickname?: string;
    avatarUrl?: string;
  }): Promise<GoogleAuthResponse> {
    const res = await apiClient.post<GoogleAuthResponse>('/auth/google', data);
    if (res?.data?.accessToken) {
      apiClient.setAccessToken(res.data.accessToken);
    }
    return res;
  },

  /**
   * Lấy thông tin phiên hiện tại từ Access Token
   */
  async getMe(): Promise<any> {
    return apiClient.get('/auth/me');
  },

  /**
   * Đăng xuất và thu hồi Refresh Token trên máy chủ
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore
    } finally {
      apiClient.setAccessToken(null);
    }
  },

  /**
   * Chuyển đổi User Entity từ API sang kiểu User của Frontend (chuẩn hóa 2 vai trò ADMIN & USER)
   */
  mapApiUserToFrontend(apiUser: AuthResponse['data']['user']): User {
    const isAdmin = apiUser.role === 'ADMIN' || (apiUser.tier as any) === 'ADMIN';
    const role: 'ADMIN' | 'USER' = isAdmin ? 'ADMIN' : 'USER';
    const roleBadge = isAdmin ? '👑 Quản Trị Viên (Admin)' : '👤 Học Viên (User)';

    return {
      id: apiUser.id,
      name: apiUser.nickname,
      email: apiUser.email,
      avatar:
        apiUser.avatarUrl ||
        (isAdmin
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'),
      tier: isAdmin ? 'admin' : 'free',
      role,
      credits: apiUser.creditsBalance ?? 100,
      googleEmail: apiUser.googleEmail || undefined,
      purchasedCourseIds: [],
      wishlistCourseIds: [],
      roleBadge,
      joinedDate: new Date().toISOString().split('T')[0],
      points: isAdmin ? 9999 : 100,
      balance: 0,
      bio: isAdmin ? 'Quản trị viên toàn quyền hệ thống Whale / GGC Studio.' : 'Thành viên học tập Digital Art & CG.',
      heat: isAdmin ? 999 : 50,
      dailyCheckedIn: false,
    };
  },
};
