import React, { useState, useEffect } from 'react';
import { Card, Table, Switch, Tag, InputNumber, Typography, message, Input } from 'antd';
import { AlertTriangle, Search } from 'lucide-react';
import { restaurantService } from '../../../services/restaurantService';
import { formatVND } from '../../../utils/format';
import type { MenuItem } from '../../../types/menu';

const { Title, Text } = Typography;

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    restaurantService.getMenuItems('rest-001').then(i => { setItems(i); setLoading(false); });
  }, []);

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const toggleAvailability = (itemId: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i));
    message.success('Đã cập nhật');
  };

  const updateMaxQty = (itemId: string, qty: number) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, maxQuantity: qty } : i));
  };

  const columns = [
    { title: 'Món ăn', dataIndex: 'name', key: 'name', render: (name: string, r: MenuItem) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={r.image} alt={name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
        <div><Text strong>{name}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{formatVND(r.basePrice)}</Text></div>
      </div>
    )},
    { title: 'Còn hàng', key: 'available', width: 100, render: (_: unknown, r: MenuItem) => <Switch checked={r.isAvailable} onChange={() => toggleAvailability(r.id)} /> },
    { title: 'Giới hạn/ngày', key: 'limit', width: 130, render: (_: unknown, r: MenuItem) => <InputNumber min={0} max={999} value={r.maxQuantity} onChange={v => updateMaxQty(r.id, v || 0)} size="small" style={{ width: 80 }} /> },
    { title: 'Đã bán', dataIndex: 'soldCount', key: 'sold', width: 80 },
    { title: 'Trạng thái', key: 'status', width: 100, render: (_: unknown, r: MenuItem) => r.isAvailable ? <Tag color="green">Đang bán</Tag> : <Tag color="red">Tạm dừng</Tag> },
  ];

  const unavailableCount = items.filter(i => !i.isAvailable).length;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Quản lý tồn kho</Title>
        {unavailableCount > 0 && <Tag icon={<AlertTriangle size={12} />} color="warning">{unavailableCount} món tạm dừng</Tag>}
      </div>
      <Input prefix={<Search size={14} />} placeholder="Tìm món..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16, maxWidth: 300, borderRadius: 8 }} allowClear />
      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
      </Card>
    </div>
  );
};

export default InventoryPage;
