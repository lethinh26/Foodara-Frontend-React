import { apiClient } from './apiClient';
import { env } from '../config/env';
import { delay } from '../utils/helpers';
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
} from '../types/merchant';

export const merchantService = {
  async registerMerchant(data: MerchantRegisterRequest): Promise<MerchantProfileResponse> {
    if (env.isMockMode) {
      await delay(800);
      return {
        id: 'mock-merchant-' + Date.now(),
        ownerId: 'mock-owner-id',
        name: data.name,
        taxCode: data.taxCode || '',
        businessEmail: data.businessEmail || '',
        businessPhone: data.businessPhone || '',
        logoUrl: data.logoUrl || '',
        coverImageUrl: data.coverImageUrl || '',
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const result = await apiClient.post<MerchantProfileResponse>('/v1/merchant/register', data);
    toast.success('Đăng ký merchant thành công!');
    return result;
  },

  async getProfile(): Promise<MerchantProfileResponse> {
    if (env.isMockMode) {
      await delay(500);
      return {
        id: 'mock-merchant-id',
        ownerId: 'mock-owner-id',
        name: 'Phở Hà Nội Xưa',
        taxCode: '0123456789',
        businessEmail: 'contact@phohanoi.vn',
        businessPhone: '0901234567',
        logoUrl: '',
        coverImageUrl: '',
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return apiClient.get<MerchantProfileResponse>('/v1/merchant/profile');
  },

  async updateProfile(data: MerchantProfileRequest): Promise<MerchantProfileResponse> {
    if (env.isMockMode) {
      await delay(600);
      return {
        id: 'mock-merchant-id',
        ownerId: 'mock-owner-id',
        name: data.name || 'Phở Hà Nội Xưa',
        taxCode: data.taxCode || '',
        businessEmail: data.businessEmail || '',
        businessPhone: data.businessPhone || '',
        logoUrl: data.logoUrl || '',
        coverImageUrl: data.coverImageUrl || '',
        approvalStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return apiClient.put<MerchantProfileResponse>('/v1/merchant/profile', data);
  },

  async uploadDocument(data: MerchantDocumentRequest): Promise<MerchantDocumentResponse> {
    if (env.isMockMode) {
      await delay(800);
      return {
        id: 'mock-doc-' + Date.now(),
        merchantId: 'mock-merchant-id',
        storeId: data.storeId || '',
        documentType: data.documentType,
        documentUrl: data.documentUrl,
        documentNumber: data.documentNumber || '',
        expiryDate: data.expiryDate || '',
        verificationStatus: 'pending',
        verifiedAt: '',
        verifiedBy: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const result = await apiClient.post<MerchantDocumentResponse>('/v1/merchant/documents', data);
    toast.success('Tải lên giấy tờ thành công!');
    return result;
  },

  async getDocuments(): Promise<MerchantDocumentResponse[]> {
    if (env.isMockMode) {
      await delay(500);
      return [];
    }
    return apiClient.get<MerchantDocumentResponse[]>('/v1/merchant/documents');
  },

  async createStore(data: StoreCreateRequest): Promise<StoreResponse> {
    if (env.isMockMode) {
      await delay(800);
      return {
        id: 'mock-store-' + Date.now(),
        name: data.name,
        slug: data.slug || '',
        description: data.description || '',
        phone: data.phone || '',
        addressLine: data.addressLine,
        ward: data.ward || '',
        districtName: data.districtName || '',
        cityName: data.cityName || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        isOpen: false,
        isActive: true,
        autoAcceptOrders: data.autoAcceptOrders || false,
        avgPreparationTime: data.avgPreparationTime || 15,
        minOrderAmount: data.minOrderAmount || 0,
        avgRating: 0,
        totalRatings: 0,
        totalOrders: 0,
        coverImageUrl: data.coverImageUrl || '',
        logoUrl: data.logoUrl || '',
        createdAt: new Date().toISOString(),
      };
    }
    const result = await apiClient.post<StoreResponse>('/v1/merchant/stores', data);
    toast.success('Tạo chi nhánh thành công!');
    return result;
  },

  async getStores(): Promise<StoreResponse[]> {
    if (env.isMockMode) {
      await delay(500);
      return [];
    }
    return apiClient.get<StoreResponse[]>('/v1/merchant/stores');
  },

  async getStore(storeId: string): Promise<StoreResponse> {
    if (env.isMockMode) {
      await delay(500);
      return {
        id: storeId,
        name: 'Phở Hà Nội Xưa',
        slug: 'pho-ha-noi-xua',
        description: '',
        phone: '0901234567',
        addressLine: '123 Nguyễn Trãi',
        ward: 'Phường 1',
        districtName: 'Quận 1',
        cityName: 'TP. Hồ Chí Minh',
        latitude: 10.7755,
        longitude: 106.7004,
        isOpen: false,
        isActive: true,
        autoAcceptOrders: false,
        avgPreparationTime: 15,
        minOrderAmount: 0,
        avgRating: 0,
        totalRatings: 0,
        totalOrders: 0,
        coverImageUrl: '',
        logoUrl: '',
        createdAt: new Date().toISOString(),
      };
    }
    return apiClient.get<StoreResponse>(`/v1/merchant/stores/${storeId}`);
  },

  async updateStore(storeId: string, data: StoreUpdateRequest): Promise<StoreResponse> {
    if (env.isMockMode) {
      await delay(600);
      return {
        id: storeId,
        name: data.name || 'Phở Hà Nội Xưa',
        slug: data.slug || '',
        description: data.description || '',
        phone: data.phone || '',
        addressLine: data.addressLine || '',
        ward: data.ward || '',
        districtName: data.districtName || '',
        cityName: data.cityName || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        isOpen: false,
        isActive: true,
        autoAcceptOrders: data.autoAcceptOrders || false,
        avgPreparationTime: data.avgPreparationTime || 15,
        minOrderAmount: data.minOrderAmount || 0,
        avgRating: 0,
        totalRatings: 0,
        totalOrders: 0,
        coverImageUrl: data.coverImageUrl || '',
        logoUrl: data.logoUrl || '',
        createdAt: new Date().toISOString(),
      };
    }
    const result = await apiClient.put<StoreResponse>(`/v1/merchant/stores/${storeId}`, data);
    toast.success('Cập nhật chi nhánh thành công!');
    return result;
  },

  async toggleStore(storeId: string): Promise<StoreResponse> {
    if (env.isMockMode) {
      await delay(500);
      return {
        id: storeId,
        name: 'Phở Hà Nội Xưa',
        slug: 'pho-ha-noi-xua',
        description: '',
        phone: '0901234567',
        addressLine: '123 Nguyễn Trãi',
        ward: 'Phường 1',
        districtName: 'Quận 1',
        cityName: 'TP. Hồ Chí Minh',
        latitude: 0,
        longitude: 0,
        isOpen: true,
        isActive: true,
        autoAcceptOrders: false,
        avgPreparationTime: 15,
        minOrderAmount: 0,
        avgRating: 0,
        totalRatings: 0,
        totalOrders: 0,
        coverImageUrl: '',
        logoUrl: '',
        createdAt: new Date().toISOString(),
      };
    }
    const result = await apiClient.put<StoreResponse>(`/v1/merchant/stores/${storeId}/toggle`, {});
    toast.success('Đã thay đổi trạng thái quán!');
    return result;
  },

  async updateOperatingHours(storeId: string, hours: StoreOperatingHoursRequest[]): Promise<void> {
    if (env.isMockMode) {
      await delay(500);
      return;
    }
    await apiClient.put<void>(`/v1/merchant/stores/${storeId}/operating-hours`, hours);
    toast.success('Cập nhật giờ mở cửa thành công!');
  },

  async addBankAccount(data: BankAccountRequest): Promise<BankAccountResponse> {
    if (env.isMockMode) {
      await delay(800);
      return {
        id: 'mock-bank-' + Date.now(),
        merchantId: 'mock-merchant-id',
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        branch: data.branch || '',
        isDefault: data.isDefault || false,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const result = await apiClient.post<BankAccountResponse>('/v1/merchant/bank-accounts', data);
    toast.success('Thêm tài khoản ngân hàng thành công!');
    return result;
  },

  async getBankAccounts(): Promise<BankAccountResponse[]> {
    if (env.isMockMode) {
      await delay(500);
      return [];
    }
    return apiClient.get<BankAccountResponse[]>('/v1/merchant/bank-accounts');
  },

  async updateBankAccount(accountId: string, data: BankAccountRequest): Promise<BankAccountResponse> {
    if (env.isMockMode) {
      await delay(600);
      return {
        id: accountId,
        merchantId: 'mock-merchant-id',
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        branch: data.branch || '',
        isDefault: data.isDefault || false,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const result = await apiClient.put<BankAccountResponse>(`/v1/merchant/bank-accounts/${accountId}`, data);
    toast.success('Cập nhật tài khoản ngân hàng thành công!');
    return result;
  },
};


export interface MerchantMenuCategoryRequest {
  storeId: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface MerchantMenuItemRequest {
  storeId: string;
  categoryId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  isAvailable?: boolean;
  isActive?: boolean;
  trackInventory?: boolean;
  stockQuantity?: number;
  maxQuantityPerOrder?: number;
  isPopular?: boolean;
  isNew?: boolean;
  displayOrder?: number;
}

export const merchantMenuApi = {
  getCategories: (storeId: string) => apiClient.get<any[]>(`/v1/merchant/stores/${storeId}/menu-categories`),
  createCategory: (storeId: string, data: Omit<MerchantMenuCategoryRequest, 'storeId'>) =>
    apiClient.post<any>(`/v1/merchant/stores/${storeId}/menu-categories`, { ...data, storeId }),
  updateCategory: (id: string, data: MerchantMenuCategoryRequest) =>
    apiClient.put<any>(`/v1/merchant/menu-categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete<any>(`/v1/merchant/menu-categories/${id}`),
  getItems: (storeId: string) => apiClient.get<any[]>(`/v1/merchant/stores/${storeId}/menu-items`),
  createItem: (storeId: string, data: Omit<MerchantMenuItemRequest, 'storeId'>) =>
    apiClient.post<any>(`/v1/merchant/stores/${storeId}/menu-items`, { ...data, storeId }),
  updateItem: (id: string, data: MerchantMenuItemRequest) =>
    apiClient.put<any>(`/v1/merchant/menu-items/${id}`, data),
  deleteItem: (id: string) => apiClient.delete<any>(`/v1/merchant/menu-items/${id}`),
  updateAvailability: (id: string, isAvailable: boolean) =>
    apiClient.put<any>(`/v1/merchant/menu-items/${id}/availability?isAvailable=${isAvailable}`, {}),
  updateStock: (id: string, stockQuantity: number) =>
    apiClient.put<any>(`/v1/merchant/menu-items/${id}/stock?stockQuantity=${stockQuantity}`, {}),
};

export const merchantOrderApi = {
  getOrders: (storeId: string) => apiClient.get<any[]>(`/v1/merchant/stores/${storeId}/orders`),
  getOrder: (storeId: string, orderId: string) => apiClient.get<any>(`/v1/merchant/stores/${storeId}/orders/${orderId}`),
  accept: (storeId: string, orderId: string) => apiClient.put<any>(`/v1/merchant/stores/${storeId}/orders/${orderId}/accept`, {}),
  reject: (storeId: string, orderId: string, reason: string) =>
    apiClient.put<any>(`/v1/merchant/stores/${storeId}/orders/${orderId}/reject`, { reason }),
  preparing: (storeId: string, orderId: string) => apiClient.put<any>(`/v1/merchant/stores/${storeId}/orders/${orderId}/preparing`, {}),
  ready: (storeId: string, orderId: string) => apiClient.put<any>(`/v1/merchant/stores/${storeId}/orders/${orderId}/ready`, {}),
  handover: (storeId: string, orderId: string) => apiClient.put<any>(`/v1/merchant/stores/${storeId}/orders/${orderId}/handover`, {}),
};

export const merchantPromotionApi = {
  getVouchers: () => apiClient.get<any[]>('/v1/merchant/vouchers'),
  createVoucher: (data: unknown) => apiClient.post<any>('/v1/merchant/vouchers', data),
  updateVoucher: (id: string, data: unknown) => apiClient.put<any>(`/v1/merchant/vouchers/${id}`, data),
  getAvailableCampaigns: () => apiClient.get<any[]>('/v1/merchant/campaigns/available'),
  joinCampaign: (id: string) => apiClient.post<any>(`/v1/merchant/campaigns/${id}/join`),
};

export const merchantReportApi = {
  overview: () => apiClient.get<any>('/v1/merchant/reports/overview'),
  orders: () => apiClient.get<any[]>('/v1/merchant/reports/orders'),
};
