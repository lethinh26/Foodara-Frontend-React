import { env } from '../config/env';
import { delay } from '../utils/helpers';
import { apiClient } from './apiClient';
import type { CartValidationIssue } from '../types/cart';

interface BackendCheckoutPreviewResponse {
  storeId: string;
  addressId?: string | null;
  subtotal?: number;
  subtotalAfterVoucher?: number;
  deliveryFee?: number;
  distanceKm?: number;
  etaMinutes?: number | null;
  surgeMultiplier?: number;
  platformFee?: number;
  platformDiscount?: number;
  storeDiscount?: number;
  totalDiscount?: number;
  totalAmount?: number;
  canCheckout?: boolean;
  issues?: Array<{
    code?: string;
    message?: string;
    cartItemId?: string | null;
  }>;
}

export interface CheckoutPreviewPayload {
  storeId: string;
  addressId?: string;
  platformCode?: string;
  storeCode?: string;
  platformVoucherId?: string;
  storeVoucherId?: string;
  subtotalHint?: number;
  totalDiscountHint?: number;
}

export interface CheckoutPreviewResult {
  storeId: string;
  addressId: string | null;
  subtotal: number;
  subtotalAfterVoucher: number;
  deliveryFee: number;
  distanceKm: number;
  etaMinutes: number | null;
  surgeMultiplier: number;
  platformFee: number;
  platformDiscount: number;
  storeDiscount: number;
  totalDiscount: number;
  totalAmount: number;
  canCheckout: boolean;
  issues: CartValidationIssue[];
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const toIssues = (
  issues: BackendCheckoutPreviewResponse['issues']
): CartValidationIssue[] => (issues ?? []).map((issue) => ({
  code: issue?.code ?? 'UNKNOWN',
  message: issue?.message ?? 'Giỏ hàng chưa hợp lệ',
  cartItemId: issue?.cartItemId ?? null,
}));

const mapPreviewResponse = (response: BackendCheckoutPreviewResponse): CheckoutPreviewResult => ({
  storeId: response.storeId,
  addressId: response.addressId ?? null,
  subtotal: toNumber(response.subtotal),
  subtotalAfterVoucher: toNumber(response.subtotalAfterVoucher),
  deliveryFee: toNumber(response.deliveryFee),
  distanceKm: toNumber(response.distanceKm),
  etaMinutes: response.etaMinutes ?? null,
  surgeMultiplier: toNumber(response.surgeMultiplier, 1),
  platformFee: toNumber(response.platformFee),
  platformDiscount: toNumber(response.platformDiscount),
  storeDiscount: toNumber(response.storeDiscount),
  totalDiscount: toNumber(response.totalDiscount),
  totalAmount: toNumber(response.totalAmount),
  canCheckout: Boolean(response.canCheckout),
  issues: toIssues(response.issues),
});

const clampPlatformFee = (subtotalAfterVoucher: number): number => {
  if (subtotalAfterVoucher <= 0) return 0;
  const fee = subtotalAfterVoucher * 0.03;
  return Math.min(Math.max(fee, 2000), 10000);
};

export const checkoutService = {
  async getDeliveryFeeByCoords(storeId: string, lat: number, lng: number) {
    return apiClient.get<BackendCheckoutPreviewResponse>('/v1/checkout/delivery-fee/by-coords', {
      storeId, lat: String(lat), lng: String(lng),
    });
  },
  async getDeliveryFeeBatch(payload: { lat: number; lng: number; storeIds: string[] }) {
    return apiClient.post<Array<{ storeId: string; distanceKm?: number; etaMinutes?: number; deliveryFee?: number; surgeMultiplier?: number }>>('/v1/checkout/delivery-fee/batch', payload);
  },

  async preview(payload: CheckoutPreviewPayload): Promise<CheckoutPreviewResult> {
    if (env.isMockMode) {
      await delay(180);
      const subtotal = toNumber(payload.subtotalHint);
      const totalDiscount = Math.min(toNumber(payload.totalDiscountHint), subtotal);
      const subtotalAfterVoucher = Math.max(subtotal - totalDiscount, 0);
      const deliveryFee = 15000;
      const platformFee = clampPlatformFee(subtotalAfterVoucher);

      return {
        storeId: payload.storeId,
        addressId: payload.addressId ?? null,
        subtotal,
        subtotalAfterVoucher,
        deliveryFee,
        distanceKm: 3.5,
        etaMinutes: 15,
        surgeMultiplier: 1,
        platformFee,
        platformDiscount: 0,
        storeDiscount: 0,
        totalDiscount,
        totalAmount: subtotalAfterVoucher + deliveryFee + platformFee,
        canCheckout: subtotal > 0,
        issues: [],
      };
    }

    const response = await apiClient.post<BackendCheckoutPreviewResponse>('/v1/checkout/preview', {
      storeId: payload.storeId,
      addressId: payload.addressId,
      platformCode: payload.platformCode,
      storeCode: payload.storeCode,
      platformVoucherId: payload.platformVoucherId,
      storeVoucherId: payload.storeVoucherId,
    });
    return mapPreviewResponse(response);
  },
};

