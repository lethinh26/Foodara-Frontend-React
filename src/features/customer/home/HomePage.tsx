import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Carousel, Skeleton, Row, Col, Typography, Space, Button, Tooltip } from 'antd';
import { MapPin, Clock, Star, ChevronRight, Flame, Truck, Sparkles, TrendingUp } from 'lucide-react';
import { homeService, type Banner } from '../../../services/homeService';
import { mapboxLocationService } from '../../../services/locationService';
import { checkoutService } from '../../../services/checkoutService';
import { authService } from '../../../services/authService';
import { formatVND, formatDistance, formatETA } from '../../../utils/format';
import type { Restaurant, RestaurantCategory } from '../../../types/restaurant';

const { Title, Text } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [featured, setFeatured] = useState<Restaurant[]>([]);
  const [nearby, setNearby] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userOrigin, setUserOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [originResolved, setOriginResolved] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bannerRes, cats, feat] = await Promise.all([
          homeService.getBanners(),
          homeService.getCategories(),
          homeService.getPopularStores(10),
        ]);
        setBanners(bannerRes);
        setCategories(cats);
        setFeatured(feat);
        setAllRestaurants(feat);
      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch nearby when userOrigin is resolved
  useEffect(() => {
    if (!userOrigin) return;
    homeService.getNearbyStores(userOrigin.lat, userOrigin.lng, 10)
      .then(n => setNearby(n))
      .catch(() => setNearby([]));
  }, [userOrigin]);

  // Resolve origin: default address -> geolocation -> none
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const addrs = await authService.getAddresses();
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def?.latitude && def?.longitude) {
          if (!cancelled) {
            setUserOrigin({ lat: Number(def.latitude), lng: Number(def.longitude) });
            setOriginResolved(true);
          }
          return;
        }
      } catch { /* not logged in / no addresses */ }
      if (!navigator.geolocation) {
        if (!cancelled) setOriginResolved(true);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            setUserOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setOriginResolved(true);
          }
        },
        () => { if (!cancelled) setOriginResolved(true); },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 }
      );
    })();
    return () => { cancelled = true; };
  }, []);

  // Batch quote: 1 call POST /v1/checkout/delivery-fee/batch -> distance/ETA/fee theo DeliveryFeeConfig
  useEffect(() => {
    if (!userOrigin) return;
    if (!featured.length && !nearby.length) return;
    let cancelled = false;
    setQuotesLoading(true);
    const stop = setTimeout(() => setQuotesLoading(false), 3000);
    (async () => {
      const ids = Array.from(new Set([...featured, ...nearby].map((r) => r.id)));
      try {
        const items = await checkoutService.getDeliveryFeeBatch({ lat: userOrigin.lat, lng: userOrigin.lng, storeIds: ids });
        const map = new Map(items.map((it) => [it.storeId, it]));
        const enrich = (list: Restaurant[]) => list.map((r) => {
          const it = map.get(r.id);
          if (!it || it.distanceKm == null) return r;
          return { ...r, distance: it.distanceKm, estimatedDeliveryTime: it.etaMinutes ?? r.estimatedDeliveryTime, deliveryFee: it.deliveryFee ?? r.deliveryFee };
        }).slice().sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        if (cancelled) return;
        setFeatured(enrich(featured));
        setNearby(enrich(nearby));
        setAllRestaurants(enrich(featured));
      } catch { /* ignore */ }
      setQuotesLoading(false);
      clearTimeout(stop);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOrigin, featured.length, nearby.length]);



  const RestaurantCard: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => (
    <Card
      hoverable
      style={{ borderRadius: 12, overflow: 'hidden', height: '100%' }}
      cover={
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <img src={restaurant.coverImage} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {restaurant.hasPromotion && (
            <Tag color="orange" style={{ position: 'absolute', top: 8, left: 8, borderRadius: 6 }}>{restaurant.promotionText}</Tag>
          )}
          {restaurant.isNew && (
            <Tag color="green" style={{ position: 'absolute', top: 8, right: 8, borderRadius: 6 }}>Mới</Tag>
          )}
          {restaurant.status === 'closed' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Đã đóng cửa</Text>
            </div>
          )}
        </div>
      }
      onClick={() => navigate(`/customer/restaurant/${restaurant.id}`)}
    >
      <div style={{ padding: '4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {restaurant.logo ? (
            <img src={restaurant.logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-soft)' }} />
          ) : null}
          <Text strong style={{ fontSize: 15 }}>{restaurant.name}</Text>
        </div>
        <Space size={12} style={{ marginBottom: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--secondary)', fontWeight: 600, fontSize: 13 }}>
            <Star size={14} fill="var(--secondary)" /> {restaurant.rating}
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>({restaurant.reviewCount})</Text>
          </span>
        </Space>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 12 }}>
          {quotesLoading ? (
            <Skeleton.Input active size="small" style={{ width: 200, height: 14 }} />
          ) : userOrigin && (restaurant.distance > 0 || restaurant.estimatedDeliveryTime > 0) ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} />{formatDistance(restaurant.distance)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} />{formatETA(restaurant.estimatedDeliveryTime)}</span>
              <Tooltip title="Phí ship cơ bản theo khoảng cách. Có thể được giảm bằng voucher khi đặt hàng."><span style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'help' }}><Truck size={12} />{formatVND(restaurant.deliveryFee)}</span></Tooltip>
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        <Skeleton.Image active style={{ width: '100%', height: 200, borderRadius: 12 }} />
        <Row gutter={16} style={{ marginTop: 24 }}>
          {[1, 2, 3, 4].map(i => (<Col key={i} xs={12} sm={8} md={6}><Skeleton active /></Col>))}
        </Row>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px 48px' }} className="animate-fade-in">
      {/* Banner */}
      {banners.length > 0 && (
        <Carousel autoplay autoplaySpeed={4000} dots style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 32 }}>
          {banners.map(b => (
            <div key={b.id}>
              <div
                style={{ position: 'relative', height: 220, borderRadius: 16, overflow: 'hidden', cursor: b.targetUrl ? 'pointer' : 'default' }}
                onClick={() => b.targetUrl && navigate(b.targetUrl)}
              >
                <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px 40px' }}>
                  <div style={{ color: '#fff', fontSize: 26, fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{b.title}</div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      )}

      {/* Categories — Clean Image Cards */}
      <div className="section" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Danh mục</Title>
        </div>
        <div style={{
          display: 'flex', gap: 14, overflowX: 'auto', padding: '2px 2px 8px',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => navigate(`/customer/search?category=${cat.id}`)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', userSelect: 'none', flexShrink: 0, width: 84,
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
                background: '#f2f2f2',
                border: '1px solid #eee',
              }}>
                {cat.icon.startsWith('http') ? (
                  <img src={cat.icon} alt={cat.name} style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                  }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, background: '#fafafa',
                  }}>
                    {cat.icon}
                  </div>
                )}
              </div>
              <Text style={{
                fontSize: 12, fontWeight: 500, color: '#333',
                textAlign: 'center', lineHeight: 1.3,
              }}>
                {cat.name}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Flash Deals */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space><Flame size={20} color="var(--danger)" /><Title level={5} style={{ margin: 0 }}>Flash Deal</Title></Space>
          <Button type="link" onClick={() => navigate('/customer/search?promotion=true')}>Xem tất cả <ChevronRight size={14} /></Button>
        </div>
        <Row gutter={[16, 16]}>
          {allRestaurants.filter(r => r.hasPromotion).slice(0, 4).map(r => (
            <Col key={r.id} xs={12} sm={12} md={8} lg={6}><RestaurantCard restaurant={r} /></Col>
          ))}
        </Row>
      </div>

      {/* Featured */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space><Sparkles size={20} color="var(--primary)" /><Title level={5} style={{ margin: 0 }}>Quán nổi bật</Title></Space>
          <Button type="link" onClick={() => navigate('/customer/search')}>Xem tất cả <ChevronRight size={14} /></Button>
        </div>
        <Row gutter={[16, 16]}>
          {featured.map(r => (
            <Col key={r.id} xs={12} sm={12} md={8} lg={6}><RestaurantCard restaurant={r} /></Col>
          ))}
        </Row>
      </div>

      {/* Nearby */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space><MapPin size={20} color="var(--info)" /><Title level={5} style={{ margin: 0 }}>Gần bạn</Title></Space>
        </div>
        <Row gutter={[16, 16]}>
          {nearby.map(r => (
            <Col key={r.id} xs={12} sm={12} md={8} lg={6}><RestaurantCard restaurant={r} /></Col>
          ))}
        </Row>
      </div>

      {/* All Restaurants */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space><TrendingUp size={20} color="var(--secondary)" /><Title level={5} style={{ margin: 0 }}>Tất cả quán</Title></Space>
        </div>
        <Row gutter={[16, 16]}>
          {allRestaurants.map(r => (
            <Col key={r.id} xs={12} sm={12} md={8} lg={6}><RestaurantCard restaurant={r} /></Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default HomePage;









