import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Select, Slider, Switch, Card, Tag, Row, Col, Empty, Spin, Typography, Space } from 'antd';
import { Search, Star, MapPin, Clock, Truck, Filter } from 'lucide-react';
import { searchService } from '../../../services/searchService';
import { formatVND, formatDistance, formatETA } from '../../../utils/format';
import { SORT_OPTIONS } from '../../../utils/constants';
import type { Restaurant, RestaurantFilters } from '../../../types/restaurant';

const { Text } = Typography;

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [minRating, setMinRating] = useState(0);
  const [maxFee, setMaxFee] = useState(30000);
  const [promoOnly, setPromoOnly] = useState(params.get('promotion') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const categoryParam = params.get('category');

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      const filters: Partial<RestaurantFilters> = {
        query,
        sortBy: sortBy as RestaurantFilters['sortBy'],
        minRating,
        maxDeliveryFee: maxFee,
        hasPromotion: promoOnly || undefined,
        categoryIds: categoryParam ? [categoryParam] : undefined,
      };
      const result = await searchService.searchStores(filters);
      setRestaurants(result.data);
      setLoading(false);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, sortBy, minRating, maxFee, promoOnly, categoryParam]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={16} />} placeholder="Tìm quán ăn, món ăn..." value={query} onChange={e => setQuery(e.target.value)} size="large" style={{ flex: 1, minWidth: 200, borderRadius: 10 }} allowClear autoFocus />
        <Select value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} style={{ width: 160 }} size="large" />
        <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: showFilters ? 'var(--primary-bg)' : 'var(--surface)', color: showFilters ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', fontSize: 14 }}>
          <Filter size={16} /> Bộ lọc
        </button>
      </div>

      {showFilters && (
        <Card style={{ marginBottom: 24, borderRadius: 12 }} className="animate-slide-up">
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Đánh giá tối thiểu</Text>
              <Slider min={0} max={5} step={0.5} value={minRating} onChange={setMinRating} marks={{ 0: '0', 3: '3⭐', 4: '4⭐', 5: '5⭐' }} />
            </Col>
            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Phí giao hàng tối đa</Text>
              <Slider min={0} max={50000} step={5000} value={maxFee} onChange={setMaxFee} tooltip={{ formatter: v => formatVND(v || 0) }} />
            </Col>
            <Col xs={24} sm={8}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Chỉ quán có khuyến mãi</Text>
              <Switch checked={promoOnly} onChange={setPromoOnly} />
            </Col>
          </Row>
        </Card>
      )}

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{loading ? 'Đang tìm...' : `${restaurants.length} kết quả`}</Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : restaurants.length === 0 ? (
        <Empty description="Không tìm thấy quán ăn phù hợp" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Row gutter={[16, 16]}>
          {restaurants.map(r => (
            <Col key={r.id} xs={24} sm={12} md={8} lg={6}>
              <Card hoverable style={{ borderRadius: 12, overflow: 'hidden', height: '100%' }}
                cover={<div style={{ position: 'relative', height: 150, overflow: 'hidden' }}><img src={r.coverImage} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{r.hasPromotion && <Tag color="orange" style={{ position: 'absolute', top: 8, left: 8 }}>{r.promotionText}</Tag>}</div>}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
              >
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>{r.name}</Text>
                <Space size={8} style={{ marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--secondary)', fontWeight: 600, fontSize: 13 }}><Star size={13} fill="var(--secondary)" />{r.rating}</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>({r.reviewCount})</Text>
                </Space>
                <div style={{ display: 'flex', gap: 10, color: 'var(--text-muted)', fontSize: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{formatDistance(r.distance)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{formatETA(r.estimatedDeliveryTime)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Truck size={11} />{formatVND(r.deliveryFee)}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default SearchPage;
