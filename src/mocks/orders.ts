import type { Order, OrderStatusHistory } from '../types/order';
import type { Voucher } from '../types/promotion';
import type { Review } from '../types/review';
import type { Driver } from '../types/driver';
import type { Address } from '../types/location';

export const mockAddresses: Address[] = [
  { id: 'addr-1', userId: 'user-001', label: 'Nhà', fullAddress: '123 Nguyễn Văn Cừ, Phường 1, Quận 5, TP.HCM', street: '123 Nguyễn Văn Cừ', ward: 'Phường 1', district: 'Quận 5', city: 'TP. Hồ Chí Minh', coordinates: { lat: 10.758, lng: 106.682 }, note: 'Hẻm 123, nhà số 5', driverNote: 'Bấm chuông, tầng 3', isDefault: true, phone: '0901234567', contactName: 'Nguyễn Văn An' },
  { id: 'addr-2', userId: 'user-001', label: 'Văn phòng', fullAddress: '456 Điện Biên Phủ, Phường 11, Quận Bình Thạnh, TP.HCM', street: '456 Điện Biên Phủ', ward: 'Phường 11', district: 'Quận Bình Thạnh', city: 'TP. Hồ Chí Minh', coordinates: { lat: 10.801, lng: 106.711 }, note: 'Toà nhà ABC, tầng 12', driverNote: 'Gọi trước 5 phút', isDefault: false, phone: '0901234567', contactName: 'Nguyễn Văn An' },
  { id: 'addr-3', userId: 'user-001', label: 'Nhà bạn', fullAddress: '789 Lê Đại Hành, Phường 15, Quận 11, TP.HCM', street: '789 Lê Đại Hành', ward: 'Phường 15', district: 'Quận 11', city: 'TP. Hồ Chí Minh', coordinates: { lat: 10.765, lng: 106.650 }, note: '', driverNote: '', isDefault: false, phone: '0934567890', contactName: 'Phạm Thị Dung' },
];

export const mockVouchers: Voucher[] = [
  { id: 'v-001', code: 'FOODARA30', title: 'Giảm 30% tối đa 50k', description: 'Áp dụng cho đơn từ 100k', type: 'percentage', scope: 'platform', restaurantId: null, restaurantName: null, discountValue: 30, maxDiscount: 50000, minOrderValue: 100000, usageLimit: 1000, usedCount: 342, userUsageLimit: 1, startDate: '2025-03-01T00:00:00Z', endDate: '2025-03-31T23:59:59Z', isStackable: false, isActive: true, conditions: ['Đơn tối thiểu 100.000đ', 'Giảm tối đa 50.000đ'] },
  { id: 'v-002', code: 'FREESHIP', title: 'Miễn phí giao hàng', description: 'Áp dụng cho đơn từ 50k', type: 'free_shipping', scope: 'platform', restaurantId: null, restaurantName: null, discountValue: 100, maxDiscount: 25000, minOrderValue: 50000, usageLimit: 5000, usedCount: 1200, userUsageLimit: 3, startDate: '2025-03-01T00:00:00Z', endDate: '2025-03-31T23:59:59Z', isStackable: true, isActive: true, conditions: ['Đơn tối thiểu 50.000đ'] },
  { id: 'v-003', code: 'PHO20K', title: 'Giảm 20k - Phở Hà Nội Xưa', description: 'Giảm 20k cho đơn từ 80k tại Phở Hà Nội Xưa', type: 'fixed', scope: 'restaurant', restaurantId: 'rest-001', restaurantName: 'Phở Hà Nội Xưa', discountValue: 20000, maxDiscount: 20000, minOrderValue: 80000, usageLimit: 200, usedCount: 45, userUsageLimit: 1, startDate: '2025-03-10T00:00:00Z', endDate: '2025-03-20T23:59:59Z', isStackable: false, isActive: true, conditions: ['Chỉ áp dụng tại Phở Hà Nội Xưa', 'Đơn tối thiểu 80.000đ'] },
  { id: 'v-004', code: 'NEWUSER50', title: 'Giảm 50% cho khách mới', description: 'Dành cho đơn hàng đầu tiên', type: 'percentage', scope: 'platform', restaurantId: null, restaurantName: null, discountValue: 50, maxDiscount: 100000, minOrderValue: 0, usageLimit: 10000, usedCount: 5600, userUsageLimit: 1, startDate: '2025-01-01T00:00:00Z', endDate: '2025-12-31T23:59:59Z', isStackable: false, isActive: true, conditions: ['Chỉ áp dụng cho đơn đầu tiên'] },
];

export const mockDrivers: Driver[] = [
  { id: 'drv-001', userId: 'drv-u-001', fullName: 'Lê Văn Hùng', phone: '0971234567', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hung', vehicleType: 'motorcycle', vehiclePlate: '59B1-12345', status: 'available', currentLocation: { lat: 10.775, lng: 106.695 }, rating: 4.9, reviewCount: 567, totalDeliveries: 1234, completionRate: 98.5, joinedAt: '2023-06-15T00:00:00Z', isVerified: true, documents: [] },
  { id: 'drv-002', userId: 'drv-u-002', fullName: 'Trần Đức Mạnh', phone: '0982345678', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manh', vehicleType: 'motorcycle', vehiclePlate: '59C2-67890', status: 'busy', currentLocation: { lat: 10.770, lng: 106.690 }, rating: 4.7, reviewCount: 345, totalDeliveries: 890, completionRate: 97.2, joinedAt: '2024-01-10T00:00:00Z', isVerified: true, documents: [] },
  { id: 'drv-003', userId: 'drv-u-003', fullName: 'Phạm Quốc Tuấn', phone: '0993456789', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tuan', vehicleType: 'motorcycle', vehiclePlate: '59D1-11111', status: 'offline', currentLocation: { lat: 10.780, lng: 106.700 }, rating: 4.5, reviewCount: 123, totalDeliveries: 456, completionRate: 95.0, joinedAt: '2024-06-20T00:00:00Z', isVerified: true, documents: [] },
];

const makeHistory = (orderId: string, statuses: { status: string; note: string; time: string }[]): OrderStatusHistory[] =>
  statuses.map((s, i) => ({ id: `osh-${orderId}-${i}`, orderId, status: s.status as OrderStatusHistory['status'], note: s.note, timestamp: s.time, updatedBy: 'system' }));

export const mockOrders: Order[] = [
  {
    id: 'ord-001', orderNumber: 'FD-250315-001', customerId: 'user-001', customerName: 'Nguyễn Văn An', customerPhone: '0901234567',
    restaurantId: 'rest-001', restaurantName: 'Phở Hà Nội Xưa', restaurantLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=PHX', restaurantPhone: '0901111222',
    items: [{ id: 'ci-1', menuItemId: 'item-001', restaurantId: 'rest-001', name: 'Phở Bò Tái Nạm', image: '', basePrice: 55000, quantity: 2, selectedSize: { sizeId: 'size-m', name: 'Vừa', priceAdjustment: 0 }, selectedToppings: [], selectedVariant: null, note: 'Ít hành', totalPrice: 110000 }],
    deliveryAddress: mockAddresses[0], status: 'delivering',
    statusHistory: makeHistory('ord-001', [
      { status: 'pending', note: 'Đặt đơn', time: '2025-03-15T10:00:00Z' },
      { status: 'confirmed', note: 'Quán xác nhận', time: '2025-03-15T10:02:00Z' },
      { status: 'preparing', note: 'Đang chuẩn bị', time: '2025-03-15T10:03:00Z' },
      { status: 'ready_for_pickup', note: 'Sẵn sàng', time: '2025-03-15T10:15:00Z' },
      { status: 'picked_up', note: 'Tài xế lấy hàng', time: '2025-03-15T10:20:00Z' },
      { status: 'delivering', note: 'Đang giao', time: '2025-03-15T10:22:00Z' },
    ]),
    pricing: { subtotal: 110000, deliveryFee: 15000, platformFee: 3000, discount: 0, voucherDiscount: 0, total: 128000, appliedVoucherIds: [], breakdown: [] },
    paymentMethod: 'cod', paymentStatus: 'pending', driverId: 'drv-001', driverName: 'Lê Văn Hùng', driverPhone: '0971234567',
    estimatedDeliveryTime: 25, actualDeliveryTime: null, note: 'Ít hành', cancelReason: '', cancelledBy: null, pickupCode: 'A1B2',
    createdAt: '2025-03-15T10:00:00Z', updatedAt: '2025-03-15T10:22:00Z', completedAt: null,
  },
  {
    id: 'ord-002', orderNumber: 'FD-250314-005', customerId: 'user-001', customerName: 'Nguyễn Văn An', customerPhone: '0901234567',
    restaurantId: 'rest-002', restaurantName: 'Cơm Tấm Sài Gòn 24h', restaurantLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=CTS', restaurantPhone: '0902222333',
    items: [{ id: 'ci-2', menuItemId: 'item-005', restaurantId: 'rest-002', name: 'Cơm Tấm Sườn Bì Chả', image: '', basePrice: 45000, quantity: 1, selectedSize: null, selectedToppings: [], selectedVariant: null, note: '', totalPrice: 45000 }],
    deliveryAddress: mockAddresses[1], status: 'delivered',
    statusHistory: makeHistory('ord-002', [
      { status: 'pending', note: 'Đặt đơn', time: '2025-03-14T12:00:00Z' },
      { status: 'delivered', note: 'Đã giao', time: '2025-03-14T12:35:00Z' },
    ]),
    pricing: { subtotal: 45000, deliveryFee: 12000, platformFee: 2000, discount: 0, voucherDiscount: 12000, total: 47000, appliedVoucherIds: ['v-002'], breakdown: [] },
    paymentMethod: 'ewallet', paymentStatus: 'paid', driverId: 'drv-002', driverName: 'Trần Đức Mạnh', driverPhone: '0982345678',
    estimatedDeliveryTime: 20, actualDeliveryTime: 35, note: '', cancelReason: '', cancelledBy: null, pickupCode: 'C3D4',
    createdAt: '2025-03-14T12:00:00Z', updatedAt: '2025-03-14T12:35:00Z', completedAt: '2025-03-14T12:35:00Z',
  },
];

export const mockReviews: Review[] = [
  { id: 'rev-001', orderId: 'ord-002', customerId: 'user-001', customerName: 'Nguyễn Văn An', customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=An', restaurantId: 'rest-002', driverId: 'drv-002', restaurantRating: 5, driverRating: 5, foodRating: 5, comment: 'Cơm tấm rất ngon, sườn nướng thơm lừng!', images: [], tags: ['Ngon', 'Giao nhanh'], reply: null, isAnonymous: false, createdAt: '2025-03-14T13:00:00Z', updatedAt: '2025-03-14T13:00:00Z' },
  { id: 'rev-002', orderId: 'ord-old-01', customerId: 'user-004', customerName: 'Phạm Thị Dung', customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dung', restaurantId: 'rest-001', driverId: 'drv-001', restaurantRating: 4, driverRating: 5, foodRating: 4, comment: 'Phở ngon, nước dùng đậm đà. Giao hàng nhanh.', images: [], tags: ['Ngon', 'Nước dùng đậm'], reply: { id: 'rr-1', content: 'Cảm ơn bạn! Hẹn gặp lại!', repliedBy: 'Phở Hà Nội Xưa', repliedAt: '2025-03-13T10:00:00Z' }, isAnonymous: false, createdAt: '2025-03-13T09:00:00Z', updatedAt: '2025-03-13T10:00:00Z' },
  { id: 'rev-003', orderId: 'ord-old-02', customerId: 'user-005', customerName: 'Hoàng Văn Em', customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Em', restaurantId: 'rest-003', driverId: null, restaurantRating: 4, driverRating: null, foodRating: 5, comment: 'Trà sữa đường nâu đúng vị. Sẽ mua lại.', images: [], tags: ['Đúng vị', 'Ngọt vừa'], reply: null, isAnonymous: false, createdAt: '2025-03-12T15:00:00Z', updatedAt: '2025-03-12T15:00:00Z' },
];
