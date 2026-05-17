import React, { useEffect, useState, useCallback } from 'react';
import { Card, Rate, Typography, Empty, Skeleton, Space, Tag, Avatar } from 'antd';
import { MessageSquare } from 'lucide-react';
import { merchantService } from '../../../services/merchantService';
import { apiClient } from '../../../services/apiClient';
import { formatRelativeTime } from '../../../utils/format';

const { Title, Text, Paragraph } = Typography;

interface StoreReview {
  id: string;
  storeRating: number | null;
  storeComment?: string;
  customerName?: string;
  customerAvatar?: string;
  isAnonymous?: boolean;
  createdAt?: string;
}

const MerchantReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const stores = await merchantService.getStores();
      if (stores.length === 0) {
        setReviews([]);
        return;
      }
      const primaryStore = stores[0];
      setStoreName(primaryStore.name);
      const data = await apiClient.get<StoreReview[]>(`/v1/stores/${primaryStore.id}/reviews`);
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  if (loading) return <Skeleton active />;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>Đánh giá của khách hàng</Title>
          <Text type="secondary">{storeName} — {reviews.length} đánh giá</Text>
        </Space>
        <Tag icon={<MessageSquare size={12} />} color="blue">{reviews.length} đánh giá</Tag>
      </div>

      {reviews.length === 0 ? (
        <Empty description="Chưa có đánh giá nào" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(rev => (
            <Card key={rev.id} style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar size={40} src={rev.customerAvatar || undefined}>
                  {(rev.customerName || 'K').charAt(0)}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{rev.customerName || 'Ẩn danh'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{rev.createdAt ? formatRelativeTime(rev.createdAt) : ''}</Text>
                  </div>
                  <Rate disabled value={rev.storeRating ?? 0} style={{ fontSize: 14, marginTop: 4 }} />
                  {rev.storeComment && (
                    <Paragraph style={{ margin: '8px 0 0', fontSize: 14 }}>{rev.storeComment}</Paragraph>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantReviewsPage;
