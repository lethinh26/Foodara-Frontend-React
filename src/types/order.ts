import type { SelectedTopping } from './menu';
import type { Address } from './location';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'driver_assigned'
  | 'driver_at_store'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'refunded';

export interface CartItem {
  id: string; // unique cart item ID
  menuItemId: string;
  restaurantId: string;
  name: string;
  image: string;
  basePrice: number;
  quantity: number;
  selectedSize: { sizeId: string; name: string; priceAdjustment: number } | null;
  selectedToppings: (SelectedTopping & { name: string; price: number })[];
  selectedVariant: { variantId: string; name: string; price: number } | null;
  note: string;
  totalPrice: number;
  discountedUnitPrice?: number;
  discountedTotalPrice?: number;
}

export interface CheckoutPricing {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discount: number;
  voucherDiscount: number;
  total: number;
  appliedVoucherIds: string[];
  breakdown: PriceBreakdownItem[];
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
  type: 'add' | 'subtract' | 'total';
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string;
  restaurantPhone: string;
  items: CartItem[];
  deliveryAddress: Address;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  pricing: CheckoutPricing;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  estimatedDeliveryTime: number; // minutes
  actualDeliveryTime: number | null;
  note: string;
  cancelReason: string;
  cancelledBy: 'customer' | 'merchant' | 'admin' | 'system' | null;
  pickupCode: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note: string;
  timestamp: string;
  updatedBy: string;
}

export interface KitchenQueueItem {
  orderId: string;
  orderNumber: string;
  items: { name: string; quantity: number; note: string }[];
  status: 'waiting' | 'preparing' | 'ready';
  estimatedPrepTime: number;
  actualPrepTime: number | null;
  priority: 'normal' | 'rush';
  receivedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
}
