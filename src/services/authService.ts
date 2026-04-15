import { apiClient } from './apiClient';
import { env } from '../config/env';
import { delay } from '../utils/helpers';
import { mockCustomer, mockMerchant, mockAdmin } from '../mocks/users';
import toast from 'react-hot-toast';
import type { User, LoginCredentials, RegisterData } from '../types/user';

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

export interface AddressResponse {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  ward: string;
  districtId: string;
  cityId: string;
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
  districtId?: string;
  cityId?: string;
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

function mapProfileToUser(profile: UserProfileResponse): User {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone || '',
    avatar: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.fullName}`,
    role: 'customer',
    status: (profile.status as User['status']) || 'active',
    emailVerified: profile.emailVerified,
    phoneVerified: profile.phoneVerified,
    createdAt: profile.createdAt,
    updatedAt: profile.createdAt,
    lastLoginAt: new Date().toISOString(),
  };
}


async function fetchProfileWithToken(token: string): Promise<User> {
  const response = await fetch(`${env.apiBaseUrl}/v1/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const body = await response.json();
  console.log(body);
  
  if (body.code === 1000 && body.result) {
    return mapProfileToUser(body.result as UserProfileResponse);
  }
  throw new Error(body.message || 'Failed to fetch profile');
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
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


    const result = await apiClient.post<{ accessToken: string; tokenType: string; expiresIn: number }>(
      '/v1/auth/login',
      { 
        username: credentials.email, 
        password: credentials.password,
      }
    );

    const tempToken = result.accessToken;
    const profile = await fetchProfileWithToken(tempToken);

    return {
      user: profile,
      token: tempToken,
    };
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    // accessToken, tokenType, expiresIn
    // Refresh token HttpOnly cookie
    console.log("abc");
    
    const result = await apiClient.post<{ accessToken: string; tokenType: string; expiresIn: number }>(
      '/v1/auth/register',
      { email: data.email, password: data.password, fullName: data.fullName, phone: data.phone, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + data.fullName }
    );
    console.log(result);
    

    const tempToken = result.accessToken;

    let profile: User;
    try {
      profile = await fetchProfileWithToken(tempToken);
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


  async getProfile(): Promise<User> {
    if (env.isMockMode) {
      await delay(500);
      return mockCustomer;
    }
    const profile = await apiClient.get<UserProfileResponse>('/v1/users/me');
    return mapProfileToUser(profile);
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
