import type { CartItem } from './order';

export interface CartItemPreview {
  name: string;
  image: string;
  basePrice: number;
  selectedSize: CartItem['selectedSize'];
  selectedToppings: CartItem['selectedToppings'];
}

export interface AddCartItemPayload {
  storeId: string;
  storeName?: string;
  menuItemId?: string;
  comboId?: string;
  quantity: number;
  optionItemIds: string[];
  specialInstructions?: string;
  itemPreview?: CartItemPreview;
}

export interface UpdateCartItemPayload {
  cartItemId: string;
  quantity: number;
  optionItemIds?: string[];
  specialInstructions?: string;
}

export interface CartSnapshot {
  id: string | null;
  storeId: string | null;
  storeName: string | null;
  storeMinOrderAmount: number;
  isStoreOpen: boolean;
  totalItems: number;
  subtotal: number;
  updatedAt: string | null;
  items: CartItem[];
}

export interface CartValidationIssue {
  code: string;
  message: string;
  cartItemId: string | null;
}

export interface CartValidationResult {
  valid: boolean;
  subtotal: number;
  minOrderAmount: number;
  shortfallAmount: number;
  issues: CartValidationIssue[];
}
