import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Typography, Empty, Tabs, Modal, Input, Space, Badge, message } from 'antd';
import { Check, X, Clock } from 'lucide-react';
import { merchantService, merchantOrderApi } from '../../../services/merchantService';
import { formatVND, formatRelativeTime } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import type { Order } from '../../../types/order';
import { useWebSocket } from '../../../hooks/useWebSocket';

const { Title, Text } = Typography;

const OrderInbox: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);

  useWebSocket({
    topic: storeId ? `/topic/merchant.${storeId}.orders` : undefined,
    onMessage: (msg) => {
      if (msg && msg.id) {
        setOrders(prev => [msg, ...prev]);
        message.success('Có đơn hàng mới!');
        try {
          const audio = new Audio('/sound/ting.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {}
      }
    }
  });

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const stores = await merchantService.getStores();
        const activeStoreId = stores[0]?.id;
        setStoreId(activeStoreId || null);
        if (!activeStoreId) return;
        const result = await merchantOrderApi.getOrders(activeStoreId);
        setOrders(result as Order[]);
      } catch (error: any) {
        message.error(error?.message || 'Khong tai duoc don hang merchant');
      }
    };

    loadOrders();
  }, []);

  const handleAccept = async (orderId: string) => {
    if (!storeId) return;
    await merchantOrderApi.accept(storeId, orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o));
    message.success('Đã xác nhận đơn hàng');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!storeId) return;
    await merchantOrderApi.reject(storeId, rejectModal, rejectReason);
    setOrders(prev => prev.map(o => o.id === rejectModal ? { ...o, status: 'cancelled', cancelReason: rejectReason } : o));
    message.warning('Đã từ chối đơn hàng');
    setRejectModal(null);
    setRejectReason('');
  };

  const pending = orders.filter(o => o.status === 'pending');
  const confirmed = orders.filter(o => ['confirmed', 'preparing'].includes(o.status));
  const completed = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <Card style={{ borderRadius: 12, marginBottom: 12, borderLeft: `4px solid ${ORDER_STATUS_COLORS[order.status]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <Text strong>#{order.orderNumber}</Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{formatRelativeTime(order.createdAt)}</Text>
        </div>
        <Tag color={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Tag>
      </div>
      <div style={{ marginBottom: 8 }}>
        {order.items.map(item => (
          <div key={item.id} style={{ fontSize: 13, padding: '2px 0' }}>
            <Text>{item.quantity}x {item.name}</Text>
            {item.note && <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>({item.note})</Text>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text strong style={{ color: 'var(--primary)' }}>{formatVND(order.pricing.total)}</Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{order.paymentMethod === 'cod' ? 'COD' : 'Đã thanh toán'}</Text>
        </div>
        {order.status === 'pending' && (
          <Space>
            <Button type="primary" icon={<Check size={14} />} onClick={() => handleAccept(order.id)}>Xác nhận</Button>
            <Button danger icon={<X size={14} />} onClick={() => setRejectModal(order.id)}>Từ chối</Button>
          </Space>
        )}
        {order.status === 'confirmed' && (
          <Button type="primary" icon={<Clock size={14} />} onClick={() => {
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'preparing' } : o));
            message.info('Bắt đầu chuẩn bị');
          }}>Bắt đầu nấu</Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="animate-fade-in">
      <Title level={4}>Đơn hàng</Title>
      <Tabs items={[
        { key: 'pending', label: <Badge count={pending.length} size="small" offset={[6, 0]}><span>Chờ xác nhận</span></Badge>, children: pending.length === 0 ? <Empty description="Không có đơn chờ" /> : pending.map(o => <OrderCard key={o.id} order={o} />) },
        { key: 'confirmed', label: `Đang xử lý (${confirmed.length})`, children: confirmed.length === 0 ? <Empty description="Không có đơn" /> : confirmed.map(o => <OrderCard key={o.id} order={o} />) },
        { key: 'completed', label: `Hoàn tất (${completed.length})`, children: completed.length === 0 ? <Empty description="Không có đơn" /> : completed.map(o => <OrderCard key={o.id} order={o} />) },
      ]} />

      <Modal title="Từ chối đơn hàng" open={!!rejectModal} onOk={handleReject} onCancel={() => setRejectModal(null)} okText="Xác nhận từ chối" okButtonProps={{ danger: true }}>
        <Text>Lý do từ chối:</Text>
        <Input.TextArea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="VD: Hết nguyên liệu..." style={{ marginTop: 8 }} />
      </Modal>
    </div>
  );
};

export default OrderInbox;
