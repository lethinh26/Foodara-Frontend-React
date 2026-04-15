import React, { useState } from 'react';
import { Card, Table, Button, Tag, Typography, Space, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { Plus, Edit2, Trash2, Megaphone } from 'lucide-react';
import { formatVND } from '../../../utils/format';
import { mockCampaigns } from '../../../mocks/dashboardMetrics';

const { Title, Text } = Typography;

const mockMerchantPromos = [
  { id: 'mp-1', name: 'Giảm 20% Phở', type: 'percentage', value: 20, maxDiscount: 20000, minOrder: 80000, status: 'active', startDate: '2025-03-10', endDate: '2025-03-20', usedCount: 45, limit: 200 },
  { id: 'mp-2', name: 'Combo 2 người 99k', type: 'fixed', value: 99000, maxDiscount: 0, minOrder: 0, status: 'active', startDate: '2025-03-01', endDate: '2025-03-31', usedCount: 120, limit: 500 },
];

const PromotionPage: React.FC = () => {
  const [promos] = useState(mockMerchantPromos);
  const [modal, setModal] = useState(false);

  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name', render: (name: string) => <Text strong>{name}</Text> },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'percentage' ? 'blue' : 'green'}>{t === 'percentage' ? 'Phần trăm' : 'Cố định'}</Tag> },
    { title: 'Giá trị', dataIndex: 'value', key: 'value', render: (v: number, r: { type: string }) => r.type === 'percentage' ? `${v}%` : formatVND(v) },
    { title: 'Đã dùng', key: 'used', render: (_: unknown, r: { usedCount: number; limit: number }) => `${r.usedCount}/${r.limit}` },
    { title: 'Thời gian', key: 'dates', render: (_: unknown, r: { startDate: string; endDate: string }) => `${r.startDate} → ${r.endDate}` },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? 'Đang chạy' : 'Tắt'}</Tag> },
    { title: '', key: 'actions', width: 80, render: () => <Space><Button size="small" icon={<Edit2 size={12} />} /><Button size="small" danger icon={<Trash2 size={12} />} /></Space> },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Khuyến mãi</Title>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setModal(true)}>Tạo khuyến mãi</Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Table columns={columns} dataSource={promos} rowKey="id" pagination={false} size="middle" />
      </Card>

      <Card title={<Space><Megaphone size={16} color="var(--secondary)" /><span>Campaign nền tảng</span></Space>} style={{ borderRadius: 12 }}>
        {mockCampaigns.filter(c => c.status === 'active').map(camp => (
          <div key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div><Text strong>{camp.name}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{camp.description}</Text></div>
            <Button>Tham gia</Button>
          </div>
        ))}
      </Card>

      <Modal title="Tạo khuyến mãi" open={modal} onCancel={() => setModal(false)} onOk={() => { setModal(false); message.success('Đã tạo!'); }}>
        <Form layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="Loại"><Select options={[{ label: 'Giảm %', value: 'percentage' }, { label: 'Giảm tiền', value: 'fixed' }]} /></Form.Item>
          <Form.Item name="value" label="Giá trị"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="limit" label="Số lượng"><InputNumber style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionPage;
