import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Rate, Input, Button, Typography, message, Spin, Result, Upload } from 'antd';
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { reviewService, type ReviewResponse, type CreateReviewPayload } from '../../../services/reviewService';
import { uploadToCloudinary } from '../../../services/uploadService';
import type { Order } from '../../../types/order';

const { Title, Text } = Typography;

interface UploadListProps {
  uploadedUrls: string[];
  onUploaded: (urls: string[]) => void;
}

const UploadList: React.FC<UploadListProps> = ({ uploadedUrls, onUploaded }) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const newUrls = [...uploadedUrls, url];
      onUploaded(newUrls);
      message.success('Tải ảnh thành công');
      return false; // prevent default upload
    } catch {
      message.error('Tải ảnh thất bại');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      listType="picture-card"
      fileList={uploadedUrls.map((url, i) => ({
        uid: `${i}-${Date.now()}`,
        name: `image-${i}`,
        status: 'done',
        url,
      }))}
      customRequest={({ file }) => handleUpload(file as File)}
      showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
      onRemove={(file) => {
        const newUrls = uploadedUrls.filter((_, i) => i !== fileList.indexOf(file));
        onUploaded(newUrls);
      }}
      maxCount={5}
      accept="image/*"
    >
      {uploadedUrls.length < 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {uploading ? <Spin size="small" /> : <UploadIcon size={20} />}
          <Text style={{ fontSize: 12 }}>{uploading ? 'Đang tải...' : 'Tải ảnh'}</Text>
        </div>
      )}
    </Upload>
  );
};

const ReviewPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewResponse | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);


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
        items: itemRatings.length > 0 ? itemRatings : undefined,
        imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
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
        <Card style={{ borderRadius: 16, marginBottom: 16 }}>
          <Result
            status="success"
            title="Bạn đã đánh giá đơn hàng này"
            subTitle={
              <div>
                <div style={{ marginBottom: 8 }}>Đánh giá quán: <Rate disabled value={existingReview.storeRating ?? 0} /></div>
                {existingReview.driverRating ? <div style={{ marginBottom: 8 }}>Đánh giá tài xế: <Rate disabled value={existingReview.driverRating} /></div> : null}
                {existingReview.storeComment ? <Text type="secondary">{existingReview.storeComment}</Text> : null}
              </div>
            }
          />
          {existingReview.items && existingReview.items.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>Đánh giá từng món:</Text>
              {existingReview.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <Text>{item.menuItemName || item.menuItemId}</Text>
                  <Rate disabled value={item.rating ?? 0} style={{ fontSize: 14 }} />
                </div>
              ))}
            </div>
          )}
          {existingReview.images && existingReview.images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>Ảnh đánh giá:</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {existingReview.images.map((img, idx) => (
                  <img key={idx} src={img.imageUrl || (typeof img === 'string' ? img : '')} alt={`Ảnh ${idx + 1}`} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(img.imageUrl || (typeof img === 'string' ? img : ''), '_blank')} />
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="primary" onClick={() => navigate('/customer/orders')}>Về danh sách đơn</Button>
          </div>
        </Card>
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
          <Form.Item name="comment" label="Nhận xét">
            <Input.TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." maxLength={500} showCount />
          </Form.Item>
        </Card>

        <Card style={{ borderRadius: 12, marginBottom: 24 }} title="Hình ảnh (tối đa 5)">
          <UploadList uploadedUrls={uploadedUrls} onUploaded={setUploadedUrls} />
        </Card>

        <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ height: 48, borderRadius: 10, fontWeight: 600 }}>
          Gửi đánh giá
        </Button>
      </Form>
    </div>
  );
};

export default ReviewPage;
