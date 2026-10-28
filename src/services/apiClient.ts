/**
 * API Client tập trung (Centralized API Client)
 * Senior Full-stack note:
 * - Dùng fetch API chuẩn (zero dependency, native Promise & streaming).
 * - Tự động đính kèm Authorization: Bearer <accessToken> trong bộ nhớ.
 * - Tự động gửi cookie Refresh Token với credentials: 'include'.
 * - Cơ chế Tự Động Làm Mới Token (Silent Refresh Token): Khi gặp HTTP 401, tự động gọi
 *   POST /api/v1/auth/refresh-token, cập nhật token mới và retry request ban đầu.
 * - Cơ chế Mutex Lock (refreshPromise) chống Race Condition: Khi nhiều request cùng lúc
 *   gặp 401, chỉ có 1 request refresh token được gửi đi, các request khác chờ và cùng dùng token mới.
 */

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api/v1';
    if (typeof window !== 'undefined') {
      this.accessToken =
        sessionStorage.getItem('whale_access_token') ||
        localStorage.getItem('whale_access_token') ||
        localStorage.getItem('shanhai_access_token');
    }
  }

  public setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('whale_access_token', token);
        localStorage.setItem('whale_access_token', token);
        localStorage.setItem('shanhai_access_token', token);
      } else {
        sessionStorage.removeItem('whale_access_token');
        localStorage.removeItem('whale_access_token');
        localStorage.removeItem('shanhai_access_token');
      }
    }
  }

  public getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken =
        sessionStorage.getItem('whale_access_token') ||
        localStorage.getItem('whale_access_token') ||
        localStorage.getItem('shanhai_access_token');
    }
    return this.accessToken;
  }

  /**
   * Gọi làm mới Refresh Token ngầm khi Access Token hết hạn
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          this.setAccessToken(null);
          return null;
        }

        const json = await response.json();
        const newAccessToken = json.data?.accessToken;
        if (newAccessToken) {
          this.setAccessToken(newAccessToken);
          return newAccessToken;
        }
        return null;
      } catch (err) {
        console.warn('[API Client] Không thể refresh token tự động:', err);
        this.setAccessToken(null);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Core Request Function
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken =
        sessionStorage.getItem('whale_access_token') ||
        localStorage.getItem('whale_access_token') ||
        localStorage.getItem('shanhai_access_token');
    }

    // Đính kèm Access Token nếu có
    if (this.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);

      if (
        response.status === 401 &&
        retryCount === 0 &&
        !endpoint.includes('/auth/refresh-token') &&
        !endpoint.includes('/auth/login')
      ) {
        console.log('[API Client] Access token hết hạn (401). Đang tự động làm mới token...');
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          return this.request<T>(endpoint, options, retryCount + 1);
        }
      }

      if (!response.ok) {
        let errorData: ApiErrorResponse = {
          error: {
            code: 'REQUEST_FAILED',
            message: `Lỗi kết nối máy chủ (${response.status})`,
          },
        };
        try {
          errorData = await response.json();
        } catch {}
        throw new ApiError(
          errorData.error?.message || `Lỗi yêu cầu: ${response.statusText}`,
          response.status,
          errorData.error?.code || 'ERROR',
          errorData.error?.details
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error.message || 'Mất kết nối tới máy chủ Backend API',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  public get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();