import { env } from '../config/env';
import { apiClient } from './apiClient';
import { delay, generateId } from '../utils/helpers';
import type { CartItem } from '../types/order';
import type {
  AddCartItemPayload,
  CartSnapshot,
  CartValidationIssue,
  CartValidationResult,
  UpdateCartItemPayload,
} from '../types/cart';

interface BackendCartItemOptionResponse {
  id: string;
  optionItemId: string;
  optionGroupId?: string | null;
  optionGroupName?: string | null;
  optionName?: string | null;
  priceAdjustment?: number;
  isSize?: boolean;
}

interface BackendCartItemResponse {
  id: string;
  menuItemId?: string | null;
  comboId?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  specialInstructions?: string | null;
  options?: BackendCartItemOptionResponse[];
}

interface BackendCartResponse {
  id?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  storeMinOrderAmount?: number;
  isStoreOpen?: boolean;
  totalItems?: number;
  subtotal?: number;
  updatedAt?: string | null;
  items?: BackendCartItemResponse[];
}

interface BackendCartValidationResponse {
  valid?: boolean;
  subtotal?: number;
  minOrderAmount?: number;
  shortfallAmount?: number;
  issues?: Array<{
    code?: string;
    message?: string;
    cartItemId?: string | null;
  }>;
}

const createEmptySnapshot = (): CartSnapshot => ({
  id: null,
  storeId: null,
  storeName: null,
  storeMinOrderAmount: 0,
  isStoreOpen: false,
  totalItems: 0,
  subtotal: 0,
  updatedAt: null,
  items: [],
});

let mockSnapshot: CartSnapshot = createEmptySnapshot();

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const deriveBasePrice = (unitPrice: number, options: BackendCartItemOptionResponse[]): number => {
  const optionTotal = options.reduce((sum, option) => sum + toNumber(option.priceAdjustment), 0);
  return Math.max(unitPrice - optionTotal, 0);
};

const mapBackendCartItem = (item: BackendCartItemResponse, storeId: string): CartItem => {
  const options = item.options ?? [];
  const sizeOption = options.find(option => option.isSize);
  const toppingOptions = options.filter(option => !option.isSize);
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const unitPrice = toNumber(item.unitPrice);
  const totalPrice = toNumber(item.totalPrice, unitPrice * quantity);

  return {
    id: item.id,
    menuItemId: item.menuItemId ?? '',
    restaurantId: storeId,
    name: item.name ?? 'Món ăn',
    image: item.imageUrl ?? '',
    basePrice: deriveBasePrice(unitPrice, options),
    quantity,
    selectedSize: sizeOption
      ? {
          sizeId: sizeOption.optionItemId,
          name: sizeOption.optionName ?? '',
          priceAdjustment: toNumber(sizeOption.priceAdjustment),
        }
      : null,
    selectedToppings: toppingOptions.map(option => ({
      groupId: option.optionGroupId ?? '',
      optionId: option.optionItemId,
      quantity: 1,
      name: option.optionName ?? '',
      price: toNumber(option.priceAdjustment),
    })),
    selectedVariant: null,
    note: item.specialInstructions ?? '',
    totalPrice,
  };
};

const mapBackendCart = (cart: BackendCartResponse): CartSnapshot => {
  const storeId = cart.storeId ?? null;
  const items = (cart.items ?? []).map(item => mapBackendCartItem(item, storeId ?? ''));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    id: cart.id ?? null,
    storeId,
    storeName: cart.storeName ?? null,
    storeMinOrderAmount: toNumber(cart.storeMinOrderAmount),
    isStoreOpen: Boolean(cart.isStoreOpen),
    totalItems: toNumber(cart.totalItems, totalItems),
    subtotal: toNumber(cart.subtotal, subtotal),
    updatedAt: cart.updatedAt ?? null,
    items,
  };
};

const mapValidation = (validation: BackendCartValidationResponse): CartValidationResult => {
  const issues: CartValidationIssue[] = (validation.issues ?? []).map(issue => ({
    code: issue.code ?? 'UNKNOWN',
    message: issue.message ?? 'Giỏ hàng không hợp lệ',
    cartItemId: issue.cartItemId ?? null,
  }));

  return {
    valid: Boolean(validation.valid),
    subtotal: toNumber(validation.subtotal),
    minOrderAmount: toNumber(validation.minOrderAmount),
    shortfallAmount: toNumber(validation.shortfallAmount),
    issues,
  };
};

const refreshMockSummary = (): void => {
  mockSnapshot.totalItems = mockSnapshot.items.reduce((sum, item) => sum + item.quantity, 0);
  mockSnapshot.subtotal = mockSnapshot.items.reduce((sum, item) => sum + item.totalPrice, 0);
  mockSnapshot.updatedAt = new Date().toISOString();
  if (mockSnapshot.items.length === 0) {
    mockSnapshot = createEmptySnapshot();
  }
};

const getMockUnitPrice = (payload: AddCartItemPayload): number => {
  const basePrice = payload.itemPreview?.basePrice ?? 0;
  const sizePrice = payload.itemPreview?.selectedSize?.priceAdjustment ?? 0;
  const toppingPrice = (payload.itemPreview?.selectedToppings ?? [])
    .reduce((sum, topping) => sum + topping.price * topping.quantity, 0);
  return basePrice + sizePrice + toppingPrice;
};

export const cartService = {
  async getCart(): Promise<CartSnapshot> {
    if (env.isMockMode) {
      await delay(200);
      return mockSnapshot;
    }
    const response = await apiClient.get<BackendCartResponse>('/v1/cart');
    return mapBackendCart(response);
  },

  async addItem(payload: AddCartItemPayload): Promise<CartSnapshot> {
    if (env.isMockMode) {
      await delay(250);
      if (mockSnapshot.storeId && mockSnapshot.storeId !== payload.storeId) {
        mockSnapshot = createEmptySnapshot();
      }

      const unitPrice = getMockUnitPrice(payload);
      const item: CartItem = {
        id: generateId(),
        menuItemId: payload.menuItemId ?? '',
        restaurantId: payload.storeId,
        name: payload.itemPreview?.name ?? 'Món ăn',
        image: payload.itemPreview?.image ?? '',
        basePrice: payload.itemPreview?.basePrice ?? 0,
        quantity: payload.quantity,
        selectedSize: payload.itemPreview?.selectedSize ?? null,
        selectedToppings: payload.itemPreview?.selectedToppings ?? [],
        selectedVariant: null,
        note: payload.specialInstructions ?? '',
        totalPrice: unitPrice * payload.quantity,
      };

      mockSnapshot.id = mockSnapshot.id ?? generateId();
      mockSnapshot.storeId = payload.storeId;
      mockSnapshot.storeName = payload.storeName ?? mockSnapshot.storeName;
      mockSnapshot.isStoreOpen = true;
      mockSnapshot.storeMinOrderAmount = mockSnapshot.storeMinOrderAmount || 0;
      mockSnapshot.items = [...mockSnapshot.items, item];
      refreshMockSummary();
      return mockSnapshot;
    }

    const response = await apiClient.post<BackendCartResponse>('/v1/cart/items', {
      storeId: payload.storeId,
      menuItemId: payload.menuItemId,
      comboId: payload.comboId,
      quantity: payload.quantity,
      optionItemIds: payload.optionItemIds,
      specialInstructions: payload.specialInstructions,
    });
    return mapBackendCart(response);
  },

  async updateItem(payload: UpdateCartItemPayload): Promise<CartSnapshot> {
    if (env.isMockMode) {
      await delay(200);
      const item = mockSnapshot.items.find(cartItem => cartItem.id === payload.cartItemId);
      if (!item) {
        return mockSnapshot;
      }
      const unitPrice = item.quantity > 0 ? item.totalPrice / item.quantity : 0;
      item.quantity = payload.quantity;
      item.totalPrice = unitPrice * payload.quantity;
      if (payload.specialInstructions !== undefined) {
        item.note = payload.specialInstructions;
      }
      refreshMockSummary();
      return mockSnapshot;
    }

    const response = await apiClient.put<BackendCartResponse>(`/v1/cart/items/${payload.cartItemId}`, {
      quantity: payload.quantity,
      optionItemIds: payload.optionItemIds,
      specialInstructions: payload.specialInstructions,
    });
    return mapBackendCart(response);
  },

  async removeItem(cartItemId: string): Promise<CartSnapshot> {
    if (env.isMockMode) {
      await delay(150);
      mockSnapshot.items = mockSnapshot.items.filter(item => item.id !== cartItemId);
      refreshMockSummary();
      return mockSnapshot;
    }

    const response = await apiClient.delete<BackendCartResponse>(`/v1/cart/items/${cartItemId}`);
    return mapBackendCart(response);
  },

  async clearCart(): Promise<CartSnapshot> {
    if (env.isMockMode) {
      await delay(120);
      mockSnapshot = createEmptySnapshot();
      return mockSnapshot;
    }

    await apiClient.delete<void>('/v1/cart');
    const response = await apiClient.get<BackendCartResponse>('/v1/cart');
    return mapBackendCart(response);
  },

  async validateCart(): Promise<CartValidationResult> {
    if (env.isMockMode) {
      await delay(150);
      if (mockSnapshot.items.length === 0) {
        return {
          valid: false,
          subtotal: 0,
          minOrderAmount: 0,
          shortfallAmount: 0,
          issues: [{ code: 'EMPTY_CART', message: 'Giỏ hàng đang trống', cartItemId: null }],
        };
      }
      const shortfallAmount = Math.max(mockSnapshot.storeMinOrderAmount - mockSnapshot.subtotal, 0);
      return {
        valid: shortfallAmount === 0,
        subtotal: mockSnapshot.subtotal,
        minOrderAmount: mockSnapshot.storeMinOrderAmount,
        shortfallAmount,
        issues: shortfallAmount > 0
          ? [{ code: 'MIN_ORDER_NOT_REACHED', message: 'Đơn hàng chưa đạt giá trị tối thiểu', cartItemId: null }]
          : [],
      };
    }

    const response = await apiClient.get<BackendCartValidationResponse>('/v1/cart/validate');
    return mapValidation(response);
  },
};
