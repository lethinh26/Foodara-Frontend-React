import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Drawer, Skeleton, Empty, Popconfirm, Descriptions, Timeline, Modal } from 'antd';
import { Search, Eye, RefreshCw, Truck, XCircle, CheckCircle } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatDate, formatVND } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';
import type { AdminOrder, AdminOrderItem, OrderStatusHistoryEntry, OrderAssignment } from '../../../types/admin';
import type { TablePaginationConfig } from 'antd';

const { Title, Text } = Typography;
const PAGE_SIZE = 15;

const PAYMENT_LABELS: Record<string, string> = { cod: 'COD', e_wallet: 'Ví', card: 'Thẻ', bank_transfer: 'CK', qr: 'QR' };
const PAYMENT_STATUS_COLORS: Record<string, string> = { pending: 'orange', paid: 'green', failed: 'red' };
const ASSIGNMENT_COLORS: Record<string, string> = { proposed: 'blue', accepted: 'green', rejected: 'red', timeout: 'default', cancelled: 'default' };

// Order detail drawer
const OrderDetailDrawer: React.FC<{ orderId: string | null; open: boolean; onClose: () => void; onChanged: () => void }> = ({ orderId, open, onClose, onChanged }) => {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [items, setItems] = useState<AdminOrderItem[]>([]);
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([]);
  const [assignments, setAssignments] = useState<OrderAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [driverIdInput, setDriverIdInput] = useState('');

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [o, it, h, a] = await Promise.all([
        adminService.getOrderDetail(orderId),
        adminService.getOrderItems(orderId).catch(() => []),
        adminService.getOrderHistory(orderId).catch(() => []),
        adminService.getOrderAssignments(orderId).catch(() => []),
      ]);
      setOrder(o); setItems(it); setHistory(h); setAssignments(a);
    } catch { toast.error('Không thể tải chi tiết đơn.'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) load();
    if (!open) { setOrder(null); setItems([]); setHistory([]); setAssignments([]); }
  }, [open, orderId, load]);

  const handleStatusChange = async (status: string) => {
    if (!orderId) return;
    try {
      await adminService.updateOrderStatus(orderId, status);
      toast.success('Đã cập nhật.'); load(); onChanged();
    } catch { toast.error('Lỗi.'); }
  };

  const handleAssignDriver = async () => {
    if (!orderId || !driverIdInput) return;
    try {
      await adminService.assignOrderDriver(orderId, driverIdInput);
      toast.success('Đã gán tài xế.'); setAssignModal(false); setDriverIdInput(''); load(); onChanged();
    } catch { toast.error('Lỗi gán tài xế.'); }
  };

  return (
    <Drawer title={`Đơn hàng ${order?.orderNumber || ''}`} open={open} onClose={onClose} width={600} destroyOnClose>
      {loading ? <Skeleton active paragraph={{ rows: 12 }} /> : !order ? <Empty description="Không tải được" /> : (
        <>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Mã đơn"><Text strong>{order.orderNumber}</Text></Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag color={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status] || order.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Khách">{order.customerName || '—'}</Descriptions.Item>
            <Descriptions.Item label="SĐT">{order.customerPhone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Quán">{order.storeName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Tài xế">{order.driverName || 'Chưa gán'}</Descriptions.Item>
            <Descriptions.Item label="Thanh toán"><Tag>{PAYMENT_LABELS[order.paymentMethod || ''] || order.paymentMethod || '—'}</Tag></Descriptions.Item>
            <Descriptions.Item label="TT thanh toán"><Tag color={PAYMENT_STATUS_COLORS[order.paymentStatus]}>{order.paymentStatus}</Tag></Descriptions.Item>
            <Descriptions.Item label="Đặt lúc">{formatDate(order.placedAt, 'DD/MM/YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Khoảng cách">{order.deliveryDistanceKm ? `${order.deliveryDistanceKm} km` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Mã lấy hàng">{order.pickupCode || '—'}</Descriptions.Item>
            <Descriptions.Item label="Commission">{order.commissionRate ? `${order.commissionRate}%` : '—'}</Descriptions.Item>
          </Descriptions>

          {/* Fees breakdown */}
          <Card size="small" style={{ marginTop: 16, borderRadius: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tạm tính</span><span>{formatVND(order.subtotal)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phí giao</span><span>{formatVND(order.deliveryFee)}</span></div>
              {order.deliveryFeeDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}><span>Giảm phí giao</span><span>-{formatVND(order.deliveryFeeDiscount)}</span></div>}
              {order.platformFee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phí nền tảng</span><span>{formatVND(order.platformFee)}</span></div>}
              {order.surgeFee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phí cao điểm</span><span>{formatVND(order.surgeFee)}</span></div>}
              {order.storeDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}><span>Giảm từ quán</span><span>-{formatVND(order.storeDiscount)}</span></div>}
              {order.voucherDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}><span>Voucher</span><span>-{formatVND(order.voucherDiscount)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border-soft)', paddingTop: 4, marginTop: 4 }}><span>Tổng</span><span>{formatVND(order.totalAmount)}</span></div>
            </div>
          </Card>

          {/* Items */}
          {items.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={5}>Món ({items.length})</Title>
              <Table dataSource={items} rowKey="id" size="small" pagination={false} columns={[
                { title: 'Món', dataIndex: 'itemName', key: 'name' },
                { title: 'SL', dataIndex: 'quantity', key: 'qty', width: 40 },
                { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unit', width: 90, render: (v: number) => formatVND(v) },
                { title: 'Thành tiền', dataIndex: 'totalPrice', key: 'total', width: 100, render: (v: number) => formatVND(v) },
              ]} />
            </div>
          )}

          {/* Status timeline */}
          {history.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={5}>Lịch sử trạng thái</Title>
              <Timeline items={history.map(h => ({
                color: ORDER_STATUS_COLORS[h.toStatus] || 'gray',
                children: (
                  <div>
                    <Tag color={ORDER_STATUS_COLORS[h.toStatus]}>{ORDER_STATUS_LABELS[h.toStatus] || h.toStatus}</Tag>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{formatDate(h.createdAt, 'DD/MM HH:mm:ss')}</Text>
                    {h.changedByRole && <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>({h.changedByRole})</Text>}
                    {h.note && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{h.note}</div>}
                  </div>
                ),
              }))} />
            </div>
          )}

          {/* Assignments */}
          {assignments.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={5}>Gán tài xế</Title>
              <Table dataSource={assignments} rowKey="id" size="small" pagination={false} columns={[
                { title: 'Tài xế', dataIndex: 'driverName', key: 'name', render: (v: string | undefined) => v || '—' },
                { title: 'Loại', dataIndex: 'assignmentType', key: 'type', width: 60, render: (v: string) => <Tag>{v}</Tag> },
                { title: 'TT', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag color={ASSIGNMENT_COLORS[v] || 'default'}>{v}</Tag> },
                { title: 'Khoảng cách', dataIndex: 'distanceToStoreKm', key: 'dist', width: 80, render: (v: number | null) => v ? `${v} km` : '—' },
              ]} />
            </div>
          )}

          {/* Cancellation info */}
          {order.cancelledAt && (
            <Card size="small" style={{ marginTop: 16, borderRadius: 8, borderColor: '#ff4d4f' }}>
              <Text strong style={{ color: '#ff4d4f' }}>Đã huỷ</Text>
              <div style={{ fontSize: 12, marginTop: 4 }}>Bởi: {order.cancelledBy || '—'}</div>
              <div style={{ fontSize: 12 }}>Lý do: {order.cancellationReason || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatDate(order.cancelledAt, 'DD/MM/YYYY HH:mm')}</div>
            </Card>
          )}

          {/* Actions */}
          <div style={{ marginTop: 16 }}>
            <Text strong>Hành động:</Text>
            <Space style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
              {!['completed', 'cancelled', 'failed'].includes(order.status) && (
                <>
                  <Popconfirm title="Huỷ đơn hàng?" onConfirm={() => handleStatusChange('cancelled')} okText="Huỷ đơn" cancelText="Không">
                    <Button size="small" danger icon={<XCircle size={12} />}>Huỷ đơn</Button>
                  </Popconfirm>
                  <Popconfirm title="Hoàn thành đơn?" onConfirm={() => handleStatusChange('completed')} okText="Hoàn thành" cancelText="Không">
                    <Button size="small" type="primary" icon={<CheckCircle size={12} />}>Hoàn thành</Button>
                  </Popconfirm>
                  <Button size="small" icon={<Truck size={12} />} onClick={() => setAssignModal(true)}>Gán tài xế</Button>
                </>
              )}
            </Space>
          </div>

          <Modal title="Gán tài xế thủ công" open={assignModal} onCancel={() => setAssignModal(false)} onOk={handleAssignDriver} okText="Gán" cancelText="Huỷ">
            <Input placeholder="Nhập Driver ID" value={driverIdInput} onChange={e => setDriverIdInput(e.target.value)} />
          </Modal>
        </>
      )}
    </Drawer>
  );
};

// Main
const OrderMonitor: React.FC = () => {
  const [data, setData] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [error, setError] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getOrders({
        page: page - 1, size: PAGE_SIZE,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
      });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page, searchTerm, statusFilter, paymentFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const columns = [
    { title: 'Mã đơn', dataIndex: 'orderNumber', key: 'num', width: 110, render: (v: string) => <Text strong style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Khách', dataIndex: 'customerName', key: 'cust', ellipsis: true, render: (v: string | undefined) => v || '—' },
    { title: 'Quán', dataIndex: 'storeName', key: 'store', ellipsis: true, render: (v: string | undefined) => v || '—' },
    { title: 'Tài xế', dataIndex: 'driverName', key: 'driver', width: 100, render: (v: string | null | undefined) => v || '—' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={ORDER_STATUS_COLORS[s]}>{ORDER_STATUS_LABELS[s] || s}</Tag> },
    { title: 'Tổng', dataIndex: 'totalAmount', key: 'total', width: 100, render: (v: number) => formatVND(v) },
    { title: 'TT', dataIndex: 'paymentMethod', key: 'pm', width: 50, render: (v: string | null) => PAYMENT_LABELS[v || ''] || v || '—' },
    { title: 'TTTT', dataIndex: 'paymentStatus', key: 'ps', width: 70, render: (v: string) => <Tag color={PAYMENT_STATUS_COLORS[v]}>{v}</Tag> },
    { title: 'Thời gian', dataIndex: 'placedAt', key: 'time', width: 120, render: (v: string) => formatDate(v, 'DD/MM HH:mm') },
    { title: '', key: 'actions', width: 80, render: (_: unknown, r: AdminOrder) => (
      <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailId(r.id)}>Xem</Button>
    )},
  ];

  const statusOptions = [
    { label: 'Tất cả', value: 'all' },
    ...Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k })),
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Giám sát đơn hàng</Title>
        <Button icon={<RefreshCw size={14} />} onClick={() => loadData()}>Làm mới</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Mã đơn, tên khách..." value={search}
          onChange={e => { setSearch(e.target.value); if (!e.target.value) { setSearchTerm(''); setPage(1); } }}
          onPressEnter={() => { setSearchTerm(search); setPage(1); }} style={{ width: 240, borderRadius: 8 }} allowClear />
        <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} style={{ width: 160 }} options={statusOptions} />
        <Select value={paymentFilter} onChange={v => { setPaymentFilter(v); setPage(1); }} style={{ width: 140 }} options={[
          { label: 'TT: Tất cả', value: 'all' }, { label: 'Pending', value: 'pending' }, { label: 'Paid', value: 'paid' }, { label: 'Failed', value: 'failed' },
        ]} />
      </div>

      {error ? <Empty description="Không thể tải danh sách đơn." /> : (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="middle" scroll={{ x: 1000 }}
            pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: t => `${t} đơn` }}
            onChange={(p: TablePaginationConfig) => setPage(p.current || 1)} />
        </Card>
      )}

      <OrderDetailDrawer orderId={detailId} open={!!detailId} onClose={() => setDetailId(null)} onChanged={loadData} />
    </div>
  );
};

export default OrderMonitor;
