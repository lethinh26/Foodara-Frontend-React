import { delay, generateId } from '../utils/helpers';
import { mockOrders, mockVouchers } from '../mocks/orders';
import type { Order, CheckoutPricing } from '../types/order';
import type { Voucher } from '../types/promotion';

export const orderService = {
  async getOrders(userId: string): Promise<Order[]> {
    await delay(600);
    return mockOrders.filter(o => o.customerId === userId);
  },

  async getOrderById(id: string): Promise<Order | null> {
    await delay(500);
    return mockOrders.find(o => o.id === id) || null;
  },

  async getAllOrders(): Promise<Order[]> {
    await delay(600);
    return mockOrders;
  },

  async getMerchantOrders(restaurantId: string): Promise<Order[]> {
    await delay(500);
    return mockOrders.filter(o => o.restaurantId === restaurantId);
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    await delay(1000);
    const order: Order = {
      ...mockOrders[0],
      ...orderData,
      id: generateId(),
      orderNumber: `FD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
      status: 'pending',
      statusHistory: [{ id: generateId(), orderId: '', status: 'pending', note: 'Đặt đơn thành công', timestamp: new Date().toISOString(), updatedBy: 'system' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };
    return order;
  },

  async updateOrderStatus(orderId: string, status: Order['status'], _note: string = ''): Promise<Order> {
    await delay(500);
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    return { ...order, status, updatedAt: new Date().toISOString() };
  },

  async calculatePricing(subtotal: number, deliveryFee: number, vouchers: Voucher[]): Promise<CheckoutPricing> {
    await delay(300);
    const platformFee = Math.min(Math.max(subtotal * 0.03, 2000), 10000);
    let voucherDiscount = 0;
    vouchers.forEach(v => {
      if (v.type === 'percentage') voucherDiscount += Math.min(subtotal * v.discountValue / 100, v.maxDiscount);
      else if (v.type === 'fixed') voucherDiscount += v.discountValue;
      else if (v.type === 'free_shipping') voucherDiscount += Math.min(deliveryFee, v.maxDiscount);
    });
    const total = subtotal + deliveryFee + platformFee - voucherDiscount;
    return {
      subtotal, deliveryFee, platformFee, discount: 0, voucherDiscount,
      total: Math.max(total, 0),
      appliedVoucherIds: vouchers.map(v => v.id),
      breakdown: [
        { label: 'Tạm tính', amount: subtotal, type: 'add' },
        { label: 'Phí giao hàng', amount: deliveryFee, type: 'add' },
        { label: 'Phí nền tảng', amount: platformFee, type: 'add' },
        ...(voucherDiscount > 0 ? [{ label: 'Voucher', amount: -voucherDiscount, type: 'subtract' as const }] : []),
        { label: 'Tổng cộng', amount: Math.max(total, 0), type: 'total' as const },
      ],
    };
  },

  async getVouchers(): Promise<Voucher[]> {
    await delay(400);
    return mockVouchers;
  },

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    await delay(500);
    console.info(`Order ${orderId} cancelled: ${reason}`);
  },
};
