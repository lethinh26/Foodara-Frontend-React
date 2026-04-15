export type UserRole = 'customer' | 'merchant' | 'admin';

export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatar: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
  adminLevel: 'super' | 'manager' | 'operator';
  department: string;
}

export interface SessionDevice {
  id: string;
  ipAddress: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  devices: SessionDevice[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}
