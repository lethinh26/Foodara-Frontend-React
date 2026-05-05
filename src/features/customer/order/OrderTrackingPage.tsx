import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Steps, Tag, Button, Spin, Divider, Avatar, message } from 'antd';
import { Phone, MapPin, Store, Bike, Clock, CheckCircle2, ArrowLeft, QrCode, Copy, CreditCard, Banknote, Package, ShieldCheck, AlertTriangle } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { formatVND, formatRelativeTime } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import type { Order } from '../../../types/order';

const { Title, Text } = Typography;

const statusSteps = ['pending', 'confirmed', 'preparing', 'picked_up', 'delivering', 'delivered'];

const stepIcons: Record<string, React.ReactNode> = {
  pending: <Clock size={20} />,
  confirmed: <CheckCircle2 size={20} />,
  preparing: <Package size={20} />,
  picked_up: <Bike size={20} />,
  delivering: <Bike size={20} />,
  delivered: <CheckCircle2 size={20} />,
};

const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000; 

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCopied, setQrCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrder = useCallback(async () => {
    const o = await orderService.getOrderById(id || '');
    if (o) setOrder(o);
    return o;
  }, [id]);

  // Initial load
  useEffect(() => {
    loadOrder().finally(() => setLoading(false));
  }, [loadOrder]);

  // Payment callback from SePay redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (!paymentStatus) return;
    if (paymentStatus === 'success') message.success('Thanh toán thành công!');
    else if (paymentStatus === 'error') message.error('Thanh toán thất bại. Vui lòng thử lại.');
    else if (paymentStatus === 'cancel') message.warning('Bạn đã huỷ thanh toán.');
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Poll order status every 5s when payment is pending
  useEffect(() => {
    if (!order) return;
    const shouldPoll = order.paymentStatus === 'pending' || ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status?.toUpperCase?.() || '');
    if (!shouldPoll) { if (pollingRef.current) clearInterval(pollingRef.current); return; }
    pollingRef.current = setInterval(() => { void loadOrder(); }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [order?.paymentStatus, order?.status, loadOrder]);

  // 10-minute countdown for QR payment
  useEffect(() => {
    if (!order) return;
    const isQr = order.paymentMethod === 'qr' || order.paymentMethod === 'pm-qr';
    if (!isQr || order.paymentStatus !== 'pending' || !order.createdAt) return;
    const placedTime = new Date(order.createdAt).getTime();
    const deadline = placedTime + PAYMENT_TIMEOUT_MS;
    const tick = () => { const rem = Math.max(0, deadline - Date.now()); setCountdown(rem); if (rem <= 0 && countdownRef.current) clearInterval(countdownRef.current); };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [order?.createdAt, order?.paymentMethod, order?.paymentStatus]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Spin size="large" />
    </div>
  );
  if (!order) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <Package size={48} color="var(--text-muted)" />
      <Text style={{ fontSize: 16 }}>Không tìm thấy đơn hàng</Text>
      <Button type="primary" onClick={() => navigate('/customer/orders')}>Xem đơn hàng khác</Button>
    </div>
  );

  const currentStep = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isQrPayment = order.paymentMethod === 'pm-qr' || order.paymentMethod === 'qr';
  const isPendingPayment = order.paymentStatus === 'pending';
  const countdownMin = countdown !== null ? Math.floor(countdown / 60000) : 0;
  const countdownSec = countdown !== null ? Math.floor((countdown % 60000) / 1000) : 0;
  const isExpired = countdown !== null && countdown <= 0;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('0123456789 - FOODARA JSC - MB Bank');
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px 60px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/customer/orders')}
          style={{ padding: '4px 8px', borderRadius: 10 }}
        />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: 0, fontSize: 18 }}>Đơn hàng</Title>
        </div>
      </div>

      {/* Order Status Card */}
      <Card style={{ borderRadius: 16, marginBottom: 20, border: 'none', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Mã đơn hàng</Text>
            <Text strong style={{ fontSize: 18, letterSpacing: 0.5 }}>#{order.orderNumber}</Text>
          </div>
          <Tag
            color={ORDER_STATUS_COLORS[order.status]}
            style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, fontWeight: 600, margin: 0 }}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Tag>
        </div>

        {/* Progress Steps */}
        {!isCancelled && (
          <div style={{ padding: '8px 0 4px', marginBottom: 8 }}>
            <Steps
              current={currentStep}
              size="small"
              labelPlacement="vertical"
              items={statusSteps.map(s => ({
                title: <span style={{ fontSize: 11, lineHeight: 1.2 }}>{ORDER_STATUS_LABELS[s]}</span>,
                icon: (
                  <div style={{
                    width: 42, height: 42, minWidth: 42, minHeight: 42, borderRadius: '50%',
                    background: statusSteps.indexOf(s) <= currentStep
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                      : 'var(--surface-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: statusSteps.indexOf(s) <= currentStep ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.3s ease', flexShrink: 0,
                  }}>
                    {stepIcons[s]}
                  </div>
                ),
              }))}
            />
          </div>
        )}

        {/* Map placeholder */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f7f0 0%, #e8f5e9 100%)',
          borderRadius: 14, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 16, border: '1px dashed var(--border-soft)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(76,175,80,0.08) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
            <MapPin size={28} style={{ marginBottom: 6 }} color="var(--primary)" />
            <div style={{ fontWeight: 600, fontSize: 13 }}>Bản đồ theo dõi</div>
            <Text type="secondary" style={{ fontSize: 11 }}>Cấu hình VITE_MAPBOX_TOKEN để hiển thị bản đồ thực</Text>
          </div>
        </div>

        {/* ETA */}
        {!isCancelled && order.status !== 'delivered' && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(56,142,60,0.12) 100%)',
            border: '1px solid rgba(76,175,80,0.15)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Clock size={20} color="#fff" />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Thời gian dự kiến</Text>
              <Text style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                {order.estimatedDeliveryTime} phút
              </Text>
            </div>
          </div>
        )}
      </Card>

      {/* QR Payment Section */}
      {isQrPayment && isPendingPayment && (
        <Card style={{
          borderRadius: 16, marginBottom: 20, border: '2px solid #6C5CE7',
          boxShadow: '0 4px 20px rgba(108,92,231,0.12)', overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
            margin: '-24px -24px 20px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <QrCode size={22} color="#fff" />
            </div>
            <div>
              <Text style={{ color: '#fff', fontWeight: 700, fontSize: 16, display: 'block' }}>Thanh toán QR</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Quét mã bên dưới để thanh toán</Text>
            </div>
            <Tag style={{
              marginLeft: 'auto', background: isExpired ? 'rgba(255,0,0,0.3)' : 'rgba(255,255,255,0.2)',
              border: 'none', color: '#fff', fontWeight: 600, borderRadius: 20,
            }}>
              {isExpired ? 'Hết thời gian' : `${String(countdownMin).padStart(2,'0')}:${String(countdownSec).padStart(2,'0')}`}
            </Tag>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* QR Code placeholder */}
            <div style={{
              width: 200, height: 200, borderRadius: 16,
              border: '2px dashed rgba(108,92,231,0.3)',
              background: 'linear-gradient(135deg, rgba(108,92,231,0.04) 0%, rgba(162,155,254,0.08) 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0,
            }}>
              <QrCode size={64} color="#6C5CE7" strokeWidth={1.5} />
              <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', padding: '0 12px' }}>
                QR Code sẽ hiển thị ở đây
              </Text>
            </div>

            {/* Payment info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'var(--surface-soft)', marginBottom: 12,
                border: '1px solid var(--border-soft)',
              }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Số tiền cần thanh toán</Text>
                <Text style={{ fontSize: 24, fontWeight: 700, color: '#6C5CE7' }}>
                  {formatVND(order.pricing.total)}
                </Text>
              </div>

              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'var(--surface-soft)', marginBottom: 12,
                border: '1px solid var(--border-soft)',
              }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Thông tin chuyển khoản</Text>
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>Ngân hàng: MB Bank</Text>
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>STK: 0123456789</Text>
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>Chủ TK: FOODARA JSC</Text>
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>
                  Nội dung: <Text copyable={{ text: order.orderNumber }} style={{ fontWeight: 700, color: '#6C5CE7' }}>{order.orderNumber}</Text>
                </Text>
              </div>

              <Button
                block
                icon={<Copy size={14} />}
                onClick={handleCopyAccount}
                style={{
                  borderRadius: 10, height: 40, fontWeight: 600,
                  borderColor: '#6C5CE7', color: qrCopied ? '#fff' : '#6C5CE7',
                  background: qrCopied ? '#6C5CE7' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {qrCopied ? 'Đã sao chép ✓' : 'Sao chép thông tin'}
              </Button>
            </div>
          </div>

          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: isExpired ? 'rgba(255,77,79,0.08)' : 'rgba(255,193,7,0.08)',
            border: `1px dashed ${isExpired ? 'rgba(255,77,79,0.3)' : 'rgba(255,193,7,0.3)'}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {isExpired ? <AlertTriangle size={16} color="#ff4d4f" /> : <ShieldCheck size={16} color="#e6a700" />}
            <Text style={{ fontSize: 12, color: isExpired ? '#ff4d4f' : '#b38600' }}>
              {isExpired
                ? 'Đã hết thời gian thanh toán. Đơn hàng sẽ tự động bị huỷ.'
                : 'Đơn hàng sẽ được xác nhận tự động sau khi nhận được thanh toán. Thời gian xử lý từ 1-3 phút.'}
            </Text>
          </div>
        </Card>
      )}

      {/* COD Payment indicator */}
      {!isQrPayment && (
        <Card style={{ borderRadius: 16, marginBottom: 20, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #43A047 0%, #66BB6A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Banknote size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 14 }}>Thanh toán khi nhận hàng</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                Trả {formatVND(order.pricing.total)} cho tài xế khi nhận đồ ăn
              </Text>
            </div>
            <Tag color="success" style={{ borderRadius: 20, fontWeight: 600 }}>
              <CreditCard size={12} style={{ marginRight: 4 }} /> COD
            </Tag>
          </div>
        </Card>
      )}

      {/* Driver & Restaurant - Side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: order.driverName ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
        {/* Driver */}
        {order.driverName && (
          <Card style={{ borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
              <Avatar size={52} style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
                <Bike size={24} color="#fff" />
              </Avatar>
              <div>
                <Text strong style={{ display: 'block', fontSize: 14 }}>{order.driverName}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{order.driverPhone}</Text>
              </div>
              <Button icon={<Phone size={14} />} shape="round" size="small" style={{ fontWeight: 500 }}>
                Gọi tài xế
              </Button>
            </div>
          </Card>
        )}

        {/* Restaurant */}
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            {order.restaurantLogo ? (
              <Avatar size={52} src={order.restaurantLogo} shape="square" style={{ borderRadius: 12 }} />
            ) : (
              <Avatar size={52} style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)' }}>
                <Store size={24} color="#fff" />
              </Avatar>
            )}
            <div>
              <Text strong style={{ display: 'block', fontSize: 14 }}>{order.restaurantName}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{order.restaurantPhone}</Text>
            </div>
            <Button icon={<Phone size={14} />} shape="round" size="small" style={{ fontWeight: 500 }}>
              Gọi quán
            </Button>
          </div>
        </Card>
      </div>

      {/* Order Items */}
      <Card style={{ borderRadius: 16, marginBottom: 20, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package size={16} color="#fff" />
          </div>
          <Text strong style={{ fontSize: 15 }}>Chi tiết đơn hàng</Text>
          <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>{order.items.length} món</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {order.items.map(item => (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 10, background: 'var(--surface-soft)',
              border: '1px solid var(--border-soft)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'var(--primary-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Text style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{item.quantity}x</Text>
                </div>
                <Text style={{ fontSize: 13 }}>{item.name}</Text>
              </div>
              <Text strong style={{ fontSize: 13, flexShrink: 0 }}>{formatVND(item.totalPrice)}</Text>
            </div>
          ))}
        </div>

        <Divider style={{ margin: '14px 0 10px' }} />

        {/* Pricing breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Tạm tính</Text>
            <Text style={{ fontSize: 13 }}>{formatVND(order.pricing.subtotal)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Phí giao hàng</Text>
            <Text style={{ fontSize: 13 }}>{formatVND(order.pricing.deliveryFee)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Phí nền tảng</Text>
            <Text style={{ fontSize: 13 }}>{formatVND(order.pricing.platformFee)}</Text>
          </div>
          {order.pricing.voucherDiscount > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '6px 12px',
              borderRadius: 8, background: 'rgba(76,175,80,0.06)', border: '1px dashed rgba(76,175,80,0.25)',
            }}>
              <Text style={{ color: 'var(--success)', fontWeight: 500, fontSize: 13 }}>Giảm voucher</Text>
              <Text style={{ color: 'var(--success)', fontWeight: 600, fontSize: 13 }}>-{formatVND(order.pricing.voucherDiscount)}</Text>
            </div>
          )}
        </div>

        <div style={{
          marginTop: 12, padding: '12px 16px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(76,175,80,0.06) 0%, rgba(56,142,60,0.1) 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Text strong style={{ fontSize: 15 }}>Tổng cộng</Text>
          <Text strong style={{ fontSize: 20, color: 'var(--primary)' }}>{formatVND(order.pricing.total)}</Text>
        </div>
      </Card>

      {/* Status History */}
      <Card style={{ borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={16} color="#fff" />
          </div>
          <Text strong style={{ fontSize: 15 }}>Lịch sử trạng thái</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 15, top: 20, bottom: 20,
            width: 2, background: 'var(--border-soft)', zIndex: 0,
          }} />

          {order.statusHistory.map((h, i) => (
            <div key={h.id} style={{
              display: 'flex', gap: 14, padding: '10px 0',
              position: 'relative', zIndex: 1,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: i === 0
                  ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                  : 'var(--surface)',
                border: i === 0 ? 'none' : '2px solid var(--border-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={14} color={i === 0 ? '#fff' : ORDER_STATUS_COLORS[h.status]} />
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <Text strong style={{ fontSize: 13, display: 'block' }}>{ORDER_STATUS_LABELS[h.status]}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {h.note} • {formatRelativeTime(h.timestamp)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OrderTrackingPage;
