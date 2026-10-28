import { apiClient } from './apiClient';
import { ChatMessage } from '../types';

export const chatApi = {
  /**
   * Lấy lịch sử tin nhắn cộng đồng từ PostgreSQL
   */
  async getMessages(): Promise<{ data: ChatMessage[] }> {
    return apiClient.get<{ data: ChatMessage[] }>('/chat/messages');
  },

  /**
   * Gửi tin nhắn mới vào phòng chat cộng đồng
   */
  async sendMessage(message: string): Promise<{ data: ChatMessage }> {
    return apiClient.post<{ data: ChatMessage }>('/chat/messages', { message });
  },
};
