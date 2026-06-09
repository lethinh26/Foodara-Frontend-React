import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import type { RootState } from './index';
import { notificationService, type NotifItem, type NotifPage } from '../services/notificationService';

interface NotificationState {
  items: NotifItem[];
  unreadCount: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  totalPages: 0,
  currentPage: 0,
  loading: false,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetch',
  async ({ page, userIdOverride }: { page?: number; userIdOverride?: string } = {}, { getState }) => {
    const state = getState() as RootState;
    const userId = userIdOverride || state.auth.user?.id;
    return notificationService.getMyNotifications(userId, page ?? 0);
  },
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/unreadCount',
  async ({ userIdOverride }: { userIdOverride?: string } = {}, { getState }) => {
    const state = getState() as RootState;
    const userId = userIdOverride || state.auth.user?.id;
    return notificationService.getUnreadCount(userId);
  },
);

export const markAsRead = createAsyncThunk(
  'notification/markRead',
  async ({ id, userIdOverride }: { id: string; userIdOverride?: string }, { getState }) => {
    const state = getState() as RootState;
    const userId = userIdOverride || state.auth.user?.id;
    await notificationService.markAsRead(id, userId);
    return id;
  },
);

export const markAllRead = createAsyncThunk(
  'notification/markAllRead',
  async ({ userIdOverride }: { userIdOverride?: string } = {}, { getState }) => {
    const state = getState() as RootState;
    const userId = userIdOverride || state.auth.user?.id;
    await notificationService.markAllAsRead(userId);
  },
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<NotifItem>) {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) state.unreadCount += 1;
    },
    removeNotification(state, action: PayloadAction<string>) {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx >= 0) {
        if (!state.items[idx].isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.items.splice(idx, 1);
      }
    },
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
      state.totalPages = 0;
      state.currentPage = 0;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(REHYDRATE, (state) => {
        state.loading = false;
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<NotifPage>) => {
        const payload = action.payload;
        if (!payload) { state.loading = false; return; }
        const { content, totalPages, page } = payload;
        state.items = page === 0 ? content : [...state.items, ...content];
        state.totalPages = totalPages;
        state.currentPage = page;
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<{ count: number }>) => {
        state.unreadCount = action.payload.count;
      })
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<string>) => {
        const item = state.items.find((n) => n.id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notification.items;
export const selectUnreadCount = (state: RootState) => state.notification.unreadCount;
export const selectNotificationLoading = (state: RootState) => state.notification.loading;

export default notificationSlice.reducer;

