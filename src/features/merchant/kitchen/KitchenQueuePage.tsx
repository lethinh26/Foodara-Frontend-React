import React, { useState } from 'react';
import { Card, Typography, Tag, Button, Badge, message } from 'antd';
import { Clock, ChefHat, CheckCircle2, ArrowRight } from 'lucide-react';
import type { KitchenQueueItem } from '../../../types/order';

const { Title, Text } = Typography;

const mockQueue: KitchenQueueItem[] = [
  { orderId: 'ord-001', orderNumber: 'FD-250315-001', items: [{ name: 'Phở Bò Tái Nạm', quantity: 2, note: 'Ít hành' }], status: 'preparing', estimatedPrepTime: 10, actualPrepTime: null, priority: 'normal', receivedAt: '2025-03-15T10:03:00Z', startedAt: '2025-03-15T10:05:00Z', completedAt: null },
  { orderId: 'ord-003', orderNumber: 'FD-250315-003', items: [{ name: 'Phở Gà', quantity: 1, note: '' }, { name: 'Trà Đá', quantity: 2, note: '' }], status: 'waiting', estimatedPrepTime: 8, actualPrepTime: null, priority: 'rush', receivedAt: '2025-03-15T10:10:00Z', startedAt: null, completedAt: null },
  { orderId: 'ord-004', orderNumber: 'FD-250315-004', items: [{ name: 'Phở Bò Viên', quantity: 1, note: 'Thêm hành' }], status: 'ready', estimatedPrepTime: 10, actualPrepTime: 9, priority: 'normal', receivedAt: '2025-03-15T09:50:00Z', startedAt: '2025-03-15T09:52:00Z', completedAt: '2025-03-15T10:01:00Z' },
];

const statusConfig = {
  waiting: { color: 'orange', label: 'Chờ nấu', icon: <Clock size={14} /> },
  preparing: { color: 'blue', label: 'Đang nấu', icon: <ChefHat size={14} /> },
  ready: { color: 'green', label: 'Sẵn sàng', icon: <CheckCircle2 size={14} /> },
};

const KitchenQueuePage: React.FC = () => {
  const [queue, setQueue] = useState(mockQueue);

  const moveToNext = (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'waiting' ? 'preparing' : 'ready';
    setQueue(prev => prev.map(q => q.orderId === orderId ? { ...q, status: nextStatus as KitchenQueueItem['status'], startedAt: nextStatus === 'preparing' ? new Date().toISOString() : q.startedAt, completedAt: nextStatus === 'ready' ? new Date().toISOString() : null } : q));
    message.success(nextStatus === 'preparing' ? 'Bắt đầu nấu' : 'Món đã sẵn sàng!');
  };

  const columns = ['waiting', 'preparing', 'ready'] as const;

  return (
    <div className="animate-fade-in">
      <Title level={4}>Hàng chờ chế biến</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, minHeight: 400 }}>
        {columns.map(status => {
          const items = queue.filter(q => q.status === status);
          const config = statusConfig[status];
          return (
            <div key={status}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                {config.icon}
                <Text strong>{config.label}</Text>
                <Badge count={items.length} style={{ marginLeft: 'auto' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Trống</div>
                ) : items.map(item => (
                  <Card key={item.orderId} size="small" style={{ borderRadius: 10, borderLeft: `3px solid var(--${config.color === 'orange' ? 'warning' : config.color === 'blue' ? 'info' : 'success'})` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>#{item.orderNumber}</Text>
                      {item.priority === 'rush' && <Tag color="red" style={{ fontSize: 10 }}>GẤP</Tag>}
                    </div>
                    {item.items.map((mi, i) => (
                      <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>
                        <Text>{mi.quantity}x {mi.name}</Text>
                        {mi.note && <Text type="secondary" style={{ fontSize: 11 }}> ({mi.note})</Text>}
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}><Clock size={11} /> ~{item.estimatedPrepTime} phút</Text>
                      {status !== 'ready' && (
                        <Button size="small" type="primary" icon={<ArrowRight size={12} />} onClick={() => moveToNext(item.orderId, status)}>
                          {status === 'waiting' ? 'Bắt đầu' : 'Hoàn tất'}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KitchenQueuePage;
