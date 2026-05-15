import { apiClient } from './apiClient';
import { env } from '../config/env';
import { delay } from '../utils/helpers';
import { mockCustomer, mockMerchant, mockAdmin } from '../mocks/users';
import type { User, LoginCredentials, RegisterData, UserRole } from '../types/user';


export interface RegisterCheckResponse {
  exists: boolean;
  passwordMatched: boolean;
  canLinkRole: boolean;
  targetRole: string;
  roles: string[];
}

interface AuthResponse {
  tokenType: string;
  expiresIn: number;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles?: string[];
  createdAt: string;
}

export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  checkMerchant: boolean;
  avatarUrl: string;
}

export interface AddressResponse {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  ward: string;
  districtName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  deliveryNote: string;
  isDefault: boolean;
  createdAt: string;
}

export interface AddressRequest {
  label: string;
  recipientName?: string;
  recipientPhone?: string;
  addressLine: string;
  ward?: string;
  districtName?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  deliveryNote?: string;
  isDefault: boolean;
}

export interface SessionResponse {
  id: string;
  ipAddress: string;
  createdAt: string;
  current: boolean;
}

function normalizeRole(role: UserRole): string {
  return role.toUpperCase();
}

function mapProfileToUser(profile: UserProfileResponse, role: UserRole = 'customer'): User {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone || '',
    avatar: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.fullName}`,
    role,
    status: (profile.status as User['status']) || 'active',
    emailVerified: profile.emailVerified,
    phoneVerified: profile.phoneVerified,
    createdAt: profile.createdAt,
    updatedAt: profile.createdAt,
    lastLoginAt: new Date().toISOString(),
  };
}


export const authService = {
  async login(credentials: LoginCredentials, role: UserRole = 'customer'): Promise<{ user: User }> {
    if (env.isMockMode) {
      await delay(800);
      const { email } = credentials;
      if (email.includes('merchant') || email.includes('quan')) {
        return { user: mockMerchant };
      }
      if (email.includes('admin')) {
        return { user: { ...mockAdmin } };
      }
      return { user: mockCustomer };
    }

    await apiClient.post<AuthResponse>(
      '/v1/auth/login',
      {
        username: credentials.email,
        password: credentials.password,
      }
    );

    const profile = await apiClient.get<UserProfileResponse>('/v1/users/me');
    const backendRoles = (profile.roles || []).map(r => r.toLowerCase());
    
    if (role === 'admin' && !backendRoles.includes('admin') && !backendRoles.includes('superadmin')) {
      await this.logout();
      throw new Error('Tài khoản không có quyền quản trị viên!');
    }
    if (role === 'merchant' && !backendRoles.includes('merchant')) {
      await this.logout();
      throw new Error('Tài khoản không có quyền chủ quán!');
    }
    
    return { user: mapProfileToUser(profile, role) };
  },

  async register(data: RegisterData, role: UserRole = 'customer'): Promise<{ user: User }> {
    if (env.isMockMode) {
      await delay(800);
      return { user: mockCustomer };
    }

    await apiClient.post<AuthResponse>(
      '/v1/auth/register',
      {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.fullName}`,
      }
    );

    const profile = await apiClient.get<UserProfileResponse>('/v1/users/me');
    return { user: mapProfileToUser(profile, role) };
  },

  async checkRegister(data: RegisterData, role: UserRole): Promise<RegisterCheckResponse> {
    if (env.isMockMode) {
      await delay(300);
      return { exists: false, passwordMatched: false, canLinkRole: false, targetRole: normalizeRole(role), roles: [] };
    }
    return apiClient.post<RegisterCheckResponse>(`/v1/auth/register/check?role=${normalizeRole(role)}`, {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.fullName}`,
    });
  },

  async linkRole(credentials: LoginCredentials, role: UserRole): Promise<{ user: User }> {
    if (env.isMockMode) {
      await delay(500);
      const user = role === 'merchant' ? mockMerchant : mockCustomer;
      return { user: { ...user, role } };
    }

    await apiClient.post<AuthResponse>('/v1/auth/link-role', {
      username: credentials.email,
      password: credentials.password,
      role: normalizeRole(role),
    });
    const profile = await apiClient.get<UserProfileResponse>('/v1/users/me');
    return { user: mapProfileToUser(profile, role) };
  },


  async getProfile(): Promise<User> {
    if (env.isMockMode) {
      await delay(500);
      return mockCustomer;
    }
    const profile = await apiClient.get<UserProfileResponse>('/v1/users/me');
    const backendRoles = (profile.roles || []).map(r => r.toLowerCase());

    // Detect role from current URL path
    const path = window.location.pathname;
    let role: UserRole = 'customer';
    if (path.startsWith('/admin') && backendRoles.includes('admin')) {
      role = 'admin';
    } else if (path.startsWith('/merchant') && backendRoles.includes('merchant')) {
      role = 'merchant';
    } else if (backendRoles.includes('customer')) {
      role = 'customer';
    } else if (backendRoles.length > 0) {
      role = backendRoles[0] as UserRole;
    }
    return mapProfileToUser(profile, role);
  },

  async getUserResponse(data: { email: string, password: string }): Promise<UserResponse> {
    const result = await apiClient.get<UserResponse>(`/v1/users/check-merchant/${data.email}/${data.password}`);
    return result;
  },

  async postUserRole(data: {userId: string, userRole: string}){
    const result = await apiClient.post<UserRole>("/v1/auth/user-role", data)
    return result
  },

  async updateProfile(data: { fullName?: string; phone?: string }): Promise<User> {
    if (env.isMockMode) {
      await delay(600);
      return { ...mockCustomer, ...data, updatedAt: new Date().toISOString() };
    }
    const profile = await apiClient.put<UserProfileResponse>('/v1/users/me', data);
    return mapProfileToUser(profile);
  },


  async getAddresses(): Promise<AddressResponse[]> {
    if (env.isMockMode) {
      await delay(500);
      return [];
    }
    return apiClient.get<AddressResponse[]>('/v1/users/me/addresses');
  },

  async createAddress(address: AddressRequest): Promise<AddressResponse> {
    if (env.isMockMode) {
      await delay(500);
      return { id: 'mock-' + Date.now(), ...address, createdAt: new Date().toISOString() } as AddressResponse;
    }
    return apiClient.post<AddressResponse>('/v1/users/me/addresses', address);
  },

  async updateAddress(id: string, address: AddressRequest): Promise<AddressResponse> {
    if (env.isMockMode) {
      await delay(500);
      return { id, ...address, createdAt: new Date().toISOString() } as AddressResponse;
    }
    return apiClient.put<AddressResponse>(`/v1/users/me/addresses/${id}`, address);
  },

  async deleteAddress(id: string): Promise<void> {
    if (env.isMockMode) {
      await delay(500);
      return;
    }
    await apiClient.delete(`/v1/users/me/addresses/${id}`);
  },

  async setDefaultAddress(id: string): Promise<AddressResponse> {
    if (env.isMockMode) {
      await delay(500);
      return {} as AddressResponse;
    }
    return apiClient.put<AddressResponse>(`/v1/users/me/addresses/${id}/default`);
  },


  async getSessions(): Promise<SessionResponse[]> {
    if (env.isMockMode) {
      await delay(500);
      return [];
    }
    return apiClient.get<SessionResponse[]>('/v1/auth/sessions');
  },

  async deleteSession(sessionId: string): Promise<void> {
    if (env.isMockMode) {
      await delay(500);
      return;
    }
    await apiClient.delete(`/v1/auth/sessions/${sessionId}`);
  },



  async logout(): Promise<void> {

    if (env.isMockMode) {
      await delay(300);
      return;
    }
    try {
      await apiClient.post('/v1/auth/logout');
    } catch {
    }
  },
};
