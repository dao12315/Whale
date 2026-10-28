import { apiClient } from './apiClient';

export interface AdminDashboardData {
  totalUsers: number;
  totalCourses: number;
  totalResources: number;
  activeEnrollments: number;
  totalRevenueVnd: number;
  totalCreditsCirculating?: number;
  pendingOrdersCount?: number;
  topSellingCourses?: Array<{
    id: string;
    code: string;
    title: string;
    salesCount: number;
    viewsCount: number;
  }>;
}

export interface AdminOrderItem {
  id: string;
  orderCode: string;
  userId: string;
  userEmail: string;
  googleEmail: string;
  userName: string;
  courseId: string | null;
  resourceId: string | null;
  itemTitle: string;
  itemCode: string;
  totalAmount: number;
  currency: string;
  method?: string;
  status: string;
  drivePermissionId?: string;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  googleEmail?: string;
  role: 'ADMIN' | 'USER' | 'INSTRUCTOR';
  tier: string;
  credits: number;
  points?: number;
  purchasedCount?: number;
  isActive: boolean;
  joinedDate: string;
}

export interface AdminResourceItem {
  id: string;
  title: string;
  fileType: string;
  fileSizeBytes: number;
  fileSizeFormatted?: string;
  downloadsCount: number;
  priceCredits: number;
  priceVnd?: number;
  isFree: boolean;
  driveFileId: string;
  category?: string;
  createdAt: string;
}

export interface AdminAuditLogItem {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export const adminApi = {
  /**
   * Lấy số liệu tổng quan hệ thống từ PostgreSQL
   */
  async getDashboard(): Promise<{ data: AdminDashboardData }> {
    return apiClient.get<{ data: AdminDashboardData }>('/admin/dashboard');
  },

  /**
   * Lấy danh sách toàn bộ đơn hàng
   */
  async getOrders(params?: { page?: number; limit?: number }): Promise<{ data: AdminOrderItem[] }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const endpoint = `/admin/orders${q.toString() ? `?${q.toString()}` : ''}`;
    return apiClient.get<{ data: AdminOrderItem[] }>(endpoint);
  },

  /**
   * Hoàn tiền và thu hồi quyền học
   */
  async refundOrder(orderId: string, reason?: string): Promise<{ data: any }> {
    return apiClient.post<{ data: any }>(`/admin/orders/${orderId}/refund`, { reason });
  },

  /**
   * Lấy danh sách người dùng từ PostgreSQL
   */
  async getUsers(params?: { page?: number; limit?: number; role?: string }): Promise<{ data: AdminUserItem[] }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.role && params.role !== 'all') q.set('role', params.role);
    const endpoint = `/admin/users${q.toString() ? `?${q.toString()}` : ''}`;
    return apiClient.get<{ data: AdminUserItem[] }>(endpoint);
  },

  /**
   * Cập nhật Role người dùng (ADMIN, USER, INSTRUCTOR)
   */
  async updateUserRole(userId: string, role: 'ADMIN' | 'USER' | 'INSTRUCTOR'): Promise<{ data: any }> {
    return apiClient.put<{ data: any }>(`/admin/users/${userId}/role`, { role });
  },

  /**
   * Cập nhật Hạng thành viên (FREE, GOLD, SUPREME, ADMIN)
   */
  async updateUserTier(userId: string, tier: string): Promise<{ data: any }> {
    return apiClient.put<{ data: any }>(`/admin/users/${userId}/tier`, { tier });
  },

  /**
   * Khóa / Mở khóa tài khoản người dùng
   */
  async toggleBanUser(userId: string, isBanned: boolean, reason?: string): Promise<{ data: any }> {
    return apiClient.post<{ data: any }>(`/admin/users/${userId}/ban`, { isBanned, reason });
  },

  /**
   * Cấp thêm xu Credits cho người dùng
   */
  async grantCredits(userId: string, amount: number, reason?: string): Promise<{ data: any }> {
    return apiClient.post<{ data: any }>(`/admin/users/${userId}/grant-credits`, { amount, reason });
  },

  /**
   * Lấy danh sách tài nguyên đồ họa từ PostgreSQL
   */
  async getResources(): Promise<{ data: AdminResourceItem[] }> {
    return apiClient.get<{ data: AdminResourceItem[] }>('/admin/resources');
  },

  /**
   * Thêm mới tài nguyên đồ họa vào PostgreSQL
   */
  async createResource(data: {
    title: string;
    fileType: string;
    fileSizeBytes?: number;
    priceCredits?: number;
    priceVnd?: number;
    isFree?: boolean;
    driveFileId: string;
    description?: string;
  }): Promise<{ data: AdminResourceItem }> {
    return apiClient.post<{ data: AdminResourceItem }>('/admin/resources', data);
  },

  /**
   * Xóa tài nguyên đồ họa khỏi PostgreSQL
   */
  async deleteResource(id: string): Promise<{ data: any }> {
    return apiClient.delete<{ data: any }>(`/admin/resources/${id}`);
  },

  /**
   * Lấy nhật ký thao tác kiểm toán từ PostgreSQL
   */
  async getAuditLogs(params?: { page?: number; limit?: number }): Promise<{ data: AdminAuditLogItem[] }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const endpoint = `/admin/audit-logs${q.toString() ? `?${q.toString()}` : ''}`;
    return apiClient.get<{ data: AdminAuditLogItem[] }>(endpoint);
  },

  /**
   * Tạo mới khóa học vào PostgreSQL
   */
  async createCourse(data: any): Promise<{ data: any }> {
    return apiClient.post<{ data: any }>('/admin/courses', data);
  },

  /**
   * Cập nhật thông tin khóa học & danh sách bài học vào PostgreSQL
   */
  async updateCourse(id: string, data: any): Promise<{ data: any }> {
    return apiClient.put<{ data: any }>(`/admin/courses/${id}`, data);
  },

  /**
   * Xóa khóa học (Soft delete / Archive) trong PostgreSQL
   */
  async deleteCourse(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/courses/${id}`);
  },

  /**
   * Lấy danh sách danh mục (categories) từ API
   */
  async getCategories(): Promise<{ data: Array<{ id: string; slug: string; name: string; description?: string }> }> {
    return apiClient.get<{ data: Array<{ id: string; slug: string; name: string; description?: string }> }>('/categories');
  },

  /**
   * Thêm chương mới cho khóa học
   */
  async addSection(courseId: string, title: string, sortOrder = 0): Promise<{ data: any }> {
    return apiClient.post<{ data: any }>(`/admin/courses/${courseId}/sections`, { title, sortOrder });
  },

  /**
   * Thêm bài học mới vào chương
   */
  async addLesson(sectionId: string, data: any): Promise<{ data: any }> {
    return apiClient.post<{ data: any }>(`/admin/sections/${sectionId}/lessons`, data);
  },
};