

export interface DailyPlatformStats {
  id: string;
  statDate: string;
  totalOrders: number;
  totalCompletedOrders: number;
  totalCancelledOrders: number;
  totalGmv: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgDeliveryTimeMinutes: number;
  cancellationRate: number;
  newUsers: number;
  newStores: number;
  newDrivers: number;
  activeUsers: number;
  activeStores: number;
  activeDrivers: number;
}


export interface DashboardSummary {
  today: DailyPlatformStats;
  previous: DailyPlatformStats;  // yesterday or previous period for comparison
  revenueByDay: ChartDataPoint[];
  ordersByStatus: ChartDataPoint[];
  topRestaurants: TopRanking[];
  topItems: TopRanking[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface TopRanking {
  name: string;
  orders?: number;
  sold?: number;
  revenue: number;
}


export interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// User management (DB: users, user_roles, roles, permissions, user_sessions)

export type AdminUserStatus = 'active' | 'suspended' | 'banned' | 'deleted';

export interface AdminUserDetail {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  status: AdminUserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: AdminRole[];
}

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  module: string;
  description: string | null;
  createdAt: string;
}

export interface AdminRoleWithPermissions extends AdminRole {
  permissions: AdminPermission[];
}

export interface AdminSession {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page (0-indexed)
}

export interface UpdateUserStatusRequest {
  status: AdminUserStatus;
}

export interface AssignRolesRequest {
  roleIds: string[];
}

// Merchant & Store (DB: merchants, stores, store_categories, store_tags, store_documents, store_operating_hours, store_bank_accounts)

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type DocumentType = 'business_license' | 'food_safety_cert' | 'id_card_front' | 'id_card_back' | 'other';

export interface AdminMerchant {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  name: string;
  taxCode: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  storeCount?: number;
}

export interface AdminStore {
  id: string;
  merchantId: string;
  merchantName?: string;
  name: string;
  slug: string | null;
  description: string | null;
  phone: string | null;
  addressLine: string;
  ward: string | null;
  districtName: string | null;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  isOpen: boolean;
  isActive: boolean;
  autoAcceptOrders: boolean;
  avgPreparationTime: number;
  minOrderAmount: number;
  maxDeliveryRadiusKm: number | null;
  avgRating: number;
  totalRatings: number;
  totalOrders: number;
  commissionRate: number;
  coverImageUrl: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  categories?: AdminStoreCategory[];
  tags?: AdminStoreTag[];
}

export interface AdminStoreCategory {
  id: string;
  name: string;
  slug: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStoreTag {
  id: string;
  name: string;
  slug: string | null;
  tagType: string | null;
  iconUrl: string | null;
  colorHex: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface StoreDocument {
  id: string;
  merchantId: string | null;
  storeId: string | null;
  documentType: DocumentType;
  documentUrl: string;
  documentNumber: string | null;
  expiryDate: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
}

export interface StoreOperatingHour {
  id: string;
  storeId: string;
  dayOfWeek: number; // 0-6
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface StoreBankAccount {
  id: string;
  merchantId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string | null;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface MerchantApprovalRequest {
  approvalStatus: 'approved' | 'rejected';
  reason?: string;
}

export interface StoreStatusRequest {
  isActive: boolean;
}

// Driver (DB: drivers, driver_documents, driver_shifts, driver_wallet_transactions, driver_bank_accounts, driver_incentive_programs)

export type VehicleType = 'motorcycle' | 'bicycle' | 'car';
export type DriverDocType = 'id_card_front' | 'id_card_back' | 'driving_license_front' | 'driving_license_back' | 'vehicle_registration' | 'portrait';

export interface AdminDriver {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
  idNumber: string | null;
  vehicleType: VehicleType | null;
  vehiclePlate: string | null;
  vehicleBrand: string | null;
  vehicleColor: string | null;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  rejectionReason: string | null;
  isOnline: boolean;
  isBusy: boolean;
  avgRating: number;
  totalRatings: number;
  totalDeliveries: number;
  acceptanceRate: number;
  completionRate: number;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  documentType: DriverDocType;
  documentUrl: string;
  documentNumber: string | null;
  expiryDate: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface DriverShift {
  id: string;
  driverId: string;
  wentOnlineAt: string;
  wentOfflineAt: string | null;
  durationMinutes: number | null;
  totalOrders: number;
  totalEarnings: number;
  createdAt: string;
}

export interface DriverWalletTransaction {
  id: string;
  driverId: string;
  transactionType: string;
  amount: number;
  balanceAfter: number | null;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface DriverBankAccount {
  id: string;
  driverId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string | null;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface DriverIncentiveProgram {
  id: string;
  name: string;
  description: string | null;
  targetType: string;
  targetValue: number;
  bonusAmount: number;
  maxParticipants: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DriverIncentiveProgress {
  id: string;
  programId: string;
  driverId: string;
  driverName?: string;
  currentValue: number;
  isCompleted: boolean;
  completedAt: string | null;
  bonusPaid: boolean;
  paidAt: string | null;
}

// Orders (DB: orders, order_items, order_status_history, order_assignments, payments)

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  storeId: string;
  storeName?: string;
  driverId: string | null;
  driverName?: string | null;
  status: string;
  subtotal: number;
  deliveryFee: number;
  deliveryFeeDiscount: number;
  platformFee: number;
  surgeFee: number;
  storeDiscount: number;
  voucherDiscount: number;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  deliveryDistanceKm: number | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  placedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  deliveryAddressSnapshot: Record<string, unknown> | null;
  pickupCode: string | null;
  createdAt: string;
}

export interface AdminOrderItem {
  id: string;
  itemName: string;
  itemImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  optionsSnapshot: Record<string, unknown> | null;
  specialInstructions: string | null;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  changedByRole: string | null;
  note: string | null;
  createdAt: string;
}

export interface OrderAssignment {
  id: string;
  orderId: string;
  driverId: string;
  driverName?: string;
  assignmentType: 'auto' | 'manual';
  status: string;
  proposedAt: string;
  respondedAt: string | null;
  distanceToStoreKm: number | null;
  rejectionReason: string | null;
}

// Promotions (DB: vouchers, campaigns, campaign_participants, banners)

export interface AdminVoucher {
  id: string;
  voucherType: 'platform' | 'store';
  campaignId: string | null;
  merchantId: string | null;
  storeId: string | null;
  storeName?: string;
  code: string;
  title: string | null;
  description: string | null;
  discountType: 'percentage' | 'fixed' | 'free_ship';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue: number | null;
  totalQuantity: number | null;
  usedQuantity: number;
  userUsageLimit: number;
  isStackable: boolean;
  applicableTo: 'all' | 'new_user' | 'vip';
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCampaign {
  id: string;
  name: string;
  description: string | null;
  campaignType: string;
  bannerUrl: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  participantCount?: number;
}

export interface CampaignParticipant {
  id: string;
  campaignId: string;
  storeId: string;
  storeName?: string;
  status: string;
  joinedAt: string;
  endedAt: string | null;
}

export interface AdminBanner {
  id: string;
  title: string | null;
  imageUrl: string;
  targetUrl: string | null;
  targetType: string | null;
  targetId: string | null;
  position: string;
  displayOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

// Reviews (DB: reviews, review_items, review_images)

export type ReviewStatus = 'active' | 'hidden' | 'flagged' | 'deleted';

export interface AdminReview {
  id: string;
  orderId: string;
  orderNumber?: string;
  userId: string;
  userName?: string;
  storeId: string | null;
  storeName?: string;
  storeRating: number | null;
  storeComment: string | null;
  driverId: string | null;
  driverName?: string;
  driverRating: number | null;
  driverComment: string | null;
  isAnonymous: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  images?: ReviewImage[];
  items?: ReviewItem[];
}

export interface ReviewItem {
  id: string;
  reviewId: string;
  menuItemId: string | null;
  menuItemName?: string;
  rating: number | null;
  comment: string | null;
}

export interface ReviewImage {
  id: string;
  reviewId: string;
  imageUrl: string;
}


// Configs (DB: delivery_fee_configs, platform_configs)

export interface DeliveryFeeConfig {
  id: string;
  baseFee: number;
  baseDistanceKm: number;
  perKmFee: number;
  surgeEnabled: boolean;
  surgeMultiplier: number;
  surgeStartTime: string | null;
  surgeEndTime: string | null;
  rainSurgeMultiplier: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  id: string;
  configKey: string;
  configValue: string;
  configType: 'string' | 'int' | 'float' | 'boolean' | 'json';
  description: string | null;
  isEditable: boolean;
  updatedBy: string | null;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Notifications (DB: notifications)

export interface AdminNotification {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  notificationType: string;
  referenceType: string | null;
  referenceId: string | null;
  channel: string;
  isRead: boolean;
  readAt: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface SendNotificationRequest {
  targetType: 'all' | 'role' | 'user';
  targetValue?: string; // role name or user id
  title: string;
  body?: string;
  imageUrl?: string;
  notificationType: string;
  referenceType?: string;
  referenceId?: string;
  channel: string;
}

// Audit Logs (DB: admin_audit_logs)

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  module: string | null;
  entityType: string | null;
  entityId: string | null;
  oldValues: string | null; // serialized JSON
  newValues: string | null; // serialized JSON
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
