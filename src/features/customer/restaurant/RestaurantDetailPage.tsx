import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Typography, Space, Button, Tabs, Rate, Divider, Badge, Spin, Empty, Modal, Input, Radio, Checkbox, message, Tooltip } from 'antd';
import { Star, MapPin, Clock, Truck, Heart, ShoppingCart, Plus, Minus, ArrowLeft, Ticket } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useStore';
import { addCartItem, fetchCart, selectCartItems, selectCartRestaurant } from '../../../store/cartSlice';
import { addFavorite, removeFavorite, selectIsFavorite } from '../../../store/favoriteSlice';
import { restaurantService } from '../../../services/restaurantService';
import { voucherService } from '../../../services/voucherService';
import { formatVND, formatDistance, formatETA, formatRelativeTime } from '../../../utils/format';
import type { Restaurant } from '../../../types/restaurant';
import type { MenuItem, MenuCategory } from '../../../types/menu';
import type { Review } from '../../../types/review';
import type { Voucher } from '../../../types/promotion';

const { Title, Text, Paragraph } = Typography;

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartRestaurant = useAppSelector(selectCartRestaurant);
  const isFav = useAppSelector(selectIsFavorite(id || '', 'restaurant'));

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [storeVouchers, setStoreVouchers] = useState<Voucher[]>([]);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherDetail, setVoucherDetail] = useState<Voucher | null>(null);
  const [collectingVoucherId, setCollectingVoucherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<Record<string, string[]>>({});
  const [itemNote, setItemNote] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    void dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [rest, cats, items, revs, vouchers] = await Promise.all([
          restaurantService.getRestaurantById(id),
          restaurantService.getMenuCategories(id),
          restaurantService.getMenuItems(id),
          restaurantService.getReviews(id),
          voucherService.getStoreVouchers(id),
        ]);
        setRestaurant(rest);
        setCategories(cats);
        setMenuItems(items);
        setReviews(revs);
        setStoreVouchers(vouchers);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
    setItemQty(1);
    setSelectedSizeId(item.sizes.find(s => s.isDefault)?.id || item.sizes[0]?.id || '');
    setSelectedToppings({});
    setItemNote('');
  };

  const getItemPrice = () => {
    if (!selectedItem) return 0;
    let price = selectedItem.basePrice;
    const size = selectedItem.sizes.find(s => s.id === selectedSizeId);
    if (size) price += size.priceAdjustment;
    Object.entries(selectedToppings).forEach(([groupId, optionIds]) => {
      const group = selectedItem.toppingGroups.find(g => g.id === groupId);
      if (group) {
        optionIds.forEach(optId => {
          const opt = group.options.find(o => o.id === optId);
          if (opt) price += opt.price;
        });
      }
    });
    return price * itemQty;
  };

  const handleCollectVoucher = async (voucher: Voucher) => {
    try {
      setCollectingVoucherId(voucher.id);
      const collected = await voucherService.collectVoucher(voucher.id);
      setStoreVouchers(prev => prev.map(v => (v.id === voucher.id ? { ...v, ...collected, isCollected: true } : v)));
      message.success(`Đã thu thập voucher ${voucher.code}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể thu thập voucher. Vui lòng thử lại.');
    } finally {
      setCollectingVoucherId(null);
    }
  };

  const handleAddToCart = () => {
    const submit = async () => {
      if (!selectedItem || !restaurant) return;

      for (const group of selectedItem.toppingGroups) {
        const selectedIds = selectedToppings[group.id] ?? [];
        const minRequired = group.required ? Math.max(group.minSelect, 1) : group.minSelect;
        if (selectedIds.length < minRequired) {
          message.error(`Vui lòng chọn ít nhất ${minRequired} tùy chọn cho "${group.name}"`);
          return;
        }
        if (selectedIds.length > group.maxSelect) {
          message.error(`Bạn chỉ có thể chọn tối đa ${group.maxSelect} tùy chọn cho "${group.name}"`);
          return;
        }
      }

      const size = selectedItem.sizes.find(s => s.id === selectedSizeId);
      const toppings = Object.entries(selectedToppings).flatMap(([groupId, optionIds]) => {
        const group = selectedItem.toppingGroups.find(g => g.id === groupId);
        return optionIds.map(optId => {
          const opt = group?.options.find(o => o.id === optId);
          return { groupId, optionId: optId, quantity: 1, name: opt?.name || '', price: opt?.price || 0 };
        });
      });
      const optionItemIds = [
        ...(size ? [size.id] : []),
        ...toppings.map(topping => topping.optionId),
      ];

      setAddingToCart(true);
      try {
        await dispatch(addCartItem({
          storeId: restaurant.id,
          storeName: restaurant.name,
          menuItemId: selectedItem.id,
          quantity: itemQty,
          optionItemIds,
          specialInstructions: itemNote,
          itemPreview: {
            name: selectedItem.name,
            image: selectedItem.image,
            basePrice: selectedItem.basePrice,
            selectedSize: size ? { sizeId: size.id, name: size.name, priceAdjustment: size.priceAdjustment } : null,
            selectedToppings: toppings,
          },
        })).unwrap();
        message.success(`Đã thêm ${selectedItem.name} vào giỏ`);
        setSelectedItem(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể thêm món vào giỏ hàng.';
        message.error(errorMessage);
      } finally {
        setAddingToCart(false);
      }
    };

    void submit();
  };

  const toggleFavorite = () => {
    if (!restaurant) return;
    if (isFav) {
      dispatch(removeFavorite({ targetId: restaurant.id, type: 'restaurant' }));
    } else {
      dispatch(addFavorite({
        id: `fav-${Date.now()}`,
        userId: '',
        type: 'restaurant',
        targetId: restaurant.id,
        targetName: restaurant.name,
        targetImage: restaurant.coverImage,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        addedAt: new Date().toISOString(),
      }));
    }
  };

  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + i.totalPrice, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;
  if (!restaurant) return <Empty description="Không tìm thấy quán ăn" />;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 100px' }} className="animate-fade-in">
      <div style={{ position: 'relative', height: 240, borderRadius: '0 0 16px 16px', overflow: 'hidden', marginBottom: 24 }}>
        <img src={restaurant.coverImage} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
        <Button type="text" icon={<ArrowLeft size={20} color="#fff" />} onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16 }} />
        <Button type="text" icon={<Heart size={20} color={isFav ? '#F44336' : '#fff'} fill={isFav ? '#F44336' : 'none'} />} onClick={toggleFavorite} style={{ position: 'absolute', top: 16, right: 16 }} />
        <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>{restaurant.name}</Title>
          <Space style={{ marginTop: 8 }}>
            <Tag color="green"><Star size={12} /> {restaurant.rating} ({restaurant.reviewCount})</Tag>
            <Tag><MapPin size={12} /> {formatDistance(restaurant.distance)}</Tag>
            <Tag><Clock size={12} /> {formatETA(restaurant.estimatedDeliveryTime)}</Tag>
            <Tag><Truck size={12} /> {formatVND(restaurant.deliveryFee)}</Tag>
          </Space>
        </div>
      </div>

      <Card style={{ marginBottom: 20, borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={18} color="#fff" />
            </div>
            <div>
              <Text strong style={{ fontSize: 15 }}>Voucher của quán</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{storeVouchers.length} voucher khả dụng</Text>
            </div>
          </div>
          <Button type="link" onClick={() => setVoucherModalOpen(true)} style={{ fontWeight: 600, padding: 0 }}>Xem tất cả →</Button>
        </div>
        {storeVouchers.length === 0 ? (
          <Text type="secondary" style={{ marginTop: 16, display: 'block', textAlign: 'center', padding: '20px 0' }}>Quán này chưa có voucher khả dụng.</Text>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
            {storeVouchers.filter(v => v.scope === 'store').map(voucher => (
              <div key={voucher.id} style={{ minWidth: 300, flex: '0 0 auto', scrollSnapAlign: 'start', display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-soft)', background: 'var(--surface)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 80, background: 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', position: 'relative' }}>
                  <Text style={{ color: '#fff', fontWeight: 700, fontSize: voucher.type === 'fixed' ? 14 : 18, lineHeight: 1.1, textAlign: 'center' }}>
                    {voucher.type === 'fixed' ? `${Math.round(voucher.discountValue / 1000)}K` : `${voucher.discountValue}%`}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{voucher.type === 'free_ship' ? 'Freeship' : 'Giảm'}</Text>
                  <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: 'var(--surface)' }} />
                </div>
                <div style={{ flex: 1, padding: '12px 14px', borderLeft: '2px dashed var(--border-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 13, lineHeight: 1.3 }}>{voucher.title}</Text>
                    {voucher.isCollected
                      ? <Tag color="success" style={{ margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 6px' }}>Đã lưu</Tag>
                      : <Tag color="warning" style={{ margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 6px' }}>Mới</Tag>}
                  </div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>{voucher.conditions.join(' • ')}</Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Button size="small" type="text" onClick={() => setVoucherDetail(voucher)} style={{ fontSize: 12, padding: '0 8px', height: 28, color: 'var(--primary)' }}>Chi tiết</Button>
                    {!voucher.isCollected && (
                      <Button size="small" type="primary" loading={collectingVoucherId === voucher.id} onClick={() => void handleCollectVoucher(voucher)}
                        style={{ fontSize: 12, borderRadius: 6, height: 28, fontWeight: 600 }}>
                        Thu thập
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Tabs defaultActiveKey="menu" items={[
        {
          key: 'menu', label: 'Thực đơn',
          children: (
            <div>
              {categories.map(cat => {
                const items = menuItems.filter(i => i.categoryId === cat.id);
                if (items.length === 0) return null;
                return (
                  <div key={cat.id} style={{ marginBottom: 32 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>{cat.name}</Title>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {items.map(item => (
                        <Card key={item.id} hoverable style={{ borderRadius: 12, opacity: item.isAvailable ? 1 : 0.5 }} onClick={() => item.isAvailable && openItemModal(item)}>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <img src={item.image} alt={item.name} style={{ width: 100, height: 100, borderRadius: 10, objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <Text strong>{item.name}</Text>
                                  {item.isBestSeller && <Tag color="orange" style={{ marginLeft: 8 }}>Bán chạy</Tag>}
                                  {item.isNew && <Tag color="green" style={{ marginLeft: 4 }}>Mới</Tag>}
                                  {!item.isAvailable && <Tag color="red" style={{ marginLeft: 4 }}>Hết hàng</Tag>}
                                  {item.pricing.bestVoucherCode && (
                                    <Tooltip title={`Voucher tốt nhất: ${item.pricing.bestVoucherCode}`}>
                                      <Tag color="blue" style={{ marginLeft: 4 }}>{item.pricing.bestVoucherCode}</Tag>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                              <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0' }} ellipsis={{ rows: 2 }}>{item.description}</Paragraph>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {item.pricing.estimatedDiscountAmount > 0 ? (
                                    <>
                                      <Text delete type="secondary" style={{ fontSize: 12 }}>{formatVND(item.basePrice)}</Text>
                                      <Text strong style={{ color: 'var(--success)', fontSize: 16 }}>{formatVND(item.pricing.discountedPrice)}</Text>
                                    </>
                                  ) : (
                                    <Text strong style={{ color: 'var(--primary)', fontSize: 15 }}>{formatVND(item.basePrice)}</Text>
                                  )}
                                </div>
                                {item.isAvailable && <Button type="primary" size="small" shape="circle" icon={<Plus size={14} />} />}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ),
        },
        {
          key: 'reviews', label: `Đánh giá (${reviews.length})`,
          children: reviews.length === 0 ? <Empty description="Chưa có đánh giá" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(rev => (
                <Card key={rev.id} style={{ borderRadius: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <img src={rev.customerAvatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{rev.customerName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{formatRelativeTime(rev.createdAt)}</Text>
                      </div>
                      <Rate disabled value={rev.restaurantRating} style={{ fontSize: 14 }} />
                      <Paragraph style={{ margin: '8px 0 0' }}>{rev.comment}</Paragraph>
                      {rev.tags.length > 0 && <Space style={{ marginTop: 4 }}>{rev.tags.map(t => <Tag key={t}>{t}</Tag>)}</Space>}
                      {rev.reply && (
                        <div style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: 12, marginTop: 8 }}>
                          <Text strong style={{ fontSize: 12 }}>{rev.reply.repliedBy}</Text>
                          <Paragraph style={{ margin: '4px 0 0', fontSize: 13 }}>{rev.reply.content}</Paragraph>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ),
        },
        {
          key: 'info', label: 'Thông tin',
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div><Text strong>Địa chỉ:</Text> <Text>{restaurant.address}</Text></div>
                <div><Text strong>Điện thoại:</Text> <Text>{restaurant.phone}</Text></div>
                <div><Text strong>Giờ mở cửa:</Text> <Text>{restaurant.openingHours.map(h => `${h.open} - ${h.close}`).join(', ')}</Text></div>
                <div><Text strong>Đơn tối thiểu:</Text> <Text>{formatVND(restaurant.minOrder)}</Text></div>
                <Paragraph>{restaurant.description}</Paragraph>
              </Space>
            </Card>
          ),
        },
      ]} />

      {cartCount > 0 && cartRestaurant.id === restaurant.id && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: 'var(--shadow-lg)' }}>
          <div><Badge count={cartCount}><ShoppingCart size={24} color="var(--primary)" /></Badge><Text strong style={{ marginLeft: 12 }}>{formatVND(cartTotal)}</Text></div>
          <Button type="primary" size="large" onClick={() => navigate('/customer/checkout')} style={{ borderRadius: 10, fontWeight: 600 }}>Xem giỏ hàng</Button>
        </div>
      )}

      <Modal open={!!selectedItem} onCancel={() => setSelectedItem(null)} footer={null} width={520} title={selectedItem?.name} centered>
        {selectedItem && (
          <div>
            <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
            <Paragraph type="secondary">{selectedItem.description}</Paragraph>

            {selectedItem.sizes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Chon size:</Text>
                <Radio.Group value={selectedSizeId} onChange={e => setSelectedSizeId(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {selectedItem.sizes.map(s => (
                    <Radio key={s.id} value={s.id}>
                      {s.name} {s.priceAdjustment !== 0 && <Text type="secondary">({s.priceAdjustment > 0 ? '+' : ''}{formatVND(s.priceAdjustment)})</Text>}
                    </Radio>
                  ))}
                </Radio.Group>
              </div>
            )}

            {selectedItem.toppingGroups.map(group => (
              <div key={group.id} style={{ marginBottom: 16 }}>
                <Text strong>{group.name}</Text>{group.required && <Tag color="red" style={{ marginLeft: 8 }}>Bat buoc</Tag>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {group.maxSelect === 1 ? (
                    <Radio.Group value={selectedToppings[group.id]?.[0]} onChange={e => setSelectedToppings(prev => ({ ...prev, [group.id]: [e.target.value] }))}>
                      {group.options.filter(o => o.isAvailable).map(opt => (
                        <Radio key={opt.id} value={opt.id} style={{ display: 'block', marginBottom: 4 }}>
                          {opt.name} {opt.price > 0 && <Text type="secondary">(+{formatVND(opt.price)})</Text>}
                        </Radio>
                      ))}
                    </Radio.Group>
                  ) : (
                    group.options.filter(o => o.isAvailable).map(opt => (
                      <Checkbox key={opt.id} checked={selectedToppings[group.id]?.includes(opt.id)} onChange={e => {
                        setSelectedToppings(prev => {
                          const current = prev[group.id] || [];
                          return { ...prev, [group.id]: e.target.checked ? [...current, opt.id] : current.filter(x => x !== opt.id) };
                        });
                      }}>
                        {opt.name} {opt.price > 0 && <Text type="secondary">(+{formatVND(opt.price)})</Text>}
                      </Checkbox>
                    ))
                  )}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <Text strong>Ghi chú cho quán:</Text>
              <Input.TextArea value={itemNote} onChange={e => setItemNote(e.target.value)} placeholder="VD: Ít cay, không hành..." rows={2} style={{ marginTop: 8 }} />
            </div>

            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button shape="circle" icon={<Minus size={16} />} onClick={() => setItemQty(Math.max(1, itemQty - 1))} disabled={itemQty <= 1} />
                <Text strong style={{ fontSize: 16, minWidth: 24, textAlign: 'center' }}>{itemQty}</Text>
                <Button shape="circle" icon={<Plus size={16} />} onClick={() => setItemQty(Math.min(selectedItem.maxQuantity, itemQty + 1))} disabled={itemQty >= selectedItem.maxQuantity} />
              </div>
              <Button
                type="primary"
                size="large"
                onClick={handleAddToCart}
                loading={addingToCart}
                style={{ borderRadius: 10, fontWeight: 600, minWidth: 220 }}
              >
                Thêm - {formatVND(getItemPrice())}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={voucherModalOpen}
        onCancel={() => setVoucherModalOpen(false)}
        footer={null}
        title={null}
        closable
        styles={{ body: { padding: 0 } }}
        modalRender={(node) => <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)' }}>{node}</div>}
      >
        <div style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ticket size={22} color="#fff" />
            <Title level={5} style={{ color: '#fff', margin: 0 }}>Voucher có thể thu thập</Title>
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{storeVouchers.length} voucher khả dụng</Text>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 450, overflowY: 'auto' }}>
          {storeVouchers.map(voucher => (
            <div key={voucher.id} style={{ display: 'flex', borderRadius: 12, border: '1px solid var(--border-soft)', transition: 'box-shadow 0.2s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ width: 76, borderRadius: '12px 0 0 12px', background: voucher.isCollected ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' : 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 6px', position: 'relative', flexShrink: 0 }}>
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: voucher.type === 'fixed' ? 13 : 16, lineHeight: 1.1, textAlign: 'center', wordBreak: 'keep-all' }}>
                  {voucher.type === 'fixed' ? `${Math.round(voucher.discountValue / 1000)}K` : `${voucher.discountValue}%`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, textTransform: 'uppercase' }}>{voucher.type === 'free_ship' ? 'Freeship' : 'Giảm'}</Text>
                <div style={{ position: 'absolute', right: -6, top: '30%', width: 12, height: 12, borderRadius: '50%', background: 'var(--surface)' }} />
                <div style={{ position: 'absolute', right: -6, bottom: '30%', width: 12, height: 12, borderRadius: '50%', background: 'var(--surface)' }} />
              </div>
              <div style={{ flex: 1, padding: '12px 14px', borderLeft: '2px dashed var(--border-soft)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <Text strong style={{ fontSize: 13 }}>{voucher.title}</Text>
                    <Tag color={voucher.isCollected ? 'success' : 'warning'} style={{ margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 6px' }}>
                      {voucher.isCollected ? 'Đã lưu' : 'Mới'}
                    </Tag>
                  </div>
                  <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 11 }}>{voucher.code}</Text>
                  <Text style={{ display: '-webkit-box', fontSize: 12, marginTop: 2, overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{voucher.description}</Text>
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button size="small" type="text" onClick={() => setVoucherDetail(voucher)} style={{ fontSize: 12, padding: '0 8px', height: 28, color: 'var(--primary)' }}>Chi tiết</Button>
                  <Button size="small" type="primary" disabled={voucher.isCollected} loading={collectingVoucherId === voucher.id} onClick={() => void handleCollectVoucher(voucher)}
                    style={{ fontSize: 12, borderRadius: 6, height: 28, fontWeight: 600 }}>
                    {voucher.isCollected ? 'Đã thu thập' : 'Thu thập'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-soft)', textAlign: 'right' }}>
          <Button type="primary" onClick={() => setVoucherModalOpen(false)} style={{ borderRadius: 8, fontWeight: 600 }}>Đóng</Button>
        </div>
      </Modal>

      <Modal
        open={!!voucherDetail}
        onCancel={() => setVoucherDetail(null)}
        footer={null}
        closable
        centered
        width={420}
        styles={{ body: { padding: 0 } }}
        modalRender={(node) => <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--shadow-xl)' }}>{node}</div>}
      >
        {voucherDetail && (
          <>
            <div style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #e65100 100%)', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Ticket size={28} color="#fff" />
              </div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>{voucherDetail.title}</Title>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 14px', marginTop: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>{voucherDetail.code}</Text>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-soft)', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Giảm</Text>
                  <Text strong style={{ fontSize: 18, color: 'var(--secondary)' }}>
                    {voucherDetail.type === 'percentage' ? `${voucherDetail.discountValue}%` : formatVND(voucherDetail.discountValue)}
                  </Text>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-soft)', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Đơn tối thiểu</Text>
                  <Text strong style={{ fontSize: 15 }}>{formatVND(voucherDetail.minOrderValue)}</Text>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)', flexShrink: 0 }} />
                  <Text style={{ fontSize: 13 }}>{voucherDetail.scope === 'platform' ? 'Voucher sàn Foodara' : 'Voucher từ cửa hàng'}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)', flexShrink: 0 }} />
                  <Text style={{ fontSize: 13 }}>{voucherDetail.conditions.join(' • ')}</Text>
                </div>
              </div>
              {voucherDetail.potentialDiscount > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', marginBottom: 16 }}>
                  <Text style={{ color: 'var(--success)', fontWeight: 600, fontSize: 13 }}>✨ Ước tính tiết kiệm: {formatVND(voucherDetail.potentialDiscount)}</Text>
                </div>
              )}
              <Button type="primary" block size="large" onClick={() => setVoucherDetail(null)} style={{ borderRadius: 10, fontWeight: 600, height: 44 }}>Đã hiểu</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default RestaurantDetailPage;
