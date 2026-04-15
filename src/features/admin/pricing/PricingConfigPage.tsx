import React, { useState } from 'react';
import { Card, Table, Button, Typography, Tag, Space, Tabs } from 'antd';
import { DollarSign, Clock, Edit2 } from 'lucide-react';
import { mockPricingConfigs, mockSLAConfigs } from '../../../mocks/dashboardMetrics';
import { formatVND } from '../../../utils/format';

const { Title, Text } = Typography;

const PricingConfigPage: React.FC = () => {
  const [pricings] = useState(mockPricingConfigs);
  const [slas] = useState(mockSLAConfigs);

  const pricingCols = [
    { title: 'Tên', dataIndex: 'name', render: (n: string) => <Text strong>{n}</Text> },
    { title: 'Vùng', dataIndex: 'zoneName' },
    { title: 'Phí cơ bản', dataIndex: 'baseDeliveryFee', render: (v: number) => formatVND(v) },
    { title: 'Phí/km', dataIndex: 'perKmFee', render: (v: number) => formatVND(v) },
    { title: 'Cao điểm', dataIndex: 'peakHourMultiplier', render: (v: number) => `${v}x` },
    { title: 'Mưa', dataIndex: 'rainMultiplier', render: (v: number) => `${v}x` },
    { title: 'Phí NTT', dataIndex: 'platformFeePercentage', render: (v: number) => `${v}%` },
    { title: '', key: 'actions', width: 60, render: () => <Button size="small" icon={<Edit2 size={12} />} /> },
  ];

  const slaCols = [
    { title: 'Tên', dataIndex: 'name', render: (n: string) => <Text strong>{n}</Text> },
    { title: 'Phản hồi', dataIndex: 'merchantResponseTime', render: (v: number) => `${v}s` },
    { title: 'Chuẩn bị max', dataIndex: 'maxPreparationTime', render: (v: number) => `${v} phút` },
    { title: 'Pickup', dataIndex: 'driverPickupTime', render: (v: number) => `${v} phút` },
    { title: 'Giao max', dataIndex: 'maxDeliveryTime', render: (v: number) => `${v} phút` },
    { title: 'Cảnh báo', dataIndex: 'warningThreshold', render: (v: number) => `${v}%` },
    { title: 'Trạng thái', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Bật' : 'Tắt'}</Tag> },
  ];

  return (
    <div className="animate-fade-in">
      <Title level={4}>Cấu hình giá & SLA</Title>
      <Tabs items={[
        {
          key: 'pricing', label: <Space><DollarSign size={14} />Bảng giá</Space>,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Table columns={pricingCols} dataSource={pricings} rowKey="id" pagination={false} size="middle" />
            </Card>
          ),
        },
        {
          key: 'sla', label: <Space><Clock size={14} />SLA</Space>,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Table columns={slaCols} dataSource={slas} rowKey="id" pagination={false} size="middle" />
            </Card>
          ),
        },
      ]} />
    </div>
  );
};

export default PricingConfigPage;
