import { apiClient } from './apiClient';

export interface CheckoutRequest {
  itemType: 'COURSE' | 'RESOURCE';
  itemId: string;
  paymentMethod: 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'CREDITS' | 'FREE';
  googleEmail?: string;
  idempotencyKey?: string;
}

export interface CheckoutResponse {
  data: {
    orderId: string;
    orderCode: string;
    status: 'COMPLETED' | 'PENDING';
    paymentMethod: string;
    message?: string;
    paymentUrl?: string;
    totalAmount?: number;
    driveAccessGranted?: boolean;
  };
}

export const ordersApi = {
  /**
   * Tạo đơn hàng và thanh toán
   */
  async checkout(payload: CheckoutRequest): Promise<CheckoutResponse> {
    return apiClient.post<CheckoutResponse>('/orders/checkout', payload);
  },

  /**
   * Lấy lịch sử đơn hàng của người dùng
   */
  async getMyOrders(): Promise<{ data: any[] }> {
    return apiClient.get<{ data: any[] }>('/orders/my-orders');
  },
};
