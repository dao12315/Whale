import { apiClient } from './apiClient';

export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  format: string;
  fileSizeMb: number;
  downloadCount: number;
  priceCredits: number;
  isFree: boolean;
  driveFileId: string;
  thumbnail: string;
  description: string;
  createdAt: string;
}

export const resourcesApi = {
  /**
   * Lấy danh sách tài nguyên đồ họa từ PostgreSQL
   */
  async getResources(category?: string): Promise<{ data: ResourceItem[] }> {
    const q = category && category !== 'all' ? `?category=${category}` : '';
    return apiClient.get<{ data: ResourceItem[] }>(`/resources${q}`);
  },

  /**
   * Lấy chi tiết tài nguyên
   */
  async getResourceById(id: string): Promise<{ data: ResourceItem }> {
    return apiClient.get<{ data: ResourceItem }>(`/resources/${id}`);
  },

  /**
   * Tải tài nguyên
   */
  async downloadResource(id: string): Promise<{ data: { downloadUrl: string; fileName: string } }> {
    return apiClient.get<{ data: { downloadUrl: string; fileName: string } }>(`/resources/${id}/download`);
  },
};
