import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { CartItem } from '../types/order';
import type {
  AddCartItemPayload,
  CartSnapshot,
  CartValidationResult,
  UpdateCartItemPayload,
} from '../types/cart';
import type { RootState } from './index';
import { cartService } from '../services/cartService';
import { ApiError } from '../services/apiClient';

interface CartState {
  id: string | null;
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  storeMinOrderAmount: number;
  isStoreOpen: boolean;
  subtotal: number;
  totalItems: number;
  updatedAt: string | null;
  loading: boolean;
  validating: boolean;
  error: string | null;
  validation: CartValidationResult | null;
}

const initialState: CartState = {
  id: null,
  items: [],
  restaurantId: null,
  restaurantName: null,
  storeMinOrderAmount: 0,
  isStoreOpen: false,
  subtotal: 0,
  totalItems: 0,
  updatedAt: null,
  loading: false,
  validating: false,
  error: null,
  validation: null,
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Không thể xử lý giỏ hàng. Vui lòng thử lại.';
};

const applySnapshot = (state: CartState, snapshot: CartSnapshot): void => {
  state.id = snapshot.id;
  state.items = snapshot.items;
  state.restaurantId = snapshot.storeId;
  state.restaurantName = snapshot.storeName;
  state.storeMinOrderAmount = snapshot.storeMinOrderAmount;
  state.isStoreOpen = snapshot.isStoreOpen;
  state.subtotal = snapshot.subtotal;
  state.totalItems = snapshot.totalItems;
  state.updatedAt = snapshot.updatedAt;
};

export const fetchCart = createAsyncThunk<CartSnapshot, void, { rejectValue: string }>(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      return await cartService.getCart();
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const addCartItem = createAsyncThunk<CartSnapshot, AddCartItemPayload, { rejectValue: string }>(
  'cart/addCartItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await cartService.addItem(payload);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const updateCartItem = createAsyncThunk<CartSnapshot, UpdateCartItemPayload, { rejectValue: string }>(
  'cart/updateCartItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await cartService.updateItem(payload);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const removeCartItem = createAsyncThunk<CartSnapshot, string, { rejectValue: string }>(
  'cart/removeCartItem',
  async (cartItemId, { rejectWithValue }) => {
    try {
      return await cartService.removeItem(cartItemId);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const clearCart = createAsyncThunk<CartSnapshot, void, { rejectValue: string }>(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      return await cartService.clearCart();
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

export const validateCart = createAsyncThunk<CartValidationResult, void, { rejectValue: string }>(
  'cart/validateCart',
  async (_, { rejectWithValue }) => {
    try {
      return await cartService.validateCart();
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        applySnapshot(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Không thể tải giỏ hàng.';
      })
      .addCase(addCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCartItem.fulfilled, (state, action) => {
        state.loading = false;
        applySnapshot(state, action.payload);
      })
      .addCase(addCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Không thể thêm món vào giỏ hàng.';
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        applySnapshot(state, action.payload);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Không thể cập nhật giỏ hàng.';
      })
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.loading = false;
        applySnapshot(state, action.payload);
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Không thể xóa món khỏi giỏ hàng.';
      })
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.loading = false;
        applySnapshot(state, action.payload);
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Không thể xóa giỏ hàng.';
      })
      .addCase(validateCart.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateCart.fulfilled, (state, action) => {
        state.validating = false;
        state.validation = action.payload;
      })
      .addCase(validateCart.rejected, (state, action) => {
        state.validating = false;
        state.error = action.payload ?? 'Không thể kiểm tra giỏ hàng.';
      });
  },
});

export const { clearCartError } = cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartRestaurant = createSelector(
  (state: RootState) => state.cart.restaurantId,
  (state: RootState) => state.cart.restaurantName,
  (id, name) => ({ id, name })
);
export const selectCartTotal = (state: RootState) => state.cart.subtotal;
export const selectCartCount = (state: RootState) => state.cart.totalItems;
export const selectCartValidation = (state: RootState) => state.cart.validation;
export const selectCartLoading = (state: RootState) => state.cart.loading;
export const selectCartValidating = (state: RootState) => state.cart.validating;
export const selectCartError = (state: RootState) => state.cart.error;
export const selectCartMinOrderAmount = (state: RootState) => state.cart.storeMinOrderAmount;
export const selectCartStoreOpen = (state: RootState) => state.cart.isStoreOpen;

export default cartSlice.reducer;
