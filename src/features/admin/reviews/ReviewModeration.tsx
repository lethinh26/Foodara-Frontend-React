import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Drawer, Skeleton, Empty, Popconfirm, Descriptions, Image as AntImage } from 'antd';
import { Search, Eye, Star, EyeOff, Flag, Trash2 } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';
import type { AdminReview, ReviewStatus, ReviewItem } from '../../../types/admin';
import type { TablePaginationConfig } from 'antd';

const { Title, Text } = Typography;
const PAGE_SIZE = 15;

const STATUS_COLORS: Record<string, string> = { active: 'green', hidden: 'default', flagged: 'orange', deleted: 'red' };
const STATUS_LABELS: Record<string, string> = { active: 'Hiển thị', hidden: 'Ẩn', flagged: 'Đánh dấu', deleted: 'Đã xoá' };

// Stars component
const Stars: React.FC<{ rating: number | null; size?: number }> = ({ rating, size = 12 }) => {
  if (!rating) return <Text type="secondary">—</Text>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} fill={i < rating ? '#FF9800' : 'none'} color={i < rating ? '#FF9800' : '#ccc'} />
      ))}
    </span>
  );
};

// Review detail drawer
const ReviewDetailDrawer: React.FC<{ reviewId: string | null; open: boolean; onClose: () => void; onChanged: () => void }> = ({ reviewId, open, onClose, onChanged }) => {
  const [review, setReview] = useState<AdminReview | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!reviewId) return;
    setLoading(true);
    try { setReview(await adminService.getReviewDetail(reviewId)); }
    catch { toast.error('Không thể tải chi tiết.'); }
    finally { setLoading(false); }
  }, [reviewId]);

  useEffect(() => {
    if (open && reviewId) load();
    if (!open) setReview(null);
  }, [open, reviewId, load]);

  const handleStatus = async (status: ReviewStatus) => {
    if (!reviewId) return;
    try {
      await adminService.updateReviewStatus(reviewId, status);
      toast.success('Đã cập nhật.'); load(); onChanged();
    } catch { toast.error('Lỗi.'); }
  };

  return (
    <Drawer title="Chi tiết đánh giá" open={open} onClose={onClose} width={540} destroyOnClose>
      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : !review ? <Empty description="Không tải được" /> : (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Khách hàng">{review.isAnonymous ? <Text type="secondary">Ẩn danh</Text> : (review.userName || '—')}</Descriptions.Item>
            <Descriptions.Item label="Đơn hàng">{review.orderNumber || review.orderId}</Descriptions.Item>
            <Descriptions.Item label="Quán">{review.storeName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag color={STATUS_COLORS[review.status]}>{STATUS_LABELS[review.status]}</Tag></Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDate(review.createdAt, 'DD/MM/YYYY HH:mm')}</Descriptions.Item>
          </Descriptions>

          {/* Store review */}
          {review.storeRating && (
            <Card size="small" style={{ marginTop: 16, borderRadius: 8 }}>
              <Text strong>Đánh giá quán</Text>
              <div style={{ marginTop: 4 }}><Stars rating={review.storeRating} size={16} /></div>
              {review.storeComment && <div style={{ marginTop: 8, fontSize: 13 }}>{review.storeComment}</div>}
            </Card>
          )}

          {/* Driver review */}
          {review.driverRating && (
            <Card size="small" style={{ marginTop: 12, borderRadius: 8 }}>
              <Text strong>Đánh giá tài xế</Text> {review.driverName && <Text type="secondary" style={{ marginLeft: 8 }}>({review.driverName})</Text>}
              <div style={{ marginTop: 4 }}><Stars rating={review.driverRating} size={16} /></div>
              {review.driverComment && <div style={{ marginTop: 8, fontSize: 13 }}>{review.driverComment}</div>}
            </Card>
          )}

          {/* Item reviews */}
          {review.items && review.items.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={5}>Đánh giá món</Title>
              {review.items.map((item: ReviewItem) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <Text>{item.menuItemName || '—'}</Text>
                  <Stars rating={item.rating} />
                </div>
              ))}
            </div>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={5}>Ảnh ({review.images.length})</Title>
              <AntImage.PreviewGroup>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {review.images.map(img => (
                    <AntImage key={img.id} src={img.imageUrl} width={80} height={80} style={{ borderRadius: 8, objectFit: 'cover' }} />
                  ))}
                </div>
              </AntImage.PreviewGroup>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 20 }}>
            <Text strong>Hành động:</Text>
            <Space style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
              {review.status !== 'hidden' && (
                <Popconfirm title="Ẩn đánh giá?" onConfirm={() => handleStatus('hidden')} okText="Ẩn" cancelText="Huỷ">
                  <Button size="small" icon={<EyeOff size={12} />}>Ẩn</Button>
                </Popconfirm>
              )}
              {review.status === 'hidden' && (
                <Popconfirm title="Hiện lại?" onConfirm={() => handleStatus('active')} okText="Hiện" cancelText="Huỷ">
                  <Button size="small" type="primary" icon={<Eye size={12} />}>Hiện lại</Button>
                </Popconfirm>
              )}
              {review.status !== 'flagged' && (
                <Popconfirm title="Đánh dấu vi phạm?" onConfirm={() => handleStatus('flagged')} okText="Flag" cancelText="Huỷ">
                  <Button size="small" icon={<Flag size={12} />} style={{ color: '#FF9800' }}>Flag</Button>
                </Popconfirm>
              )}
              {review.status !== 'deleted' && (
                <Popconfirm title="Xoá vĩnh viễn?" onConfirm={() => handleStatus('deleted')} okText="Xoá" cancelText="Huỷ">
                  <Button size="small" danger icon={<Trash2 size={12} />}>Xoá</Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        </>
      )}
    </Drawer>
  );
};

// Main
const ReviewModeration: React.FC = () => {
  const [data, setData] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [error, setError] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getReviews({
        page: page - 1, size: PAGE_SIZE,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        rating: ratingFilter !== 'all' ? ratingFilter : undefined,
      });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page, searchTerm, statusFilter, ratingFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleQuickAction = async (id: string, status: ReviewStatus) => {
    try {
      await adminService.updateReviewStatus(id, status);
      toast.success('Đã cập nhật.'); loadData();
    } catch { toast.error('Lỗi.'); }
  };

  const columns = [
    { title: 'Khách', key: 'user', width: 120, render: (_: unknown, r: AdminReview) => (
      <Text>{r.isAnonymous ? <Text type="secondary">Ẩn danh</Text> : (r.userName || '—')}</Text>
    )},
    { title: 'Quán', dataIndex: 'storeName', key: 'store', ellipsis: true, render: (v: string | undefined) => v || '—' },
    { title: 'Quán ⭐', key: 'storeRating', width: 100, render: (_: unknown, r: AdminReview) => <Stars rating={r.storeRating} /> },
    { title: 'Tài xế ⭐', key: 'driverRating', width: 100, render: (_: unknown, r: AdminReview) => <Stars rating={r.driverRating} /> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 100, render: (s: ReviewStatus) => <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Tag> },
    { title: 'Ngày', dataIndex: 'createdAt', key: 'date', width: 110, render: (v: string) => formatDate(v) },
    { title: '', key: 'actions', width: 180, render: (_: unknown, r: AdminReview) => (
      <Space>
        <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailId(r.id)}>Xem</Button>
        {r.status === 'active' && (
          <Popconfirm title="Ẩn?" onConfirm={() => handleQuickAction(r.id, 'hidden')} okText="Ẩn" cancelText="Huỷ">
            <Button size="small" icon={<EyeOff size={12} />} />
          </Popconfirm>
        )}
        {r.status !== 'flagged' && r.status !== 'deleted' && (
          <Popconfirm title="Flag?" onConfirm={() => handleQuickAction(r.id, 'flagged')} okText="Flag" cancelText="Huỷ">
            <Button size="small" icon={<Flag size={12} />} style={{ color: '#FF9800' }} />
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <Title level={4} style={{ marginBottom: 16 }}>Quản lý đánh giá</Title>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm quán, khách..." value={search}
          onChange={e => { setSearch(e.target.value); if (!e.target.value) { setSearchTerm(''); setPage(1); } }}
          onPressEnter={() => { setSearchTerm(search); setPage(1); }} style={{ width: 240, borderRadius: 8 }} allowClear />
        <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} style={{ width: 140 }} options={[
          { label: 'Tất cả', value: 'all' }, { label: 'Hiển thị', value: 'active' }, { label: 'Ẩn', value: 'hidden' },
          { label: 'Flagged', value: 'flagged' }, { label: 'Đã xoá', value: 'deleted' },
        ]} />
        <Select value={ratingFilter} onChange={v => { setRatingFilter(v); setPage(1); }} style={{ width: 120 }} options={[
          { label: 'Tất cả ⭐', value: 'all' },
          { label: '1 ⭐', value: '1' }, { label: '2 ⭐', value: '2' }, { label: '3 ⭐', value: '3' },
          { label: '4 ⭐', value: '4' }, { label: '5 ⭐', value: '5' },
        ]} />
      </div>

      {error ? <Empty description="Không thể tải." /> : (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="middle"
            pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: t => `${t} đánh giá` }}
            onChange={(p: TablePaginationConfig) => setPage(p.current || 1)} />
        </Card>
      )}

      <ReviewDetailDrawer reviewId={detailId} open={!!detailId} onClose={() => setDetailId(null)} onChanged={loadData} />
    </div>
  );
};

export default ReviewModeration;
