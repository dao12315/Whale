import { apiClient } from './apiClient';
import { ForumBoard, ForumPost } from '../types';

export interface ForumCommentData {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTier: string;
  text: string;
  image?: string;
  timeAgo: string;
  likes: number;
}

export interface CreatePostPayload {
  boardId: string;
  title: string;
  content: string;
  category?: ForumPost['category'];
  images?: string[];
  tags?: string[];
  isVotingEnabled?: boolean;
}

export const forumApi = {
  /**
   * Lấy danh sách các chuyên mục Diễn đàn (Forum Boards) từ PostgreSQL
   */
  async getBoards(): Promise<{ data: ForumBoard[] }> {
    return apiClient.get<{ data: ForumBoard[] }>('/posts/boards');
  },

  /**
   * Lấy danh sách bài viết thảo luận (Forum Posts) từ PostgreSQL
   */
  async getPosts(params?: {
    boardId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ForumPost[]; total?: number; page?: number; totalPages?: number }> {
    const q = new URLSearchParams();
    if (params?.boardId && params.boardId !== 'all') q.set('boardId', params.boardId);
    if (params?.category) q.set('category', params.category);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const endpoint = `/posts${q.toString() ? `?${q.toString()}` : ''}`;
    return apiClient.get<{ data: ForumPost[]; total?: number; page?: number; totalPages?: number }>(endpoint);
  },

  /**
   * Lấy chi tiết bài viết kèm poll options
   */
  async getPostDetail(id: string): Promise<{ data: ForumPost }> {
    return apiClient.get<{ data: ForumPost }>(`/posts/${id}`);
  },

  /**
   * Tạo bài viết thảo luận mới vào PostgreSQL
   */
  async createPost(payload: CreatePostPayload): Promise<{ data: ForumPost }> {
    return apiClient.post<{ data: ForumPost }>('/posts', payload);
  },

  /**
   * Lấy danh sách bình luận của bài viết từ PostgreSQL
   */
  async getComments(postId: string): Promise<{ data: ForumCommentData[] }> {
    return apiClient.get<{ data: ForumCommentData[] }>(`/posts/${postId}/comments`);
  },

  /**
   * Gửi bình luận vào bài viết
   */
  async addComment(postId: string, text: string, image?: string): Promise<{ data: ForumCommentData }> {
    return apiClient.post<{ data: ForumCommentData }>(`/posts/${postId}/comments`, { text, image });
  },

  /**
   * Like bài viết
   */
  async likePost(postId: string): Promise<{ data: { id: string; likesCount: number } }> {
    return apiClient.post<{ data: { id: string; likesCount: number } }>(`/posts/${postId}/like`);
  },

  /**
   * Bình chọn Poll trong bài viết
   */
  async votePoll(postId: string, pollOptionId: string): Promise<{ data: any }> {
    return apiClient.post<{ data: any }>(`/posts/${postId}/vote`, { pollOptionId });
  },
};
