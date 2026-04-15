import React from 'react';
import { Card, Table, Tag, Typography, Progress } from 'antd';
import { mockCampaigns } from '../../../mocks/dashboardMetrics';
import { formatVND, formatDate } from '../../../utils/format';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = { active: 'green', scheduled: 'blue', ended: 'default', paused: 'orange' };
const statusLabels: Record<string, string> = { active: 'Đang chạy', scheduled: 'Lên lịch', ended: 'Kết thúc', paused: 'Tạm dừng' };

const columns = [
  { title: 'Campaign', key: 'name', render: (_: unknown, r: typeof mockCampaigns[0]) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={r.bannerImage} alt={r.name} style={{ width: 60, height: 40, borderRadius: 6, objectFit: 'cover' as const }} />
      <div><Text strong>{r.name}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.description}</Text></div>
    </div>
  )},
  { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
  { title: 'Thời gian', key: 'dates', render: (_: unknown, r: typeof mockCampaigns[0]) => <Text style={{ fontSize: 12 }}>{formatDate(r.startDate)} → {formatDate(r.endDate)}</Text> },
  { title: 'Ngân sách', key: 'budget', render: (_: unknown, r: typeof mockCampaigns[0]) => (
    <div><Progress percent={Math.round(r.spentAmount / r.budget * 100)} size="small" /><Text style={{ fontSize: 11 }}>{formatVND(r.spentAmount)} / {formatVND(r.budget)}</Text></div>
  )},
  { title: 'Quán', dataIndex: 'participatingRestaurants' },
  { title: 'Đơn', dataIndex: 'totalOrders' },
  { title: 'Doanh thu', dataIndex: 'totalRevenue', render: (v: number) => formatVND(v) },
];

const CampaignManager: React.FC = () => (
  <div className="animate-fade-in">
    <Title level={4}>Quản lý Campaign</Title>
    <Card style={{ borderRadius: 12 }}>
      <Table columns={columns} dataSource={mockCampaigns} rowKey="id" pagination={false} size="middle" />
    </Card>
  </div>
);

export default CampaignManager;
