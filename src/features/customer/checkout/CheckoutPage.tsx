import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Divider, Radio, Empty, message, Select, Input, Space, Tag, Modal } from 'antd';
import { Trash2, Plus, Minus, MapPin, Ticket, CreditCard, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useStore';
import { selectCartItems, selectCartRestaurant, updateQuantity, removeFromCart, clearCart } from '../../../store/cartSlice';
import { orderService } from '../../../services/orderService';
import { paymentService } from '../../../services/paymentService';
import { formatVND } from '../../../utils/format';
import { mockAddresses } from '../../../mocks/orders';
import type { Voucher } from '../../../types/promotion';
import type { PaymentMethod } from '../../../types/payment';

const { Title, Text } = Typography;

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const restaurant = useAppSelector(selectCartRestaurant);
  const [selectedAddress, setSelectedAddress] = useState(mockAddresses[0]?.id || '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState('pm-1');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [voucherModal, setVoucherModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    paymentService.getPaymentMethods().then(setPaymentMethods);
    orderService.getVouchers().then(setVouchers);
  }, []);

  if (cartItems.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <Empty description="Giỏ hàng trống" />
        <Button type="primary" onClick={() => navigate('/customer')} style={{ marginTop: 16 }}>Khám phá quán ăn</Button>
      </div>
    );
  }

  const subtotal = cartItems.reduce((s, i) => s + i.totalPrice, 0);
  const deliveryFee = 15000;
  const platformFee = Math.min(Math.max(subtotal * 0.03, 2000), 10000);
  const appliedVouchers = vouchers.filter(v => selectedVouchers.includes(v.id));
  let voucherDiscount = 0;
  appliedVouchers.forEach(v => {
    if (v.type === 'percentage') voucherDiscount += Math.min(subtotal * v.discountValue / 100, v.maxDiscount);
    else if (v.type === 'fixed') voucherDiscount += v.discountValue;
    else if (v.type === 'free_shipping') voucherDiscount += Math.min(deliveryFee, v.maxDiscount);
  });
  const total = Math.max(subtotal + deliveryFee + platformFee - voucherDiscount, 0);

  const handleOrder = async () => {
    setLoading(true);
    try {
      const addr = mockAddresses.find(a => a.id === selectedAddress) || mockAddresses[0];
      await orderService.createOrder({
        customerId: 'user-001', restaurantId: restaurant.id || '', restaurantName: restaurant.name || '',
        items: cartItems, deliveryAddress: addr, paymentMethod: selectedPayment, note,
        pricing: { subtotal, deliveryFee, platformFee, discount: 0, voucherDiscount, total, appliedVoucherIds: selectedVouchers, breakdown: [] },
      });
      dispatch(clearCart());
      message.success('Đặt hàng thành công!');
      navigate('/customer/order/ord-001');
    } catch {
      message.error('Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Quay lại</Button>
      <Title level={4}>Thanh toán</Title>

      {/* Address */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><MapPin size={18} color="var(--primary)" /><Text strong>Địa chỉ giao hàng</Text></div>
        <Select value={selectedAddress} onChange={setSelectedAddress} style={{ width: '100%' }} options={mockAddresses.map(a => ({ label: `${a.label} - ${a.fullAddress}`, value: a.id }))} />
      </Card>

      {/* Cart items */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>{restaurant.name}</Text>
        {cartItems.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ flex: 1 }}>
              <Text>{item.name}</Text>
              {item.selectedSize && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Size: {item.selectedSize.name}</Text>}
              {item.selectedToppings.length > 0 && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>+ {item.selectedToppings.map(t => t.name).join(', ')}</Text>}
              {item.note && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>📝 {item.note}</Text>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" icon={<Minus size={12} />} onClick={() => item.quantity > 1 ? dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 })) : dispatch(removeFromCart(item.id))} />
              <Text strong>{item.quantity}</Text>
              <Button size="small" icon={<Plus size={12} />} onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))} />
              <Text strong style={{ minWidth: 80, textAlign: 'right' }}>{formatVND(item.totalPrice)}</Text>
              <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => dispatch(removeFromCart(item.id))} />
            </div>
          </div>
        ))}
        <Input.TextArea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú cho đơn hàng..." rows={2} style={{ marginTop: 12 }} />
      </Card>

      {/* Voucher */}
      <Card style={{ marginBottom: 16, borderRadius: 12, cursor: 'pointer' }} onClick={() => setVoucherModal(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space><Ticket size={18} color="var(--secondary)" /><Text strong>Voucher</Text></Space>
          <div>{selectedVouchers.length > 0 ? <Tag color="green">Đã chọn {selectedVouchers.length} voucher</Tag> : <Text type="secondary">Chọn voucher</Text>}</div>
        </div>
      </Card>

      {/* Payment method */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><CreditCard size={18} color="var(--primary)" /><Text strong>Phương thức thanh toán</Text></div>
        <Radio.Group value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)} style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {paymentMethods.map(pm => (
              <Radio key={pm.id} value={pm.id} style={{ padding: '8px 0', width: '100%' }}>
                <Space><Text>{pm.name}</Text><Text type="secondary" style={{ fontSize: 12 }}>{pm.description}</Text></Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Card>

      {/* Price breakdown */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><ShieldCheck size={18} color="var(--primary)" /><Text strong>Chi tiết thanh toán</Text></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><Text>Tạm tính</Text><Text>{formatVND(subtotal)}</Text></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><Text>Phí giao hàng</Text><Text>{formatVND(deliveryFee)}</Text></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><Text>Phí nền tảng</Text><Text>{formatVND(platformFee)}</Text></div>
        {voucherDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--success)' }}><Text style={{ color: 'inherit' }}>Voucher</Text><Text style={{ color: 'inherit' }}>-{formatVND(voucherDiscount)}</Text></div>}
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text strong style={{ fontSize: 16 }}>Tổng cộng</Text><Text strong style={{ fontSize: 18, color: 'var(--primary)' }}>{formatVND(total)}</Text></div>
      </Card>

      <Button type="primary" block size="large" loading={loading} onClick={handleOrder} style={{ height: 52, borderRadius: 12, fontWeight: 700, fontSize: 16 }}>
        Đặt hàng - {formatVND(total)}
      </Button>

      {/* Voucher Modal */}
      <Modal open={voucherModal} onCancel={() => setVoucherModal(false)} title="Chọn voucher" footer={<Button type="primary" onClick={() => setVoucherModal(false)}>Xác nhận</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vouchers.map(v => {
            const eligible = subtotal >= v.minOrderValue;
            return (
              <Card key={v.id} size="small" style={{ borderRadius: 10, opacity: eligible ? 1 : 0.5, cursor: eligible ? 'pointer' : 'default', borderColor: selectedVouchers.includes(v.id) ? 'var(--primary)' : undefined }}
                onClick={() => eligible && setSelectedVouchers(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : v.isStackable ? [...prev, v.id] : [v.id])}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><Text strong>{v.title}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{v.conditions.join(' • ')}</Text></div>
                  {selectedVouchers.includes(v.id) && <Tag color="green">Đã chọn</Tag>}
                </div>
              </Card>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
