import { apiClient } from './apiClient';
import { env } from '../config/env';
import { delay } from '../utils/helpers';
import { mockCustomer, mockMerchant, mockAdmin } from '../mocks/users';
import toast from 'react-hot-toast';
import type { User, LoginCredentials, RegisterData, UserRole } from '../types/user';


export interface RegisterCheckResponse {
  exists: boolean;
  passwordMatched: boolean;
  canLinkRole: boolean;
  targetRole: string;
  roles: string[];
}

interface TokenResponse {
  accessToken: string;
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


async function fetchProfileWithToken(token: string, role: UserRole = 'customer'): Promise<User> {
  const response = await fetch(`${env.apiBaseUrl}/v1/users/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const body = await response.json();

  if (body.code === 1000 && body.result) {
    return mapProfileToUser(body.result as UserProfileResponse, role);
  }
  throw new Error(body.message || 'Failed to fetch profile');
}

export const authService = {
  async login(credentials: LoginCredentials, role: UserRole = 'customer'): Promise<{ user: User; token: string }> {
    if (env.isMockMode) {
      await delay(800);
      const { email } = credentials;
      if (email.includes('merchant') || email.includes('quan')) {
        return { user: mockMerchant, token: 'mock-merchant-token' };
      }
      if (email.includes('admin')) {
        return { user: { ...mockAdmin }, token: 'mock-admin-token' };
      }
      return { user: mockCustomer, token: 'mock-customer-token' };
    }


    const result = await apiClient.post<TokenResponse>(
      '/v1/auth/login',
      {
        username: credentials.email,
        password: credentials.password,
      }
    );

    const tempToken = result.accessToken;
    const profile = await fetchProfileWithToken(tempToken, role);

    return {
      user: profile,
      token: tempToken,
    };
  },

  async register(data: RegisterData, role: UserRole = 'customer'): Promise<{ user: User; token: string }> {
    const result = await apiClient.post<TokenResponse>(
      '/v1/auth/register',
      {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.fullName}`,
      }
    );

    const tempToken = result.accessToken;

    let profile: User;
    try {
      profile = await fetchProfileWithToken(tempToken, role);
    } catch {
      toast.error('Vui lòng đăng nhập lại.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
      throw new Error('Vui lòng đăng nhập lại.');
    }

    return {
      user: profile,
      token: tempToken,
    };
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

  async linkRole(credentials: LoginCredentials, role: UserRole): Promise<{ user: User; token: string }> {
    if (env.isMockMode) {
      await delay(500);
      const user = role === 'merchant' ? mockMerchant : mockCustomer;
      return { user: { ...user, role }, token: `mock-${role}-token` };
    }

    const result = await apiClient.post<TokenResponse>('/v1/auth/link-role', {
      username: credentials.email,
      password: credentials.password,
      role: normalizeRole(role),
    });
    const profile = await fetchProfileWithToken(result.accessToken, role);
    return { user: profile, token: result.accessToken };
  },

  async getProfileWithToken(token: string, role: UserRole = 'customer'): Promise<User> {
    return fetchProfileWithToken(token, role);
  },


  async getProfile(): Promise<User> {
    if (env.isMockMode) {
      await delay(500);
      return mockCustomer;
    }
    const profile = await apiClient.get<UserProfileResponse>('/v1/users/me');
    return mapProfileToUser(profile);
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
