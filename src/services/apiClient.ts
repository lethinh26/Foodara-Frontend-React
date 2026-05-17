import { env } from '../config/env';

/**
 * Backend response format: { code: number, message: string, result: T }
 */
interface BackendResponse<T> {
  code: number;
  message: string;
  result: T;
}

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
  'Menu item is out of stock': 'Một số món đã hết hàng, vui lòng kiểm tra lại giỏ hàng',
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
  private refreshQueue: Array<(ok: boolean) => void> = [];

  constructor() {
    this.baseUrl = env.apiBaseUrl;
  }

  private buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
  }

  private async handleResponse<T>(response: Response, originalRequest?: { url: string; init: RequestInit }): Promise<T> {
    if (response.status === 401 && originalRequest) {
      const refreshOk = await this.tryRefreshToken();
      if (refreshOk) {
        const retryResponse = await this.safeFetch(originalRequest.url, originalRequest.init);
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

  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const res = await fetch(`${this.baseUrl}/v1/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const ok = res.ok;
      this.refreshQueue.forEach((cb) => cb(ok));
      this.refreshQueue = [];
      return ok;
    } catch {
      this.refreshQueue.forEach((cb) => cb(false));
      this.refreshQueue = [];
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private logoutUser(): void {
    fetch(`${this.baseUrl}/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    window.location.href = '/customer/login';
  }

  private async safeFetch(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        credentials: 'include',
      });
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new ApiError(0, 0, 'Không thể kết nối đến server. Kiểm tra lại kết nối mạng.');
      }
      const message = err instanceof Error ? err.message : 'Lỗi kết nối mạng';
      throw new ApiError(0, 0, message);
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
