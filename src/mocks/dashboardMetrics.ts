import type { AuditLog, AdminDashboardData } from '../types/admin';
import type { PricingConfig, SLAConfig } from '../types/finance';
import type { Campaign } from '../types/promotion';
import type { Region } from '../types/location';

export const mockDashboard: AdminDashboardData = {
  totalOrders: { id: 'm1', name: 'Tổng đơn hàng', value: 12456, previousValue: 11230, change: 10.9, changeType: 'increase', unit: 'đơn', period: 'Tháng 3/2025', icon: 'ShoppingBag', color: '#4CAF50' },
  totalRevenue: { id: 'm2', name: 'Doanh thu', value: 2850000000, previousValue: 2560000000, change: 11.3, changeType: 'increase', unit: 'VND', period: 'Tháng 3/2025', icon: 'DollarSign', color: '#FF9800' },
  gmv: { id: 'm3', name: 'GMV', value: 3420000000, previousValue: 3100000000, change: 10.3, changeType: 'increase', unit: 'VND', period: 'Tháng 3/2025', icon: 'TrendingUp', color: '#2196F3' },
  aov: { id: 'm4', name: 'AOV', value: 125000, previousValue: 118000, change: 5.9, changeType: 'increase', unit: 'VND', period: 'Tháng 3/2025', icon: 'BarChart3', color: '#9C27B0' },
  cancelRate: { id: 'm5', name: 'Tỷ lệ huỷ', value: 3.2, previousValue: 4.1, change: -22.0, changeType: 'decrease', unit: '%', period: 'Tháng 3/2025', icon: 'XCircle', color: '#F44336' },
  avgDeliveryTime: { id: 'm6', name: 'TG giao TB', value: 28, previousValue: 32, change: -12.5, changeType: 'decrease', unit: 'phút', period: 'Tháng 3/2025', icon: 'Clock', color: '#00BCD4' },
  activeUsers: { id: 'm7', name: 'Người dùng', value: 8900, previousValue: 7800, change: 14.1, changeType: 'increase', unit: 'người', period: 'Tháng 3/2025', icon: 'Users', color: '#4CAF50' },
  activeRestaurants: { id: 'm8', name: 'Quán hoạt động', value: 342, previousValue: 310, change: 10.3, changeType: 'increase', unit: 'quán', period: 'Tháng 3/2025', icon: 'Store', color: '#FF9800' },
  activeDrivers: { id: 'm9', name: 'Tài xế', value: 156, previousValue: 140, change: 11.4, changeType: 'increase', unit: 'người', period: 'Tháng 3/2025', icon: 'Bike', color: '#2196F3' },
  ordersByStatus: [
    { label: 'Đang giao', value: 45 }, { label: 'Chuẩn bị', value: 32 }, { label: 'Chờ xác nhận', value: 18 },
    { label: 'Đã giao', value: 890 }, { label: 'Đã huỷ', value: 28 },
  ],
  revenueByDay: [
    { label: '01/03', value: 85000000 }, { label: '02/03', value: 92000000 }, { label: '03/03', value: 78000000 },
    { label: '04/03', value: 105000000 }, { label: '05/03', value: 98000000 }, { label: '06/03', value: 88000000 },
    { label: '07/03', value: 112000000 }, { label: '08/03', value: 120000000 }, { label: '09/03', value: 95000000 },
    { label: '10/03', value: 102000000 }, { label: '11/03', value: 110000000 }, { label: '12/03', value: 115000000 },
    { label: '13/03', value: 108000000 }, { label: '14/03', value: 125000000 }, { label: '15/03', value: 98000000 },
  ],
  ordersByHour: Array.from({ length: 24 }, (_, i) => ({ label: `${i}h`, value: Math.floor(Math.random() * 80 + (i >= 11 && i <= 13 || i >= 17 && i <= 20 ? 60 : 10)) })),
  topRestaurants: [
    { name: 'Phở Hà Nội Xưa', orders: 342, revenue: 42750000 },
    { name: 'Cơm Tấm Sài Gòn 24h', orders: 521, revenue: 23445000 },
    { name: 'Tiger Sugar', orders: 456, revenue: 25080000 },
    { name: 'Pizza 4P\'s', orders: 189, revenue: 37800000 },
    { name: 'Highlands Coffee', orders: 380, revenue: 11400000 },
  ],
  topItems: [
    { name: 'Phở Bò Tái Nạm', sold: 890, revenue: 48950000 },
    { name: 'Cơm Tấm Sườn Bì Chả', sold: 756, revenue: 34020000 },
    { name: 'Trà Sữa Đường Nâu', sold: 1200, revenue: 66000000 },
    { name: 'Bánh Mì Đặc Biệt', sold: 650, revenue: 22750000 },
    { name: 'Cà Phê Sữa Đá', sold: 1500, revenue: 37500000 },
  ],
};


export const mockPricingConfigs: PricingConfig[] = [
  { id: 'pc-001', name: 'Khu vực trung tâm', description: 'Quận 1, 3, 5, 10', zoneId: 'zone-1', zoneName: 'Trung tâm TP.HCM', baseDeliveryFee: 15000, perKmFee: 5000, peakHourMultiplier: 1.5, peakHours: ['11:00-13:00', '17:00-20:00'], rainMultiplier: 1.3, platformFeePercentage: 3, platformFeeMin: 2000, platformFeeMax: 10000, minOrderValue: 20000, smallOrderFee: 10000, smallOrderThreshold: 30000, isActive: true, updatedAt: '2025-03-01T00:00:00Z', updatedBy: 'admin' },
];

export const mockSLAConfigs: SLAConfig[] = [
  { id: 'sla-001', name: 'SLA tiêu chuẩn', description: 'Áp dụng cho tất cả quán', merchantResponseTime: 120, maxPreparationTime: 30, driverPickupTime: 10, maxDeliveryTime: 45, autoRejectAfter: 300, autoCancelAfter: 60, warningThreshold: 80, isActive: true, updatedAt: '2025-03-01T00:00:00Z', updatedBy: 'admin' },
];

export const mockCampaigns: Campaign[] = [
  { id: 'camp-001', name: 'Tháng 3 Yêu Thương', description: 'Khuyến mãi đặc biệt mừng 8/3', bannerImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', type: 'seasonal', status: 'active', startDate: '2025-03-01T00:00:00Z', endDate: '2025-03-31T23:59:59Z', budget: 500000000, spentAmount: 180000000, participatingRestaurants: 85, totalOrders: 3400, totalRevenue: 425000000, createdBy: 'admin', createdAt: '2025-02-20T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z' },
  { id: 'camp-002', name: 'Flash Sale Cuối Tuần', description: 'Giảm 50% mỗi thứ 7', bannerImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', type: 'flash_sale', status: 'scheduled', startDate: '2025-03-22T00:00:00Z', endDate: '2025-03-22T23:59:59Z', budget: 100000000, spentAmount: 0, participatingRestaurants: 50, totalOrders: 0, totalRevenue: 0, createdBy: 'admin', createdAt: '2025-03-14T00:00:00Z', updatedAt: '2025-03-14T00:00:00Z' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'al-001', userId: 'user-003', userName: 'Lê Quốc Cường', userRole: 'admin', action: 'Duyệt quán ăn', module: 'Restaurants', targetType: 'restaurant', targetId: 'rest-007', targetName: 'Gà Rán Ông Bảy', details: 'Duyệt đăng ký quán mới', ipAddress: '42.118.xxx.xxx', userAgent: 'Chrome/122', timestamp: '2025-03-15T09:00:00Z', status: 'success', metadata: {} },
  { id: 'al-002', userId: 'user-003', userName: 'Lê Quốc Cường', userRole: 'admin', action: 'Cập nhật giá', module: 'Pricing', targetType: 'pricing_config', targetId: 'pc-001', targetName: 'Khu vực trung tâm', details: 'Tăng phí giờ cao điểm từ 1.3x lên 1.5x', ipAddress: '42.118.xxx.xxx', userAgent: 'Chrome/122', timestamp: '2025-03-14T14:30:00Z', status: 'success', metadata: {} },
  { id: 'al-003', userId: 'user-003', userName: 'Lê Quốc Cường', userRole: 'admin', action: 'Khoá tài khoản', module: 'Users', targetType: 'user', targetId: 'user-007', targetName: 'Đặng Văn Giang', details: 'Vi phạm chính sách đặt hàng', ipAddress: '42.118.xxx.xxx', userAgent: 'Chrome/122', timestamp: '2025-02-20T10:00:00Z', status: 'success', metadata: {} },
];

export const mockRegions: Region[] = [
  {
    id: 'reg-001', name: 'Miền Nam', code: 'MN', isActive: true,
    cities: [
      {
        id: 'city-001', regionId: 'reg-001', name: 'TP. Hồ Chí Minh', code: 'HCM', isActive: true,
        districts: [
          { id: 'dist-001', cityId: 'city-001', name: 'Quận 1', code: 'Q1', isActive: true, zones: [{ id: 'zone-1', districtId: 'dist-001', name: 'Trung tâm Q1', code: 'Q1-TT', isActive: true, polygon: [], baseFee: 15000, peakMultiplier: 1.5 }] },
          { id: 'dist-002', cityId: 'city-001', name: 'Quận 3', code: 'Q3', isActive: true, zones: [] },
          { id: 'dist-003', cityId: 'city-001', name: 'Quận 5', code: 'Q5', isActive: true, zones: [] },
          { id: 'dist-004', cityId: 'city-001', name: 'Quận 10', code: 'Q10', isActive: true, zones: [] },
          { id: 'dist-005', cityId: 'city-001', name: 'Quận Bình Thạnh', code: 'BT', isActive: true, zones: [] },
          { id: 'dist-006', cityId: 'city-001', name: 'Quận Tân Bình', code: 'TB', isActive: false, zones: [] },
        ],
      },
    ],
  },
  {
    id: 'reg-002', name: 'Miền Bắc', code: 'MB', isActive: true,
    cities: [
      {
        id: 'city-002', regionId: 'reg-002', name: 'Hà Nội', code: 'HN', isActive: false,
        districts: [
          { id: 'dist-010', cityId: 'city-002', name: 'Hoàn Kiếm', code: 'HK', isActive: false, zones: [] },
        ],
      },
    ],
  },
];
