import type { Coordinates, TimeRange, FileUpload } from './common';

export type RestaurantStatus = 'open' | 'closed' | 'busy' | 'suspended' | 'pending_approval';

export interface RestaurantCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
  description: string;
  restaurantCount: number;
  sortOrder: number;
  isActive: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  logo: string;
  categories: string[]; // category IDs
  categoryNames: string[];
  address: string;
  coordinates: Coordinates;
  phone: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  minOrder: number;
  estimatedDeliveryTime: number; // minutes
  distance: number; // km from user
  openingHours: TimeRange[];
  status: RestaurantStatus;
  isVerified: boolean;
  isFeatured: boolean;
  isNew: boolean;
  hasPromotion: boolean;
  promotionText: string;
  totalOrders: number;
  merchantId: string;
  createdAt: string;
  updatedAt: string;

  /** True only when the merchant flag + today's operating hours both allow ordering. */
  isOpenNow?: boolean;
  /**
   * Lý do quán đang đóng:
   * {@code merchant_closed} | {@code inactive} | {@code day_off} | {@code outside_hours}.
   */
  closeReason?: 'merchant_closed' | 'inactive' | 'day_off' | 'outside_hours' | string;
  /** ISO local-time string (HH:mm) for the next opening; absent when unknown. */
  nextOpenTime?: string;
}

export interface MerchantProfile {
  id: string;
  userId: string;
  restaurantId: string;
  businessName: string;
  businessType: string;
  taxId: string;
  bankAccount: string;
  bankName: string;
  accountHolder: string;
  documents: MerchantDocument[];
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  approvalNote: string;
  joinedAt: string;
  contractStartDate: string;
  contractEndDate: string;
  commissionRate: number; // percentage
}

export interface MerchantDocument {
  id: string;
  type: 'business_license' | 'food_safety' | 'id_card' | 'bank_statement' | 'other';
  name: string;
  file: FileUpload;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  uploadedAt: string;
  reviewedAt: string;
}

export interface RestaurantFilters {
  query: string;
  categoryIds: string[];
  minRating: number;
  maxDeliveryFee: number;
  maxEta: number;
  hasPromotion: boolean;
  sortBy: 'distance' | 'rating' | 'popular' | 'delivery_fee' | 'eta';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
