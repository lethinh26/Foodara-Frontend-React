import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Empty, Typography, Button, Row, Col } from 'antd';
import { Heart, Trash2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useStore';
import { selectFavorites, removeFavorite } from '../../../store/favoriteSlice';

const { Title, Text } = Typography;

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);

  if (favorites.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <Empty description="Chưa có mục yêu thích" image={<Heart size={48} color="var(--text-muted)" />} />
        <Button type="primary" onClick={() => navigate('/customer')} style={{ marginTop: 16 }}>Khám phá quán ăn</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Title level={4}>Yêu thích ({favorites.length})</Title>
      <Row gutter={[16, 16]}>
        {favorites.map(fav => (
          <Col key={fav.id} xs={24} sm={12} md={8}>
            <Card hoverable style={{ borderRadius: 12, overflow: 'hidden' }}
              cover={<div style={{ height: 140, overflow: 'hidden' }}><img src={fav.targetImage} alt={fav.targetName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
              onClick={() => navigate(`/customer/restaurant/${fav.restaurantId}`)}
            >
              <Text strong style={{ display: 'block' }}>{fav.targetName}</Text>
              {fav.type === 'menu_item' && <Text type="secondary" style={{ fontSize: 12 }}>{fav.restaurantName}</Text>}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" danger icon={<Trash2 size={12} />} onClick={e => { e.stopPropagation(); dispatch(removeFavorite({ targetId: fav.targetId, type: fav.type })); }}>Bỏ thích</Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FavoritesPage;
