export interface MerchantProfileResponse {
  id: string;
  ownerId: string;
  name: string;
  taxCode: string;
  businessEmail: string;
  businessPhone: string;
  logoUrl: string;
  coverImageUrl: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface MerchantRegisterRequest {
  name: string;
  taxCode?: string;
  businessEmail?: string;
  businessPhone?: string;
  logoUrl?: string;
  coverImageUrl?: string;
}

export interface MerchantProfileRequest {
  name?: string;
  taxCode?: string;
  businessEmail?: string;
  businessPhone?: string;
  logoUrl?: string;
  coverImageUrl?: string;
}

export interface MerchantDocumentRequest {
  storeId?: string;
  documentType: 'business_license' | 'food_safety_cert' | 'id_card_front' | 'id_card_back' | 'other';
  documentUrl: string;
  documentNumber?: string;
  expiryDate?: string;
}

export interface MerchantDocumentResponse {
  id: string;
  merchantId: string;
  storeId: string;
  documentType: string;
  documentUrl: string;
  documentNumber: string;
  expiryDate: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt: string;
  verifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreCreateRequest {
  name: string;
  slug?: string;
  description?: string;
  phone?: string;
  addressLine: string;
  ward?: string;
  districtId?: string;
  cityId?: string;
  latitude?: number;
  longitude?: number;
  serviceZoneId?: string;
  autoAcceptOrders?: boolean;
  avgPreparationTime?: number;
  minOrderAmount?: number;
  maxDeliveryRadiusKm?: number;
  coverImageUrl?: string;
  logoUrl?: string;
}

export interface StoreUpdateRequest {
  name?: string;
  slug?: string;
  description?: string;
  phone?: string;
  addressLine?: string;
  ward?: string;
  districtId?: string;
  cityId?: string;
  latitude?: number;
  longitude?: number;
  serviceZoneId?: string;
  autoAcceptOrders?: boolean;
  avgPreparationTime?: number;
  minOrderAmount?: number;
  maxDeliveryRadiusKm?: number;
  coverImageUrl?: string;
  logoUrl?: string;
}

export interface StoreOperatingHoursRequest {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}

export interface StoreResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  addressLine: string;
  ward: string;
  districtId: string;
  cityId: string;
  latitude: number;
  longitude: number;
  serviceZoneId: string;
  isOpen: boolean;
  isActive: boolean;
  autoAcceptOrders: boolean;
  avgPreparationTime: number;
  minOrderAmount: number;
  avgRating: number;
  totalRatings: number;
  totalOrders: number;
  coverImageUrl: string;
  logoUrl: string;
  createdAt: string;
}

export interface BankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isDefault?: boolean;
}

export interface BankAccountResponse {
  id: string;
  merchantId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
