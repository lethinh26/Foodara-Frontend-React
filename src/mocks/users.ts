import type { User, AdminUser, SessionDevice, Role, Permission } from '../types/user';

export const mockCustomer: User = {
  id: 'user-001',
  email: 'nguyenvana@email.com',
  fullName: 'Nguyễn Văn An',
  phone: '0901234567',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=An',
  role: 'customer',
  status: 'active',
  emailVerified: true,
  phoneVerified: true,
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2025-03-10T14:30:00Z',
  lastLoginAt: '2025-03-15T10:00:00Z',
};

export const mockMerchant: User = {
  id: 'user-002',
  email: 'quanpho@email.com',
  fullName: 'Trần Thị Bình',
  phone: '0912345678',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Binh',
  role: 'merchant',
  status: 'active',
  emailVerified: true,
  phoneVerified: true,
  createdAt: '2023-06-01T08:00:00Z',
  updatedAt: '2025-03-14T09:00:00Z',
  lastLoginAt: '2025-03-15T07:30:00Z',
};

export const mockAdmin: AdminUser = {
  id: 'user-003',
  email: 'admin@foodara.vn',
  fullName: 'Lê Quốc Cường',
  phone: '0923456789',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cuong',
  role: 'admin',
  status: 'active',
  emailVerified: true,
  phoneVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2025-03-15T08:00:00Z',
  lastLoginAt: '2025-03-15T08:00:00Z',
  permissions: ['*'],
  adminLevel: 'super',
  department: 'Operations',
};

export const mockUsers: User[] = [
  mockCustomer,
  mockMerchant,
  { ...mockAdmin },
  { id: 'user-004', email: 'phamthid@email.com', fullName: 'Phạm Thị Dung', phone: '0934567890', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dung', role: 'customer', status: 'active', emailVerified: true, phoneVerified: true, createdAt: '2024-03-20T08:00:00Z', updatedAt: '2025-03-14T12:00:00Z', lastLoginAt: '2025-03-14T12:00:00Z' },
  { id: 'user-005', email: 'hoangvane@email.com', fullName: 'Hoàng Văn Em', phone: '0945678901', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Em', role: 'customer', status: 'active', emailVerified: true, phoneVerified: false, createdAt: '2024-05-10T08:00:00Z', updatedAt: '2025-03-12T15:00:00Z', lastLoginAt: '2025-03-12T15:00:00Z' },
  { id: 'user-006', email: 'vothif@email.com', fullName: 'Võ Thị Phượng', phone: '0956789012', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Phuong', role: 'merchant', status: 'pending', emailVerified: true, phoneVerified: true, createdAt: '2025-02-28T08:00:00Z', updatedAt: '2025-03-01T08:00:00Z', lastLoginAt: '2025-03-01T08:00:00Z' },
  { id: 'user-007', email: 'dangvang@email.com', fullName: 'Đặng Văn Giang', phone: '0967890123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Giang', role: 'customer', status: 'suspended', emailVerified: true, phoneVerified: true, createdAt: '2024-02-14T08:00:00Z', updatedAt: '2025-02-20T08:00:00Z', lastLoginAt: '2025-02-20T08:00:00Z' },
];

export const mockDevices: SessionDevice[] = [
  { id: 'dev-1', deviceName: 'Chrome trên Windows', browser: 'Chrome 122', os: 'Windows 11', ip: '42.118.xxx.xxx', lastActive: '2025-03-15T10:00:00Z', isCurrent: true, location: 'TP. Hồ Chí Minh' },
  { id: 'dev-2', deviceName: 'Safari trên iPhone', browser: 'Safari 17', os: 'iOS 17.4', ip: '113.185.xxx.xxx', lastActive: '2025-03-14T18:30:00Z', isCurrent: false, location: 'TP. Hồ Chí Minh' },
  { id: 'dev-3', deviceName: 'Firefox trên MacBook', browser: 'Firefox 123', os: 'macOS 14', ip: '42.118.xxx.xxx', lastActive: '2025-03-10T09:00:00Z', isCurrent: false, location: 'Hà Nội' },
];

export const mockRoles: Role[] = [
  { id: 'role-1', name: 'Super Admin', description: 'Toàn quyền trên hệ thống', permissions: ['*'], userCount: 2, createdAt: '2023-01-01T00:00:00Z' },
  { id: 'role-2', name: 'Operations Manager', description: 'Quản lý vận hành, đơn hàng, quán', permissions: ['orders.*', 'restaurants.*', 'users.read', 'zones.*'], userCount: 5, createdAt: '2023-01-01T00:00:00Z' },
  { id: 'role-3', name: 'Finance', description: 'Quản lý tài chính, đối soát', permissions: ['finance.*', 'settlements.*', 'orders.read'], userCount: 3, createdAt: '2023-01-01T00:00:00Z' },
  { id: 'role-4', name: 'Marketing', description: 'Quản lý campaign, banner, voucher', permissions: ['campaigns.*', 'promotions.*', 'banners.*'], userCount: 4, createdAt: '2023-06-01T00:00:00Z' },
  { id: 'role-5', name: 'Support', description: 'Hỗ trợ khách hàng, xem thông tin', permissions: ['orders.read', 'users.read', 'restaurants.read'], userCount: 8, createdAt: '2023-06-01T00:00:00Z' },
];

export const mockPermissions: Permission[] = [
  { id: 'perm-1', code: 'users.read', name: 'Xem người dùng', module: 'Users', description: 'Xem danh sách và chi tiết người dùng' },
  { id: 'perm-2', code: 'users.write', name: 'Sửa người dùng', module: 'Users', description: 'Tạo, sửa, khoá/mở tài khoản' },
  { id: 'perm-3', code: 'orders.read', name: 'Xem đơn hàng', module: 'Orders', description: 'Xem danh sách và chi tiết đơn hàng' },
  { id: 'perm-4', code: 'orders.write', name: 'Can thiệp đơn hàng', module: 'Orders', description: 'Huỷ, hoàn, chuyển trạng thái đơn' },
  { id: 'perm-5', code: 'restaurants.read', name: 'Xem quán', module: 'Restaurants', description: 'Xem danh sách quán ăn' },
  { id: 'perm-6', code: 'restaurants.write', name: 'Quản lý quán', module: 'Restaurants', description: 'Duyệt, khoá, sửa quán ăn' },
  { id: 'perm-7', code: 'finance.read', name: 'Xem tài chính', module: 'Finance', description: 'Xem báo cáo tài chính' },
  { id: 'perm-8', code: 'finance.write', name: 'Quản lý tài chính', module: 'Finance', description: 'Đối soát, quyết toán' },
  { id: 'perm-9', code: 'campaigns.*', name: 'Quản lý Campaign', module: 'Marketing', description: 'Toàn quyền campaign' },
  { id: 'perm-10', code: 'zones.*', name: 'Quản lý vùng', module: 'Zones', description: 'Toàn quyền khu vực hoạt động' },
  { id: 'perm-11', code: 'audit.read', name: 'Xem audit log', module: 'Audit', description: 'Xem lịch sử thao tác' },
  { id: 'perm-12', code: 'settings.*', name: 'Cấu hình hệ thống', module: 'Settings', description: 'Cấu hình giá, SLA, phí' },
];
