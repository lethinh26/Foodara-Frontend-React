import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order';
  read: boolean;
  timestamp: string;
  link?: string;
}

interface NotificationState {
  items: Notification[];
}

const initialState: NotificationState = {
  items: [
    { id: 'n-1', title: 'Đơn hàng đang giao', message: 'Đơn #FD-250315-001 đang trên đường giao đến bạn', type: 'order', read: false, timestamp: '2025-03-15T10:22:00Z', link: '/customer/order/ord-001' },
    { id: 'n-2', title: 'Voucher mới', message: 'Bạn có voucher giảm 30% cho đơn hàng tiếp theo', type: 'info', read: false, timestamp: '2025-03-15T08:00:00Z', link: '/customer/vouchers' },
    { id: 'n-3', title: 'Đánh giá đơn hàng', message: 'Đừng quên đánh giá đơn #FD-250314-005', type: 'info', read: true, timestamp: '2025-03-14T13:00:00Z', link: '/customer/review/ord-002' },
  ],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
    },
    markAsRead(state, action: PayloadAction<string>) {
      const item = state.items.find(n => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead(state) {
      state.items.forEach(n => { n.read = true; });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter(n => n.id !== action.payload);
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification } = notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notification.items;
export const selectUnreadCount = (state: RootState) => state.notification.items.filter(n => !n.read).length;

export default notificationSlice.reducer;
