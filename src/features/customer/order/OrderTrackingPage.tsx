import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Steps, Tag, Button, Spin, Divider } from 'antd';
import { Phone, MapPin, Store, Bike, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { formatVND, formatRelativeTime } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import type { Order } from '../../../types/order';

const { Title, Text } = Typography;

const statusSteps = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering', 'delivered'];

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getOrderById(id || '').then(o => { setOrder(o); setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;
  if (!order) return <div style={{ textAlign: 'center', padding: 48 }}><Text>Không tìm thấy đơn hàng</Text></div>;

  const currentStep = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate('/customer/orders')} style={{ marginBottom: 16 }}>Đơn hàng</Button>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>Đơn #{order.orderNumber}</Title>
          <Tag color={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Tag>
        </div>

        {!isCancelled && (
          <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}
            items={statusSteps.map(s => ({ title: ORDER_STATUS_LABELS[s] }))} />
        )}

        {/* Simulated map */}
        <div style={{ background: 'var(--surface-soft)', borderRadius: 12, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid var(--border-soft)' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <MapPin size={32} style={{ marginBottom: 8 }} />
            <div>Bản đồ theo dõi</div>
            <Text type="secondary" style={{ fontSize: 12 }}>Cấu hình VITE_MAPBOX_TOKEN để hiển thị bản đồ thực</Text>
          </div>
        </div>

        {/* ETA */}
        {!isCancelled && order.status !== 'delivered' && (
          <div style={{ background: 'var(--primary-bg)', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Clock size={20} color="var(--primary)" />
            <div>
              <Text strong>Thời gian dự kiến</Text>
              <Text style={{ display: 'block', fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{order.estimatedDeliveryTime} phút</Text>
            </div>
          </div>
        )}
      </Card>

      {/* Driver info */}
      {order.driverName && (
        <Card style={{ borderRadius: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={24} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <Text strong>{order.driverName}</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{order.driverPhone}</Text>
            </div>
            <Button icon={<Phone size={16} />} shape="circle" />
          </div>
        </Card>
      )}

      {/* Restaurant info */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={24} color="var(--secondary)" />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>{order.restaurantName}</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{order.restaurantPhone}</Text>
          </div>
          <Button icon={<Phone size={16} />} shape="circle" />
        </div>
      </Card>

      {/* Order items */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Chi tiết đơn hàng</Text>
        {order.items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <Text>{item.quantity}x {item.name}</Text>
            <Text>{formatVND(item.totalPrice)}</Text>
          </div>
        ))}
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Tổng cộng</Text>
          <Text strong style={{ color: 'var(--primary)', fontSize: 16 }}>{formatVND(order.pricing.total)}</Text>
        </div>
      </Card>

      {/* Status history */}
      <Card style={{ borderRadius: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Lịch sử trạng thái</Text>
        {order.statusHistory.map((h, i) => (
          <div key={h.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < order.statusHistory.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
            <CheckCircle2 size={16} color={ORDER_STATUS_COLORS[h.status]} style={{ marginTop: 2 }} />
            <div>
              <Text strong style={{ fontSize: 13 }}>{ORDER_STATUS_LABELS[h.status]}</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{h.note} • {formatRelativeTime(h.timestamp)}</Text>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default OrderTrackingPage;
