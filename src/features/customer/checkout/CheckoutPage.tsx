import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Divider, Radio, Empty, message, Select, Input, Space, Tag, Modal, Form, Checkbox } from 'antd';
import { Trash2, Plus, Minus, MapPin, Ticket, CreditCard, ArrowLeft, ShieldCheck, User, Phone } from 'lucide-react';
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
import { checkoutService, type CheckoutPreviewResult } from '../../../services/checkoutService';
import { authService } from '../../../services/authService';
import { locationService } from '../../../services/locationService';
import { formatVND } from '../../../utils/format';
import type { Voucher, VoucherCartPricing } from '../../../types/promotion';
import type { PaymentMethod } from '../../../types/payment';
import type { AddressResponse, AddressRequest } from '../../../services/authService';
import type { ProvinceItem, DistrictItem, WardItem } from '../../../services/locationService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const labelOptions = [
    { value: 'home', label: 'Nhà' },
    { value: 'work', label: 'Văn phòng' },
    { value: 'other', label: 'Khác' },
];

const ADD_ADDRESS_VALUE = '__add_address__';



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

    const [selectedAddress, setSelectedAddress] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPayment, setSelectedPayment] = useState('pm-cod');
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [voucherPricing, setVoucherPricing] = useState<VoucherCartPricing | null>(null);
    const [selectedStoreVoucherId, setSelectedStoreVoucherId] = useState<string | undefined>(undefined);
    const [selectedSystemDiscountVoucherId, setSelectedSystemDiscountVoucherId] = useState<string | undefined>(undefined);
    const [selectedSystemShipVoucherId, setSelectedSystemShipVoucherId] = useState<string | undefined>(undefined);
    const [voucherModal, setVoucherModal] = useState(false);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [collectingVoucherId, setCollectingVoucherId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState('');
    const [preview, setPreview] = useState<CheckoutPreviewResult | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [addresses, setAddresses] = useState<AddressResponse[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [addressModal, setAddressModal] = useState(false);
    const [editAddress, setEditAddress] = useState<AddressResponse | null>(null);
    const [savingAddress, setSavingAddress] = useState(false);
    const [addressForm] = Form.useForm();

    const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
    const [districts, setDistricts] = useState<DistrictItem[]>([]);
    const [wards, setWards] = useState<WardItem[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    const loadAddresses = async () => {
        setLoadingAddresses(true);
        try {
            const result = await authService.getAddresses();
            setAddresses(result);
            const defaultAddr = result.find(a => a.isDefault) ?? result[0];
            setSelectedAddress(prev => {
                if (prev && result.some(a => a.id === prev)) return prev;
                return defaultAddr?.id || '';
            });
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Không thể tải danh sách địa chỉ');
        } finally {
            setLoadingAddresses(false);
        }
    };

    const loadProvinces = async () => {
        setLoadingProvinces(true);
        try {
            const result = await locationService.getProvinces();
            setProvinces(result);
        } catch { setProvinces([]); }
        finally { setLoadingProvinces(false); }
    };

    const loadDistricts = async (provinceCode: number) => {
        setLoadingDistricts(true);
        setDistricts([]); setWards([]);
        try {
            const result = await locationService.getDistricts(provinceCode);
            setDistricts(result);
        } catch { setDistricts([]); }
        finally { setLoadingDistricts(false); }
    };

    const loadWards = async (districtCode: number) => {
        setLoadingWards(true);
        setWards([]);
        try {
            const result = await locationService.getWards(districtCode);
            setWards(result);
        } catch { setWards([]); }
        finally { setLoadingWards(false); }
    };

    const openAddressModal = (addr?: AddressResponse) => {
        setEditAddress(addr || null);
        setDistricts([]); setWards([]);
        if (addr) {
            addressForm.setFieldsValue({
                label: addr.label || 'home',
                recipientName: addr.recipientName,
                recipientPhone: addr.recipientPhone,
                addressLine: addr.addressLine,
                ward: addr.ward,
                deliveryNote: addr.deliveryNote,
                isDefault: addr.isDefault,
            });
        } else {
            addressForm.resetFields();
            addressForm.setFieldsValue({ label: 'home', isDefault: false });
        }
        setAddressModal(true);
    };

    const handleSaveAddress = async (values: Record<string, unknown>) => {
        setSavingAddress(true);
        try {
            const selProv = provinces.find(p => p.code === values.provinceCode);
            const selDist = districts.find(d => d.code === values.districtCode);
            const selWard = wards.find(w => w.code === values.wardCode);
            const request: AddressRequest = {
                label: values.label as string,
                recipientName: values.recipientName as string | undefined,
                recipientPhone: values.recipientPhone as string | undefined,
                addressLine: values.addressLine as string,
                ward: selWard?.name || (values.ward as string) || '',
                cityName: selProv?.name || '',
                districtName: selDist?.name || '',
                deliveryNote: values.deliveryNote as string | undefined,
                isDefault: (values.isDefault as boolean) || false,
            };
            if (editAddress) {
                await authService.updateAddress(editAddress.id, request);
                message.success('Đã cập nhật địa chỉ');
            } else {
                await authService.createAddress(request);
                message.success('Đã thêm địa chỉ mới');
            }
            setAddressModal(false);
            addressForm.resetFields();
            await loadAddresses();
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Lưu địa chỉ thất bại');
        } finally {
            setSavingAddress(false);
        }
    };

    const syncVoucherPricing = async (
        storeId: string,
        mode: 'available' | 'apply' | 'remove',
        ids?: { platformVoucherId?: string; platformShipVoucherId?: string; storeVoucherId?: string },
    ) => {
        try {
            setVoucherLoading(true);
            const pricing = mode === 'available'
                ? await voucherService.getAvailableForCart(storeId)
                : mode === 'apply'
                    ? await voucherService.applyVouchers({ storeId, platformVoucherId: ids?.platformVoucherId, platformShipVoucherId: ids?.platformShipVoucherId, storeVoucherId: ids?.storeVoucherId })
                    : await voucherService.removeVouchers({ storeId, removePlatform: true, removeStore: true });

            setVouchers(pricing.availableVouchers);
            setVoucherPricing(pricing);
            await dispatch(fetchCart());
            return pricing;
        } catch (error) {
            // Only show toast for user-initiated actions, not auto-apply attempts
            if (mode !== 'apply') {
                message.error(error instanceof Error ? error.message : 'Không thể cập nhật voucher');
            }
            return null;
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
        void loadAddresses();
        void loadProvinces();
    }, []);

    useEffect(() => {
        if (cartError) {
            message.error(cartError);
        }
    }, [cartError]);



    const handleCollectVoucherInCheckout = async (voucherId: string) => {
        try {
            setCollectingVoucherId(voucherId);
            await voucherService.collectVoucher(voucherId);
            message.success('Thu thập voucher thành công!');
            // Refresh vouchers
            if (restaurant.id) {
                await syncVoucherPricing(restaurant.id, 'available');
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Không thể thu thập voucher');
        } finally {
            setCollectingVoucherId(null);
        }
    };

    const estimateVoucherDiscount = (voucher: Voucher, sub: number, delFee: number) => {
        if (sub < voucher.minOrderValue) return 0;
        if (voucher.type === 'percentage') {
            const raw = (sub * voucher.discountValue) / 100;
            return voucher.maxDiscount > 0 ? Math.min(raw, voucher.maxDiscount) : raw;
        }
        if (voucher.type === 'fixed') return voucher.discountValue;
        // free_ship: discountValue is percentage of delivery fee (e.g. 50 = 50%, 100 = 100%)
        const shipDiscount = (delFee * voucher.discountValue) / 100;
        return voucher.maxDiscount > 0 ? Math.min(shipDiscount, voucher.maxDiscount) : shipDiscount;
    };

    const applySelectedVouchers = async (storeVId?: string, sysDiscountVId?: string, sysShipVId?: string) => {
        if (!restaurant.id) return;

        const prevStore = selectedStoreVoucherId;
        const prevDiscount = selectedSystemDiscountVoucherId;
        const prevShip = selectedSystemShipVoucherId;
        setSelectedStoreVoucherId(storeVId);
        setSelectedSystemDiscountVoucherId(sysDiscountVId);
        setSelectedSystemShipVoucherId(sysShipVId);
        const result = await syncVoucherPricing(restaurant.id, 'apply', {
            storeVoucherId: storeVId,
            platformVoucherId: sysDiscountVId,
            platformShipVoucherId: sysShipVId,
        });
        if (!result) {
            setSelectedStoreVoucherId(prevStore);
            setSelectedSystemDiscountVoucherId(prevDiscount);
            setSelectedSystemShipVoucherId(prevShip);
        }
    };

    const autoPickBestVouchers = async (sub: number, delFee: number) => {
        const storeV = vouchers.filter(v => v.scope === 'store' && v.isCollected);
        const sysDiscV = vouchers.filter(v => v.scope === 'platform' && v.type !== 'free_ship' && v.isCollected);
        const sysShipV = vouchers.filter(v => v.scope === 'platform' && v.type === 'free_ship' && v.isCollected);
        const pickBest = (list: Voucher[]) => list
            .map(v => ({ v, d: estimateVoucherDiscount(v, sub, delFee) }))
            .filter(x => x.d > 0)
            .sort((a, b) => b.d - a.d)[0]?.v;
        const bStore = pickBest(storeV);
        const bDisc = pickBest(sysDiscV);
        const bShip = pickBest(sysShipV);
        await applySelectedVouchers(bStore?.id, bDisc?.id, bShip?.id);
        message.success('Đã tự động chọn các voucher tốt nhất.');
    };

    useEffect(() => {
        if (selectedStoreVoucherId || selectedSystemDiscountVoucherId || selectedSystemShipVoucherId) return;
        const initStoreId = bestStoreVoucher?.voucherId;
        const initPlatformId = bestPlatformVoucher?.voucherId;
        const initPlatformV = vouchers.find(v => v.id === initPlatformId);
        if (!initStoreId && !initPlatformId) return;

        // Auto-apply best vouchers silently — if they turn out ineligible (e.g. minOrder not met)
        // just ignore the error rather than spamming toast errors.
        const tryApply = async () => {
            try {
                if (initPlatformV?.type === 'free_ship') {
                    await applySelectedVouchers(initStoreId, undefined, initPlatformId);
                } else {
                    await applySelectedVouchers(initStoreId, initPlatformId, undefined);
                }
            } catch {
                // Voucher is not eligible — silently skip auto-apply
            }
        };
        void tryApply();
    }, [bestPlatformVoucher?.voucherId, bestStoreVoucher?.voucherId, vouchers, selectedStoreVoucherId, selectedSystemDiscountVoucherId, selectedSystemShipVoucherId]);

    const subtotal = preview?.subtotal ?? cartTotal ?? cartItems.reduce((s, i) => s + i.totalPrice, 0);
    const voucherDiscount = preview?.totalDiscount ?? cartVoucherDiscount;
    const discountedSubtotal = preview?.subtotalAfterVoucher ?? Math.max(subtotal - voucherDiscount, 0);
    const deliveryFee = preview?.deliveryFee ?? 0;
    const platformFee = preview?.platformFee ?? 0;
    const total = preview?.totalAmount ?? Math.max(discountedSubtotal + deliveryFee + platformFee, 0);
    const distanceKm = preview?.distanceKm ?? null;
    const etaMinutes = preview?.etaMinutes ?? null;
    const selectedVoucherIds = [selectedStoreVoucherId, selectedSystemDiscountVoucherId, selectedSystemShipVoucherId].filter(Boolean) as string[];
    void cartTotalAfterVoucher;

    // Refresh BE preview whenever the inputs that feed into pricing change.
    // BE is the only source of truth for delivery/platform fees and final total.
    useEffect(() => {
        if (!restaurant.id || cartItems.length === 0) {
            setPreview(null);
            return;
        }
        const timeout = setTimeout(() => {
            const run = async () => {
                setPreviewLoading(true);
                try {
                    const result = await checkoutService.preview({
                        storeId: restaurant.id!,
                        addressId: selectedAddress || undefined,
                        platformVoucherId: selectedSystemDiscountVoucherId || selectedSystemShipVoucherId || undefined,
                        storeVoucherId: selectedStoreVoucherId || undefined,
                    });
                    setPreview(result);
                } catch {
                    // Keep last preview; the validate-cart card will surface the error.
                } finally {
                    setPreviewLoading(false);
                }
            };
            void run();
        }, 250);
        return () => clearTimeout(timeout);
    }, [
        restaurant.id,
        selectedAddress,
        selectedStoreVoucherId,
        selectedSystemDiscountVoucherId,
        selectedSystemShipVoucherId,
        cartItems.length,
        cartTotal,
    ]);

    const discountSuggestion = (() => {
        const collectedNotMet = vouchers.filter(v => v.isCollected && subtotal < v.minOrderValue);
        if (collectedNotMet.length === 0) return null;
        const best = collectedNotMet
            .map(v => ({ v, gap: v.minOrderValue - subtotal }))
            .filter(x => x.gap > 0)
            .sort((a, b) => a.gap - b.gap)[0];
        if (!best) return null;
        return { gap: best.gap, voucher: best.v };
    })();

    if (cartItems.length === 0) {
        return (
            <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, textAlign: 'center' }}>
                <Empty description="Giỏ hàng trống" />
                <Button type="primary" onClick={() => navigate('/customer')} style={{ marginTop: 16 }}>Khám phá quán ăn</Button>
            </div>
        );
    }

    const handleOrder = async () => {
        setLoading(true);
        try {
            const latestValidation = await dispatch(validateCart()).unwrap();
            if (!latestValidation.valid) {
                const firstIssue = latestValidation.issues[0];
                message.error(firstIssue?.message || 'Giỏ hàng không hợp lệ, vui lòng kiểm tra lại.');
                return;
            }

            if (!selectedAddress) {
                message.error('Địa chỉ giao hàng không hợp lệ.');
                return;
            }

            const paymentMethod = selectedPayment === 'pm-qr' ? 'qr' : 'cod';

            const result = await orderService.createOrder({
                storeId: restaurant.id || '',
                addressId: selectedAddress,
                paymentMethod,
                note: note || undefined,
                platformVoucherId: selectedSystemDiscountVoucherId || selectedSystemShipVoucherId || undefined,
                storeVoucherId: selectedStoreVoucherId || undefined,
            });

            await dispatch(clearCart()).unwrap();
            message.success('Đặt hàng thành công!');

            if (paymentMethod === 'qr' && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                navigate(`/customer/order/${result.orderId}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Đặt hàng thất bại. Vui lòng thử lại.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px 100px' }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} style={{ padding: '4px 0' }} />
                <Title level={4} style={{ margin: 0 }}>Thanh toán</Title>
            </div>

            <Card style={{ marginBottom: 16, borderRadius: 14, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FF6B6B 0%, #ee5a24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={18} color="#fff" />
                    </div>
                    <Text strong style={{ fontSize: 15 }}>Địa chỉ giao hàng</Text>
                </div>
                <Select
                    value={selectedAddress || undefined}
                    onChange={(val: string) => { if (val === ADD_ADDRESS_VALUE) { openAddressModal(); } else { setSelectedAddress(val); } }}
                    style={{ width: '100%' }}
                    loading={loadingAddresses}
                    placeholder="Chọn địa chỉ giao hàng"
                    options={[
                        ...addresses.map(a => {
                            const lbl = labelOptions.find(o => o.value === a.label)?.label || a.label;
                            return { value: a.id, label: `${lbl} - ${[a.addressLine, a.ward].filter(Boolean).join(', ')}` };
                        }),
                        { value: ADD_ADDRESS_VALUE, label: '+ Thêm địa chỉ mới' },
                    ]}
                />
                {!selectedAddress && <Text type="warning" style={{ color: '#ff4d4f', marginTop: 8, display: 'block' }}>Vui lòng chọn địa chỉ giao hàng.</Text>}
            </Card>

            <Card style={{ marginBottom: 16, borderRadius: 14, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
                <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>🍽️ {restaurant.name}</Text>
                {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                        <div style={{ flex: 1 }}>
                            <Text>{item.name}</Text>
                            {item.selectedSize && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Size: {item.selectedSize.name}</Text>}
                            {item.selectedToppings.length > 0 && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>+ {item.selectedToppings.map(t => t.name).join(', ')}</Text>}
                            {item.note && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Ghi chú: {item.note}</Text>}
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
                <Input.TextArea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú cho đơn hàng..." rows={2} style={{ marginTop: 12 }} />
                {discountSuggestion && (
                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,193,7,0.08)', border: '1px dashed rgba(255,193,7,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#e6a700' }}>
                            💡 Mua thêm <Text strong style={{ color: '#e6a700', fontSize: 12 }}>{formatVND(discountSuggestion.gap)}</Text> để được <Text strong style={{ color: '#e6a700', fontSize: 12 }}>{discountSuggestion.voucher.title}</Text>
                        </Text>
                    </div>
                )}
            </Card>

            {(minOrderAmount > 0 || !isStoreOpen || (cartValidation && !cartValidation.valid)) && (
                <Card style={{ marginBottom: 16, borderRadius: 12, borderColor: 'var(--warning)' }}>
                    {!isStoreOpen && <Text style={{ display: 'block', color: 'var(--danger)' }}>Cửa hàng hiện đang đóng cửa.</Text>}
                    {minOrderAmount > 0 && subtotal < minOrderAmount && (
                        <Text style={{ display: 'block', color: 'var(--danger)' }}>
                            Đơn hàng chưa đạt tối thiểu {formatVND(minOrderAmount)}.
                        </Text>
                    )}
                    {cartValidation?.issues.map(issue => (
                        <Text key={`${issue.code}-${issue.cartItemId ?? 'cart'}`} style={{ display: 'block', color: 'var(--danger)' }}>
                            {issue.message}
                        </Text>
                    ))}
                </Card>
            )}

            <Card style={{ marginBottom: 16, borderRadius: 14, cursor: 'pointer', border: selectedVoucherIds.length > 0 ? '1.5px solid var(--primary)' : '1px solid var(--border-soft)', transition: 'all 0.2s', boxShadow: selectedVoucherIds.length > 0 ? '0 2px 12px rgba(76,175,80,0.12)' : 'none' }}
              onClick={() => setVoucherModal(true)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Ticket size={20} color="#fff" />
                        </div>
                        <div>
                            <Text strong style={{ fontSize: 14 }}>Voucher & Khuyến mãi</Text>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Quán', active: !!selectedStoreVoucherId },
                                    { label: 'Giảm giá', active: !!selectedSystemDiscountVoucherId },
                                    { label: 'Freeship', active: !!selectedSystemShipVoucherId },
                                ].map(slot => (
                                    <div key={slot.label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: slot.active ? 'rgba(76,175,80,0.1)' : 'var(--surface-soft)', border: `1px solid ${slot.active ? 'rgba(76,175,80,0.3)' : 'var(--border-soft)'}` }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: slot.active ? 'var(--success)' : 'var(--text-tertiary)' }} />
                                        <Text style={{ fontSize: 11, color: slot.active ? 'var(--success)' : 'var(--text-secondary)' }}>{slot.label}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {selectedVoucherIds.length > 0 ? (
                            <Tag color="success" style={{ margin: 0, fontWeight: 600 }}>{selectedVoucherIds.length} áp dụng</Tag>
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>Chọn voucher →</Text>
                        )}
                    </div>
                </div>
            </Card>

            <Card style={{ marginBottom: 16, borderRadius: 14, border: 'none', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={18} color="#fff" />
                    </div>
                    <Text strong style={{ fontSize: 15 }}>Phương thức thanh toán</Text>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {paymentMethods.map(pm => {
                        const isSelected = selectedPayment === pm.id;
                        const IconComponent = pm.icon;
                        return (
                            <div
                                key={pm.id}
                                onClick={() => setSelectedPayment(pm.id)}
                                style={{
                                    padding: '16px 14px',
                                    borderRadius: 12,
                                    border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border-soft)',
                                    background: isSelected ? 'rgba(76,175,80,0.04)' : 'var(--surface)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 10,
                                    position: 'relative',
                                    boxShadow: isSelected ? '0 2px 12px rgba(76,175,80,0.12)' : 'none',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary-light)'; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
                            >
                                {isSelected && (
                                    <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>
                                    </div>
                                )}
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <IconComponent size={22} color="#fff" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text strong style={{ display: 'block', fontSize: 13 }}>{pm.name}</Text>
                                    <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.3 }}>{pm.description}</Text>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card style={{ marginBottom: 24, borderRadius: 14, border: 'none', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={18} color="#fff" />
                    </div>
                    <Text strong style={{ fontSize: 15 }}>Chi tiết thanh toán</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><Text type="secondary">Tạm tính</Text><Text>{formatVND(subtotal)}</Text></div>
                    {voucherDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 8, background: 'rgba(76,175,80,0.06)', border: '1px dashed rgba(76,175,80,0.25)' }}>
                            <Text style={{ color: 'var(--success)', fontWeight: 500 }}>Giảm voucher</Text>
                            <Text style={{ color: 'var(--success)', fontWeight: 600 }}>-{formatVND(voucherDiscount)}</Text>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><Text type="secondary">Sau voucher</Text><Text>{formatVND(discountedSubtotal)}</Text></div>
                    {(distanceKm !== null || etaMinutes !== null) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                            <Text type="secondary">Khoảng cách · ETA</Text>
                            <Text>{distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '—'}{etaMinutes !== null ? ` · ~${etaMinutes} phút` : ''}</Text>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><Text type="secondary">Phí giao hàng</Text><Text>{formatVND(deliveryFee)}</Text></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><Text type="secondary">Phí nền tảng</Text><Text>{formatVND(platformFee)}</Text></div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(76,175,80,0.06) 0%, rgba(56,142,60,0.1) 100%)' }}>
                    <Text strong style={{ fontSize: 16 }}>Tổng cộng</Text>
                    <Text strong style={{ fontSize: 20, color: 'var(--primary)' }}>{formatVND(total)}</Text>
                </div>
            </Card>

            <Button
                type="primary"
                block
                size="large"
                loading={loading || cartLoading || previewLoading}
                onClick={handleOrder}
                disabled={!selectedAddress || !isStoreOpen || (minOrderAmount > 0 && subtotal < minOrderAmount)}
                style={{ height: 56, borderRadius: 14, fontWeight: 700, fontSize: 16, boxShadow: '0 4px 16px rgba(76,175,80,0.3)', letterSpacing: 0.3 }}
            >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <ShieldCheck size={20} /> Đặt hàng · {formatVND(total)}
                </span>
            </Button>

            <Modal open={voucherModal} onCancel={() => setVoucherModal(false)} title="Chọn voucher áp dụng" footer={<Button type="primary" onClick={() => setVoucherModal(false)}>Đóng</Button>} width={560}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {vouchers.length === 0 && <Text type="secondary">Bạn chưa có voucher nào cho cửa hàng này.</Text>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <Button type="default" disabled={voucherLoading} onClick={() => void autoPickBestVouchers(subtotal, deliveryFee)}>Tự chọn voucher tốt nhất</Button>
                        <Button danger disabled={voucherLoading || !restaurant.id} onClick={async () => { setSelectedStoreVoucherId(undefined); setSelectedSystemDiscountVoucherId(undefined); setSelectedSystemShipVoucherId(undefined); if (restaurant.id) await syncVoucherPricing(restaurant.id, 'remove'); }}>Bỏ tất cả voucher</Button>
                    </div>

                    <Card size="small" title="Voucher của quán (chọn 1)">
                        <Radio.Group style={{ width: '100%' }} value={selectedStoreVoucherId} onChange={e => void applySelectedVouchers(e.target.value, selectedSystemDiscountVoucherId, selectedSystemShipVoucherId)}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {vouchers.filter(v => v.scope === 'store').length === 0 && <Text type="secondary">Không có voucher quán khả dụng.</Text>}
                                {vouchers.filter(v => v.scope === 'store').map(v => {
                                    const est = estimateVoucherDiscount(v, subtotal, deliveryFee);
                                    const isBest = voucherPricing?.bestStoreVoucher?.voucherId === v.id;
                                    const notCollected = !v.isCollected;
                                    return (
                                        <Radio key={v.id} value={v.id} disabled={est <= 0 || voucherLoading || notCollected}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                                                <Space direction="vertical" size={0} style={{ flex: 1 }}>
                                                    <Text strong>{v.title} {isBest && <Tag color="gold">Best</Tag>} {notCollected && <Tag color="orange">Chưa thu thập</Tag>} {est <= 0 && v.isCollected && <Tag color="red">Chưa đủ điều kiện</Tag>}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{v.conditions.join(' • ')}</Text>
                                                    <Text style={{ color: notCollected ? 'var(--warning)' : est > 0 ? 'var(--success)' : 'var(--danger)', fontSize: 12 }}>{notCollected ? 'Cần thu thập voucher trước khi sử dụng' : est > 0 ? `Ước tính giảm ${formatVND(est)}` : `Cần đơn tối thiểu ${formatVND(v.minOrderValue)}`}</Text>
                                                </Space>
                                                {notCollected && (
                                                    <Button size="small" type="primary" loading={collectingVoucherId === v.id} onClick={(e) => { e.stopPropagation(); void handleCollectVoucherInCheckout(v.id); }}
                                                        style={{ fontSize: 11, borderRadius: 6, height: 26, flexShrink: 0 }}>Thu thập</Button>
                                                )}
                                            </div>
                                        </Radio>);
                                })}
                            </Space>
                        </Radio.Group>
                    </Card>

                    <Card size="small" title="Voucher hệ thống - Giảm giá (chọn 1)">
                        <Radio.Group style={{ width: '100%' }} value={selectedSystemDiscountVoucherId} onChange={e => void applySelectedVouchers(selectedStoreVoucherId, e.target.value, selectedSystemShipVoucherId)}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {vouchers.filter(v => v.scope === 'platform' && v.type !== 'free_ship').length === 0 && <Text type="secondary">Không có voucher giảm giá hệ thống.</Text>}
                                {vouchers.filter(v => v.scope === 'platform' && v.type !== 'free_ship').map(v => {
                                    const est = estimateVoucherDiscount(v, subtotal, deliveryFee);
                                    const isBest = voucherPricing?.bestPlatformVoucher?.voucherId === v.id;
                                    const notCollected = !v.isCollected;
                                    return (
                                        <Radio key={v.id} value={v.id} disabled={est <= 0 || voucherLoading || notCollected}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                                                <Space direction="vertical" size={0} style={{ flex: 1 }}>
                                                    <Text strong>{v.title} {isBest && <Tag color="gold">Best</Tag>} {notCollected && <Tag color="orange">Chưa thu thập</Tag>} {est <= 0 && v.isCollected && <Tag color="red">Chưa đủ điều kiện</Tag>}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{v.conditions.join(' • ')}</Text>
                                                    <Text style={{ color: notCollected ? 'var(--warning)' : est > 0 ? 'var(--success)' : 'var(--danger)', fontSize: 12 }}>{notCollected ? 'Cần thu thập voucher trước khi sử dụng' : est > 0 ? `Ước tính giảm ${formatVND(est)}` : `Cần đơn tối thiểu ${formatVND(v.minOrderValue)}`}</Text>
                                                </Space>
                                                {notCollected && (
                                                    <Button size="small" type="primary" loading={collectingVoucherId === v.id} onClick={(e) => { e.stopPropagation(); void handleCollectVoucherInCheckout(v.id); }}
                                                        style={{ fontSize: 11, borderRadius: 6, height: 26, flexShrink: 0 }}>Thu thập</Button>
                                                )}
                                            </div>
                                        </Radio>);
                                })}
                            </Space>
                        </Radio.Group>
                    </Card>

                    <Card size="small" title="Voucher hệ thống - Freeship (chọn 1)">
                        <Radio.Group style={{ width: '100%' }} value={selectedSystemShipVoucherId} onChange={e => void applySelectedVouchers(selectedStoreVoucherId, selectedSystemDiscountVoucherId, e.target.value)}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {vouchers.filter(v => v.scope === 'platform' && v.type === 'free_ship').length === 0 && <Text type="secondary">Không có voucher freeship hệ thống.</Text>}
                                {vouchers.filter(v => v.scope === 'platform' && v.type === 'free_ship').map(v => {
                                    const est = estimateVoucherDiscount(v, subtotal, deliveryFee);
                                    const notCollected = !v.isCollected;
                                    return (
                                        <Radio key={v.id} value={v.id} disabled={est <= 0 || voucherLoading || notCollected}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                                                <Space direction="vertical" size={0} style={{ flex: 1 }}>
                                                    <Text strong>{v.title} {notCollected && <Tag color="orange">Chưa thu thập</Tag>} {est <= 0 && v.isCollected && <Tag color="red">Chưa đủ điều kiện</Tag>}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{v.conditions.join(' • ')}</Text>
                                                    <Text style={{ color: notCollected ? 'var(--warning)' : est > 0 ? 'var(--success)' : 'var(--danger)', fontSize: 12 }}>{notCollected ? 'Cần thu thập voucher trước khi sử dụng' : est > 0 ? `Ước tính giảm phí ship ${formatVND(est)}` : `Cần đơn tối thiểu ${formatVND(v.minOrderValue)}`}</Text>
                                                </Space>
                                                {notCollected && (
                                                    <Button size="small" type="primary" loading={collectingVoucherId === v.id} onClick={(e) => { e.stopPropagation(); void handleCollectVoucherInCheckout(v.id); }}
                                                        style={{ fontSize: 11, borderRadius: 6, height: 26, flexShrink: 0 }}>Thu thập</Button>
                                                )}
                                            </div>
                                        </Radio>);
                                })}
                            </Space>
                        </Radio.Group>
                    </Card>
                </div>
            </Modal>

            <Modal
                title={editAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                open={addressModal}
                onCancel={() => { setAddressModal(false); addressForm.resetFields(); }}
                footer={null}
                width={540}
                destroyOnHidden
            >
                <Form form={addressForm} layout="vertical" onFinish={handleSaveAddress} style={{ marginTop: 16 }}>
                    <Form.Item name="label" label="Loại địa chỉ" rules={[{ required: true, message: 'Chọn loại địa chỉ' }]}>
                        <Select options={labelOptions} />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item name="recipientName" label="Tên người nhận">
                            <Input prefix={<User size={14} />} placeholder="Nguyễn Văn A" />
                        </Form.Item>
                        <Form.Item name="recipientPhone" label="SĐT người nhận" rules={[{ pattern: /^0[0-9]{9}$/, message: 'SĐT phải có 10 chữ số' }]}>
                            <Input prefix={<Phone size={14} />} placeholder="0901234567" maxLength={10} />
                        </Form.Item>
                    </div>
                    <Form.Item name="addressLine" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
                        <Input prefix={<MapPin size={14} />} placeholder="Số nhà, tên đường" />
                    </Form.Item>
                    <Form.Item name="provinceCode" label="Tỉnh / Thành phố">
                        <Select
                            showSearch placeholder="Chọn tỉnh/thành phố" loading={loadingProvinces}
                            options={provinces.map(p => ({ value: p.code, label: p.name }))}
                            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                            onChange={(val) => { addressForm.setFieldsValue({ districtCode: undefined, wardCode: undefined }); setDistricts([]); setWards([]); if (val) loadDistricts(val); }}
                            allowClear
                        />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item name="districtCode" label="Quận / Huyện">
                            <Select
                                showSearch placeholder="Chọn quận/huyện" loading={loadingDistricts}
                                options={districts.map(d => ({ value: d.code, label: d.name }))}
                                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                                onChange={(val) => { addressForm.setFieldValue('wardCode', undefined); setWards([]); if (val) loadWards(val); }}
                                allowClear disabled={districts.length === 0}
                            />
                        </Form.Item>
                        <Form.Item name="wardCode" label="Phường / Xã">
                            <Select
                                showSearch placeholder="Chọn phường/xã" loading={loadingWards}
                                options={wards.map(w => ({ value: w.code, label: w.name }))}
                                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                                allowClear disabled={wards.length === 0}
                            />
                        </Form.Item>
                    </div>
                    <Form.Item name="deliveryNote" label="Ghi chú giao hàng">
                        <TextArea rows={2} placeholder="Tầng 3, phòng 302, gọi trước khi giao..." />
                    </Form.Item>
                    <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 8 }}>
                        <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                        <Button onClick={() => { setAddressModal(false); addressForm.resetFields(); }}>Huỷ</Button>
                        <Button type="primary" htmlType="submit" loading={savingAddress}>{editAddress ? 'Cập nhật' : 'Thêm địa chỉ'}</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CheckoutPage;


