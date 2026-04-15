export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  targetType: string;
  targetId: string;
  targetName: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failed';
  metadata: Record<string, string>;
}

export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number; // percentage
  changeType: 'increase' | 'decrease' | 'stable';
  unit: string; // 'đơn', 'VND', '%', etc.
  period: string;
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
  category?: string;
}

export interface AdminDashboardData {
  totalOrders: DashboardMetric;
  totalRevenue: DashboardMetric;
  gmv: DashboardMetric;
  aov: DashboardMetric;
  cancelRate: DashboardMetric;
  avgDeliveryTime: DashboardMetric;
  activeUsers: DashboardMetric;
  activeRestaurants: DashboardMetric;
  activeDrivers: DashboardMetric;
  ordersByStatus: ChartDataPoint[];
  revenueByDay: ChartDataPoint[];
  ordersByHour: ChartDataPoint[];
  topRestaurants: { name: string; orders: number; revenue: number }[];
  topItems: { name: string; sold: number; revenue: number }[];
}
