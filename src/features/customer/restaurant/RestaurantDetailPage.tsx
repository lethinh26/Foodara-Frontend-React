import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tag, Typography, Space, Button, Tabs, Rate, Divider, Badge, Spin, Empty, Modal, Input, Radio, Checkbox, message } from 'antd';
import { Star, MapPin, Clock, Truck, Heart, ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../hooks/useStore';
import { addToCart, selectCartItems, selectCartRestaurant } from '../../../store/cartSlice';
import { addFavorite, removeFavorite, selectIsFavorite } from '../../../store/favoriteSlice';
import { restaurantService } from '../../../services/restaurantService';
import { formatVND, formatDistance, formatETA, formatRelativeTime } from '../../../utils/format';
import { generateId } from '../../../utils/helpers';
import type { Restaurant } from '../../../types/restaurant';
import type { MenuItem, MenuCategory } from '../../../types/menu';
import type { Review } from '../../../types/review';

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
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [selectedToppings, setSelectedToppings] = useState<Record<string, string[]>>({});
  const [itemNote, setItemNote] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [rest, cats, items, revs] = await Promise.all([
        restaurantService.getRestaurantById(id),
        restaurantService.getMenuCategories(id),
        restaurantService.getMenuItems(id),
        restaurantService.getReviews(id),
      ]);
      setRestaurant(rest);
      setCategories(cats);
      setMenuItems(items);
      setReviews(revs);
      setLoading(false);
    };
    load();
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

  const handleAddToCart = () => {
    if (!selectedItem || !restaurant) return;
    const size = selectedItem.sizes.find(s => s.id === selectedSizeId);
    const toppings = Object.entries(selectedToppings).flatMap(([groupId, optionIds]) => {
      const group = selectedItem.toppingGroups.find(g => g.id === groupId);
      return optionIds.map(optId => {
        const opt = group?.options.find(o => o.id === optId);
        return { groupId, optionId: optId, quantity: 1, name: opt?.name || '', price: opt?.price || 0 };
      });
    });
    dispatch(addToCart({
      item: {
        id: generateId(), menuItemId: selectedItem.id, restaurantId: restaurant.id,
        name: selectedItem.name, image: selectedItem.image, basePrice: selectedItem.basePrice,
        quantity: itemQty,
        selectedSize: size ? { sizeId: size.id, name: size.name, priceAdjustment: size.priceAdjustment } : null,
        selectedToppings: toppings, selectedVariant: null, note: itemNote, totalPrice: getItemPrice(),
      },
      restaurantId: restaurant.id, restaurantName: restaurant.name,
    }));
    message.success(`Đã thêm ${selectedItem.name} vào giỏ`);
    setSelectedItem(null);
  };

  const toggleFavorite = () => {
    if (!restaurant) return;
    if (isFav) {
      dispatch(removeFavorite({ targetId: restaurant.id, type: 'restaurant' }));
    } else {
      dispatch(addFavorite({ id: generateId(), userId: '', type: 'restaurant', targetId: restaurant.id, targetName: restaurant.name, targetImage: restaurant.coverImage, restaurantId: restaurant.id, restaurantName: restaurant.name, addedAt: new Date().toISOString() }));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;
  if (!restaurant) return <Empty description="Không tìm thấy quán ăn" />;

  const cartTotal = cartItems.reduce((s, i) => s + i.totalPrice, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 100px' }} className="animate-fade-in">
      {/* Hero */}
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

      {/* Info + Menu */}
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
                                </div>
                              </div>
                              <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0' }} ellipsis={{ rows: 2 }}>{item.description}</Paragraph>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ color: 'var(--primary)', fontSize: 15 }}>{formatVND(item.basePrice)}</Text>
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

      {/* Cart bar */}
      {cartCount > 0 && cartRestaurant.id === restaurant.id && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: 'var(--shadow-lg)' }}>
          <div><Badge count={cartCount}><ShoppingCart size={24} color="var(--primary)" /></Badge><Text strong style={{ marginLeft: 12 }}>{formatVND(cartTotal)}</Text></div>
          <Button type="primary" size="large" onClick={() => navigate('/customer/checkout')} style={{ borderRadius: 10, fontWeight: 600 }}>Xem giỏ hàng</Button>
        </div>
      )}

      {/* Item Modal */}
      <Modal open={!!selectedItem} onCancel={() => setSelectedItem(null)} footer={null} width={520} title={selectedItem?.name} centered>
        {selectedItem && (
          <div>
            <img src={selectedItem.image} alt={selectedItem.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
            <Paragraph type="secondary">{selectedItem.description}</Paragraph>

            {selectedItem.sizes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Chọn size:</Text>
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
                <Text strong>{group.name}</Text>{group.required && <Tag color="red" style={{ marginLeft: 8 }}>Bắt buộc</Tag>}
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
                          return { ...prev, [group.id]: e.target.checked ? [...current, opt.id] : current.filter(id => id !== opt.id) };
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
              <Button type="primary" size="large" onClick={handleAddToCart} style={{ borderRadius: 10, fontWeight: 600, minWidth: 180 }}>
                Thêm - {formatVND(getItemPrice())}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RestaurantDetailPage;
