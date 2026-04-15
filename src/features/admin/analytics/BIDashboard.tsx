import React from 'react';
import { Card, Row, Col, Typography, Table, DatePicker, Space } from 'antd';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatVND } from '../../../utils/format';
import { mockDashboard } from '../../../mocks/dashboardMetrics';

const { Title, Text } = Typography;

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#00BCD4'];

const metrics = [
  mockDashboard.totalOrders, mockDashboard.totalRevenue, mockDashboard.gmv,
  mockDashboard.aov, mockDashboard.cancelRate, mockDashboard.avgDeliveryTime,
  mockDashboard.activeUsers, mockDashboard.activeRestaurants, mockDashboard.activeDrivers,
];

const BIDashboard: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Admin Dashboard</Title>
        <Space><DatePicker.RangePicker /></Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {metrics.map(m => (
          <Col key={m.id} xs={12} sm={8} md={6} lg={4}>
            <Card size="small" style={{ borderRadius: 10, borderTop: `3px solid ${m.color}` }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{m.name}</Text>
              <div style={{ fontSize: 18, fontWeight: 700, color: m.color, marginTop: 2 }}>
                {m.unit === 'VND' ? (m.value >= 1000000 ? `${(m.value / 1000000000).toFixed(1)}B` : formatVND(m.value)) : m.value}{m.unit === '%' ? '%' : m.unit === 'phút' ? ' ph' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, marginTop: 2 }}>
                {m.change > 0 ? <ArrowUpRight size={12} color="var(--success)" /> : <ArrowDownRight size={12} color="var(--danger)" />}
                <span style={{ color: m.changeType === 'increase' ? 'var(--success)' : (m.name.includes('huỷ') || m.name.includes('TG')) ? 'var(--success)' : 'var(--danger)' }}>{Math.abs(m.change)}%</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Doanh thu theo ngày" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockDashboard.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                <XAxis dataKey="label" style={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v) => formatVND(v as number)} />
                <Bar dataKey="value" name="Doanh thu" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Đơn theo trạng thái" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={mockDashboard.ordersByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }: { name?: string }) => name || ''}>
                  {mockDashboard.ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Top quán (Doanh thu)" style={{ borderRadius: 12 }}>
            <Table size="small" pagination={false} dataSource={mockDashboard.topRestaurants} rowKey="name" columns={[
              { title: '#', render: (_: unknown, __: unknown, i: number) => i + 1, width: 30 },
              { title: 'Quán', dataIndex: 'name' },
              { title: 'Đơn', dataIndex: 'orders', width: 60 },
              { title: 'Doanh thu', dataIndex: 'revenue', render: (v: number) => formatVND(v), width: 120 },
            ]} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Top món ăn (Số lượng)" style={{ borderRadius: 12 }}>
            <Table size="small" pagination={false} dataSource={mockDashboard.topItems} rowKey="name" columns={[
              { title: '#', render: (_: unknown, __: unknown, i: number) => i + 1, width: 30 },
              { title: 'Món', dataIndex: 'name' },
              { title: 'Đã bán', dataIndex: 'sold', width: 70 },
              { title: 'Doanh thu', dataIndex: 'revenue', render: (v: number) => formatVND(v), width: 120 },
            ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BIDashboard;
