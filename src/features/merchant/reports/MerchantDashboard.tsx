import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, DatePicker, Skeleton, Empty, message } from "antd";
import {
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  CartesianGrid,
  Legend,
  ComposedChart,
} from "recharts";
import { type Dayjs } from "dayjs";
import { formatVND } from "../../../utils/format";
import {
  merchantReportApi,
  merchantService,
} from "../../../services/merchantService";
import type { MerchantRevenuePoint } from "../../../types/merchant";
import type { StoreResponse } from "../../../types/merchant";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  isVND?: boolean;
  suffix?: string;
}

const DATE_FORMAT = "YYYY-MM-DD";

const MerchantDashboard: React.FC = () => {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [revenueData, setRevenueData] = useState<MerchantRevenuePoint[]>([]);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedStores = await merchantService.getStores();
        setStores(fetchedStores);
      } catch {
        message.error("Không thể tải danh sách cửa hàng");
      }
    };
    init();
  }, []);

  useEffect(() => {
    const storeId = stores[0]?.id;
    if (!storeId) {
      setLoading(false);
      return;
    }

    const startDate = range?.[0]?.format(DATE_FORMAT);
    const endDate = range?.[1]?.format(DATE_FORMAT);

    const load = async () => {
      setLoading(true);
      try {
        const [totalRevenue, totalOrder, avgTime, successRate, revenuePoints] =
          await Promise.all([
            merchantReportApi.totalRevenue(storeId),
            merchantReportApi.totalOrder(storeId),
            merchantReportApi.avgtime(storeId),
            merchantReportApi.successRate(storeId),
            merchantReportApi.revenueAll(storeId, startDate, endDate),
          ]);

        setStats([
          {
            title: "Số đơn",
            value: totalOrder,
            icon: <ShoppingBag size={20} />,
            color: "var(--primary)",
          },
          {
            title: "Tổng doanh thu",
            value: totalRevenue,
            icon: <DollarSign size={20} />,
            color: "var(--secondary)",
            isVND: true,
          },
          {
            title: "TG chuẩn bị TB",
            value: avgTime,
            icon: <Clock size={20} />,
            color: "var(--info)",
            suffix: " phút",
          },
          {
            title: "Tỷ lệ hoàn thành",
            value: successRate,
            icon: <CheckCircle2 size={20} />,
            color: "var(--success)",
            suffix: "%",
          },
        ]);
        setRevenueData(revenuePoints);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Không thể tải báo cáo";
        message.error(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [stores, range]);

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <RangePicker
          value={range}
          onChange={(values) => {
            if (values && values[0] && values[1]) {
              setRange([values[0], values[1]]);
            } else {
              setRange(null);
            }
          }}
          format={DATE_FORMAT}
        />
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : stores.length === 0 ? (
        <Empty description="Chưa có cửa hàng nào" />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {stats.map((stat, i) => (
              <Col key={i} xs={12} sm={12} md={6}>
                <Card>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {stat.title}
                      </Text>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: stat.color,
                          marginTop: 4,
                        }}
                      >
                        {stat.isVND ? formatVND(Number(stat.value)) : stat.value}
                        {stat.suffix}
                      </div>
                    </div>
                    <div
                      style={{
                        background: `${stat.color}15`,
                        borderRadius: 10,
                        padding: 8,
                      }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            title="Doanh thu & Đơn hàng"
            style={{ borderRadius: 12, marginBottom: 24 }}
          >
            {revenueData.length === 0 ? (
              <Empty description="Chưa có dữ liệu trong khoảng thời gian này" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                  <XAxis dataKey="day" />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? formatVND(Number(value)) : value,
                      name === "revenue" ? "Doanh thu" : "Đơn hàng",
                    ]}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Doanh thu"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    dataKey="orders"
                    name="Đơn hàng"
                    stroke="var(--secondary)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default MerchantDashboard;
