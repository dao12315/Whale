import { apiClient } from './apiClient';

export interface CategoryData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  coursesCount: number;
  resourcesCount: number;
}

export interface TagData {
  id: string;
  slug: string;
  name: string;
  coursesCount: number;
}

export const taxonomyApi = {
  /**
   * Lấy danh sách danh mục (Categories) từ PostgreSQL
   */
  async getCategories(): Promise<{ data: CategoryData[] }> {
    return apiClient.get<{ data: CategoryData[] }>('/categories');
  },

  /**
   * Lấy danh sách thẻ phân loại (Tags) từ PostgreSQL
   */
  async getTags(): Promise<{ data: TagData[] }> {
    return apiClient.get<{ data: TagData[] }>('/tags');
  },
};
