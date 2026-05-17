import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Rate, Input, Button, Typography, Tag, message, Space, Spin, Result } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { reviewService, type ReviewResponse, type CreateReviewPayload } from '../../../services/reviewService';
import type { Order } from '../../../types/order';

const { Title, Text } = Typography;

const ReviewPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewResponse | null>(null);

  const TAGS = ['Ngon', 'Giao nhanh', 'Đóng gói đẹp', 'Nhiều lượng', 'Đúng vị', 'Tươi ngon', 'Giá hợp lý', 'Nhân viên thân thiện'];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      try {
        const [orderData, review] = await Promise.all([
          orderService.getOrderById(orderId),
          reviewService.getReviewByOrder(orderId).catch(() => null),
        ]);
        setOrder(orderData);
        setExistingReview(review);
      } catch {
        message.error('Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [orderId]);

  const handleSubmit = async (values: {
    storeRating: number;
    driverRating?: number;
    comment?: string;
    items?: Record<string, number>;
  }) => {
    if (!orderId) return;
    setSubmitting(true);
    try {
      const itemRatings: CreateReviewPayload['items'] = [];
      if (values.items) {
        Object.entries(values.items).forEach(([menuItemId, rating]) => {
          if (rating && rating > 0) {
            itemRatings.push({ menuItemId, rating });
          }
        });
      }

      await reviewService.createReview({
        orderId,
        storeRating: values.storeRating,
        storeComment: values.comment,
        driverRating: values.driverRating,
        isAnonymous: false,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        items: itemRatings.length > 0 ? itemRatings : undefined,
      });
      message.success('Cảm ơn bạn đã đánh giá!');
      navigate('/customer/orders');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;
  }

  if (existingReview) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }} className="animate-fade-in">
        <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Quay lại</Button>
        <Result
          status="success"
          title="Bạn đã đánh giá đơn hàng này"
          subTitle={`Đánh giá quán: ${existingReview.storeRating}/5 sao`}
          extra={<Button type="primary" onClick={() => navigate('/customer/orders')}>Về danh sách đơn</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Quay lại</Button>
      <Title level={4}>Đánh giá đơn hàng</Title>
      {order && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Đơn #{order.orderNumber} — {order.restaurantName}
        </Text>
      )}

      <Form layout="vertical" onFinish={handleSubmit} initialValues={{ storeRating: 5, driverRating: 5 }}>
        <Card style={{ borderRadius: 12, marginBottom: 16 }}>
          <Form.Item name="storeRating" label="Đánh giá quán" rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}>
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item name="driverRating" label="Đánh giá tài xế">
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
        </Card>

        {/* Per-item ratings */}
        {order && order.items && order.items.length > 0 && (
          <Card style={{ borderRadius: 12, marginBottom: 16 }} title="Đánh giá từng món">
            {order.items.map((item) => (
              <Form.Item
                key={item.menuItemId || item.id}
                name={['items', item.menuItemId || item.id]}
                label={`${item.name} (x${item.quantity})`}
                style={{ marginBottom: 12 }}
              >
                <Rate style={{ fontSize: 20 }} />
              </Form.Item>
            ))}
          </Card>
        )}

        <Card style={{ borderRadius: 12, marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Từ khoá</Text>
          <Space wrap>
            {TAGS.map(tag => (
              <Tag
                key={tag}
                style={{ cursor: 'pointer', borderRadius: 6, padding: '4px 12px' }}
                color={selectedTags.includes(tag) ? 'green' : undefined}
                onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </Card>

        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          <Form.Item name="comment" label="Nhận xét">
            <Input.TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." maxLength={500} showCount />
          </Form.Item>
        </Card>

        <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ height: 48, borderRadius: 10, fontWeight: 600 }}>
          Gửi đánh giá
        </Button>
      </Form>
    </div>
  );
};

export default ReviewPage;
