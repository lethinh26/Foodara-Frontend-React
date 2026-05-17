import { apiClient } from './apiClient';
import toast from 'react-hot-toast';
import type {
  MerchantProfileResponse,
  MerchantRegisterRequest,
  MerchantProfileRequest,
  MerchantDocumentRequest,
  MerchantDocumentResponse,
  StoreCreateRequest,
  StoreUpdateRequest,
  StoreOperatingHoursRequest,
  StoreResponse,
  BankAccountRequest,
  BankAccountResponse,
  StoreOperatingHoursResponse,
  MerchantMenuCategory,
  MerchantMenuItem,
  MerchantMenuCategoryRequest,
  MerchantMenuItemRequest,
  MerchantOrder,
  MerchantOrderDetail,
  MerchantVoucherRequest,
  MerchantRevenuePoint,
  MerchantDriverInfo,
  MerchantCombo,
  MerchantComboRequestBody,
  MerchantOptionGroup,
} from '../types/merchant';
import type { CampaignJoinRequest, CampaignJoinResponse, CampaignResponse, Voucher } from '../types/promotion';

// =============================================================================
// Merchant profile, stores, documents, bank accounts (M01–M02)
// =============================================================================
export const merchantService = {
  async registerMerchant(data: MerchantRegisterRequest): Promise<MerchantProfileResponse> {
    const result = await apiClient.post<MerchantProfileResponse>('/v1/merchant/register', data);
    toast.success('Đăng ký merchant thành công!');
    return result;
  },

  async getProfile(): Promise<MerchantProfileResponse> {
    return apiClient.get<MerchantProfileResponse>('/v1/merchant/profile');
  },

  async updateProfile(data: MerchantProfileRequest): Promise<MerchantProfileResponse> {
    return apiClient.put<MerchantProfileResponse>('/v1/merchant/profile', data);
  },

  async uploadDocument(data: MerchantDocumentRequest): Promise<MerchantDocumentResponse> {
    const result = await apiClient.post<MerchantDocumentResponse>('/v1/merchant/documents', data);
    toast.success('Tải lên giấy tờ thành công!');
    return result;
  },

  async getDocuments(): Promise<MerchantDocumentResponse[]> {
    return apiClient.get<MerchantDocumentResponse[]>('/v1/merchant/documents');
  },

  async createStore(data: StoreCreateRequest): Promise<StoreResponse> {
    const result = await apiClient.post<StoreResponse>('/v1/merchant/stores', data);
    toast.success('Tạo chi nhánh thành công!');
    return result;
  },

  async getStores(): Promise<StoreResponse[]> {
    return apiClient.get<StoreResponse[]>('/v1/merchant/stores');
  },

  async getStore(storeId: string): Promise<StoreResponse> {
    return apiClient.get<StoreResponse>(`/v1/merchant/stores/${storeId}`);
  },

  async updateStore(storeId: string, data: StoreUpdateRequest): Promise<StoreResponse> {
    const result = await apiClient.put<StoreResponse>(`/v1/merchant/stores/${storeId}`, data);
    toast.success('Cập nhật chi nhánh thành công!');
    return result;
  },

  async toggleStore(storeId: string): Promise<StoreResponse> {
    const result = await apiClient.put<StoreResponse>(`/v1/merchant/stores/${storeId}/toggle`, {});
    toast.success('Đã thay đổi trạng thái quán!');
    return result;
  },

  async getOperatingHours(storeId: string): Promise<StoreOperatingHoursResponse[]> {
    return apiClient.get<StoreOperatingHoursResponse[]>(`/v1/stores/${storeId}/operating-hours`);
  },

  async updateOperatingHours(storeId: string, hours: StoreOperatingHoursRequest[]): Promise<void> {
    await apiClient.put<void>(`/v1/merchant/stores/${storeId}/operating-hours`, hours);
    toast.success('Cập nhật giờ mở cửa thành công!');
  },

  async addBankAccount(data: BankAccountRequest): Promise<BankAccountResponse> {
    const result = await apiClient.post<BankAccountResponse>('/v1/merchant/bank-accounts', data);
    toast.success('Thêm tài khoản ngân hàng thành công!');
    return result;
  },

  async getBankAccounts(): Promise<BankAccountResponse[]> {
    return apiClient.get<BankAccountResponse[]>('/v1/merchant/bank-accounts');
  },

  async updateBankAccount(accountId: string, data: BankAccountRequest): Promise<BankAccountResponse> {
    const result = await apiClient.put<BankAccountResponse>(`/v1/merchant/bank-accounts/${accountId}`, data);
    toast.success('Cập nhật tài khoản ngân hàng thành công!');
    return result;
  },
};

// =============================================================================
// Menu CRUD (M03 — Menu / M04 — Inventory)
// =============================================================================
export const merchantMenuApi = {
  getCategories: (storeId: string) =>
    apiClient.get<MerchantMenuCategory[]>(`/v1/merchant/stores/${storeId}/menu-categories`),

  createCategory: (storeId: string, data: Omit<MerchantMenuCategoryRequest, 'storeId'>) =>
    apiClient.post<MerchantMenuCategory>(`/v1/merchant/stores/${storeId}/menu-categories`, { ...data, storeId }),

  updateCategory: (id: string, data: MerchantMenuCategoryRequest) =>
    apiClient.put<MerchantMenuCategory>(`/v1/merchant/menu-categories/${id}`, data),

  deleteCategory: (id: string) =>
    apiClient.delete<void>(`/v1/merchant/menu-categories/${id}`),

  getItems: (storeId: string) =>
    apiClient.get<MerchantMenuItem[]>(`/v1/merchant/stores/${storeId}/menu-items`),

  createItem: (storeId: string, data: Omit<MerchantMenuItemRequest, 'storeId'>) =>
    apiClient.post<MerchantMenuItem>(`/v1/merchant/stores/${storeId}/menu-items`, { ...data, storeId }),

  updateItem: (id: string, data: MerchantMenuItemRequest) =>
    apiClient.put<MerchantMenuItem>(`/v1/merchant/menu-items/${id}`, data),

  deleteItem: (id: string) =>
    apiClient.delete<void>(`/v1/merchant/menu-items/${id}`),

  updateAvailability: (id: string, isAvailable: boolean) =>
    apiClient.put<MerchantMenuItem>(`/v1/merchant/menu-items/${id}/availability?isAvailable=${isAvailable}`, {}),

  updateStock: (id: string, stockQuantity: number) =>
    apiClient.put<MerchantMenuItem>(`/v1/merchant/menu-items/${id}/stock?stockQuantity=${stockQuantity}`, {}),

  // Option groups (toppings, sizes, ...)
  listOptionGroups: (storeId: string) =>
    apiClient.get<MerchantOptionGroup[]>(`/v1/merchant/stores/${storeId}/option-groups`),

  /** Returns option-group IDs currently linked to a menu item — for the edit modal preload. */
  getMenuItemOptionGroups: (menuItemId: string) =>
    apiClient.get<string[]>(`/v1/merchant/menu-items/${menuItemId}/option-groups`),

  // Combos
  listCombos: (storeId: string) =>
    apiClient.get<MerchantCombo[]>(`/v1/merchant/stores/${storeId}/combos`),

  createCombo: (storeId: string, body: MerchantComboRequestBody) =>
    apiClient.post<MerchantCombo>(`/v1/merchant/stores/${storeId}/combos`, body),

  updateCombo: (id: string, body: MerchantComboRequestBody) =>
    apiClient.put<MerchantCombo>(`/v1/merchant/combos/${id}`, body),

  deleteCombo: (id: string) =>
    apiClient.delete<void>(`/v1/merchant/combos/${id}`),
};

// =============================================================================
// Order management (M05 — Inbox / M06 — Kitchen / M07 — Handover)
// =============================================================================
export const merchantOrderApi = {
  getOrders: (storeId: string) =>
    apiClient.get<MerchantOrder[]>(`/v1/merchant/stores/${storeId}/orders`),

  getOrder: (storeId: string, orderId: string) =>
    apiClient.get<MerchantOrderDetail>(`/v1/merchant/stores/${storeId}/orders/${orderId}`),

  accept: (storeId: string, orderId: string) =>
    apiClient.put<MerchantOrder>(`/v1/merchant/stores/${storeId}/orders/${orderId}/accept`, {}),

  reject: (storeId: string, orderId: string, reason: string) =>
    apiClient.put<MerchantOrder>(`/v1/merchant/stores/${storeId}/orders/${orderId}/reject`, { reason }),

  preparing: (storeId: string, orderId: string) =>
    apiClient.put<MerchantOrder>(`/v1/merchant/stores/${storeId}/orders/${orderId}/preparing`, {}),

  ready: (storeId: string, orderId: string) =>
    apiClient.put<MerchantOrder>(`/v1/merchant/stores/${storeId}/orders/${orderId}/ready`, {}),

  handover: (storeId: string, orderId: string) =>
    apiClient.put<MerchantOrder>(`/v1/merchant/stores/${storeId}/orders/${orderId}/handover`, {}),

  completed: (storeId: string, orderId: string) =>
    apiClient.put<MerchantOrder>(`/v1/merchant/stores/${storeId}/orders/${orderId}/completed`, {}),
};

// =============================================================================
// Promotions (M08 — Vouchers + Campaigns)
// =============================================================================
export const merchantPromotionApi = {
  getVouchers: () =>
    apiClient.get<Voucher[]>('/v1/merchant/vouchers'),

  createVoucher: (data: MerchantVoucherRequest & { storeId: string }) => {
    const { storeId, ...payload } = data;
    return apiClient.post<Voucher>(`/v1/merchant/vouchers/${storeId}`, payload);
  },

  updateVoucher: (id: string, data: MerchantVoucherRequest) =>
    apiClient.put<Voucher>(`/v1/merchant/vouchers/${id}`, data),

  deleteVoucher: (id: string) =>
    apiClient.delete<void>(`/v1/merchant/vouchers/${id}`),

  getAvailableCampaigns: () =>
    apiClient.get<CampaignResponse[]>('/v1/home/campaigns'),

  joinCampaign: (request: CampaignJoinRequest) =>
    apiClient.post<CampaignJoinResponse>('/v1/merchant/campaigns/join', request),

  getJoinedCampaigns: () =>
    apiClient.get<CampaignJoinResponse[]>('/v1/merchant/campaigns/join'),
};

// =============================================================================
// Reports (M09)
// =============================================================================
export const merchantReportApi = {
  totalRevenue: (storeId: string) =>
    apiClient.get<number>(`/v1/merchant/${storeId}/reports/total-revenue`),

  totalOrder: (storeId: string) =>
    apiClient.get<number>(`/v1/merchant/${storeId}/reports/total-order`),

  avgtime: (storeId: string) =>
    apiClient.get<number>(`/v1/merchant/${storeId}/reports/avg-time`),

  successRate: (storeId: string) =>
    apiClient.get<number>(`/v1/merchant/${storeId}/reports/success-rate`),

  revenueAll: (storeId: string, startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate?.trim()) params.startDate = startDate.trim();
    if (endDate?.trim()) params.endDate = endDate.trim();
    return apiClient.get<MerchantRevenuePoint[]>(
      `/v1/merchant/${storeId}/reports/revenue-data`,
      Object.keys(params).length ? params : undefined,
    );
  },
};

// =============================================================================
// Driver lookup (handover screen)
// =============================================================================
export const merchantDriverApi = {
  getDriver: (driverId: string) =>
    apiClient.get<MerchantDriverInfo>(`/v1/merchant/driver/${driverId}`),
};
