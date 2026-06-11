import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Empty, Spin, Typography, Button, Tabs, Avatar, Modal, Input, message } from 'antd';
import { RotateCcw, Star, ShoppingBag, XCircle } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { formatVND, formatDate } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import type { Order } from '../../../types/order';

const { Title, Text } = Typography;

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = async () => {
    try {
      const o = await orderService.getOrders();
      setOrders(o);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(cancelOrderId, cancelReason || '');
      message.success('Đã huỷ đơn hàng');
      setCancelModalOpen(false);
      setCancelReason('');
      const oid = cancelOrderId;
      setCancelOrderId(null);
      await loadOrders();
      // Redirect to order detail so user can see refund options
      navigate(`/customer/order/${oid}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể huỷ đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const activeOrders = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'completed', 'cancelled'].includes(o.status));

  const ActiveOrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <Card style={{ borderRadius: 12, marginBottom: 12 }} hoverable onClick={() => navigate(`/customer/order/${order.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {order.restaurantLogo ? (
            <img src={order.restaurantLogo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <Avatar size={36} shape="square" style={{ borderRadius: 8, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #e8590c) 100%)', fontWeight: 700, fontSize: 16 }}>
              {order.restaurantName?.charAt(0) || <ShoppingBag size={18} />}
            </Avatar>
          )}
          <div><Text strong>{order.restaurantName}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>#{order.orderNumber}</Text></div>
        </div>
        <Tag color={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Tag>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {order.items.length > 0 ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : `${order.orderNumber}`}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ color: 'var(--primary)' }}>{formatVND(order.pricing?.total ?? 0)}</Text>
        {order.status === 'pending' && (
          <Button
            size="small"
            danger
            icon={<XCircle size={12} />}
            onClick={(e) => {
              e.stopPropagation();
              setCancelOrderId(order.id);
              setCancelModalOpen(true);
            }}
          >
            Huỷ đơn
          </Button>
        )}
      </div>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{formatDate(order.createdAt, 'DD/MM/YYYY HH:mm')}</Text>
    </Card>
  );

  const PastOrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <Card style={{ borderRadius: 12, marginBottom: 12 }} hoverable onClick={() => navigate(`/customer/order/${order.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {order.restaurantLogo ? (
            <img src={order.restaurantLogo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <Avatar size={36} shape="square" style={{ borderRadius: 8, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #e8590c) 100%)', fontWeight: 700, fontSize: 16 }}>
              {order.restaurantName?.charAt(0) || <ShoppingBag size={18} />}
            </Avatar>
          )}
          <div><Text strong>{order.restaurantName}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>#{order.orderNumber}</Text></div>
        </div>
        <Tag color={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Tag>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {order.items.length > 0 ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : `${order.orderNumber}`}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ color: 'var(--primary)' }}>{formatVND(order.pricing?.total ?? 0)}</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          {['delivered', 'completed'].includes(order.status) && (
            <Button size="small" icon={<Star size={12} />} onClick={e => { e.stopPropagation(); navigate(`/customer/review/${order.id}`); }}>Đánh giá</Button>
          )}
          {['delivered', 'completed'].includes(order.status) && (
            <Button size="small" icon={<RotateCcw size={12} />} onClick={async (e) => {
              e.stopPropagation();
              try {
                const result = await orderService.reorder(order.id);
                message.success(`Đã thêm ${result.copiedItems} món vào giỏ${result.skippedItems > 0 ? ` (${result.skippedItems} món không còn)` : ''}`);
                navigate('/customer/checkout');
              } catch (error) {
                message.error(error instanceof Error ? error.message : 'Không thể đặt lại đơn hàng');
              }
            }}>Đặt lại</Button>
          )}
        </div>
      </div>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{formatDate(order.createdAt, 'DD/MM/YYYY HH:mm')}</Text>
    </Card>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Title level={4}>Đơn hàng của tôi</Title>
      <Tabs items={[
        {
          key: 'active',
          label: `Đang xử lý (${activeOrders.length})`,
          children: activeOrders.length === 0
            ? <Empty description="Không có đơn đang xử lý" />
            : activeOrders.map(o => <ActiveOrderCard key={o.id} order={o} />),
        },
        {
          key: 'past',
          label: `Lịch sử (${pastOrders.length})`,
          children: pastOrders.length === 0
            ? <Empty description="Chưa có đơn hàng" />
            : pastOrders.map(o => <PastOrderCard key={o.id} order={o} />),
        },
      ]} />

      <Modal
        title="Huỷ đơn hàng"
        open={cancelModalOpen}
        onCancel={() => { setCancelModalOpen(false); setCancelReason(''); setCancelOrderId(null); }}
        onOk={handleCancelOrder}
        okText="Xác nhận huỷ"
        okButtonProps={{ danger: true, loading: cancelling }}
        cancelText="Quay lại"
        destroyOnClose
      >
        <Text style={{ display: 'block', marginBottom: 12 }}>Bạn có chắc muốn huỷ đơn hàng này?</Text>
        <Input.TextArea
          rows={3}
          placeholder="Lý do huỷ (tuỳ chọn)"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default OrderHistoryPage;
