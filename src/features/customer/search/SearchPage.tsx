import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Select, Slider, Switch, Card, Tag, Row, Col, Empty, Spin, Typography, Space, Skeleton, Tooltip } from 'antd';
import { Search, Star, MapPin, Clock, Truck, Filter } from 'lucide-react';
import { searchService } from '../../../services/searchService';
import { authService } from '../../../services/authService';
import { checkoutService } from '../../../services/checkoutService';
import { formatVND, formatDistance, formatETA } from '../../../utils/format';
import { SORT_OPTIONS } from '../../../utils/constants';
import type { Restaurant, RestaurantFilters } from '../../../types/restaurant';
import MapView, { type MapMarker } from '../../../components/map/MapView';

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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userOrigin, setUserOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [originResolved, setOriginResolved] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
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

  // Resolve origin: default address -> geolocation -> none
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const addrs = await authService.getAddresses();
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def?.latitude && def?.longitude) {
          if (!cancelled) { setUserOrigin({ lat: Number(def.latitude), lng: Number(def.longitude) }); setOriginResolved(true); }
          return;
        }
      } catch { /* ignore */ }
      if (!navigator.geolocation) { if (!cancelled) setOriginResolved(true); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (!cancelled) { setUserOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setOriginResolved(true); } },
        () => { if (!cancelled) setOriginResolved(true); },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 }
      );
    })();
    return () => { cancelled = true; };
  }, []);

  // Batch quote distance/ETA/fee
  useEffect(() => {
    if (!userOrigin || !restaurants.length) return;
    let cancelled = false;
    setQuotesLoading(true);
    const stop = setTimeout(() => setQuotesLoading(false), 3000);
    (async () => {
      try {
        const ids = restaurants.map((r) => r.id);
        const items = await checkoutService.getDeliveryFeeBatch({ lat: userOrigin.lat, lng: userOrigin.lng, storeIds: ids });
        const map = new Map(items.map((it) => [it.storeId, it]));
        if (cancelled) return;
        setRestaurants((prev) => prev.map((r) => {
          const it = map.get(r.id);
          if (!it || it.distanceKm == null) return r;
          return { ...r, distance: it.distanceKm, estimatedDeliveryTime: it.etaMinutes ?? r.estimatedDeliveryTime, deliveryFee: it.deliveryFee ?? r.deliveryFee };
        }));
      } catch { /* ignore */ }
      setQuotesLoading(false);
      clearTimeout(stop);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOrigin, restaurants.length]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={16} />} placeholder="Tìm quán ăn, món ăn..." value={query} onChange={e => setQuery(e.target.value)} size="large" style={{ flex: 1, minWidth: 200, borderRadius: 10 }} allowClear autoFocus />
        <Select value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} style={{ width: 160 }} size="large" />
        <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: showFilters ? 'var(--primary-bg)' : 'var(--surface)', color: showFilters ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', fontSize: 14 }}>
          <Filter size={16} /> Bộ lọc
        </button>
        <button onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: viewMode === 'map' ? 'var(--primary-bg)' : 'var(--surface)', color: viewMode === 'map' ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', fontSize: 14 }}>
          <MapPin size={16} /> {viewMode === 'list' ? 'Xem bản đồ' : 'Xem danh sách'}
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
      ) : viewMode === 'map' ? (
        <div style={{ borderRadius: 14, overflow: 'hidden', height: 'calc(100vh - 200px)', minHeight: 400 }}>
          <MapView
            markers={restaurants.filter(r => r.coordinates?.lat && r.coordinates?.lng).map(r => ({
              id: `store-${r.id}`,
              lat: r.coordinates.lat,
              lng: r.coordinates.lng,
              type: 'store' as const,
              label: r.name,
            }))}
            onMarkerClick={(markerId) => {
              const storeId = markerId.replace('store-', '');
              navigate(`/customer/restaurant/${storeId}`);
            }}
          />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {restaurants.map(r => (
            <Col key={r.id} xs={24} sm={12} md={8} lg={6}>
              <Card hoverable style={{ borderRadius: 12, overflow: 'hidden', height: '100%' }}
                cover={<div style={{ position: 'relative', height: 150, overflow: 'hidden' }}><img src={r.coverImage} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{(r.hasPromotion || r.promotionText) && <Tag color="orange" style={{ position: 'absolute', top: 8, left: 8 }}>{r.promotionText || 'Khuyến mãi'}</Tag>}</div>}
                onClick={() => navigate(`/customer/restaurant/${r.id}`)}
              >
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }} ellipsis={{ tooltip: r.name }}>{r.name}</Text>
                <Space size={8} style={{ marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--secondary)', fontWeight: 600, fontSize: 13 }}><Star size={13} fill="var(--secondary)" />{r.rating}</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>({r.reviewCount})</Text>
                </Space>
                {r.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>
                    <MapPin size={11} />
                    <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: r.address }}>{r.address}</Text>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, color: 'var(--text-muted)', fontSize: 12, flexWrap: 'wrap', minHeight: 16 }}>
                  {quotesLoading ? (
                    <Skeleton.Input active size="small" style={{ width: 180, height: 12 }} />
                  ) : (userOrigin && (r.distance > 0 || r.estimatedDeliveryTime > 0)) ? (
                    <>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{formatDistance(r.distance)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{formatETA(r.estimatedDeliveryTime)}</span>
                      <Tooltip title="Phí ship cơ bản theo khoảng cách. Có thể được giảm bằng voucher khi đặt hàng."><span style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'help' }}><Truck size={11} />{formatVND(r.deliveryFee)}</span></Tooltip>
                    </>
                  ) : null}
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


