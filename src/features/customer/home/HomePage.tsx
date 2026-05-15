import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Carousel, Skeleton, Row, Col, Typography, Space, Button } from 'antd';
import { MapPin, Clock, Star, ChevronRight, Flame, Truck, Sparkles, TrendingUp } from 'lucide-react';
import { homeService, type Banner } from '../../../services/homeService';
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

  useEffect(() => {
    const load = async () => {
      try {
        const [bannerRes, cats, feat, near] = await Promise.all([
          homeService.getBanners(),
          homeService.getCategories(),
          homeService.getPopularStores(10),
          homeService.getNearbyStores(undefined, undefined, 10),
        ]);
        setBanners(bannerRes);
        setCategories(cats);
        setFeatured(feat);
        setNearby(near);
        // For all restaurants, use popular stores for now
        setAllRestaurants(feat);
      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} />{formatDistance(restaurant.distance)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} />{formatETA(restaurant.estimatedDeliveryTime)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Truck size={12} />{formatVND(restaurant.deliveryFee)}</span>
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

      {/* Categories */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>Danh mục</Title>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 }}>
          {categories.map(cat => (
            <div key={cat.id} onClick={() => navigate(`/customer/search?category=${cat.id}`)}
              style={{ textAlign: 'center', cursor: 'pointer', padding: '12px 4px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-soft)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 8, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cat.icon.startsWith('http') ? (
                  <img src={cat.icon} alt={cat.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                ) : (
                  cat.icon
                )}
              </div>
              <Text style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</Text>
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
