import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { CartItem } from '../types/order';
import type { RootState } from './index';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
}

const initialState: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<{ item: CartItem; restaurantId: string; restaurantName: string }>) {
      const { item, restaurantId, restaurantName } = action.payload;
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
      }
      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;
      const existingIndex = state.items.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        state.items[existingIndex] = item;
      } else {
        state.items.push(item);
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload);
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }
    },
    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        item.totalPrice = (item.basePrice + (item.selectedSize?.priceAdjustment || 0) + item.selectedToppings.reduce((s, t) => s + t.price * t.quantity, 0)) * item.quantity;
      }
    },
    clearCart(state) {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartRestaurant = createSelector(
  (state: RootState) => state.cart.restaurantId,
  (state: RootState) => state.cart.restaurantName,
  (id, name) => ({ id, name })
);
export const selectCartTotal = (state: RootState) => state.cart.items.reduce((sum, i) => sum + i.totalPrice, 0);
export const selectCartCount = (state: RootState) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;
