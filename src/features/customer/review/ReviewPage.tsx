import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Rate, Input, Button, Typography, Tag, message, Space } from 'antd';
import { ArrowLeft } from 'lucide-react';

const { Title, Text } = Typography;

const ReviewPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (_values: { restaurantRating: number; foodRating: number; driverRating: number; comment: string }) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    message.success('Cảm ơn bạn đã đánh giá!');
    setLoading(false);
    navigate('/customer/orders');
  };

  const tags = ['Ngon', 'Giao nhanh', 'Đóng gói đẹp', 'Nhiều lượng', 'Đúng vị', 'Tươi ngon', 'Giá hợp lý', 'Nhân viên thân thiện'];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Quay lại</Button>
      <Title level={4}>Đánh giá đơn hàng</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Đơn #{orderId}</Text>

      <Form layout="vertical" onFinish={handleSubmit} initialValues={{ restaurantRating: 5, foodRating: 5, driverRating: 5 }}>
        <Card style={{ borderRadius: 12, marginBottom: 16 }}>
          <Form.Item name="restaurantRating" label="Đánh giá quán" rules={[{ required: true }]}>
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item name="foodRating" label="Đánh giá món ăn" rules={[{ required: true }]}>
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
          <Form.Item name="driverRating" label="Đánh giá tài xế" rules={[{ required: true }]}>
            <Rate style={{ fontSize: 28 }} />
          </Form.Item>
        </Card>

        <Card style={{ borderRadius: 12, marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Từ khoá</Text>
          <Space wrap>
            {tags.map(tag => (
              <Tag key={tag} style={{ cursor: 'pointer', borderRadius: 6, padding: '4px 12px' }}
                color={selectedTags.includes(tag) ? 'green' : undefined}
                onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}>
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

        <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ height: 48, borderRadius: 10, fontWeight: 600 }}>
          Gửi đánh giá
        </Button>
      </Form>
    </div>
  );
};

export default ReviewPage;
