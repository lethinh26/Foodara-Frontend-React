import React, { useEffect, useState } from 'react';
import { Drawer, List, Typography, Button, Badge, Empty, Skeleton } from 'antd';
import {
  Bell,
  ShoppingBag,
  CreditCard,
  Info,
  Truck,
  MessageSquare,
  Gift,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllRead,
  addNotification,
  removeNotification,
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
} from '../store/notificationSlice';
import { useWebSocket } from '../hooks/useWebSocket';
import { selectUser } from '../store/authSlice';
import type { NotifItem } from '../services/notificationService';

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  userIdOverride?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  order: <ShoppingBag size={18} />,
  order_status: <Truck size={18} />,
  payment: <CreditCard size={18} />,
  system: <Info size={18} />,
  promo: <Gift size={18} />,
  review: <MessageSquare size={18} />,
};

const iconColors: Record<string, string> = {
  order: '#f97316',
  order_status: '#3b82f6',
  payment: '#10b981',
  system: '#8b5cf6',
  promo: '#ec4899',
  review: '#f59e0b',
};

const NotificationPanel: React.FC<Props> = ({ open, onClose, userIdOverride }) => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotificationLoading);
  const user = useAppSelector(selectUser);

  const resolvedUserId = userIdOverride || user?.id;

  // Play notification sound
  const playDing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 800;
      o.type = 'sine';
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.3);
    } catch { /* ignore audio errors */ }
  };

  useEffect(() => {
    if (open && resolvedUserId) {
      dispatch(fetchNotifications({ page: 0, userIdOverride: resolvedUserId }));
      dispatch(fetchUnreadCount({ userIdOverride: resolvedUserId }));
    }
  }, [open, dispatch, resolvedUserId]);

  // Listen for real-time WebSocket notifications
  useWebSocket<NotifItem>({
    topic: resolvedUserId ? `/topic/notifications.${resolvedUserId}` : undefined,
    onMessage: (msg) => {
      if (msg?.id) {
        dispatch(addNotification(msg));
        if (!msg.isRead) {
          dispatch(fetchUnreadCount({ userIdOverride: resolvedUserId }));
          if (!open) playDing();
        }
      }
    },
  });

  const handleMarkAll = async () => {
    await dispatch(markAllRead({ userIdOverride: resolvedUserId }));
  };

  const handleItemClick = (item: NotifItem) => {
    if (!item.isRead) {
      dispatch(markAsRead({ id: item.id, userIdOverride: resolvedUserId }));
    }
    if (item.referenceType === 'order' && item.referenceId) {
      // Route based on current page: merchant stays on /merchant/orders
      if (window.location.pathname.startsWith('/merchant')) {
        window.location.href = `/merchant/orders`;
      } else if (window.location.pathname.startsWith('/admin')) {
        window.location.href = `/admin/orders/${item.referenceId}`;
      } else {
        window.location.href = `/customer/order/${item.referenceId}`;
      }
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(removeNotification(id));
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} />
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <Badge count={unreadCount} size="small" style={{ marginLeft: 4 }} />
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              type="text"
              size="small"
              icon={<CheckCheck size={16} />}
              onClick={handleMarkAll}
            >
              Đánh dấu đã đọc tất cả
            </Button>
          )}
        </div>
      }
      open={open}
      onClose={onClose}
      width={420}
      styles={{
        body: { padding: 0 },
      }}
    >
      {loading && notifications.length === 0 ? (
        <div style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} active avatar paragraph={{ rows: 2 }} style={{ marginBottom: 16 }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          image={<Bell size={48} color="#d1d5db" />}
          description="Chưa có thông báo nào"
          style={{ marginTop: 80 }}
        />
      ) : (
        <>
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: item.isRead ? 'transparent' : 'var(--surface-soft)',
                  borderBottom: '1px solid var(--border-soft)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = item.isRead
                    ? 'transparent'
                    : 'var(--surface-soft)';
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${iconColors[item.notificationType] || 'var(--primary)'}15`,
                        color: iconColors[item.notificationType] || 'var(--primary)',
                        flexShrink: 0,
                      }}
                    >
                      {iconMap[item.notificationType] || <Bell size={18} />}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text
                        strong
                        style={{
                          fontSize: 14,
                          color: item.isRead ? 'var(--text-secondary)' : 'var(--text)',
                          fontWeight: item.isRead ? 400 : 600,
                        }}
                      >
                        {item.title}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {!item.isRead && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'var(--primary)',
                            }}
                          />
                        )}
                        <Button
                          type="text"
                          size="small"
                          icon={<Trash2 size={12} />}
                          onClick={(e) => handleDelete(e, item.id)}
                          style={{ padding: 2, minWidth: 24, color: 'var(--text-muted)' }}
                        />
                      </div>
                    </div>
                  }
                  description={
                    <div>
                      <Text
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          display: 'block',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.body?.length > 120
                          ? item.body.slice(0, 120) + '...'
                          : item.body}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, marginTop: 4, display: 'block' }}
                      >
                        {item.sentAt ? formatRelative(item.sentAt) : ''}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Drawer>
  );
};

export default NotificationPanel;
