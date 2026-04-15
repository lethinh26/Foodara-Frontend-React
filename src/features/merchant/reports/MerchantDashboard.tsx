import React from 'react';
import { Card, Row, Col, Typography, DatePicker } from 'antd';
import { ShoppingBag, DollarSign, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, CartesianGrid, Legend } from 'recharts';
import { formatVND } from '../../../utils/format';

const { Title, Text } = Typography;

const revenueData = [
  { day: 'T2', revenue: 4500000, orders: 32 }, { day: 'T3', revenue: 5200000, orders: 38 },
  { day: 'T4', revenue: 4800000, orders: 35 }, { day: 'T5', revenue: 6100000, orders: 42 },
  { day: 'T6', revenue: 7200000, orders: 51 }, { day: 'T7', revenue: 8500000, orders: 62 },
  { day: 'CN', revenue: 7800000, orders: 55 },
];

const statsCards = [
  { title: 'Đơn hôm nay', value: 42, icon: <ShoppingBag size={20} />, change: 12, color: 'var(--primary)' },
  { title: 'Doanh thu hôm nay', value: 6350000, icon: <DollarSign size={20} />, change: 8.5, color: 'var(--secondary)', isVND: true },
  { title: 'TG chuẩn bị TB', value: 12, icon: <Clock size={20} />, change: -15, color: 'var(--info)', suffix: 'phút' },
  { title: 'Tỷ lệ hoàn thành', value: 97.5, icon: <CheckCircle2 size={20} />, change: 2.1, color: 'var(--success)', suffix: '%' },
];

const MerchantDashboard: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <DatePicker.RangePicker />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((stat, i) => (
          <Col key={i} xs={12} sm={12} md={6}>
            <Card style={{ borderRadius: 12, borderTop: `3px solid ${stat.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{stat.title}</Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, marginTop: 4 }}>
                    {stat.isVND ? formatVND(stat.value) : stat.value}{stat.suffix}
                  </div>
                </div>
                <div style={{ background: `${stat.color}15`, borderRadius: 10, padding: 8 }}>{stat.icon}</div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                {stat.change > 0 ? <ArrowUpRight size={14} color="var(--success)" /> : <ArrowDownRight size={14} color={stat.change < 0 ? 'var(--success)' : 'var(--danger)'} />}
                <Text style={{ color: stat.change > 0 ? 'var(--success)' : 'var(--success)', fontSize: 12 }}>{Math.abs(stat.change)}%</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>so với tuần trước</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Doanh thu & Đơn hàng tuần" style={{ borderRadius: 12, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="left" tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [name === 'revenue' ? formatVND(value as number) : value, name === 'revenue' ? 'Doanh thu' : 'Đơn hàng']} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="orders" name="Đơn hàng" stroke="var(--secondary)" strokeWidth={2} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default MerchantDashboard;
