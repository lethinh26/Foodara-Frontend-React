export type VoucherType = 'percentage' | 'fixed' | 'free_ship';
export type VoucherScope = 'platform' | 'store';

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  type: VoucherType;
  scope: VoucherScope;
  storeId: string | null;
  discountValue: number;
  maxDiscount: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  userUsageLimit: number;
  startDate: string;
  endDate: string;
  isStackable: boolean;
  isActive: boolean;
  conditions: string[];
  isCollected: boolean;
  isUsed: boolean;
  collectedAt: string | null;
  potentialDiscount: number;

  // Backend raw aliases (used by merchant promotion page that reads raw responses)
  startsAt?: string;
  expiresAt?: string;
  totalQuantity?: number;
  usedQuantity?: number;
  discountType?: string;
}

export interface VoucherPricing {
  voucherId: string;
  code: string;
  voucherType: VoucherScope;
  discountType: VoucherType;
  discountValue: number;
  potentialDiscount: number;
}

export interface VoucherBestChoice {
  platformVoucher: VoucherPricing | null;
  storeVoucher: VoucherPricing | null;
  totalDiscount: number;
}

export interface VoucherCartPricing {
  storeId: string;
  subtotal: number;
  totalDiscount: number;
  subtotalAfterVoucher: number;
  appliedPlatformVoucher: VoucherPricing | null;
  appliedPlatformShipVoucher: VoucherPricing | null;
  appliedStoreVoucher: VoucherPricing | null;
  bestPlatformVoucher: VoucherPricing | null;
  bestStoreVoucher: VoucherPricing | null;
  availableVouchers: Voucher[];
  canApply: boolean;
  message: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  type: 'flash_deal' | 'free_ship' | 'bundle' | 'percentage_off' | 'new_user';
  startDate: string;
  endDate: string;
  isActive: boolean;
  restaurantIds: string[];
  menuItemIds: string[];
  discountPercentage: number;
  maxDiscount: number;
  minOrderValue: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  bannerImage: string;
  type: 'seasonal' | 'flash_sale' | 'partnership' | 'loyalty' | 'new_user';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
  startDate: string;
  endDate: string;
  budget: number;
  spentAmount: number;
  participatingRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignResponse {
  bannerUrl: string;
  campaignType: string;
  createdAt: string;
  description: string;
  endsAt: string;
  id: string;
  isActive: boolean;
  name: string;
  startsAt: string
}

export interface CampaignJoinRequest {
  campaignId: string;
  storeId: string;
}

export interface CampaignJoinResponse {
  campaignId: string;
  storeId: string;
  joinedAt: string;
  status: string
  endedAt: string
}

export interface VoucherRequest {
  title: string;
  description: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  discountType: VoucherType;
  scope: VoucherScope;
  startDate: string;
  endDate: string;
  totalQuantity: number;
  storeId: string;
}