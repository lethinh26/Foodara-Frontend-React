import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Skeleton, Empty, Tabs, Popconfirm, Modal, Form, InputNumber, Switch, Avatar } from 'antd';
import { Search, Plus, Trash2, Image } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatDate, formatVND } from '../../../utils/format';
import toast from 'react-hot-toast';
import type { AdminVoucher, AdminCampaign, CampaignParticipant, AdminBanner } from '../../../types/admin';
import type { TablePaginationConfig } from 'antd';

const { Text } = Typography;
const PAGE_SIZE = 10;

const DISCOUNT_LABELS: Record<string, string> = { percentage: '%', fixed: 'VNĐ', free_ship: 'Free ship' };
const CAMPAIGN_TYPE_LABELS: Record<string, string> = { promotion: 'Khuyến mãi', flash_sale: 'Flash Sale', free_ship: 'Free Ship', seasonal: 'Mùa vụ', custom: 'Tuỳ chỉnh' };

// Vouchers tab
const VouchersTab: React.FC = () => {
  const [data, setData] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getVouchers({
        page: page - 1, size: PAGE_SIZE,
        search: searchTerm || undefined,
        voucher_type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page, searchTerm, typeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      await adminService.createVoucher(vals);
      toast.success('Đã tạo voucher.'); setModalOpen(false); form.resetFields(); loadData();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await adminService.deleteVoucher(id); toast.success('Đã xoá.'); loadData(); } catch { toast.error('Lỗi.'); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try { await adminService.updateVoucher(id, { isActive }); loadData(); } catch { toast.error('Lỗi.'); }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 110, render: (v: string) => <Text strong style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Tên', dataIndex: 'title', key: 'title', ellipsis: true, render: (v: string | null) => v || '—' },
    { title: 'Loại', dataIndex: 'voucherType', key: 'type', width: 80, render: (v: string) => <Tag color={v === 'platform' ? 'blue' : 'green'}>{v === 'platform' ? 'Platform' : 'Store'}</Tag> },
    { title: 'Giảm', key: 'discount', width: 100, render: (_: unknown, r: AdminVoucher) => (
      <span>{r.discountType === 'percentage' ? `${r.discountValue}%` : r.discountType === 'free_ship' ? 'Free ship' : formatVND(r.discountValue)}</span>
    )},
    { title: 'Sử dụng', key: 'usage', width: 80, render: (_: unknown, r: AdminVoucher) => `${r.usedQuantity}/${r.totalQuantity ?? '∞'}` },
    { title: 'Active', key: 'active', width: 70, render: (_: unknown, r: AdminVoucher) => <Switch size="small" checked={r.isActive} onChange={v => handleToggle(r.id, v)} /> },
    { title: 'Hạn', dataIndex: 'expiresAt', key: 'exp', width: 100, render: (v: string | null) => v ? formatDate(v) : '∞' },
    { title: '', key: 'del', width: 50, render: (_: unknown, r: AdminVoucher) => (
      <Popconfirm title="Xoá?" onConfirm={() => handleDelete(r.id)} okText="Xoá" cancelText="Huỷ"><Button size="small" danger icon={<Trash2 size={11} />} /></Popconfirm>
    )},
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm code, tên..." value={search}
          onChange={e => { setSearch(e.target.value); if (!e.target.value) { setSearchTerm(''); setPage(1); } }}
          onPressEnter={() => { setSearchTerm(search); setPage(1); }} style={{ width: 220, borderRadius: 8 }} allowClear />
        <Select value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} style={{ width: 130 }} options={[
          { label: 'Tất cả', value: 'all' }, { label: 'Platform', value: 'platform' }, { label: 'Store', value: 'store' },
        ]} />
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>Tạo voucher</Button>
      </div>
      {error ? <Empty description="Không thể tải." /> : (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="small"
            pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false }}
            onChange={(p: TablePaginationConfig) => setPage(p.current || 1)} />
        </Card>
      )}
      <Modal title="Tạo voucher" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} okText="Tạo" cancelText="Huỷ" width={520}>
        <Form form={form} layout="vertical" initialValues={{ voucherType: 'platform', discountType: 'percentage', applicableTo: 'all', userUsageLimit: 1 }}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input placeholder="FREESHIP50K" /></Form.Item>
          <Form.Item name="title" label="Tên hiển thị"><Input /></Form.Item>
          <Form.Item name="voucherType" label="Loại">
            <Select options={[{ label: 'Platform', value: 'platform' }, { label: 'Store', value: 'store' }]} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="discountType" label="Kiểu giảm" style={{ flex: 1 }}>
              <Select options={Object.entries(DISCOUNT_LABELS).map(([k, v]) => ({ label: v, value: k }))} />
            </Form.Item>
            <Form.Item name="discountValue" label="Giá trị" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="minOrderValue" label="Đơn tối thiểu" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="maxDiscountValue" label="Giảm tối đa" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="totalQuantity" label="Số lượng" style={{ flex: 1 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="userUsageLimit" label="Giới hạn/user" style={{ flex: 1 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          </div>
          <Form.Item name="applicableTo" label="Đối tượng">
            <Select options={[{ label: 'Tất cả', value: 'all' }, { label: 'User mới', value: 'new_user' }, { label: 'VIP', value: 'vip' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// Campaigns tab
const CampaignsTab: React.FC = () => {
  const [data, setData] = useState<AdminCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [participants, setParticipants] = useState<CampaignParticipant[]>([]);
  const [participantsId, setParticipantsId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getCampaigns({ page: page - 1, size: PAGE_SIZE });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      await adminService.createCampaign(vals);
      toast.success('Đã tạo.'); setModalOpen(false); form.resetFields(); loadData();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await adminService.deleteCampaign(id); toast.success('Đã xoá.'); loadData(); } catch { toast.error('Lỗi.'); }
  };

  const handleViewParticipants = async (campaignId: string) => {
    if (participantsId === campaignId) { setParticipantsId(null); return; }
    try {
      const p = await adminService.getCampaignParticipants(campaignId);
      setParticipants(p); setParticipantsId(campaignId);
    } catch { toast.error('Lỗi.'); }
  };

  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Loại', dataIndex: 'campaignType', key: 'type', width: 100, render: (v: string) => <Tag>{CAMPAIGN_TYPE_LABELS[v] || v}</Tag> },
    { title: 'Active', dataIndex: 'isActive', key: 'active', width: 60, render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Có' : 'Không'}</Tag> },
    { title: 'Stores', dataIndex: 'participantCount', key: 'parts', width: 60, render: (v: number | undefined) => v ?? '—' },
    { title: 'Thời gian', key: 'dates', width: 180, render: (_: unknown, r: AdminCampaign) => (
      <Text type="secondary" style={{ fontSize: 11 }}>{r.startsAt ? formatDate(r.startsAt) : '—'} → {r.endsAt ? formatDate(r.endsAt) : '∞'}</Text>
    )},
    { title: '', key: 'actions', width: 150, render: (_: unknown, r: AdminCampaign) => (
      <Space>
        <Button size="small" onClick={() => handleViewParticipants(r.id)}>{participantsId === r.id ? 'Ẩn' : 'Stores'}</Button>
        <Popconfirm title="Xoá?" onConfirm={() => handleDelete(r.id)} okText="Xoá" cancelText="Huỷ">
          <Button size="small" danger icon={<Trash2 size={11} />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong>Campaigns ({total})</Text>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>Tạo campaign</Button>
      </div>
      {error ? <Empty description="Không thể tải." /> : (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="small"
            pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false }}
            onChange={(p: TablePaginationConfig) => setPage(p.current || 1)}
            expandable={{
              expandedRowKeys: participantsId ? [participantsId] : [],
              expandedRowRender: () => participants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có quán tham gia" /> : (
                <Table dataSource={participants} rowKey="id" size="small" pagination={false} columns={[
                  { title: 'Quán', dataIndex: 'storeName', key: 'store', render: (v: string | undefined) => v || '—' },
                  { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
                  { title: 'Tham gia', dataIndex: 'joinedAt', key: 'joined', render: (v: string) => formatDate(v) },
                ]} />
              ),
            }}
          />
        </Card>
      )}
      <Modal title="Tạo campaign" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} okText="Tạo" cancelText="Huỷ">
        <Form form={form} layout="vertical" initialValues={{ campaignType: 'promotion' }}>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="campaignType" label="Loại">
            <Select options={Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => ({ label: v, value: k }))} />
          </Form.Item>
          <Form.Item name="bannerUrl" label="Banner URL"><Input placeholder="https://..." /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// Banners tab
const BannersTab: React.FC = () => {
  const [data, setData] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await adminService.getBanners()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      await adminService.createBanner(vals);
      toast.success('Đã tạo.'); setModalOpen(false); form.resetFields(); load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await adminService.deleteBanner(id); toast.success('Đã xoá.'); load(); } catch { toast.error('Lỗi.'); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try { await adminService.updateBanner(id, { isActive }); load(); } catch { toast.error('Lỗi.'); }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong>Banners ({data.length})</Text>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>Tạo banner</Button>
      </div>
      {data.length === 0 ? <Empty description="Chưa có banner" /> : (
        <Table dataSource={data} rowKey="id" size="small" pagination={false} columns={[
          { title: 'Ảnh', dataIndex: 'imageUrl', key: 'img', width: 80, render: (v: string) => <Avatar src={v} size={48} shape="square" icon={<Image size={16} />} /> },
          { title: 'Tiêu đề', dataIndex: 'title', key: 'title', render: (v: string | null) => v || '—' },
          { title: 'Vị trí', dataIndex: 'position', key: 'pos', width: 100 },
          { title: 'Target', dataIndex: 'targetType', key: 'target', width: 90, render: (v: string | null) => v || '—' },
          { title: 'Thứ tự', dataIndex: 'displayOrder', key: 'order', width: 60 },
          { title: 'Active', key: 'active', width: 70, render: (_: unknown, r: AdminBanner) => <Switch size="small" checked={r.isActive} onChange={v => handleToggle(r.id, v)} /> },
          { title: '', key: 'del', width: 50, render: (_: unknown, r: AdminBanner) => (
            <Popconfirm title="Xoá?" onConfirm={() => handleDelete(r.id)} okText="Xoá" cancelText="Huỷ"><Button size="small" danger icon={<Trash2 size={11} />} /></Popconfirm>
          )},
        ]} />
      )}
      <Modal title="Tạo banner" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} okText="Tạo" cancelText="Huỷ">
        <Form form={form} layout="vertical" initialValues={{ position: 'home_top', targetType: 'none' }}>
          <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}><Input placeholder="https://..." /></Form.Item>
          <Form.Item name="title" label="Tiêu đề"><Input /></Form.Item>
          <Form.Item name="position" label="Vị trí"><Input /></Form.Item>
          <Form.Item name="targetType" label="Target type">
            <Select options={[
              { label: 'Không', value: 'none' }, { label: 'Campaign', value: 'campaign' }, { label: 'Store', value: 'store' },
              { label: 'Category', value: 'category' }, { label: 'External', value: 'external' },
            ]} />
          </Form.Item>
          <Form.Item name="targetUrl" label="Target URL"><Input placeholder="https://..." /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Main
const PromotionManagement: React.FC = () => (
  <div className="animate-fade-in">
    <Tabs defaultActiveKey="vouchers" items={[
      { key: 'vouchers', label: 'Vouchers', children: <VouchersTab /> },
      { key: 'campaigns', label: 'Campaigns', children: <CampaignsTab /> },
      { key: 'banners', label: 'Banners', children: <BannersTab /> },
    ]} />
  </div>
);

export default PromotionManagement;
