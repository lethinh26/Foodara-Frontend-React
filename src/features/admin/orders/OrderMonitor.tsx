import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Input, Select, Button } from 'antd';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { formatVND, formatRelativeTime } from '../../../utils/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../utils/constants';
import type { Order } from '../../../types/order';

const { Title, Text } = Typography;

const OrderMonitor: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { orderService.getAllOrders().then(o => { setOrders(o); setLoading(false); }); }, []);

  const filtered = orders.filter(o => { if (search && !o.orderNumber.includes(search) && !o.customerName.includes(search)) return false; if (statusFilter !== 'all' && o.status !== statusFilter) return false; return true; });

  const columns = [
    { title: 'Mã đơn', dataIndex: 'orderNumber', render: (n: string) => <Text strong style={{ fontSize: 12 }}>{n}</Text> },
    { title: 'Khách hàng', dataIndex: 'customerName' },
    { title: 'Quán', dataIndex: 'restaurantName' },
    { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag color={ORDER_STATUS_COLORS[s]}>{ORDER_STATUS_LABELS[s]}</Tag> },
    { title: 'Tổng tiền', key: 'total', render: (_: unknown, r: Order) => formatVND(r.pricing.total) },
    { title: 'TT', dataIndex: 'paymentMethod', render: (m: string) => <Tag>{m === 'cod' ? 'COD' : m}</Tag> },
    { title: 'Thời gian', dataIndex: 'createdAt', render: (t: string) => <Text type="secondary" style={{ fontSize: 11 }}>{formatRelativeTime(t)}</Text> },
    { title: '', key: 'actions', width: 40, render: () => <Button size="small" icon={<Eye size={12} />} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Giám sát đơn hàng</Title>
        <Button icon={<RefreshCw size={14} />} onClick={() => { setLoading(true); orderService.getAllOrders().then(o => { setOrders(o); setLoading(false); }); }}>Làm mới</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm mã đơn, tên khách..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260, borderRadius: 8 }} allowClear />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }} options={[{ label: 'Tất cả', value: 'all' }, ...Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k }))]} />
      </div>
      <Card style={{ borderRadius: 12 }}><Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" /></Card>
    </div>
  );
};

export default OrderMonitor;
