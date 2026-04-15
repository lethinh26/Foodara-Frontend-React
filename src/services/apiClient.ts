import { env } from '../config/env';
import { refreshAccessToken } from '../utils/tokenRefresh';

/**
 * Backend response format: { code: number, message: string, result: T }
 */
interface BackendResponse<T> {
  code: number;
  message: string;
  result: T;
}

// ── Map backend error messages → Vietnamese ──
const ERROR_MESSAGES: Record<string, string> = {
  'USER_EXISTED': 'Email đã được đăng ký',
  'USER_NOT_EXISTED': 'Tài khoản không tồn tại',
  'Email already exists': 'Email đã được đăng ký',
  'PHONE_EXISTED': 'Số điện thoại đã được sử dụng',
  'INVALID_EMAIL': 'Email không hợp lệ',
  'INVALID_PASSWORD': 'Mật khẩu phải có ít nhất 8 ký tự',
  'INVALID_PHONE': 'Số điện thoại không hợp lệ (cần 10 số, bắt đầu bằng 0)',
  'UNAUTHORIZED': 'Phiên đăng nhập đã hết hạn',
  'FORBIDDEN': 'Bạn không có quyền thực hiện thao tác này',
  'UNAUTHENTICATED': 'Sai email hoặc mật khẩu',
  'Uncategorized error': 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
  'Email or phone is required': 'Vui lòng nhập email hoặc số điện thoại',
  'Password is required': 'Vui lòng nhập mật khẩu',
  'Email is required': 'Vui lòng nhập email',
  'Full name is required': 'Vui lòng nhập họ tên',
  'Label is required': 'Vui lòng chọn loại địa chỉ',
  'Full address is required': 'Vui lòng nhập địa chỉ',
};

function translateMessage(msg: string): string {
  if (ERROR_MESSAGES[msg]) return ERROR_MESSAGES[msg];
  for (const [key, val] of Object.entries(ERROR_MESSAGES)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return msg;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshQueue: Array<() => void> = [];

  constructor() {
    this.baseUrl = env.apiBaseUrl;
  }

  private getToken(): string | null {
    try {
      const persisted = localStorage.getItem('persist:foodara');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const auth = JSON.parse(parsed.auth || '{}');
        return auth.token || null;
      }
    } catch {
      //
    }
    return null;
  }

  private buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response, originalRequest?: { url: string; init: RequestInit }): Promise<T> {
    if (response.status === 401 && originalRequest) {
      const newToken = await this.handleTokenRefresh();
      if (newToken) {
        this.updateTokenInStore(newToken);
        
        const retryHeaders = {
          ...originalRequest.init.headers as Record<string, string>,
          'Authorization': `Bearer ${newToken}`,
        };
        const retryResponse = await fetch(originalRequest.url, {
          ...originalRequest.init,
          headers: retryHeaders,
        });
        return this.handleResponse<T>(retryResponse);
      } else {
        this.logoutUser();
        throw new ApiError(401, 1102, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const rawMessage = body?.message || `HTTP ${response.status}`;
      throw new ApiError(response.status, body?.code || response.status, translateMessage(rawMessage));
    }

    const body: BackendResponse<T> = await response.json();

    if (body.code !== undefined && body.code !== 1000) {
      throw new ApiError(400, body.code, translateMessage(body.message || 'Đã xảy ra lỗi'));
    }

    return body.result;
  }

  private async handleTokenRefresh(): Promise<string | null> {
    // If already refreshing, wait for it to complete
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push(() => {
          resolve(this.getToken());
        });
      });
    }

    this.isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      
      // Notify all waiting requests
      this.refreshQueue.forEach(callback => callback());
      this.refreshQueue = [];
      
      return newToken;
    } finally {
      this.isRefreshing = false;
    }
  }

  private updateTokenInStore(token: string): void {
    try {
      const persisted = localStorage.getItem('persist:foodara');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const auth = JSON.parse(parsed.auth || '{}');
        auth.token = token;
        parsed.auth = JSON.stringify(auth);
        localStorage.setItem('persist:foodara', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Failed to update token in store:', error);
    }
  }

  private logoutUser(): void {
    try {
      localStorage.removeItem('persist:foodara');
      window.location.href = '/customer/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  private async safeFetch(url: string, init: RequestInit, enableRetry = true): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...init,
        credentials: 'include',
      });
      
      if (enableRetry) {
        return response;
      }
      return response;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new ApiError(0, 0, 'Không thể kết nối đến server. Kiểm tra lại kết nối mạng.');
      }
      throw new ApiError(0, 0, err?.message || 'Lỗi kết nối mạng');
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const search = new URLSearchParams(params);
      url += `?${search.toString()}`;
    }
    const init: RequestInit = {
      method: 'GET',
      headers: this.buildHeaders(),
    };
    const response = await this.safeFetch(url, init);
    return this.handleResponse<T>(response, { url, init });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method: 'POST',
      headers: this.buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    };
    const response = await this.safeFetch(url, init);
    return this.handleResponse<T>(response, { url, init });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    };
    const response = await this.safeFetch(url, init);
    return this.handleResponse<T>(response, { url, init });
  }

  async delete<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method: 'DELETE',
      headers: this.buildHeaders(),
    };
    const response = await this.safeFetch(url, init);
    return this.handleResponse<T>(response, { url, init });
  }
}

export class ApiError extends Error {
  status: number;
  code: number;

  constructor(status: number, code: number, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
