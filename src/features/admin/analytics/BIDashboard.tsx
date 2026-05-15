import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, Row, Col, Typography, Table, DatePicker, Skeleton, Empty } from 'antd';
import { ArrowUpRight, ArrowDownRight, ShoppingBag, DollarSign, TrendingUp, BarChart3, XCircle, Clock, Users, Store, Bike } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { formatVND, formatNumber, formatPercentage } from '../../../utils/format';
import { adminService } from '../../../services/adminService';
import type { DashboardSummary, DailyPlatformStats } from '../../../types/admin';
import type { LucideIcon } from 'lucide-react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PIE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9E9E9E', '#F44336'];

interface KpiConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  getValue: (stats: DailyPlatformStats) => number;
  format: (v: number) => string;
  invertChange?: boolean; // true = decrease is good (e.g. cancel rate, delivery time)
}

const KPI_CONFIGS: KpiConfig[] = [
  {
    key: 'orders', label: 'Tổng đơn', icon: ShoppingBag, color: '#4CAF50',
    getValue: (s) => s.totalOrders,
    format: (v) => formatNumber(v),
  },
  {
    key: 'completed', label: 'Hoàn thành', icon: ShoppingBag, color: '#2196F3',
    getValue: (s) => s.totalCompletedOrders,
    format: (v) => formatNumber(v),
  },
  {
    key: 'revenue', label: 'Doanh thu', icon: DollarSign, color: '#FF9800',
    getValue: (s) => s.totalRevenue,
    format: (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : formatVND(v),
  },
  {
    key: 'gmv', label: 'GMV', icon: TrendingUp, color: '#2196F3',
    getValue: (s) => s.totalGmv,
    format: (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : formatVND(v),
  },
  {
    key: 'aov', label: 'AOV', icon: BarChart3, color: '#9C27B0',
    getValue: (s) => s.avgOrderValue,
    format: (v) => formatVND(v),
  },
  {
    key: 'cancelRate', label: 'Tỷ lệ huỷ', icon: XCircle, color: '#F44336',
    getValue: (s) => s.cancellationRate,
    format: (v) => formatPercentage(v),
    invertChange: true,
  },
  {
    key: 'deliveryTime', label: 'TG giao TB', icon: Clock, color: '#00BCD4',
    getValue: (s) => s.avgDeliveryTimeMinutes,
    format: (v) => `${v} ph`,
    invertChange: true,
  },
  {
    key: 'activeUsers', label: 'Người dùng', icon: Users, color: '#4CAF50',
    getValue: (s) => s.activeUsers,
    format: (v) => formatNumber(v),
  },
  {
    key: 'activeStores', label: 'Quán hoạt động', icon: Store, color: '#FF9800',
    getValue: (s) => s.activeStores,
    format: (v) => formatNumber(v),
  },
  {
    key: 'activeDrivers', label: 'Tài xế', icon: Bike, color: '#2196F3',
    getValue: (s) => s.activeDrivers,
    format: (v) => formatNumber(v),
  },
];

const GROWTH_ITEMS: { label: string; getValue: (s: DailyPlatformStats) => number; color: string }[] = [
  { label: 'User mới', getValue: (s) => s.newUsers, color: 'var(--primary)' },
  { label: 'Quán mới', getValue: (s) => s.newStores, color: '#FF9800' },
  { label: 'Tài xế mới', getValue: (s) => s.newDrivers, color: '#2196F3' },
];


function calcChange(current: number, previous: number): { change: number; isPositive: boolean } {
  if (previous === 0) return { change: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { change: Math.abs(change), isPositive: change >= 0 };
}


interface KpiCardProps {
  config: KpiConfig;
  today: DailyPlatformStats;
  previous: DailyPlatformStats;
}

const KpiCard: React.FC<KpiCardProps> = ({ config, today, previous }) => {
  const currentVal = config.getValue(today);
  const prevVal = config.getValue(previous);
  const { change, isPositive } = calcChange(currentVal, prevVal);
  const isGood = config.invertChange ? !isPositive : isPositive;

  const Icon = config.icon;

  return (
    <Card size="small" style={{ borderRadius: 10, borderTop: `3px solid ${config.color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>{config.label}</Text>
        <Icon size={14} color={config.color} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: config.color }}>
        {config.format(currentVal)}
      </div>
      {change > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, marginTop: 2 }}>
          {isPositive
            ? <ArrowUpRight size={12} color={isGood ? 'var(--success)' : 'var(--danger)'} />
            : <ArrowDownRight size={12} color={isGood ? 'var(--success)' : 'var(--danger)'} />
          }
          <span style={{ color: isGood ? 'var(--success)' : 'var(--danger)' }}>
            {formatPercentage(change)}
          </span>
        </div>
      )}
    </Card>
  );
};


const revenueTooltipFormatter = (v: number) => formatVND(v);
const yAxisTickFormatter = (v: number) => `${(v / 1e6).toFixed(0)}M`;


const restaurantColumns = [
  { title: '#', key: 'idx', render: (_: unknown, __: unknown, i: number) => i + 1, width: 30 },
  { title: 'Quán', dataIndex: 'name', key: 'name' },
  { title: 'Đơn', dataIndex: 'orders', key: 'orders', width: 60 },
  { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', render: (v: number) => formatVND(v), width: 130 },
];

const itemColumns = [
  { title: '#', key: 'idx', render: (_: unknown, __: unknown, i: number) => i + 1, width: 30 },
  { title: 'Món', dataIndex: 'name', key: 'name' },
  { title: 'Đã bán', dataIndex: 'sold', key: 'sold', width: 70 },
  { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', render: (v: number) => formatVND(v), width: 130 },
];


const renderPieLabel = ({ name }: { name?: string }) => name || '';


const BIDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const loadDashboard = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    setError(false);
    try {
      const result = await adminService.getDashboard(from, to);
      setData(result);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(dateRange?.[0], dateRange?.[1]);
  }, [dateRange, loadDashboard]);

  const handleDateChange = useCallback((_: unknown, dateStrings: string[]) => {
    if (dateStrings[0] && dateStrings[1]) {
      setDateRange([dateStrings[0], dateStrings[1]]);
    } else {
      setDateRange(null);
    }
  }, []);

  const pieData = useMemo(() =>
    data?.ordersByStatus.map((item, idx) => ({ ...item, fill: PIE_COLORS[idx % PIE_COLORS.length] })) ?? [],
    [data?.ordersByStatus]
  );

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
        <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Col key={i} xs={12} sm={8} md={6} lg={4}>
              <Card size="small" style={{ borderRadius: 10 }}><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}><Card style={{ borderRadius: 12 }}><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
          <Col xs={24} md={8}><Card style={{ borderRadius: 12 }}><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
        </Row>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: 80 }}>
        <Empty description={error ? 'Không thể tải dữ liệu. Vui lòng thử lại.' : 'Chưa có dữ liệu dashboard.'} />
      </div>
    );
  }

  const { today, previous, revenueByDay, topRestaurants, topItems } = data;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Admin Dashboard</Title>
        <RangePicker
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          placeholder={['Từ ngày', 'Đến ngày']}
        />
      </div>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {KPI_CONFIGS.map((cfg) => (
          <Col key={cfg.key} xs={12} sm={8} md={6} lg={4}>
            <KpiCard config={cfg} today={today} previous={previous} />
          </Col>
        ))}
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Doanh thu theo ngày" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                <XAxis dataKey="label" style={{ fontSize: 11 }} />
                <YAxis tickFormatter={yAxisTickFormatter} style={{ fontSize: 11 }} />
                <Tooltip formatter={revenueTooltipFormatter} />
                <Area type="monotone" dataKey="value" name="Doanh thu" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Đơn theo trạng thái" style={{ borderRadius: 12 }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={renderPieLabel}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Growth summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Tăng trưởng" style={{ borderRadius: 12 }}>
            <Row gutter={16}>
              {GROWTH_ITEMS.map(({ label, getValue, color }) => (
                <Col key={label} xs={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                    <div style={{ fontSize: 20, fontWeight: 700, color }}>{formatNumber(getValue(today))}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Top Rankings */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Top quán (Doanh thu)" style={{ borderRadius: 12 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={topRestaurants}
              rowKey="name"
              columns={restaurantColumns}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Top món ăn (Số lượng)" style={{ borderRadius: 12 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={topItems}
              rowKey="name"
              columns={itemColumns}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BIDashboard;
