import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Divider, Radio, Empty, message, Select, Input, Space, Tag, Modal } from 'antd';
import { Trash2, Plus, Minus, MapPin, Ticket, CreditCard, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useStore';
import {
  clearCart,
  fetchCart,
  removeCartItem,
  selectCartBestPlatformVoucher,
  selectCartBestStoreVoucher,
  selectCartError,
  selectCartItems,
  selectCartLoading,
  selectCartMinOrderAmount,
  selectCartRestaurant,
  selectCartStoreOpen,
  selectCartSubtotalAfterVoucher,
  selectCartTotal,
  selectCartValidation,
  selectCartVoucherDiscount,
  updateCartItem,
  validateCart,
} from '../../../store/cartSlice';
import { orderService } from '../../../services/orderService';
import { paymentService } from '../../../services/paymentService';
import { voucherService } from '../../../services/voucherService';
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
  const cartTotal = useAppSelector(selectCartTotal);
  const cartTotalAfterVoucher = useAppSelector(selectCartSubtotalAfterVoucher);
  const cartVoucherDiscount = useAppSelector(selectCartVoucherDiscount);
  const bestPlatformVoucher = useAppSelector(selectCartBestPlatformVoucher);
  const bestStoreVoucher = useAppSelector(selectCartBestStoreVoucher);
  const cartLoading = useAppSelector(selectCartLoading);
  const cartValidation = useAppSelector(selectCartValidation);
  const cartError = useAppSelector(selectCartError);
  const minOrderAmount = useAppSelector(selectCartMinOrderAmount);
  const isStoreOpen = useAppSelector(selectCartStoreOpen);

  const [selectedAddress, setSelectedAddress] = useState(mockAddresses[0]?.id || '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState('pm-1');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [voucherModal, setVoucherModal] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const syncVoucherPricing = async (
    storeId: string,
    mode: 'available' | 'apply' | 'remove',
    ids?: { platformVoucherId?: string; storeVoucherId?: string },
  ) => {
    try {
      setVoucherLoading(true);
      const pricing = mode === 'available'
        ? await voucherService.getAvailableForCart(storeId)
        : mode === 'apply'
          ? await voucherService.applyVouchers({ storeId, platformVoucherId: ids?.platformVoucherId, storeVoucherId: ids?.storeVoucherId })
          : await voucherService.removeVouchers({ storeId, removePlatform: true, removeStore: true });

      setVouchers(pricing.availableVouchers);
      setSelectedVouchers([
        ...(pricing.appliedPlatformVoucher?.voucherId ? [pricing.appliedPlatformVoucher.voucherId] : []),
        ...(pricing.appliedStoreVoucher?.voucherId ? [pricing.appliedStoreVoucher.voucherId] : []),
      ]);

      await dispatch(fetchCart());
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Khong the cap nhat voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await dispatch(fetchCart());
      await dispatch(validateCart());
      const pm = await paymentService.getPaymentMethods();
      setPaymentMethods(pm);
      if (restaurant.id) {
        await syncVoucherPricing(restaurant.id, 'available');
      }
    };
    void load();
  }, [dispatch, restaurant.id]);

  useEffect(() => {
    if (cartError) {
      message.error(cartError);
    }
  }, [cartError]);

  useEffect(() => {
    if (selectedVouchers.length === 0) {
      const bestIds = [bestPlatformVoucher?.voucherId, bestStoreVoucher?.voucherId].filter(Boolean) as string[];
      if (bestIds.length > 0) {
        setSelectedVouchers(bestIds);
      }
    }
  }, [bestPlatformVoucher?.voucherId, bestStoreVoucher?.voucherId, selectedVouchers.length]);

  if (cartItems.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <Empty description="Gio hang trong" />
        <Button type="primary" onClick={() => navigate('/customer')} style={{ marginTop: 16 }}>Kham pha quan an</Button>
      </div>
    );
  }

  const subtotal = cartTotal || cartItems.reduce((s, i) => s + i.totalPrice, 0);
  const discountedSubtotal = cartVoucherDiscount > 0 ? cartTotalAfterVoucher : subtotal;
  const deliveryFee = 15000;
  const platformFee = Math.min(Math.max(discountedSubtotal * 0.03, 2000), 10000);
  const voucherDiscount = cartVoucherDiscount;
  const total = Math.max(discountedSubtotal + deliveryFee + platformFee, 0);

  const handleOrder = async () => {
    setLoading(true);
    try {
      const latestValidation = await dispatch(validateCart()).unwrap();
      if (!latestValidation.valid) {
        const firstIssue = latestValidation.issues[0];
        message.error(firstIssue?.message || 'Gio hang khong hop le, vui long kiem tra lai.');
        return;
      }

      const addr = mockAddresses.find(a => a.id === selectedAddress) || mockAddresses[0];
      await orderService.createOrder({
        customerId: 'user-001',
        restaurantId: restaurant.id || '',
        restaurantName: restaurant.name || '',
        items: cartItems,
        deliveryAddress: addr,
        paymentMethod: selectedPayment,
        note,
        pricing: {
          subtotal,
          deliveryFee,
          platformFee,
          discount: 0,
          voucherDiscount,
          total,
          appliedVoucherIds: selectedVouchers,
          breakdown: [],
        },
      });
      await dispatch(clearCart()).unwrap();
      message.success('Dat hang thanh cong!');
      navigate('/customer/order/ord-001');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Dat hang that bai. Vui long thu lai.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Quay lai</Button>
      <Title level={4}>Thanh toan</Title>

      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><MapPin size={18} color="var(--primary)" /><Text strong>Dia chi giao hang</Text></div>
        <Select value={selectedAddress} onChange={setSelectedAddress} style={{ width: '100%' }} options={mockAddresses.map(a => ({ label: `${a.label} - ${a.fullAddress}`, value: a.id }))} />
      </Card>

      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>{restaurant.name}</Text>
        {cartItems.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ flex: 1 }}>
              <Text>{item.name}</Text>
              {item.selectedSize && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Size: {item.selectedSize.name}</Text>}
              {item.selectedToppings.length > 0 && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>+ {item.selectedToppings.map(t => t.name).join(', ')}</Text>}
              {item.note && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Note: {item.note}</Text>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                size="small"
                icon={<Minus size={12} />}
                onClick={() => {
                  if (item.quantity > 1) {
                    void dispatch(updateCartItem({ cartItemId: item.id, quantity: item.quantity - 1 }));
                  } else {
                    void dispatch(removeCartItem(item.id));
                  }
                }}
              />
              <Text strong>{item.quantity}</Text>
              <Button
                size="small"
                icon={<Plus size={12} />}
                onClick={() => void dispatch(updateCartItem({ cartItemId: item.id, quantity: item.quantity + 1 }))}
              />
              <div style={{ minWidth: 100, textAlign: 'right' }}>
                {item.discountedTotalPrice != null && item.discountedTotalPrice < item.totalPrice ? (
                  <>
                    <Text delete type="secondary" style={{ display: 'block', fontSize: 12 }}>{formatVND(item.totalPrice)}</Text>
                    <Text strong style={{ color: 'var(--success)' }}>{formatVND(item.discountedTotalPrice)}</Text>
                  </>
                ) : (
                  <Text strong>{formatVND(item.totalPrice)}</Text>
                )}
              </div>
              <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => void dispatch(removeCartItem(item.id))} />
            </div>
          </div>
        ))}
        <Input.TextArea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chu cho don hang..." rows={2} style={{ marginTop: 12 }} />
      </Card>

      {(minOrderAmount > 0 || !isStoreOpen || (cartValidation && !cartValidation.valid)) && (
        <Card style={{ marginBottom: 16, borderRadius: 12, borderColor: 'var(--warning)' }}>
          {!isStoreOpen && <Text style={{ display: 'block', color: 'var(--danger)' }}>Cua hang hien dang dong cua.</Text>}
          {minOrderAmount > 0 && subtotal < minOrderAmount && (
            <Text style={{ display: 'block', color: 'var(--danger)' }}>
              Don hang chua dat toi thieu {formatVND(minOrderAmount)}.
            </Text>
          )}
          {cartValidation?.issues.map(issue => (
            <Text key={`${issue.code}-${issue.cartItemId ?? 'cart'}`} style={{ display: 'block', color: 'var(--danger)' }}>
              {issue.message}
            </Text>
          ))}
        </Card>
      )}

      <Card style={{ marginBottom: 16, borderRadius: 12, cursor: 'pointer' }} onClick={() => setVoucherModal(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space><Ticket size={18} color="var(--secondary)" /><Text strong>Voucher</Text></Space>
          <div>{selectedVouchers.length > 0 ? <Tag color="green">Dang ap dung {selectedVouchers.length} voucher</Tag> : <Text type="secondary">Khong co voucher phu hop</Text>}</div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><CreditCard size={18} color="var(--primary)" /><Text strong>Phuong thuc thanh toan</Text></div>
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

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><ShieldCheck size={18} color="var(--primary)" /><Text strong>Chi tiet thanh toan</Text></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><Text>Tam tinh</Text><Text>{formatVND(subtotal)}</Text></div>
        {voucherDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--success)' }}><Text style={{ color: 'inherit' }}>Giam voucher</Text><Text style={{ color: 'inherit' }}>-{formatVND(voucherDiscount)}</Text></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><Text>Tam tinh sau voucher</Text><Text>{formatVND(discountedSubtotal)}</Text></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><Text>Phi giao hang</Text><Text>{formatVND(deliveryFee)}</Text></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><Text>Phi nen tang</Text><Text>{formatVND(platformFee)}</Text></div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text strong style={{ fontSize: 16 }}>Tong cong</Text><Text strong style={{ fontSize: 18, color: 'var(--primary)' }}>{formatVND(total)}</Text></div>
      </Card>

      <Button
        type="primary"
        block
        size="large"
        loading={loading || cartLoading}
        onClick={handleOrder}
        disabled={!isStoreOpen || (minOrderAmount > 0 && subtotal < minOrderAmount)}
        style={{ height: 52, borderRadius: 12, fontWeight: 700, fontSize: 16 }}
      >
        Dat hang - {formatVND(total)}
      </Button>

      <Modal open={voucherModal} onCancel={() => setVoucherModal(false)} title="Voucher dang ap dung" footer={<Button type="primary" onClick={() => setVoucherModal(false)}>Dong</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vouchers.length === 0 && <Text type="secondary">Ban chua co voucher nao cho cua hang nay.</Text>}
          {vouchers.map(v => {
            const selected = selectedVouchers.includes(v.id);
            const eligible = subtotal >= v.minOrderValue;
            return (
              <Card key={v.id} size="small" style={{ borderRadius: 10, opacity: eligible ? 1 : 0.5, borderColor: selected ? 'var(--primary)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <Text strong>{v.title}</Text><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{v.conditions.join(' • ')}</Text>
                  </div>
                  <Space>
                    <Button
                      size="small"
                      disabled={!eligible || voucherLoading || !restaurant.id}
                      onClick={() => {
                        const platformVoucherId = v.scope === 'platform'
                          ? v.id
                          : selectedVouchers.find(id => vouchers.find(x => x.id === id)?.scope === 'platform');
                        const storeVoucherId = v.scope === 'store'
                          ? v.id
                          : selectedVouchers.find(id => vouchers.find(x => x.id === id)?.scope === 'store');
                        if (restaurant.id) {
                          void syncVoucherPricing(restaurant.id, 'apply', { platformVoucherId, storeVoucherId });
                        }
                      }}
                    >
                      Ap dung
                    </Button>
                    {selected && <Tag color="green">Dang ap dung</Tag>}
                  </Space>
                </div>
              </Card>
            );
          })}
          <Button
            danger
            disabled={voucherLoading || !restaurant.id}
            onClick={() => restaurant.id && void syncVoucherPricing(restaurant.id, 'remove')}
          >
            Bo tat ca voucher
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
