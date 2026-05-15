import { env } from '../config/env';
import { apiClient } from './apiClient';
import { delay } from '../utils/helpers';
import { mockVouchers } from '../mocks/orders';
import type { Voucher, VoucherBestChoice, VoucherCartPricing } from '../types/promotion';

interface BackendVoucher {
  id: string;
  voucherType?: string;
  storeId?: string | null;
  code?: string;
  title?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  userUsageLimit?: number;
  usedQuantity?: number;
  totalQuantity?: number;
  startsAt?: string;
  expiresAt?: string;
  isStackable?: boolean;
  isActive?: boolean;
  isCollected?: boolean;
  isUsed?: boolean;
  collectedAt?: string;
  potentialDiscount?: number;
}

interface BackendVoucherPricing {
  voucherId?: string;
  code?: string;
  voucherType?: string;
  discountType?: string;
  discountValue?: number;
  potentialDiscount?: number;
}

interface BackendBestVoucher {
  platformVoucher?: BackendVoucherPricing | null;
  storeVoucher?: BackendVoucherPricing | null;
  totalDiscount?: number;
}

interface BackendVoucherCartPricing {
  storeId?: string;
  subtotal?: number;
  totalDiscount?: number;
  subtotalAfterVoucher?: number;
  appliedPlatformVoucher?: BackendVoucherPricing | null;
  appliedPlatformShipVoucher?: BackendVoucherPricing | null;
  appliedStoreVoucher?: BackendVoucherPricing | null;
  bestPlatformVoucher?: BackendVoucherPricing | null;
  bestStoreVoucher?: BackendVoucherPricing | null;
  availableVouchers?: BackendVoucher[];
  canApply?: boolean;
  message?: string;
}

const mapDiscountType = (type?: string): Voucher['type'] => {
  if (type === 'free_ship' || type === 'free_shipping') return 'free_ship';
  if (type === 'fixed') return 'fixed';
  return 'percentage';
};

const mapScope = (type?: string): Voucher['scope'] => {
  if (type === 'store' || type === 'restaurant') return 'store';
  return 'platform';
};

const mapVoucher = (item: BackendVoucher): Voucher => {
  const minOrder = Number(item.minOrderValue || 0);
  const discountValue = Number(item.discountValue || 0);
  const maxDiscount = Number(item.maxDiscountValue || 0);

  return {
    id: item.id,
    code: item.code || '',
    title: item.title || '',
    description: item.description || '',
    type: mapDiscountType(item.discountType),
    scope: mapScope(item.voucherType),
    storeId: item.storeId || null,
    discountValue,
    maxDiscount,
    minOrderValue: minOrder,
    usageLimit: Number(item.totalQuantity || 0),
    usedCount: Number(item.usedQuantity || 0),
    userUsageLimit: Number(item.userUsageLimit || 1),
    startDate: item.startsAt || '',
    endDate: item.expiresAt || '',
    isStackable: Boolean(item.isStackable),
    isActive: item.isActive !== false,
    conditions: [
      minOrder > 0 ? `Đơn tối thiểu ${minOrder.toLocaleString('vi-VN')}d` : 'Không yêu cầu đơn tối thiểu',
      mapDiscountType(item.discountType) === 'percentage'
        ? `Giảm ${discountValue}%${maxDiscount > 0 ? ` tối đa ${maxDiscount.toLocaleString('vi-VN')}đ` : ''}`
        : mapDiscountType(item.discountType) === 'fixed'
          ? `Giảm ${discountValue.toLocaleString('vi-VN')}đ`
          : discountValue >= 100
            ? `Miễn phí giao hàng${maxDiscount > 0 ? ` (tối đa ${maxDiscount.toLocaleString('vi-VN')}đ)` : ''}`
            : `Giảm ${discountValue}% phí ship${maxDiscount > 0 ? ` tối đa ${maxDiscount.toLocaleString('vi-VN')}đ` : ''}`,
    ],
    isCollected: Boolean(item.isCollected),
    isUsed: Boolean(item.isUsed),
    collectedAt: item.collectedAt || null,
    potentialDiscount: Number(item.potentialDiscount || 0),
  };
};

const mapVoucherPricing = (item?: BackendVoucherPricing | null): VoucherBestChoice['platformVoucher'] => {
  if (!item || !item.voucherId) {
    return null;
  }
  return {
    voucherId: item.voucherId,
    code: item.code || '',
    voucherType: item.voucherType === 'store' ? 'store' : 'platform',
    discountType: mapDiscountType(item.discountType),
    discountValue: Number(item.discountValue || 0),
    potentialDiscount: Number(item.potentialDiscount || 0),
  };
};

const mapCartPricing = (item: BackendVoucherCartPricing): VoucherCartPricing => ({
  storeId: item.storeId || '',
  subtotal: Number(item.subtotal || 0),
  totalDiscount: Number(item.totalDiscount || 0),
  subtotalAfterVoucher: Number(item.subtotalAfterVoucher || 0),
  appliedPlatformVoucher: mapVoucherPricing(item.appliedPlatformVoucher),
  appliedPlatformShipVoucher: mapVoucherPricing(item.appliedPlatformShipVoucher),
  appliedStoreVoucher: mapVoucherPricing(item.appliedStoreVoucher),
  bestPlatformVoucher: mapVoucherPricing(item.bestPlatformVoucher),
  bestStoreVoucher: mapVoucherPricing(item.bestStoreVoucher),
  availableVouchers: (item.availableVouchers || []).map(mapVoucher),
  canApply: Boolean(item.canApply),
  message: item.message || '',
});

export const voucherService = {
  async getStoreVouchers(storeId: string, subtotal?: number): Promise<Voucher[]> {
    if (env.isMockMode) {
      await delay(300);
      return mockVouchers.filter(v => v.scope === 'store' && v.storeId === storeId);
    }

    const params: Record<string, string> = {};
    if (subtotal != null) {
      params.subtotal = String(subtotal);
    }
    const response = await apiClient.get<BackendVoucher[]>(`/v1/stores/${storeId}/vouchers`, params);
    return response.map(mapVoucher);
  },

  async collectVoucher(voucherId: string): Promise<Voucher> {
    if (env.isMockMode) {
      await delay(200);
      const found = mockVouchers.find(v => v.id === voucherId);
      if (!found) {
        throw new Error('Voucher không tồn tại');
      }
      return { ...found, isCollected: true };
    }

    const response = await apiClient.post<BackendVoucher>(`/v1/vouchers/${voucherId}/collect`);
    return mapVoucher(response);
  },

  async getMyVouchers(storeId?: string, subtotal?: number): Promise<Voucher[]> {
    if (env.isMockMode) {
      await delay(300);
      return mockVouchers.map(v => ({ ...v, isCollected: true }));
    }

    const params: Record<string, string> = {};
    if (storeId) {
      params.storeId = storeId;
    }
    if (subtotal != null) {
      params.subtotal = String(subtotal);
    }

    const response = await apiClient.get<BackendVoucher[]>('/v1/vouchers/my-vouchers', params);
    return response.map(mapVoucher);
  },

  async getPlatformVouchers(): Promise<Voucher[]> {
    if (env.isMockMode) {
      await delay(300);
      return mockVouchers.filter(v => v.scope === 'platform');
    }

    const response = await apiClient.get<BackendVoucher[]>('/v1/vouchers/platform');
    return response.map(mapVoucher);
  },

  async getAvailableForCart(storeId: string): Promise<VoucherCartPricing> {
    if (env.isMockMode) {
      await delay(250);
      const best = await this.getBestVoucher(storeId, 0);
      return {
        storeId,
        subtotal: 0,
        totalDiscount: best.totalDiscount,
        subtotalAfterVoucher: 0,
        appliedPlatformVoucher: best.platformVoucher,
        appliedPlatformShipVoucher: null,
        appliedStoreVoucher: best.storeVoucher,
        bestPlatformVoucher: best.platformVoucher,
        bestStoreVoucher: best.storeVoucher,
        availableVouchers: mockVouchers,
        canApply: true,
        message: 'Success',
      };
    }

    const response = await apiClient.get<BackendVoucherCartPricing>('/v1/vouchers/available', { storeId });
    return mapCartPricing(response);
  },

  async applyVouchers(payload: { storeId: string; platformVoucherId?: string; platformShipVoucherId?: string; storeVoucherId?: string }): Promise<VoucherCartPricing> {
    if (env.isMockMode) {
      await delay(250);
      return this.getAvailableForCart(payload.storeId);
    }

    const response = await apiClient.post<BackendVoucherCartPricing>('/v1/vouchers/apply', payload);
    return mapCartPricing(response);
  },

  async removeVouchers(payload: { storeId: string; removePlatform?: boolean; removeStore?: boolean }): Promise<VoucherCartPricing> {
    if (env.isMockMode) {
      await delay(180);
      return this.getAvailableForCart(payload.storeId);
    }

    const response = await apiClient.post<BackendVoucherCartPricing>('/v1/vouchers/remove', {
      storeId: payload.storeId,
      removePlatform: payload.removePlatform ?? true,
      removeStore: payload.removeStore ?? true,
    });
    return mapCartPricing(response);
  },

  async getBestVoucher(storeId: string, subtotal: number): Promise<VoucherBestChoice> {
    if (env.isMockMode) {
      await delay(250);
      const matched = mockVouchers
        .filter(v => v.isCollected !== false && subtotal >= v.minOrderValue)
        .map(v => {
          let discount = 0;
          if (v.type === 'percentage') {
            discount = Math.min((subtotal * v.discountValue) / 100, v.maxDiscount || Number.MAX_SAFE_INTEGER);
          } else if (v.type === 'fixed' || v.type === 'free_ship') {
            discount = v.discountValue;
          }
          return { voucher: v, discount };
        });

      const platform = matched
        .filter(x => x.voucher.scope === 'platform')
        .sort((a, b) => b.discount - a.discount)[0];
      const store = matched
        .filter(x => x.voucher.scope === 'store')
        .sort((a, b) => b.discount - a.discount)[0];

      return {
        platformVoucher: platform ? {
          voucherId: platform.voucher.id,
          code: platform.voucher.code,
          voucherType: 'platform',
          discountType: platform.voucher.type,
          discountValue: platform.voucher.discountValue,
          potentialDiscount: platform.discount,
        } : null,
        storeVoucher: store ? {
          voucherId: store.voucher.id,
          code: store.voucher.code,
          voucherType: 'store',
          discountType: store.voucher.type,
          discountValue: store.voucher.discountValue,
          potentialDiscount: store.discount,
        } : null,
        totalDiscount: (platform?.discount || 0) + (store?.discount || 0),
      };
    }

    const response = await apiClient.get<BackendBestVoucher>('/v1/vouchers/best', {
      storeId,
      subtotal: String(subtotal),
    });

    const platformVoucher = mapVoucherPricing(response.platformVoucher);
    const storeVoucher = mapVoucherPricing(response.storeVoucher);

    return {
      platformVoucher,
      storeVoucher,
      totalDiscount: Number(response.totalDiscount || 0),
    };
  },
};
