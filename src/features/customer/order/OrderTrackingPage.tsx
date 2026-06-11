import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Steps, Tag, Button, Spin, Divider, Avatar, message, Space } from 'antd';
import { Phone, MapPin, Store, Bike, Clock, CheckCircle2, ArrowLeft, QrCode, Copy, CreditCard, Banknote, Package, ShieldCheck, AlertTriangle, Ticket, CheckCircle } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import type { OrderTrackingResponse } from '../../../services/orderService';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { formatVND, formatRelativeTime } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import type { Order } from '../../../types/order';
import MapView, { type MapMarker } from '../../../components/map/MapView';

const { Title, Text } = Typography;

const statusSteps = ['pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'delivering', 'delivered'];

const stepIcons: Record<string, React.ReactNode> = {
  pending: <Clock size={20} />,
  confirmed: <CheckCircle2 size={20} />,
  ready_for_pickup: <Package size={20} />,
  picked_up: <Bike size={20} />,
  delivering: <Bike size={20} />,
  delivered: <CheckCircle2 size={20} />,
};

const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

function buildMarkers(tracking: OrderTrackingResponse | null): MapMarker[] {
  if (!tracking) return [];
  const markers: MapMarker[] = [];
  if (tracking.storeLatitude && tracking.storeLongitude) {
    markers.push({
      id: `store-${tracking.storeId}`,
      lat: tracking.storeLatitude,
      lng: tracking.storeLongitude,
      type: 'store',
      label: tracking.storeName || 'Quán',
    });
  }
  if (tracking.deliveryLatitude && tracking.deliveryLongitude) {
    markers.push({
      id: `delivery-${tracking.orderId}`,
      lat: tracking.deliveryLatitude,
      lng: tracking.deliveryLongitude,
      type: 'delivery',
      label: 'Điểm giao',
    });
  }
  if (tracking.driverLatitude && tracking.driverLongitude) {
    markers.push({
      id: `driver-${tracking.driverId || 'unknown'}`,
      lat: tracking.driverLatitude,
      lng: tracking.driverLongitude,
      type: 'driver',
      label: tracking.driverName || 'Tài xế',
    });
  }
  return markers;
}

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCopied, setQrCopied] = useState(false);
  const [tracking, setTracking] = useState<OrderTrackingResponse | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [refundChoice, setRefundChoice] = useState<'bank' | 'voucher' | null>(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundDone, setRefundDone] = useState(false);
  const [refundResult, setRefundResult] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useWebSocket<{ status?: string; driverLatitude?: number; driverLongitude?: number }>({
    topic: id ? `/topic/orders.${id}` : undefined,
    onMessage: (msg) => {
      if (msg && msg.status) {
        // Full refresh to get statusHistory + updated state
        loadOrder();
        message.info('Trạng thái đơn hàng vừa được cập nhật!');
      }
      // If driver location included, refresh tracking
      if (msg && (msg.driverLatitude || msg.driverLongitude)) {
        setTracking(prev => prev ? { ...prev, driverLatitude: msg.driverLatitude ?? prev.driverLatitude, driverLongitude: msg.driverLongitude ?? prev.driverLongitude } : prev);
      }
    }
  });

  const loadOrder = useCallback(async () => {
    const o = await orderService.getOrderById(id || '');
    if (o) setOrder(o);
    return o;
  }, [id]);

  const loadTracking = useCallback(async () => {
    const t = await orderService.getOrderTracking(id || '');
    if (t) setTracking(t);
  }, [id]);

  // Initial load
  useEffect(() => {
    Promise.all([loadOrder(), loadTracking()]).finally(() => setLoading(false));
  }, [loadOrder, loadTracking]);

  // Sync refundDone from order data
  useEffect(() => {
    if (order && (order as any).refundStatus) {
      setRefundDone(true);
      const status = (order as any).refundStatus;
      setRefundResult(status === 'voucher' ? 'Đã hoàn tiền bằng voucher' : 'Đã ghi nhận hoàn tiền về tài khoản');
    }
  }, [order?.id]);

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
    const shouldPoll = order.paymentStatus === 'pending' || ['pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'delivering'].includes(order.status || '');
    if (!shouldPoll) { if (pollingRef.current) clearInterval(pollingRef.current); return; }
    pollingRef.current = setInterval(() => { void loadOrder(); void loadTracking(); }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [order?.paymentStatus, order?.status, loadOrder, loadTracking]);

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

  // Auto-cancel when QR timer expires
  useEffect(() => {
    if (!order) return;
    const isQr = order.paymentMethod === 'qr' || order.paymentMethod === 'pm-qr';
    if (!isQr || order.paymentStatus !== 'pending') return;
    if (countdown !== null && countdown <= 0) {
      orderService.cancelOrder(order.id, 'Hết thời gian thanh toán');
    }
  }, [countdown, order?.id, order?.paymentMethod, order?.paymentStatus]);

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
  const isAwaitingPayment = isQrPayment && isPendingPayment && !isCancelled;
  const hasRefunded = (order as any).refundStatus != null;
  const countdownMin = countdown !== null ? Math.floor(countdown / 60000) : 0;
  const countdownSec = countdown !== null ? Math.floor((countdown % 60000) / 1000) : 0;
  const isExpired = countdown !== null && countdown <= 0;

  const displayStatus = isQrPayment && isPendingPayment && !isCancelled ? 'awaiting_payment' : order.status;
  const AWAITING_PAYMENT_LABEL = 'Chờ thanh toán';

  const handleRefundChoose = (choice: 'bank' | 'voucher') => {
    setRefundChoice(choice);
    setRefundResult(null);
  };

  const handleRefundConfirm = async () => {
    if (!refundChoice) return;
    setRefundSubmitting(true);
    try {
      if (refundChoice === 'bank') {
        await orderService.chooseRefund(order!.id, 'bank');
        message.success('Đã ghi nhận yêu cầu hoàn tiền. Chúng tôi sẽ xử lý trong vòng 24h.');
      } else {
        await orderService.chooseRefund(order!.id, 'voucher');
        message.success('Voucher hoàn tiền đã được tạo và thêm vào ví của bạn!');
      }
      // Refresh order to get refundStatus from backend
      const updated = await loadOrder();
      if (updated && (updated as any).refundStatus) {
        setRefundDone(true);
        const status = (updated as any).refundStatus;
        setRefundResult(status === 'voucher'
          ? 'Đã hoàn tiền bằng voucher'
          : 'Đã hoàn tiền về tài khoản ngân hàng');
      }
    } catch {
      message.error('Không thể xử lý yêu cầu. Vui lòng thử lại.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('0943941773 MBBank Foodara');
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

      {/* Cancellation banner */}
      {isCancelled && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 14,
            border: '1px solid rgba(244,67,54,0.2)',
            background: '#FFF5F5',
            color: '#b71c1c',
            marginBottom: 20,
          }}
        >
          <AlertTriangle size={22} color="#d32f2f" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <Text strong style={{ color: '#b71c1c', fontSize: 15, display: 'block', marginBottom: 4 }}>
              Đơn hàng đã bị huỷ
              {order.cancelledBy === 'store' && ' bởi quán'}
              {order.cancelledBy === 'customer' && ' bởi bạn'}
              {order.cancelledBy === 'driver' && ' bởi tài xế'}
              {order.cancelledBy === 'admin' && ' bởi quản trị'}
              {order.cancelledBy === 'system' && ' bởi hệ thống'}
            </Text>
            <Text style={{ color: '#b71c1c', fontSize: 13 }}>
              {order.cancelReason ? `Lý do: ${order.cancelReason}` : 'Không có lý do được cung cấp.'}
            </Text>
          </div>
        </div>
      )}
      {/* Refund section for cancelled paid QR orders */}
      {isCancelled && isQrPayment && order.paymentStatus === 'paid' && (
        <Card style={{
          borderRadius: 16, marginBottom: 20, border: '2px solid #FF9800',
          boxShadow: '0 4px 20px rgba(255,152,0,0.12)', overflow: 'hidden',
        }}>
          <div style={{
            background: '#FFF3E0',
            margin: '-24px -24px 20px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '3px solid #FF9800',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#FF9800', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={22} color="#fff" />
            </div>
            <div>
              <Text style={{ color: '#E65100', fontWeight: 700, fontSize: 16, display: 'block' }}>Hoàn tiền</Text>
              <Text style={{ color: '#BF360C', fontSize: 12 }}>Đơn hàng đã thanh toán {formatVND(order.pricing.total)}, vui lòng chọn hình thức hoàn tiền</Text>
            </div>
          </div>

          <Space direction="vertical" size={16} style={{ width: '100%' }}>

            {refundDone ? (
              <div style={{ padding: '20px 14px', textAlign: 'center' }}>
                <div style={{ marginBottom: 8 }}>
                  <CheckCircle size={40} color="var(--success)" />
                </div>
                <Text strong style={{ fontSize: 16, display: 'block', color: 'var(--success)', marginBottom: 4 }}>{refundResult}</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>Cảm ơn bạn!</Text>
              </div>
            ) : (
              <>
                <Card
                  hoverable
                  onClick={() => handleRefundChoose('bank')}
                  style={{
                    borderRadius: 12, border: refundChoice === 'bank' ? '2px solid var(--primary)' : '1px solid var(--border-soft)',
                    background: refundChoice === 'bank' ? 'rgba(76,175,80,0.04)' : 'var(--surface)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  bodyStyle={{ padding: '16px 18px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#43A047', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Banknote size={22} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 14, display: 'block' }}>Hoàn tiền về tài khoản</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>Chúng tôi sẽ xử lý hoàn tiền trong 24h</Text>
                    </div>
                    {refundChoice === 'bank' && <CheckCircle size={20} color="var(--primary)" />}
                  </div>
                </Card>

                <Card
                  hoverable
                  onClick={() => handleRefundChoose('voucher')}
                  style={{
                    borderRadius: 12, border: refundChoice === 'voucher' ? '2px solid var(--primary)' : '1px solid var(--border-soft)',
                    background: refundChoice === 'voucher' ? 'rgba(76,175,80,0.04)' : 'var(--surface)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  bodyStyle={{ padding: '16px 18px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ticket size={22} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 14, display: 'block' }}>Nhận mã voucher</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>Nhận voucher giảm giá {formatVND(order.pricing.total)} cho đơn sau</Text>
                    </div>
                    {refundChoice === 'voucher' && <CheckCircle size={20} color="var(--primary)" />}
                  </div>
                </Card>

                {refundResult && (
                  <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(76,175,80,0.08)', border: '1px dashed var(--success)' }}>
                    <Text style={{ color: 'var(--success)', fontWeight: 600, fontSize: 14, display: 'block' }}>
                      {refundResult}
                    </Text>
                  </div>
                )}

                <Button
                  type="primary"
                  block
                  size="large"
                  loading={refundSubmitting}
                  disabled={!refundChoice}
                  onClick={handleRefundConfirm}
                  style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
                >
                  {refundChoice === 'voucher' ? 'Xác nhận nhận voucher' : 'Xác nhận hoàn tiền'}
                </Button>
              </>
            )}

          </Space>
        </Card>
      )}

      {/* Order Status Card */}
      <Card style={{ borderRadius: 16, marginBottom: 20, border: 'none', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Mã đơn hàng</Text>
            <Text strong style={{ fontSize: 18, letterSpacing: 0.5 }}>#{order.orderNumber}</Text>
          </div>
          <Tag
            color={isAwaitingPayment ? '#FF9800' : ORDER_STATUS_COLORS[order.status]}
            style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, fontWeight: 600, margin: 0 }}
          >
            {isAwaitingPayment ? AWAITING_PAYMENT_LABEL : ORDER_STATUS_LABELS[order.status]}
          </Tag>
        </div>

        {/* Progress Steps — only when paid (COD always shows, QR waits) */}
        {!isCancelled && !isAwaitingPayment && (
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
                      ? 'var(--primary)'
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

        {/* Tracking Map */}
        <div style={{ marginTop: 16, borderRadius: 14, overflow: 'hidden' }}>
          <MapView
            markers={buildMarkers(tracking)}
            polyline={tracking?.polyline ?? undefined}
            height={220}
          />
        </div>

        {/* ETA */}
        {!isCancelled && order.status !== 'delivered' && (
          <div style={{
            marginTop: 16, padding: '14px 18px', borderRadius: 12,
            background: 'var(--surface-soft)',
            border: '1px solid var(--border-soft)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Clock size={20} color="#fff" />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Thời gian dự kiến</Text>
              <Text style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                {tracking?.etaMinutes ?? order.estimatedDeliveryTime} phút
              </Text>
              {tracking?.distanceKm != null && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  ~{tracking.distanceKm.toFixed(1)} km
                </Text>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* QR Payment Section — hide when cancelled or expired */}
      {isQrPayment && isPendingPayment && !isCancelled && !isExpired && (
        <Card style={{
          borderRadius: 16, marginBottom: 20, border: '2px solid #6C5CE7',
          boxShadow: '0 4px 20px rgba(108,92,231,0.12)', overflow: 'hidden',
        }}>
          <div style={{
            background: '#EEEEFF',
            margin: '-24px -24px 20px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '3px solid #6C5CE7',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#6C5CE7', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <QrCode size={22} color="#fff" />
            </div>
            <div>
              <Text style={{ color: '#1A1A2E', fontWeight: 700, fontSize: 16, display: 'block' }}>Thanh toán QR</Text>
              <Text style={{ color: '#333', fontSize: 12 }}>Quét mã bên dưới để thanh toán</Text>
            </div>
            <Tag style={{
              marginLeft: 'auto', background: isExpired ? 'rgba(255,0,0,0.2)' : '#6C5CE7',
              border: 'none', color: '#fff', fontWeight: 600, borderRadius: 20,
            }}>
              {isExpired ? 'Hết thời gian' : `${String(countdownMin).padStart(2,'0')}:${String(countdownSec).padStart(2,'0')}`}
            </Tag>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Real SePay QR */}
            <img
              src={`https://qr.sepay.vn/img?bank=MBBank&acc=0943941773&template=compact&des=${order.orderNumber}&amount=${order.pricing.total}`}
              alt="QR Payment"
              style={{ width: 200, height: 200, borderRadius: 16, flexShrink: 0 }}
            />

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
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>Ngân hàng: MBBank</Text>
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>STK: 0943941773</Text>
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>Chủ TK: FOODARA</Text>
                <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>
                  Nội dung: <Text copyable={{ text: order.orderNumber }} style={{ fontWeight: 700, color: '#6C5CE7' }}>{order.orderNumber}</Text>
                </Text>
              </div>

              <Button
                block
                icon={qrCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
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
              background: '#43A047',
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
              <Avatar size={52} style={{ background: 'var(--primary)' }}>
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
              <Avatar size={52} style={{ background: 'var(--secondary)' }}>
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
            background: 'var(--secondary)',
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
          background: 'var(--surface-soft)',
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
            background: '#2196F3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={16} color="#fff" />
          </div>
          <Text strong style={{ fontSize: 15 }}>Lịch sử trạng thái</Text>
        </div>

        {(order.statusHistory?.length ?? 0) === 0 ? (
          <Text type="secondary" style={{ fontSize: 13 }}>Chưa có lịch sử trạng thái.</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 15, top: 20, bottom: 20,
              width: 2, background: 'var(--border-soft)', zIndex: 0,
            }} />

            {(order.statusHistory ?? []).map((h, i) => (
              <div key={h.id} style={{
                display: 'flex', gap: 14, padding: '10px 0',
                position: 'relative', zIndex: 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: i === (order.statusHistory?.length ?? 0) - 1
                    ? 'var(--primary)'
                    : 'var(--surface)',
                  border: i === (order.statusHistory?.length ?? 0) - 1 ? 'none' : '2px solid var(--border-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2
                    size={14}
                    color={i === (order.statusHistory?.length ?? 0) - 1 ? '#fff' : ORDER_STATUS_COLORS[h.status]}
                  />
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>
                    {ORDER_STATUS_LABELS[h.status] ?? h.status}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {h.note ? `${h.note} • ` : ''}{formatRelativeTime(h.timestamp)}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review button for completed/delivered orders */}
      {['delivered', 'completed'].includes(order.status) && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            style={{ borderRadius: 10, fontWeight: 600, height: 44, paddingInline: 32 }}
            onClick={() => navigate(`/customer/review/${order.id}`)}
          >
            ⭐ Đánh giá đơn hàng
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
