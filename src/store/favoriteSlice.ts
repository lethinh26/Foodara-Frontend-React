import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Favorite } from '../types/review';
import type { RootState } from './index';

interface FavoriteState {
  items: Favorite[];
}

const initialState: FavoriteState = {
  items: [],
};

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState,
  reducers: {
    addFavorite(state, action: PayloadAction<Favorite>) {
      const exists = state.items.find(f => f.targetId === action.payload.targetId && f.type === action.payload.type);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeFavorite(state, action: PayloadAction<{ targetId: string; type: 'restaurant' | 'menu_item' }>) {
      state.items = state.items.filter(f => !(f.targetId === action.payload.targetId && f.type === action.payload.type));
    },
    clearFavorites(state) {
      state.items = [];
    },
  },
});

export const { addFavorite, removeFavorite, clearFavorites } = favoriteSlice.actions;

export const selectFavorites = (state: RootState) => state.favorite.items;
export const selectIsFavorite = (targetId: string, type: 'restaurant' | 'menu_item') =>
  (state: RootState) => state.favorite.items.some(f => f.targetId === targetId && f.type === type);

export default favoriteSlice.reducer;
