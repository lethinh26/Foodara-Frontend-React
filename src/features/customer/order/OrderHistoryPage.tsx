import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Empty, Spin, Typography, Button, Tabs } from 'antd';
import { RotateCcw, Star } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { formatVND, formatDate } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import type { Order } from '../../../types/order';

const { Title, Text } = Typography;

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getOrders('user-001').then(o => { setOrders(o); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled', 'refunded'].includes(o.status));

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <Card style={{ borderRadius: 12, marginBottom: 12 }} hoverable onClick={() => navigate(`/customer/order/${order.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={order.restaurantLogo} alt="" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div><Text strong>{order.restaurantName}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>#{order.orderNumber}</Text></div>
        </div>
        <Tag color={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Tag>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ color: 'var(--primary)' }}>{formatVND(order.pricing.total)}</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          {order.status === 'delivered' && !orders.some(() => false) && (
            <Button size="small" icon={<Star size={12} />} onClick={e => { e.stopPropagation(); navigate(`/customer/review/${order.id}`); }}>Đánh giá</Button>
          )}
          <Button size="small" icon={<RotateCcw size={12} />} onClick={e => { e.stopPropagation(); }}>Đặt lại</Button>
        </div>
      </div>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{formatDate(order.createdAt, 'DD/MM/YYYY HH:mm')}</Text>
    </Card>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Title level={4}>Đơn hàng của tôi</Title>
      <Tabs items={[
        { key: 'active', label: `Đang xử lý (${activeOrders.length})`, children: activeOrders.length === 0 ? <Empty description="Không có đơn đang xử lý" /> : activeOrders.map(o => <OrderCard key={o.id} order={o} />) },
        { key: 'past', label: `Lịch sử (${pastOrders.length})`, children: pastOrders.length === 0 ? <Empty description="Chưa có đơn hàng" /> : pastOrders.map(o => <OrderCard key={o.id} order={o} />) },
      ]} />
    </div>
  );
};

export default OrderHistoryPage;
