import { apiClient } from './apiClient';

export interface UserEnrollmentItem {
  id: string;
  userId: string;
  courseId?: string | null;
  resourceId?: string | null;
  status: string;
  createdAt: string;
  itemTitle: string;
  itemCode: string;
  thumbnail?: string;
  driveFolderId?: string;
  progress: number;
}

export interface UserNotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const usersApi = {
  /**
   * Lấy thông tin tài khoản hiện tại
   */
  async getMe(): Promise<{ data: any }> {
    return apiClient.get<{ data: any }>('/users/me');
  },

  /**
   * Cập nhật hồ sơ
   */
  async updateMe(data: { nickname?: string; googleEmail?: string; avatarUrl?: string }): Promise<{ data: any }> {
    return apiClient.patch<{ data: any }>('/users/me', data);
  },

  /**
   * Điểm danh hằng ngày
   */
  async checkin(): Promise<{ data: { message: string; creditsEarned: number; newBalance: number; newPoints: number } }> {
    return apiClient.post<{ data: { message: string; creditsEarned: number; newBalance: number; newPoints: number } }>('/users/me/checkin');
  },

  /**
   * Lấy danh sách khóa học và tài nguyên đã đăng ký
   */
  async getMyEnrollments(): Promise<{ data: UserEnrollmentItem[] }> {
    return apiClient.get<{ data: UserEnrollmentItem[] }>('/users/me/enrollments');
  },

  /**
   * Lấy lịch sử đơn hàng của người dùng
   */
  async getMyOrders(): Promise<{ data: any[] }> {
    return apiClient.get<{ data: any[] }>('/users/me/orders');
  },

  /**
   * Lấy danh sách thông báo của người dùng
   */
  async getMyNotifications(): Promise<{ data: UserNotificationItem[] }> {
    return apiClient.get<{ data: UserNotificationItem[] }>('/users/me/notifications');
  },
};
