import { apiClient } from './apiClient';
import { ForumPost, ForumBoard, ForumComment } from '../types';

export interface PostsListResponse {
  data: ForumPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const postsApi = {
  /**
   * Lấy danh sách chuyên mục diễn đàn từ PostgreSQL
   */
  async getBoards(): Promise<{ data: ForumBoard[] }> {
    return apiClient.get<{ data: ForumBoard[] }>('/posts/boards');
  },

  /**
   * Lấy danh sách bài viết từ database (hỗ trợ lọc status, authorId)
   */
  async getPosts(params?: {
    boardId?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'ALL';
    authorId?: string;
  }): Promise<PostsListResponse> {
    const query = new URLSearchParams();
    if (params?.boardId && params.boardId !== 'all') query.set('boardId', params.boardId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.authorId) query.set('authorId', params.authorId);

    const endpoint = `/posts${query.toString() ? `?${query.toString()}` : ''}`;
    return apiClient.get<PostsListResponse>(endpoint);
  },

  /**
   * Lấy danh sách bài viết chờ duyệt (Moderation Queue)
   */
  async getPendingPosts(): Promise<{ data: ForumPost[] }> {
    return apiClient.get<{ data: ForumPost[] }>('/posts/moderation/pending');
  },

  /**
   * Lấy chi tiết bài viết
   */
  async getPostById(id: string): Promise<{ data: ForumPost }> {
    return apiClient.get<{ data: ForumPost }>(`/posts/${id}`);
  },

  /**
   * Tạo bài viết mới (kèm AI Content Moderation tự động)
   */
  async createPost(data: {
    boardId: string;
    title: string;
    content: string;
    coverImageUrl?: string;
  }): Promise<{
    data: ForumPost;
    moderation?: any;
    isAutoApproved?: boolean;
    isPendingAdmin?: boolean;
  }> {
    return apiClient.post<{
      data: ForumPost;
      moderation?: any;
      isAutoApproved?: boolean;
      isPendingAdmin?: boolean;
    }>('/posts', data);
  },

  /**
   * Admin duyệt bài viết
   */
  async approvePost(id: string): Promise<{ data: ForumPost; message: string }> {
    return apiClient.post<{ data: ForumPost; message: string }>(`/posts/${id}/approve`, {});
  },

  /**
   * Admin từ chối bài viết
   */
  async rejectPost(id: string, reason?: string): Promise<{ data: ForumPost; message: string }> {
    return apiClient.post<{ data: ForumPost; message: string }>(`/posts/${id}/reject`, { reason });
  },

  /**
   * Admin xóa bài viết
   */
  async deletePost(id: string): Promise<{ data: { message: string } }> {
    return apiClient.delete<{ data: { message: string } }>(`/posts/${id}`);
  },

  /**
   * Lấy bình luận của bài viết
   */
  async getComments(postId: string): Promise<{ data: ForumComment[] }> {
    return apiClient.get<{ data: ForumComment[] }>(`/posts/${postId}/comments`);
  },

  /**
   * Gửi bình luận bài viết
   */
  async createComment(postId: string, data: { text: string; image?: string }): Promise<{ data: ForumComment }> {
    return apiClient.post<{ data: ForumComment }>(`/posts/${postId}/comments`, data);
  },

  /**
   * Thả tim bài viết
   */
  async likePost(postId: string): Promise<{ data: { id: string; likesCount: number } }> {
    return apiClient.post<{ data: { id: string; likesCount: number } }>(`/posts/${postId}/like`);
  },
};
