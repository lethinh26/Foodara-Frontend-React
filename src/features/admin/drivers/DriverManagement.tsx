import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Drawer, Skeleton, Empty, Tabs, Popconfirm, Descriptions, Modal, Form, InputNumber, Progress } from 'antd';
import { Search, Eye, CheckCircle, XCircle, Star, FileText, CreditCard, Wallet, Clock, Bike } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatDate, formatVND } from '../../../utils/format';
import toast from 'react-hot-toast';
import type { AdminDriver, ApprovalStatus, DriverDocument, DriverShift, DriverWalletTransaction, DriverBankAccount, DriverIncentiveProgram, DriverIncentiveProgress } from '../../../types/admin';
import type { TablePaginationConfig } from 'antd';

const { Title, Text } = Typography;
const PAGE_SIZE = 10;

const APPROVAL_COLORS: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', suspended: 'default' };
const APPROVAL_LABELS: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', suspended: 'Tạm khoá' };
const VEHICLE_LABELS: Record<string, string> = { motorcycle: 'Xe máy', bicycle: 'Xe đạp', car: 'Ô tô' };
const DOC_LABELS: Record<string, string> = {
  id_card_front: 'CMND trước', id_card_back: 'CMND sau', driving_license_front: 'GPLX trước',
  driving_license_back: 'GPLX sau', vehicle_registration: 'Đăng ký xe', portrait: 'Ảnh chân dung',
};
const VERIFY_COLORS: Record<string, string> = { pending: 'orange', verified: 'green', rejected: 'red' };
const VERIFY_LABELS: Record<string, string> = { pending: 'Chờ', verified: 'Đã xác minh', rejected: 'Từ chối' };
const TX_LABELS: Record<string, string> = {
  delivery_earning: 'Phí giao', tip: 'Tip', bonus: 'Thưởng', cod_collected: 'Thu COD',
  cod_transferred: 'Chuyển COD', platform_fee: 'Phí nền tảng', withdrawal: 'Rút tiền', adjustment: 'Điều chỉnh', incentive: 'Khuyến khích',
};

// Driver detail drawer
const DriverDetailDrawer: React.FC<{ driverId: string | null; open: boolean; onClose: () => void; onChanged: () => void }> = ({ driverId, open, onClose, onChanged }) => {
  const [driver, setDriver] = useState<AdminDriver | null>(null);
  const [docs, setDocs] = useState<DriverDocument[]>([]);
  const [banks, setBanks] = useState<DriverBankAccount[]>([]);
  const [shifts, setShifts] = useState<DriverShift[]>([]);
  const [txns, setTxns] = useState<DriverWalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    try {
      const [d, dc, b] = await Promise.all([
        adminService.getDriverDetail(driverId),
        adminService.getDriverDocuments(driverId).catch(() => []),
        adminService.getDriverBankAccounts(driverId).catch(() => []),
      ]);
      setDriver(d); setDocs(dc); setBanks(b);
      const [sh, tx] = await Promise.all([
        adminService.getDriverShifts(driverId, { page: 0, size: 5 }).catch(() => ({ content: [] })),
        adminService.getDriverWalletTransactions(driverId, { page: 0, size: 10 }).catch(() => ({ content: [] })),
      ]);
      setShifts(sh.content); setTxns(tx.content);
    } catch { toast.error('Không thể tải chi tiết tài xế.'); }
    finally { setLoading(false); }
  }, [driverId]);

  useEffect(() => {
    if (open && driverId) load();
    if (!open) { setDriver(null); setDocs([]); setBanks([]); setShifts([]); setTxns([]); }
  }, [open, driverId, load]);

  const handleApproval = async (status: 'approved' | 'rejected') => {
    if (!driverId) return;
    try {
      await adminService.approveDriver(driverId, { approvalStatus: status });
      toast.success(status === 'approved' ? 'Đã duyệt.' : 'Đã từ chối.');
      load(); onChanged();
    } catch { toast.error('Lỗi.'); }
  };

  const handleVerifyDoc = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      await adminService.verifyDriverDocument(docId, status);
      toast.success('Đã cập nhật.'); load();
    } catch { toast.error('Lỗi.'); }
  };

  return (
    <Drawer title="Chi tiết tài xế" open={open} onClose={onClose} width={600} destroyOnClose>
      {loading ? <Skeleton active paragraph={{ rows: 12 }} /> : !driver ? <Empty description="Không tải được" /> : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={24} color="white" />
            </div>
            <div>
              <Title level={5} style={{ margin: 0 }}>{driver.fullName}</Title>
              <Space size={4}>
                <Tag color={APPROVAL_COLORS[driver.approvalStatus]}>{APPROVAL_LABELS[driver.approvalStatus]}</Tag>
                {driver.isOnline && <Tag color="blue">Online</Tag>}
                {driver.isBusy && <Tag color="orange">Đang giao</Tag>}
              </Space>
            </div>
          </div>

          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="SĐT">{driver.phone}</Descriptions.Item>
            <Descriptions.Item label="CMND">{driver.idNumber || '—'}</Descriptions.Item>
            <Descriptions.Item label="Xe">{driver.vehicleType ? VEHICLE_LABELS[driver.vehicleType] : '—'}</Descriptions.Item>
            <Descriptions.Item label="Biển số">{driver.vehiclePlate || '—'}</Descriptions.Item>
            <Descriptions.Item label="Hãng xe">{driver.vehicleBrand || '—'}</Descriptions.Item>
            <Descriptions.Item label="Màu">{driver.vehicleColor || '—'}</Descriptions.Item>
            <Descriptions.Item label="Rating"><Star size={11} style={{ color: '#FF9800' }} /> {driver.avgRating} ({driver.totalRatings})</Descriptions.Item>
            <Descriptions.Item label="Tổng đơn">{driver.totalDeliveries}</Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ nhận">{driver.acceptanceRate}%</Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ hoàn">{driver.completionRate}%</Descriptions.Item>
            <Descriptions.Item label="Ví">{formatVND(driver.walletBalance)}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDate(driver.createdAt)}</Descriptions.Item>
          </Descriptions>

          {driver.approvalStatus === 'pending' && (
            <Space style={{ marginTop: 16 }}>
              <Popconfirm title="Duyệt tài xế?" onConfirm={() => handleApproval('approved')} okText="Duyệt" cancelText="Huỷ">
                <Button size="small" type="primary" icon={<CheckCircle size={12} />}>Duyệt</Button>
              </Popconfirm>
              <Popconfirm title="Từ chối tài xế?" onConfirm={() => handleApproval('rejected')} okText="Từ chối" cancelText="Huỷ">
                <Button size="small" danger icon={<XCircle size={12} />}>Từ chối</Button>
              </Popconfirm>
            </Space>
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
                  {b.isVerified ? <Tag color="green" style={{ marginLeft: 8 }}>Verified</Tag> : <Tag color="orange" style={{ marginLeft: 8 }}>Chưa</Tag>}
                </Card>
              ))}
            </div>
          )}

          {txns.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Title level={5}><Wallet size={14} /> Giao dịch gần nhất</Title>
              <Table dataSource={txns} rowKey="id" size="small" pagination={false} columns={[
                { title: 'Loại', dataIndex: 'transactionType', key: 'type', render: (v: string) => TX_LABELS[v] || v },
                { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: v >= 0 ? 'green' : 'red' }}>{formatVND(v)}</Text> },
                { title: 'Ngày', dataIndex: 'createdAt', key: 'date', render: (v: string) => formatDate(v, 'DD/MM HH:mm') },
              ]} />
            </div>
          )}

          {shifts.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Title level={5}><Clock size={14} /> Ca gần nhất</Title>
              <Table dataSource={shifts} rowKey="id" size="small" pagination={false} columns={[
                { title: 'Online', dataIndex: 'wentOnlineAt', key: 'on', render: (v: string) => formatDate(v, 'DD/MM HH:mm') },
                { title: 'Offline', dataIndex: 'wentOfflineAt', key: 'off', render: (v: string | null) => v ? formatDate(v, 'DD/MM HH:mm') : '—' },
                { title: 'Phút', dataIndex: 'durationMinutes', key: 'dur', render: (v: number | null) => v ?? '—' },
                { title: 'Đơn', dataIndex: 'totalOrders', key: 'orders' },
                { title: 'Thu nhập', dataIndex: 'totalEarnings', key: 'earn', render: (v: number) => formatVND(v) },
              ]} />
            </div>
          )}
        </>
      )}
    </Drawer>
  );
};

// Incentive programs tab
const IncentivesTab: React.FC = () => {
  const [programs, setPrograms] = useState<DriverIncentiveProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [progressData, setProgressData] = useState<Record<string, DriverIncentiveProgress[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPrograms(await adminService.getIncentivePrograms()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try {
      const vals = await form.validateFields();
      await adminService.createIncentiveProgram(vals);
      toast.success('Đã tạo.'); setModalOpen(false); form.resetFields(); load();
    } catch {}
  };

  const handleViewProgress = async (programId: string) => {
    if (expandedId === programId) { setExpandedId(null); return; }
    try {
      const data = await adminService.getIncentiveProgress(programId);
      setProgressData(prev => ({ ...prev, [programId]: data }));
      setExpandedId(programId);
    } catch { toast.error('Lỗi tải progress.'); }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong>Chương trình khuyến khích ({programs.length})</Text>
        <Button size="small" type="primary" onClick={() => setModalOpen(true)}>Tạo mới</Button>
      </div>

      {programs.length === 0 ? <Empty description="Chưa có chương trình" /> : (
        <div>
          {programs.map(p => (
            <Card key={p.id} size="small" style={{ marginBottom: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>{p.name}</Text>
                  <Tag color={p.isActive ? 'green' : 'default'} style={{ marginLeft: 8 }}>{p.isActive ? 'Active' : 'Inactive'}</Tag>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {p.targetType}: {p.targetValue} → {formatVND(p.bonusAmount)}
                    {p.startsAt && ` | ${formatDate(p.startsAt)} - ${p.endsAt ? formatDate(p.endsAt) : '∞'}`}
                  </div>
                </div>
                <Button size="small" onClick={() => handleViewProgress(p.id)}>
                  {expandedId === p.id ? 'Ẩn' : 'Progress'}
                </Button>
              </div>
              {expandedId === p.id && progressData[p.id] && (
                <div style={{ marginTop: 12 }}>
                  {progressData[p.id].length === 0 ? <Text type="secondary">Chưa có tài xế tham gia</Text> : (
                    <Table dataSource={progressData[p.id]} rowKey="id" size="small" pagination={false} columns={[
                      { title: 'Tài xế', dataIndex: 'driverName', key: 'name', render: (v: string | undefined) => v || '—' },
                      { title: 'Tiến độ', key: 'progress', render: (_: unknown, r: DriverIncentiveProgress) => (
                        <Progress percent={Math.round((r.currentValue / p.targetValue) * 100)} size="small" status={r.isCompleted ? 'success' : 'active'} />
                      )},
                      { title: 'Hoàn thành', key: 'done', width: 80, render: (_: unknown, r: DriverIncentiveProgress) => r.isCompleted ? <Tag color="green">Xong</Tag> : <Tag>Chưa</Tag> },
                      { title: 'Đã trả', key: 'paid', width: 70, render: (_: unknown, r: DriverIncentiveProgress) => r.bonusPaid ? <Tag color="green">Rồi</Tag> : <Tag color="orange">Chưa</Tag> },
                    ]} />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal title="Tạo chương trình" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} okText="Tạo" cancelText="Huỷ">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="targetType" label="Loại mục tiêu" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Đơn/ngày', value: 'daily_orders' }, { label: 'Đơn/tuần', value: 'weekly_orders' },
              { label: 'Tỷ lệ nhận', value: 'acceptance_rate' }, { label: 'Giờ cao điểm', value: 'peak_hour' },
              { label: 'Tỷ lệ hoàn', value: 'completion_rate' },
            ]} />
          </Form.Item>
          <Form.Item name="targetValue" label="Giá trị mục tiêu" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="bonusAmount" label="Thưởng (VNĐ)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Main page
const DriverManagement: React.FC = () => {
  const [data, setData] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [error, setError] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getDrivers({
        page: page - 1, size: PAGE_SIZE,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        vehicle_type: vehicleFilter !== 'all' ? vehicleFilter : undefined,
      });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page, searchTerm, statusFilter, vehicleFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleQuickApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.approveDriver(id, { approvalStatus: status });
      toast.success(status === 'approved' ? 'Đã duyệt.' : 'Đã từ chối.'); loadData();
    } catch { toast.error('Lỗi.'); }
  };

  const columns = [
    { title: 'Tài xế', key: 'name', render: (_: unknown, r: AdminDriver) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bike size={16} color="white" />
        </div>
        <div><Text strong>{r.fullName}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.phone}</Text></div>
      </div>
    )},
    { title: 'Xe', key: 'vehicle', width: 100, render: (_: unknown, r: AdminDriver) => (
      <div>{r.vehicleType ? VEHICLE_LABELS[r.vehicleType] : '—'}<br /><Text type="secondary" style={{ fontSize: 11 }}>{r.vehiclePlate || ''}</Text></div>
    )},
    { title: 'Rating', key: 'rating', width: 70, render: (_: unknown, r: AdminDriver) => <span><Star size={11} style={{ color: '#FF9800' }} /> {r.avgRating}</span> },
    { title: 'Đơn', dataIndex: 'totalDeliveries', key: 'deliveries', width: 60 },
    { title: 'Trạng thái', dataIndex: 'approvalStatus', key: 'status', width: 100, render: (s: ApprovalStatus) => <Tag color={APPROVAL_COLORS[s]}>{APPROVAL_LABELS[s]}</Tag> },
    { title: 'Online', key: 'online', width: 70, render: (_: unknown, r: AdminDriver) => r.isOnline ? <Tag color="blue">Online</Tag> : <Tag>Offline</Tag> },
    { title: '', key: 'actions', width: 220, render: (_: unknown, r: AdminDriver) => (
      <Space>
        <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailId(r.id)}>Chi tiết</Button>
        {r.approvalStatus === 'pending' && (
          <>
            <Popconfirm title="Duyệt?" onConfirm={() => handleQuickApproval(r.id, 'approved')} okText="OK" cancelText="Huỷ">
              <Button size="small" type="primary" icon={<CheckCircle size={12} />}>Duyệt</Button>
            </Popconfirm>
            <Popconfirm title="Từ chối?" onConfirm={() => handleQuickApproval(r.id, 'rejected')} okText="OK" cancelText="Huỷ">
              <Button size="small" danger icon={<XCircle size={12} />}>Từ chối</Button>
            </Popconfirm>
          </>
        )}
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <Tabs defaultActiveKey="drivers" items={[
        { key: 'drivers', label: 'Tài xế', children: (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <Input prefix={<Search size={14} />} placeholder="Tìm tên, SĐT..." value={search}
                onChange={e => { setSearch(e.target.value); if (!e.target.value) { setSearchTerm(''); setPage(1); } }}
                onPressEnter={() => { setSearchTerm(search); setPage(1); }} style={{ width: 240, borderRadius: 8 }} allowClear />
              <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} style={{ width: 140 }} options={[
                { label: 'Tất cả', value: 'all' }, { label: 'Chờ duyệt', value: 'pending' }, { label: 'Đã duyệt', value: 'approved' }, { label: 'Từ chối', value: 'rejected' },
              ]} />
              <Select value={vehicleFilter} onChange={v => { setVehicleFilter(v); setPage(1); }} style={{ width: 130 }} options={[
                { label: 'Tất cả xe', value: 'all' }, { label: 'Xe máy', value: 'motorcycle' }, { label: 'Xe đạp', value: 'bicycle' }, { label: 'Ô tô', value: 'car' },
              ]} />
            </div>
            {error ? <Empty description="Không thể tải danh sách." /> : (
              <Card style={{ borderRadius: 12 }}>
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="middle"
                  pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: t => `${t} tài xế` }}
                  onChange={(p: TablePaginationConfig) => setPage(p.current || 1)} />
              </Card>
            )}
          </>
        )},
        { key: 'incentives', label: 'Khuyến khích', children: <IncentivesTab /> },
      ]} />
      <DriverDetailDrawer driverId={detailId} open={!!detailId} onClose={() => setDetailId(null)} onChanged={loadData} />
    </div>
  );
};

export default DriverManagement;
