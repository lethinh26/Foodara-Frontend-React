import { apiClient } from './apiClient';
import type {
  DashboardSummary,
  DailyPlatformStats,
  AdminUserDetail,
  AdminSession,
  AdminRole,
  AdminRoleWithPermissions,
  AdminPermission,
  PaginatedResponse,
  UpdateUserStatusRequest,
  AssignRolesRequest,
  AdminMerchant,
  AdminStore,
  AdminStoreCategory,
  AdminStoreTag,
  StoreDocument,
  StoreOperatingHour,
  StoreBankAccount,
  MerchantApprovalRequest,
  StoreStatusRequest,
  AdminDriver,
  DriverDocument,
  DriverShift,
  DriverWalletTransaction,
  DriverBankAccount,
  DriverIncentiveProgram,
  DriverIncentiveProgress,
  AdminOrder,
  AdminOrderItem,
  OrderStatusHistoryEntry,
  OrderAssignment,
  AdminVoucher,
  AdminCampaign,
  CampaignParticipant,
  AdminBanner,
  AdminReview,
  ReviewStatus,

  PlatformConfig,
  DeliveryFeeConfig,
  AdminNotification,
  SendNotificationRequest,
  AdminAuditLog,
} from '../types/admin';

interface ListParams {
  page?: number;
  size?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

function buildQuery(params: ListParams): Record<string, string> {
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q[k] = String(v);
  }
  return q;
}

export const adminService = {
  // Dashboard
  async getDashboard(from?: string, to?: string): Promise<DashboardSummary> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return apiClient.get<DashboardSummary>('/v1/admin/stats/dashboard', params);
  },

  async getDailyStats(from: string, to: string): Promise<DailyPlatformStats[]> {
    return apiClient.get<DailyPlatformStats[]>('/v1/admin/stats/daily', { from, to });
  },

  // Users
  async getUsers(params: ListParams = {}): Promise<PaginatedResponse<AdminUserDetail>> {
    return apiClient.get<PaginatedResponse<AdminUserDetail>>('/v1/admin/users', buildQuery(params));
  },

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    return apiClient.get<AdminUserDetail>(`/v1/admin/users/${userId}`);
  },

  async updateUserStatus(userId: string, data: UpdateUserStatusRequest): Promise<void> {
    await apiClient.put<void>(`/v1/admin/users/${userId}/status`, data);
  },

  async assignUserRoles(userId: string, data: AssignRolesRequest): Promise<void> {
    await apiClient.put<void>(`/v1/admin/users/${userId}/roles`, data);
  },

  // Sessions
  async getUserSessions(userId: string): Promise<AdminSession[]> {
    return apiClient.get<AdminSession[]>(`/v1/admin/users/${userId}/sessions`);
  },

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await apiClient.delete<void>(`/v1/admin/users/${userId}/sessions/${sessionId}`);
  },

  // Roles & Permissions
  async getRoles(): Promise<AdminRoleWithPermissions[]> {
    return apiClient.get<AdminRoleWithPermissions[]>('/v1/admin/roles');
  },

  async createRole(data: { name: string; description?: string }): Promise<AdminRole> {
    return apiClient.post<AdminRole>('/v1/admin/roles', data);
  },

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await apiClient.put<void>(`/v1/admin/roles/${roleId}/permissions`, { permissionIds });
  },

  async deleteRole(roleId: string): Promise<void> {
    await apiClient.delete<void>(`/v1/admin/roles/${roleId}`);
  },

  async getPermissions(): Promise<AdminPermission[]> {
    return apiClient.get<AdminPermission[]>('/v1/admin/permissions');
  },

  // Merchants
  async getMerchants(params: ListParams = {}): Promise<PaginatedResponse<AdminMerchant>> {
    return apiClient.get<PaginatedResponse<AdminMerchant>>('/v1/admin/merchants', buildQuery(params));
  },

  async getMerchantDetail(id: string): Promise<AdminMerchant> {
    return apiClient.get<AdminMerchant>(`/v1/admin/merchants/${id}`);
  },

  async approveMerchant(id: string, data: MerchantApprovalRequest): Promise<void> {
    await apiClient.put<void>(`/v1/admin/merchants/${id}/approval`, data);
  },

  async getMerchantDocuments(id: string): Promise<StoreDocument[]> {
    return apiClient.get<StoreDocument[]>(`/v1/admin/merchants/${id}/documents`);
  },

  // Stores
  async getStores(params: ListParams = {}): Promise<PaginatedResponse<AdminStore>> {
    return apiClient.get<PaginatedResponse<AdminStore>>('/v1/admin/stores', buildQuery(params));
  },

  async getStoreDetail(id: string): Promise<AdminStore> {
    return apiClient.get<AdminStore>(`/v1/admin/stores/${id}`);
  },

  async updateStoreStatus(id: string, data: StoreStatusRequest): Promise<void> {
    await apiClient.put<void>(`/v1/admin/stores/${id}/status`, data);
  },

  async getStoreOperatingHours(storeId: string): Promise<StoreOperatingHour[]> {
    return apiClient.get<StoreOperatingHour[]>(`/v1/admin/stores/${storeId}/operating-hours`);
  },

  async getStoreDocuments(storeId: string): Promise<StoreDocument[]> {
    return apiClient.get<StoreDocument[]>(`/v1/admin/stores/${storeId}/documents`);
  },

  async verifyDocument(docId: string, status: 'verified' | 'rejected'): Promise<void> {
    await apiClient.put<void>(`/v1/admin/documents/${docId}/verify`, { status });
  },

  async getStoreBankAccounts(merchantId: string): Promise<StoreBankAccount[]> {
    return apiClient.get<StoreBankAccount[]>(`/v1/admin/merchants/${merchantId}/bank-accounts`);
  },

  // Store Categories
  async getStoreCategories(): Promise<AdminStoreCategory[]> {
    const res = await apiClient.get<PaginatedResponse<AdminStoreCategory>>('/v1/admin/store-categories', { size: '100' });
    return res.content;
  },

  async createStoreCategory(data: { name: string; slug?: string; iconUrl?: string }): Promise<AdminStoreCategory> {
    return apiClient.post<AdminStoreCategory>('/v1/admin/store-categories', data);
  },

  async updateStoreCategory(id: string, data: Partial<AdminStoreCategory>): Promise<void> {
    await apiClient.put<void>(`/v1/admin/store-categories/${id}`, data);
  },

  async deleteStoreCategory(id: string): Promise<void> {
    await apiClient.delete<void>(`/v1/admin/store-categories/${id}`);
  },

  // Store Tags
  async getStoreTags(): Promise<AdminStoreTag[]> {
    const res = await apiClient.get<PaginatedResponse<AdminStoreTag>>('/v1/admin/store-tags', { size: '100' });
    return res.content;
  },

  async createStoreTag(data: { name: string; slug?: string; tagType?: string; colorHex?: string }): Promise<AdminStoreTag> {
    return apiClient.post<AdminStoreTag>('/v1/admin/store-tags', data);
  },

  async updateStoreTag(id: string, data: Partial<AdminStoreTag>): Promise<void> {
    await apiClient.put<void>(`/v1/admin/store-tags/${id}`, data);
  },

  async deleteStoreTag(id: string): Promise<void> {
    await apiClient.delete<void>(`/v1/admin/store-tags/${id}`);
  },

  // Drivers
  async getDrivers(params: ListParams = {}): Promise<PaginatedResponse<AdminDriver>> {
    return apiClient.get<PaginatedResponse<AdminDriver>>('/v1/admin/drivers', buildQuery(params));
  },

  async getDriverDetail(id: string): Promise<AdminDriver> {
    return apiClient.get<AdminDriver>(`/v1/admin/drivers/${id}`);
  },

  async approveDriver(id: string, data: MerchantApprovalRequest): Promise<void> {
    await apiClient.put<void>(`/v1/admin/drivers/${id}/approval`, data);
  },

  async getDriverDocuments(id: string): Promise<DriverDocument[]> {
    return apiClient.get<DriverDocument[]>(`/v1/admin/drivers/${id}/documents`);
  },

  async verifyDriverDocument(docId: string, status: 'verified' | 'rejected', reason?: string): Promise<void> {
    await apiClient.put<void>(`/v1/admin/driver-documents/${docId}/verify`, { status, reason });
  },

  async getDriverBankAccounts(id: string): Promise<DriverBankAccount[]> {
    return apiClient.get<DriverBankAccount[]>(`/v1/admin/drivers/${id}/bank-accounts`);
  },

  async getDriverWalletTransactions(id: string, params: ListParams = {}): Promise<PaginatedResponse<DriverWalletTransaction>> {
    return apiClient.get<PaginatedResponse<DriverWalletTransaction>>(`/v1/admin/drivers/${id}/wallet`, buildQuery(params));
  },

  async getDriverShifts(id: string, params: ListParams = {}): Promise<PaginatedResponse<DriverShift>> {
    return apiClient.get<PaginatedResponse<DriverShift>>(`/v1/admin/drivers/${id}/shifts`, buildQuery(params));
  },

  // Driver Incentives
  async getIncentivePrograms(): Promise<DriverIncentiveProgram[]> {
    return apiClient.get<DriverIncentiveProgram[]>('/v1/admin/incentive-programs');
  },

  async createIncentiveProgram(data: Partial<DriverIncentiveProgram>): Promise<DriverIncentiveProgram> {
    return apiClient.post<DriverIncentiveProgram>('/v1/admin/incentive-programs', data);
  },

  async updateIncentiveProgram(id: string, data: Partial<DriverIncentiveProgram>): Promise<void> {
    await apiClient.put<void>(`/v1/admin/incentive-programs/${id}`, data);
  },

  async getIncentiveProgress(programId: string): Promise<DriverIncentiveProgress[]> {
    return apiClient.get<DriverIncentiveProgress[]>(`/v1/admin/incentive-programs/${programId}/progress`);
  },

  // Orders
  async getOrders(params: ListParams = {}): Promise<PaginatedResponse<AdminOrder>> {
    return apiClient.get<PaginatedResponse<AdminOrder>>('/v1/admin/orders', buildQuery(params));
  },

  async getOrderDetail(id: string): Promise<AdminOrder> {
    return apiClient.get<AdminOrder>(`/v1/admin/orders/${id}`);
  },

  async getOrderItems(orderId: string): Promise<AdminOrderItem[]> {
    return apiClient.get<AdminOrderItem[]>(`/v1/admin/orders/${orderId}/items`);
  },

  async getOrderHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
    return apiClient.get<OrderStatusHistoryEntry[]>(`/v1/admin/orders/${orderId}/history`);
  },

  async getOrderAssignments(orderId: string): Promise<OrderAssignment[]> {
    return apiClient.get<OrderAssignment[]>(`/v1/admin/orders/${orderId}/assignments`);
  },

  async updateOrderStatus(orderId: string, status: string, note?: string): Promise<void> {
    await apiClient.put<void>(`/v1/admin/orders/${orderId}/status`, { status, note });
  },

  async assignOrderDriver(orderId: string, driverId: string): Promise<void> {
    await apiClient.put<void>(`/v1/admin/orders/${orderId}/assign-driver`, { driverId });
  },

  // Vouchers
  async getVouchers(params: ListParams = {}): Promise<PaginatedResponse<AdminVoucher>> {
    return apiClient.get<PaginatedResponse<AdminVoucher>>('/v1/admin/vouchers', buildQuery(params));
  },

  async createVoucher(data: Partial<AdminVoucher>): Promise<AdminVoucher> {
    return apiClient.post<AdminVoucher>('/v1/admin/vouchers', data);
  },

  async updateVoucher(id: string, data: Partial<AdminVoucher>): Promise<void> {
    await apiClient.put<void>(`/v1/admin/vouchers/${id}`, data);
  },

  async deleteVoucher(id: string): Promise<void> {
    await apiClient.delete<void>(`/v1/admin/vouchers/${id}`);
  },

  // Campaigns
  async getCampaigns(params: ListParams = {}): Promise<PaginatedResponse<AdminCampaign>> {
    return apiClient.get<PaginatedResponse<AdminCampaign>>('/v1/admin/campaigns', buildQuery(params));
  },

  async createCampaign(data: Partial<AdminCampaign>): Promise<AdminCampaign> {
    return apiClient.post<AdminCampaign>('/v1/admin/campaigns', data);
  },

  async updateCampaign(id: string, data: Partial<AdminCampaign>): Promise<void> {
    await apiClient.put<void>(`/v1/admin/campaigns/${id}`, data);
  },

  async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete<void>(`/v1/admin/campaigns/${id}`);
  },

  async getCampaignParticipants(campaignId: string): Promise<CampaignParticipant[]> {
    return apiClient.get<CampaignParticipant[]>(`/v1/admin/campaigns/${campaignId}/participants`);
  },

  // Banners
  async getBanners(): Promise<AdminBanner[]> {
    return apiClient.get<AdminBanner[]>('/v1/admin/banners');
  },

  async createBanner(data: Partial<AdminBanner>): Promise<AdminBanner> {
    return apiClient.post<AdminBanner>('/v1/admin/banners', data);
  },

  async updateBanner(id: string, data: Partial<AdminBanner>): Promise<void> {
    await apiClient.put<void>(`/v1/admin/banners/${id}`, data);
  },

  async deleteBanner(id: string): Promise<void> {
    await apiClient.delete<void>(`/v1/admin/banners/${id}`);
  },

  // Reviews
  async getReviews(params: ListParams = {}): Promise<PaginatedResponse<AdminReview>> {
    return apiClient.get<PaginatedResponse<AdminReview>>('/v1/admin/reviews', buildQuery(params));
  },

  async getReviewDetail(id: string): Promise<AdminReview> {
    return apiClient.get<AdminReview>(`/v1/admin/reviews/${id}`);
  },

  async updateReviewStatus(id: string, status: ReviewStatus): Promise<void> {
    await apiClient.put<void>(`/v1/admin/reviews/${id}/status`, { status });
  },


  // Configs
  async getPlatformConfigs(): Promise<PlatformConfig[]> {
    return apiClient.get<PlatformConfig[]>('/v1/admin/config/platform');
  },

  async updatePlatformConfig(key: string, value: string): Promise<void> {
    await apiClient.put<void>(`/v1/admin/config/platform/${key}`, { configValue: value });
  },

  async getDeliveryFeeConfigs(): Promise<DeliveryFeeConfig[]> {
    return apiClient.get<DeliveryFeeConfig[]>('/v1/admin/config/delivery-fees');
  },

  async updateDeliveryFeeConfig(id: string, data: Partial<DeliveryFeeConfig>): Promise<void> {
    await apiClient.put<void>(`/v1/admin/config/delivery-fees/${id}`, data);
  },

  // Notifications
  async getNotifications(params: ListParams = {}): Promise<PaginatedResponse<AdminNotification>> {
    return apiClient.get<PaginatedResponse<AdminNotification>>('/v1/admin/notifications', buildQuery(params));
  },

  async sendNotification(data: SendNotificationRequest): Promise<void> {
    await apiClient.post<void>('/v1/admin/notifications/send', data);
  },

  // Audit Logs
  async getAuditLogs(params: ListParams = {}): Promise<PaginatedResponse<AdminAuditLog>> {
    return apiClient.get<PaginatedResponse<AdminAuditLog>>('/v1/admin/audit-logs', buildQuery(params));
  },
};
