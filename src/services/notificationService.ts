import { apiClient } from './apiClient';

export interface NotifItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  imageUrl?: string;
  notificationType: string;
  referenceType?: string;
  referenceId?: string;
  channel?: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface NotifPage {
  content: NotifItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

function headers(userId?: string): Record<string, string> | undefined {
  return userId ? { 'X-User-Id': userId } : undefined;
}

export const notificationService = {
  getMyNotifications(userId?: string, page = 0, size = 20): Promise<NotifPage> {
    return apiClient.get<NotifPage>(
      `/v1/notifications/me?page=${page}&size=${size}`,
      undefined,
      headers(userId),
    );
  },

  getUnreadCount(userId?: string): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(
      '/v1/notifications/me/unread-count',
      undefined,
      headers(userId),
    );
  },

  markAsRead(id: string, userId?: string): Promise<{ status: string }> {
    return apiClient.put<{ status: string }>(
      `/v1/notifications/${id}/read`,
      undefined,
      headers(userId),
    );
  },

  markAllAsRead(userId?: string): Promise<{ status: string }> {
    return apiClient.put<{ status: string }>(
      '/v1/notifications/read-all',
      undefined,
      headers(userId),
    );
  },

  deleteNotification(id: string, userId?: string): Promise<{ status: string }> {
    return apiClient.delete<{ status: string }>(
      `/v1/notifications/${id}`,
      headers(userId),
    );
  },

  // Admin APIs
  adminGetNotifications(page = 0, size = 20, type?: string): Promise<NotifPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (type) params.set('type', type);
    return apiClient.get<NotifPage>(`/v1/admin/notifications?${params.toString()}`);
  },

  adminSend(data: {
    title: string;
    body: string;
    userId?: string;
    notificationType?: string;
    channel?: string;
    imageUrl?: string;
  }): Promise<{ status: string }> {
    return apiClient.post<{ status: string }>('/v1/admin/notifications/send', data);
  },
};
