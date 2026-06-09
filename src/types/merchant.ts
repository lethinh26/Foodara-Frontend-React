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
  addressLine?: string;
  ward?: string;
  districtName?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
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
  districtName?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
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
  districtName?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
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
  districtName: string;
  cityName: string;
  latitude: number;
  longitude: number;
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

export interface StoreOperatingHoursResponse {
  storeId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  updatedAt: string;
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


// =============================================================================
// Merchant menu (M03/M04)
// =============================================================================
export interface MerchantMenuCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MerchantMenuItem {
  id: string;
  storeId: string;
  categoryId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  isAvailable: boolean;
  isActive?: boolean;
  trackInventory?: boolean;
  stockQuantity?: number;
  maxQuantityPerOrder?: number;
  dailyLimit?: number;
  dailySoldCount?: number;
  isPopular?: boolean;
  isNew?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

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
  dailyLimit?: number;
  isPopular?: boolean;
  isNew?: boolean;
  displayOrder?: number;
  /**
   * IDs of option groups (toppings/sizes) attached to this menu item.
   * `undefined` leaves existing assignments untouched on update.
   * `[]` clears all assignments.
   */
  optionGroupIds?: string[];
}

export interface MerchantOptionGroup {
  id: string;
  storeId: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
}

// =============================================================================
// Merchant orders (M05/M06/M07)
// =============================================================================
export interface MerchantOrderItem {
  id: string;
  menuItemId?: string;
  comboId?: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

export interface MerchantOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  storeId: string;
  driverId?: string | null;
  status: string;
  /** Customer info enriched by backend (M05/M06/M07 endpoints). */
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  pickupCode?: string;
  deliveryNote?: string;
  placedAt?: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantOrderDetail extends MerchantOrder {
  items?: MerchantOrderItem[];
}

// =============================================================================
// Merchant promotions (M08)
// =============================================================================
export interface MerchantVoucherRequest {
  code: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'free_ship';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  totalQuantity?: number;
  userUsageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

// =============================================================================
// Merchant reports (M09)
// =============================================================================
export interface MerchantRevenuePoint {
  date: string;
  day: string;
  revenue: number;
  orders: number;
}

// =============================================================================
// Driver info (handover screen)
// =============================================================================
export interface MerchantDriverInfo {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
}


// =============================================================================
// Combos (M03 — extension)
// =============================================================================
export interface MerchantComboItem {
  id?: string;
  menuItemId: string;
  menuItemName?: string;
  quantity: number;
}

export interface MerchantCombo {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  comboPrice: number;
  originalPrice?: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  items: MerchantComboItem[];
}

export interface MerchantComboRequestBody {
  comboRequest: {
    name: string;
    description?: string;
    imageUrl?: string;
    comboPrice: number;
    originalPrice?: number;
    isActive?: boolean;
    startsAt?: string;
    endsAt?: string;
  };
  comboItems: Array<{ menuItemId: string; quantity: number }>;
}
