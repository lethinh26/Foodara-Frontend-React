import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Drawer, Avatar, Skeleton, Empty, Tabs, Popconfirm, Descriptions, Modal, Form, Switch } from 'antd';
import { Search, Eye, CheckCircle, XCircle, Store, Star, FileText, CreditCard, Clock } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatDate, formatVND } from '../../../utils/format';
import toast from 'react-hot-toast';
import type { AdminMerchant, AdminStore, ApprovalStatus, AdminStoreCategory, AdminStoreTag, StoreDocument, StoreBankAccount, StoreOperatingHour } from '../../../types/admin';
import type { TablePaginationConfig } from 'antd';

const { Title, Text } = Typography;
const PAGE_SIZE = 10;

const APPROVAL_COLORS: Record<string, string> = {
  pending: 'orange', approved: 'green', rejected: 'red', suspended: 'default',
};
const APPROVAL_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', suspended: 'Tạm khoá',
};
const DOC_LABELS: Record<string, string> = {
  business_license: 'Giấy phép KD', food_safety_cert: 'Chứng nhận ATTP', id_card_front: 'CMND mặt trước', id_card_back: 'CMND mặt sau', other: 'Khác',
};
const VERIFY_COLORS: Record<string, string> = { pending: 'orange', verified: 'green', rejected: 'red' };
const VERIFY_LABELS: Record<string, string> = { pending: 'Chờ', verified: 'Đã xác minh', rejected: 'Từ chối' };
const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Store detail drawer
const StoreDetailDrawer: React.FC<{ storeId: string | null; open: boolean; onClose: () => void; onChanged: () => void }> = ({ storeId, open, onClose, onChanged }) => {
  const [store, setStore] = useState<AdminStore | null>(null);
  const [docs, setDocs] = useState<StoreDocument[]>([]);
  const [hours, setHours] = useState<StoreOperatingHour[]>([]);
  const [banks, setBanks] = useState<StoreBankAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [s, d, h] = await Promise.all([
        adminService.getStoreDetail(storeId),
        adminService.getStoreDocuments(storeId).catch(() => []),
        adminService.getStoreOperatingHours(storeId).catch(() => []),
      ]);
      setStore(s);
      setDocs(d);
      setHours(h);
      if (s.merchantId) {
        const b = await adminService.getStoreBankAccounts(s.merchantId).catch(() => []);
        setBanks(b);
      }
    } catch { toast.error('Không thể tải chi tiết quán.'); }
    finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => {
    if (open && storeId) load();
    if (!open) { setStore(null); setDocs([]); setHours([]); setBanks([]); }
  }, [open, storeId, load]);

  const handleToggleActive = async () => {
    if (!store) return;
    try {
      await adminService.updateStoreStatus(store.id, { isActive: !store.isActive });
      toast.success(store.isActive ? 'Đã tạm khoá quán.' : 'Đã mở lại quán.');
      load(); onChanged();
    } catch { toast.error('Lỗi cập nhật.'); }
  };

  const handleVerifyDoc = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      await adminService.verifyDocument(docId, status);
      toast.success('Đã cập nhật.');
      load();
    } catch { toast.error('Lỗi xác minh.'); }
  };

  return (
    <Drawer title="Chi tiết quán" open={open} onClose={onClose} width={580} destroyOnClose>
      {loading ? <Skeleton active paragraph={{ rows: 10 }} /> : !store ? <Empty description="Không tải được" /> : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Avatar src={store.logoUrl} size={56} shape="square" style={{ background: 'var(--primary)' }}><Store size={24} /></Avatar>
            <div>
              <Title level={5} style={{ margin: 0 }}>{store.name}</Title>
              <Space size={4}><Tag color={store.isActive ? 'green' : 'red'}>{store.isActive ? 'Active' : 'Suspended'}</Tag>{store.isOpen && <Tag color="blue">Đang mở</Tag>}</Space>
            </div>
          </div>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Địa chỉ">{store.addressLine}</Descriptions.Item>
            <Descriptions.Item label="SĐT">{store.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Rating"><Star size={12} style={{ color: '#FF9800' }} /> {store.avgRating} ({store.totalRatings})</Descriptions.Item>
            <Descriptions.Item label="Đơn hàng">{store.totalOrders}</Descriptions.Item>
            <Descriptions.Item label="Commission">{store.commissionRate}%</Descriptions.Item>
            <Descriptions.Item label="Min order">{formatVND(store.minOrderAmount)}</Descriptions.Item>
            <Descriptions.Item label="Prep time">{store.avgPreparationTime} phút</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDate(store.createdAt)}</Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 16 }}>
            <Popconfirm title={store.isActive ? 'Tạm khoá quán?' : 'Mở lại quán?'} onConfirm={handleToggleActive} okText="OK" cancelText="Huỷ">
              <Button size="small" danger={store.isActive} type={store.isActive ? 'default' : 'primary'}>{store.isActive ? 'Tạm khoá' : 'Mở lại'}</Button>
            </Popconfirm>
          </div>

          {hours.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Title level={5}><Clock size={14} /> Giờ hoạt động</Title>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  {hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '4px 8px', fontWeight: 600 }}>{DAY_LABELS[h.dayOfWeek]}</td>
                      <td style={{ padding: '4px 8px' }}>{h.isClosed ? <Text type="secondary">Đóng cửa</Text> : `${h.openTime} – ${h.closeTime}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {docs.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Title level={5}><FileText size={14} /> Giấy tờ</Title>
              {docs.map(d => (
                <Card key={d.id} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{DOC_LABELS[d.documentType] || d.documentType}</Text>
                      {d.documentNumber && <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>#{d.documentNumber}</Text>}
                      <div><Tag color={VERIFY_COLORS[d.verificationStatus]}>{VERIFY_LABELS[d.verificationStatus]}</Tag></div>
                    </div>
                    {d.verificationStatus === 'pending' && (
                      <Space>
                        <Button size="small" type="primary" onClick={() => handleVerifyDoc(d.id, 'verified')}>Duyệt</Button>
                        <Button size="small" danger onClick={() => handleVerifyDoc(d.id, 'rejected')}>Từ chối</Button>
                      </Space>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {banks.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Title level={5}><CreditCard size={14} /> Tài khoản NH</Title>
              {banks.map(b => (
                <Card key={b.id} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
                  <Text strong>{b.bankName}</Text> — {b.accountNumber}<br />
                  <Text type="secondary">{b.accountHolder}</Text>
                  {b.isVerified ? <Tag color="green" style={{ marginLeft: 8 }}>Đã xác minh</Tag> : <Tag color="orange" style={{ marginLeft: 8 }}>Chưa xác minh</Tag>}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
};

// Merchants tab
const MerchantsTab: React.FC = () => {
  const [data, setData] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getMerchants({ page: page - 1, size: PAGE_SIZE, search: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.approveMerchant(id, { approvalStatus: status });
      toast.success(status === 'approved' ? 'Đã duyệt.' : 'Đã từ chối.');
      loadData();
    } catch { toast.error('Lỗi.'); }
  };

  const columns = [
    { title: 'Merchant', key: 'name', render: (_: unknown, r: AdminMerchant) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar src={r.logoUrl} size={36} shape="square" style={{ background: 'var(--primary)' }}>{r.name[0]}</Avatar>
        <div><Text strong>{r.name}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.ownerEmail || r.businessEmail || '—'}</Text></div>
      </div>
    )},
    { title: 'Mã số thuế', dataIndex: 'taxCode', key: 'tax', width: 120, render: (v: string | null) => v || '—' },
    { title: 'Stores', dataIndex: 'storeCount', key: 'stores', width: 70, render: (v: number | undefined) => v ?? '—' },
    { title: 'Trạng thái', dataIndex: 'approvalStatus', key: 'status', width: 110, render: (s: ApprovalStatus) => <Tag color={APPROVAL_COLORS[s]}>{APPROVAL_LABELS[s]}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'created', width: 110, render: (d: string) => formatDate(d) },
    { title: '', key: 'actions', width: 180, render: (_: unknown, r: AdminMerchant) => (
      <Space>
        {r.approvalStatus === 'pending' && (
          <>
            <Popconfirm title="Duyệt merchant?" onConfirm={() => handleApproval(r.id, 'approved')} okText="Duyệt" cancelText="Huỷ">
              <Button size="small" type="primary" icon={<CheckCircle size={12} />}>Duyệt</Button>
            </Popconfirm>
            <Popconfirm title="Từ chối merchant?" onConfirm={() => handleApproval(r.id, 'rejected')} okText="Từ chối" cancelText="Huỷ">
              <Button size="small" danger icon={<XCircle size={12} />}>Từ chối</Button>
            </Popconfirm>
          </>
        )}
      </Space>
    )},
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm merchant..." value={search}
          onChange={e => { setSearch(e.target.value); if (!e.target.value) { setSearchTerm(''); setPage(1); } }}
          onPressEnter={() => { setSearchTerm(search); setPage(1); }} style={{ width: 240, borderRadius: 8 }} allowClear />
        <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} style={{ width: 150 }} options={[
          { label: 'Tất cả', value: 'all' }, { label: 'Chờ duyệt', value: 'pending' }, { label: 'Đã duyệt', value: 'approved' }, { label: 'Từ chối', value: 'rejected' },
        ]} />
      </div>
      {error ? <Empty description="Không thể tải danh sách." /> : (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="middle"
            pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: t => `${t} merchants` }}
            onChange={(p: TablePaginationConfig) => setPage(p.current || 1)} />
        </Card>
      )}
    </>
  );
};

// Stores tab
const StoresTab: React.FC = () => {
  const [data, setData] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getStores({ page: page - 1, size: PAGE_SIZE, search: searchTerm || undefined, isActive: activeFilter !== 'all' ? activeFilter : undefined });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page, searchTerm, activeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const columns = [
    { title: 'Quán', key: 'name', render: (_: unknown, r: AdminStore) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar src={r.logoUrl} size={36} shape="square" style={{ background: 'var(--primary)' }}><Store size={16} /></Avatar>
        <div><Text strong>{r.name}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.addressLine}</Text></div>
      </div>
    )},
    { title: 'Rating', key: 'rating', width: 80, render: (_: unknown, r: AdminStore) => <span><Star size={11} style={{ color: '#FF9800' }} /> {r.avgRating}</span> },
    { title: 'Đơn', dataIndex: 'totalOrders', key: 'orders', width: 70 },
    { title: 'Active', dataIndex: 'isActive', key: 'active', width: 70, render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Có' : 'Không'}</Tag> },
    { title: 'Mở', dataIndex: 'isOpen', key: 'open', width: 60, render: (v: boolean) => v ? <Tag color="blue">Mở</Tag> : <Tag>Đóng</Tag> },
    { title: '', key: 'actions', width: 100, render: (_: unknown, r: AdminStore) => (
      <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailId(r.id)}>Chi tiết</Button>
    )},
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm quán..." value={search}
          onChange={e => { setSearch(e.target.value); if (!e.target.value) { setSearchTerm(''); setPage(1); } }}
          onPressEnter={() => { setSearchTerm(search); setPage(1); }} style={{ width: 240, borderRadius: 8 }} allowClear />
        <Select value={activeFilter} onChange={v => { setActiveFilter(v); setPage(1); }} style={{ width: 140 }} options={[
          { label: 'Tất cả', value: 'all' }, { label: 'Active', value: 'true' }, { label: 'Suspended', value: 'false' },
        ]} />
      </div>
      {error ? <Empty description="Không thể tải danh sách." /> : (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="middle"
            pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: t => `${t} quán` }}
            onChange={(p: TablePaginationConfig) => setPage(p.current || 1)} />
        </Card>
      )}
      <StoreDetailDrawer storeId={detailId} open={!!detailId} onClose={() => setDetailId(null)} onChanged={loadData} />
    </>
  );
};

// Categories tab
const CategoriesTab: React.FC = () => {
  const [data, setData] = useState<AdminStoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await adminService.getStoreCategories()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      await adminService.createStoreCategory(vals);
      toast.success('Đã tạo.'); setModalOpen(false); form.resetFields(); load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await adminService.deleteStoreCategory(id); toast.success('Đã xoá.'); load(); } catch { toast.error('Lỗi.'); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try { await adminService.updateStoreCategory(id, { isActive }); load(); } catch { toast.error('Lỗi.'); }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong>Danh mục quán ({data.length})</Text>
        <Button size="small" type="primary" onClick={() => setModalOpen(true)}>Thêm</Button>
      </div>
      {data.length === 0 ? <Empty description="Chưa có danh mục" /> : (
        <Table dataSource={data} rowKey="id" size="small" pagination={false} columns={[
          { title: 'Tên', dataIndex: 'name', key: 'name' },
          { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (v: string | null) => v || '—' },
          { title: 'Thứ tự', dataIndex: 'displayOrder', key: 'order', width: 70 },
          { title: 'Active', key: 'active', width: 80, render: (_: unknown, r: AdminStoreCategory) => <Switch size="small" checked={r.isActive} onChange={v => handleToggle(r.id, v)} /> },
          { title: '', key: 'del', width: 60, render: (_: unknown, r: AdminStoreCategory) => (
            <Popconfirm title="Xoá?" onConfirm={() => handleDelete(r.id)} okText="Xoá" cancelText="Huỷ"><Button size="small" danger>Xoá</Button></Popconfirm>
          )},
        ]} />
      )}
      <Modal title="Thêm danh mục" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} okText="Tạo" cancelText="Huỷ">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
          <Form.Item name="slug" label="Slug"><Input placeholder="tu-dong-tao" /></Form.Item>
          <Form.Item name="iconUrl" label="Icon URL"><Input placeholder="https://..." /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Tags tab
const TagsTab: React.FC = () => {
  const [data, setData] = useState<AdminStoreTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await adminService.getStoreTags()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      await adminService.createStoreTag(vals);
      toast.success('Đã tạo.'); setModalOpen(false); form.resetFields(); load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await adminService.deleteStoreTag(id); toast.success('Đã xoá.'); load(); } catch { toast.error('Lỗi.'); }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong>Tags ({data.length})</Text>
        <Button size="small" type="primary" onClick={() => setModalOpen(true)}>Thêm</Button>
      </div>
      {data.length === 0 ? <Empty description="Chưa có tag" /> : (
        <Table dataSource={data} rowKey="id" size="small" pagination={false} columns={[
          { title: 'Tên', dataIndex: 'name', key: 'name' },
          { title: 'Loại', dataIndex: 'tagType', key: 'type', width: 100, render: (v: string | null) => v || '—' },
          { title: 'Màu', key: 'color', width: 60, render: (_: unknown, r: AdminStoreTag) => r.colorHex ? <div style={{ width: 20, height: 20, borderRadius: 4, background: r.colorHex }} /> : '—' },
          { title: 'Thứ tự', dataIndex: 'displayOrder', key: 'order', width: 70 },
          { title: '', key: 'del', width: 60, render: (_: unknown, r: AdminStoreTag) => (
            <Popconfirm title="Xoá?" onConfirm={() => handleDelete(r.id)} okText="Xoá" cancelText="Huỷ"><Button size="small" danger>Xoá</Button></Popconfirm>
          )},
        ]} />
      )}
      <Modal title="Thêm tag" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} okText="Tạo" cancelText="Huỷ">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
          <Form.Item name="tagType" label="Loại"><Input placeholder="vd: cuisine, feature" /></Form.Item>
          <Form.Item name="colorHex" label="Màu"><Input placeholder="#FF5722" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Main page
const MerchantManagement: React.FC = () => (
  <div className="animate-fade-in">
    <Tabs defaultActiveKey="merchants" items={[
      { key: 'merchants', label: 'Merchants', children: <MerchantsTab /> },
      { key: 'stores', label: 'Stores', children: <StoresTab /> },
      { key: 'categories', label: 'Danh mục', children: <CategoriesTab /> },
      { key: 'tags', label: 'Tags', children: <TagsTab /> },
    ]} />
  </div>
);

export default MerchantManagement;
