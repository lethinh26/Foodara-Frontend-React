import { apiClient } from './apiClient';
import { env } from '../config/env';
import { delay, generateId } from '../utils/helpers';
import { mockOrders } from '../mocks/orders';
import type { Order } from '../types/order';

// Response type from backend PlaceOrderResponse
export interface PlaceOrderApiRequest {
  storeId: string;
  addressId: string;
  paymentMethod: 'cod' | 'qr';
  note?: string;
  platformVoucherId?: string;
  storeVoucherId?: string;
  platformCode?: string;
  storeCode?: string;
}

export interface PlaceOrderApiResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  voucherDiscount: number;
  totalAmount: number;
  checkoutUrl: string | null;
  placedAt: string;
  estimatedDeliveryTime: number;
}

export interface OrderTrackingResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  storeId: string;
  storeName: string;
  storeLatitude: number;
  storeLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverLatitude: number | null;
  driverLongitude: number | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  polyline: string | null;
}

function mapBackendOrder(raw: any): Order {
  const pricing = {
    subtotal: raw.subtotal ?? 0,
    deliveryFee: raw.deliveryFee ?? 0,
    platformFee: raw.platformFee ?? 0,
    discount: raw.storeDiscount ?? 0,
    voucherDiscount: raw.voucherDiscount ?? 0,
    total: raw.totalAmount ?? 0,
    appliedVoucherIds: [raw.platformVoucherId, raw.storeVoucherId].filter(Boolean) as string[],
    breakdown: [],
  };

  let deliveryAddress = {
    id: raw.deliveryAddressId || '',
    userId: raw.customerId || '',
    label: '',
    fullAddress: '',
    street: '',
    ward: '',
    districtName: '',
    cityName: '',
    coordinates: { lat: Number(raw.deliveryLatitude) || 0, lng: Number(raw.deliveryLongitude) || 0 },
    note: raw.deliveryNote || '',
    driverNote: '',
    isDefault: false,
    phone: '',
    contactName: '',
  };
  if (raw.deliveryAddressSnapshot) {
    try {
      const snap = typeof raw.deliveryAddressSnapshot === 'string'
        ? JSON.parse(raw.deliveryAddressSnapshot)
        : raw.deliveryAddressSnapshot;
      deliveryAddress = {
        ...deliveryAddress,
        street: snap.addressLine || '',
        ward: snap.ward || '',
        districtName: snap.district || '',
        cityName: snap.city || '',
        fullAddress: [snap.addressLine, snap.ward, snap.district, snap.city].filter(Boolean).join(', '),
        phone: snap.phone || '',
        contactName: snap.name || '',
      };
    } catch {  }
  }

  const items = (raw.orderItems || raw.items || []).map((item: any) => ({
    id: item.id || '',
    menuItemId: item.menuItemId || '',
    restaurantId: raw.storeId || '',
    name: item.itemName || '',
    image: item.itemImageUrl || '',
    basePrice: Number(item.unitPrice) || 0,
    quantity: item.quantity || 1,
    selectedSize: null,
    selectedToppings: [],
    selectedVariant: null,
    note: item.specialInstructions || '',
    totalPrice: Number(item.totalPrice) || 0,
  }));

  const statusHistory = (raw.statusHistories || raw.statusHistory || []).map((h: any) => ({
    id: h.id || '',
    orderId: raw.id || '',
    status: h.toStatus || h.status || '',
    note: h.note || '',
    timestamp: h.createdAt || h.timestamp || '',
    updatedBy: h.changedBy || h.updatedBy || '',
  }));

  return {
    id: raw.id || '',
    orderNumber: raw.orderNumber || '',
    customerId: raw.customerId || '',
    customerName: '',
    customerPhone: '',
    restaurantId: raw.storeId || '',
    restaurantName: raw.storeName || '',
    restaurantLogo: raw.storeLogoUrl || '',
    restaurantPhone: raw.storePhone || '',
    items,
    deliveryAddress,
    status: raw.status || 'pending',
    statusHistory,
    pricing,
    paymentMethod: raw.paymentMethod || 'cod',
    paymentStatus: raw.paymentStatus || 'pending',
    driverId: raw.driverId || null,
    driverName: null,
    driverPhone: null,
    estimatedDeliveryTime: raw.estimatedTotalTime || raw.estimatedDeliveryTime || 35,
    actualDeliveryTime: null,
    note: raw.deliveryNote || '',
    cancelReason: raw.cancellationReason || '',
    cancelledBy: raw.cancelledBy ? raw.cancelledBy.toLowerCase() : null,
    pickupCode: raw.pickupCode || '',
    createdAt: raw.createdAt || raw.placedAt || '',
    updatedAt: raw.updatedAt || '',
    completedAt: raw.completedAt || null,
  };
}

export const orderService = {
  async createOrder(data: PlaceOrderApiRequest): Promise<PlaceOrderApiResponse> {
    if (env.isMockMode) {
      await delay(1000);
      return {
        orderId: generateId(),
        orderNumber: `FD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
        status: 'PENDING',
        paymentMethod: data.paymentMethod,
        paymentStatus: 'pending',
        subtotal: 0,
        deliveryFee: 0,
        platformFee: 0,
        voucherDiscount: 0,
        totalAmount: 0,
        checkoutUrl: null,
        placedAt: new Date().toISOString(),
        estimatedDeliveryTime: 35,
      };
    }
    return apiClient.post<PlaceOrderApiResponse>('/v1/orders', data);
  },

  async getOrders(): Promise<Order[]> {
    if (env.isMockMode) {
      await delay(600);
      return mockOrders;
    }
    const rawList = await apiClient.get<any[]>('/v1/orders');
    return rawList.map(mapBackendOrder);
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (env.isMockMode) {
      await delay(500);
      return mockOrders.find(o => o.id === id) || null;
    }
    try {
      const raw = await apiClient.get<any>(`/v1/orders/${id}`);
      return mapBackendOrder(raw);
    } catch {
      return null;
    }
  },

  async getOrderTracking(id: string): Promise<OrderTrackingResponse | null> {
    if (env.isMockMode) {
      await delay(400);
      return {
        orderId: id,
        orderNumber: 'FD-MOCK',
        status: 'delivering',
        storeId: '',
        storeName: 'Mock Store',
        storeLatitude: 10.8231,
        storeLongitude: 106.6297,
        deliveryLatitude: 10.8500,
        deliveryLongitude: 106.6500,
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverLatitude: null,
        driverLongitude: null,
        distanceKm: null,
        etaMinutes: null,
        polyline: null,
      };
    }
    try {
      return await apiClient.get<OrderTrackingResponse>(`/v1/orders/${id}/tracking`);
    } catch {
      return null;
    }
  },

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    if (env.isMockMode) {
      await delay(500);
      return;
    }
    await apiClient.put(`/v1/orders/${orderId}/cancel`, { reason });
  },

  async reorder(orderId: string): Promise<{ cartId: string; storeId: string; copiedItems: number; skippedItems: number }> {
    if (env.isMockMode) {
      await delay(500);
      return { cartId: '', storeId: '', copiedItems: 0, skippedItems: 0 };
    }
    return apiClient.post(`/v1/orders/${orderId}/reorder`, {});
  },

    async getMerchantOrders(restaurantId: string): Promise<Order[]> {
    if (env.isMockMode) {
      await delay(500);
      return mockOrders.filter(o => o.restaurantId === restaurantId);
    }
    const rawList = await apiClient.get<any[]>(`/v1/merchant/stores/${restaurantId}/orders`);
    return rawList.map(mapBackendOrder);
  },

  async updateOrderStatus(orderId: string, status: Order['status'], _note: string = ''): Promise<Order> {
    if (env.isMockMode) {
      await delay(500);
      const order = mockOrders.find(o => o.id === orderId);
      if (!order) throw new Error('Không tìm thấy đơn hàng');
      return { ...order, status, updatedAt: new Date().toISOString() };
    }
    throw new Error('Not implemented — use merchant-specific endpoints');
  },
};
