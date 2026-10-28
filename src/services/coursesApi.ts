import { apiClient } from './apiClient';
import { Course, Comment, CommentReply } from '../types';

export interface CoursesListResponse {
  data: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LessonStreamResponse {
  data: {
    lessonId: string;
    title: string;
    streamToken: string;
    streamUrl: string;
    expiresIn: string;
  };
}

export const coursesApi = {
  /**
   * Lấy danh sách khóa học có bộ lọc
   */
  async getCourses(params?: {
    category?: string;
    search?: string;
    isFree?: boolean;
    page?: number;
    limit?: number;
  }): Promise<CoursesListResponse> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.isFree !== undefined) query.set('isFree', String(params.isFree));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const endpoint = `/courses${query.toString() ? `?${query.toString()}` : ''}`;
    return apiClient.get<CoursesListResponse>(endpoint);
  },

  /**
   * Lấy chi tiết khóa học và danh sách bài học
   */
  async getCourseById(id: string): Promise<{ data: Course }> {
    return apiClient.get<{ data: Course }>(`/courses/${id}`);
  },

  /**
   * Lấy token phát video bài học (Được bảo vệ bởi Entitlement Guard)
   */
  async getLessonStream(courseId: string, lessonId: string): Promise<LessonStreamResponse> {
    return apiClient.get<LessonStreamResponse>(`/courses/${courseId}/lessons/${lessonId}/stream`);
  },

  /**
   * Lấy danh sách bình luận khóa học từ PostgreSQL
   */
  async getComments(courseId: string): Promise<{ data: Comment[] }> {
    return apiClient.get<{ data: Comment[] }>(`/courses/${courseId}/comments`);
  },

  /**
   * Gửi bình luận khóa học
   */
  async addComment(courseId: string, content: string): Promise<{ data: Comment }> {
    return apiClient.post<{ data: Comment }>(`/courses/${courseId}/comments`, { content });
  },

  /**
   * Gửi phản hồi bình luận khóa học
   */
  async addReply(courseId: string, commentId: string, content: string): Promise<{ data: CommentReply }> {
    return apiClient.post<{ data: CommentReply }>(`/courses/${courseId}/comments/${commentId}/replies`, { content });
  },

  /**
   * Thả tim khóa học
   */
  async likeCourse(courseId: string): Promise<{ data: { id: string; likesCount: number } }> {
    return apiClient.post<{ data: { id: string; likesCount: number } }>(`/courses/${courseId}/like`);
  },
};
