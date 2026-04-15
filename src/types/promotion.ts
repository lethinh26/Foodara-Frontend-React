export type VoucherType = 'percentage' | 'fixed' | 'free_shipping';
export type VoucherScope = 'platform' | 'restaurant';

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  type: VoucherType;
  scope: VoucherScope;
  restaurantId: string | null;
  restaurantName: string | null;
  discountValue: number; // percentage or fixed amount
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
