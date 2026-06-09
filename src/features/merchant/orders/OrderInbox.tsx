import React, { useEffect, useState } from "react";
import {
  Card,
  Tag,
  Button,
  Typography,
  Empty,
  Tabs,
  Modal,
  Input,
  Space,
  Badge,
  message,
  Select,
  Skeleton,
} from "antd";
import { Check, X, Clock, PackageCheck } from "lucide-react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import {
  merchantService,
  merchantOrderApi,
} from "../../../services/merchantService";
import { formatVND, formatRelativeTime } from "../../../utils/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../../utils/constants";
import type {
  MerchantOrder,
  StoreResponse,
} from "../../../types/merchant";

const { Title, Text } = Typography;

const PENDING_STATUSES = ["pending"] as const;
const ACTIVE_STATUSES = [
  "confirmed",
  "ready_for_pickup",
  "driver_assigned",
  "driver_at_store",
  "picked_up",
  "delivering",
] as const;
const DONE_STATUSES = ["delivered", "cancelled", "failed"] as const;

const OrderInbox: React.FC = () => {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const playDing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 800;
      o.type = 'sine';
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.3);
    } catch { /* ignore */ }
  };

  useWebSocket<Record<string, unknown>>({
    topic: storeId ? `/topic/merchant.${storeId}.orders` : undefined,
    onMessage: (msg) => {
      if (!msg) return;
      const orderId = (msg.orderId || msg.id) as string | undefined;
      if (!orderId || !storeId) return;

      playDing();

      // Fetch full order detail to update inline
      merchantOrderApi.getOrder(storeId, orderId).then((detail) => {
        setOrders((prev) => {
          const existing = prev.find((o) => o.id === orderId);
          if (!existing) {
            return [detail, ...prev];
          }
          return prev.map((o) => (o.id === orderId ? { ...o, ...detail } : o));
        });
      }).catch(() => {
        // fallback: re-fetch all
        loadOrders(storeId!);
      });
    },
  });

  const loadOrders = async (id: string) => {
    setLoading(true);
    try {
      const data = await merchantOrderApi.getOrders(id);
      setOrders(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không tải được đơn hàng";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedStores = await merchantService.getStores();
        setStores(fetchedStores);
        const firstId = fetchedStores[0]?.id ?? null;
        setStoreId(firstId);
        if (firstId) {
          await loadOrders(firstId);
        } else {
          setLoading(false);
        }
      } catch {
        message.error("Không tải được danh sách cửa hàng");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleStoreChange = async (id: string) => {
    setStoreId(id);
    await loadOrders(id);
  };

  const updateLocalStatus = (orderId: string, patch: Partial<MerchantOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
  };

  const handleAccept = async (orderId: string) => {
    if (!storeId) return;
    try {
      const updated = await merchantOrderApi.accept(storeId, orderId);
      updateLocalStatus(orderId, updated);
      message.success("Đã xác nhận đơn hàng");
    } catch {
      message.error("Không thể xác nhận đơn hàng");
    }
  };

  const handleReady = async (orderId: string) => {
    if (!storeId) return;
    try {
      const updated = await merchantOrderApi.ready(storeId, orderId);
      updateLocalStatus(orderId, updated);
      message.success("Món ăn đã sẵn sàng");
    } catch {
      message.error("Thao tác thất bại");
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !storeId) return;
    try {
      const updated = await merchantOrderApi.reject(storeId, rejectModal, rejectReason);
      updateLocalStatus(rejectModal, updated);
      message.warning("Đã từ chối đơn hàng");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không thể từ chối đơn hàng";
      message.error(msg);
    } finally {
      setRejectModal(null);
      setRejectReason("");
    }
  };

  const pending = orders.filter((o) => PENDING_STATUSES.includes(o.status as typeof PENDING_STATUSES[number]));
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status as typeof ACTIVE_STATUSES[number]));
  const done = orders.filter((o) => DONE_STATUSES.includes(o.status as typeof DONE_STATUSES[number]));

  const PrepTimer: React.FC<{ startedAt?: string }> = ({ startedAt }) => {
    const [tick, setTick] = useState(0);
    useEffect(() => {
      if (!startedAt) return;
      const id = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(id);
    }, [startedAt]);
    if (!startedAt) return null;
    void tick; // re-render trigger; value itself is unused
    const elapsedMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
    const totalSec = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return (
      <Tag color="processing" icon={<Clock size={12} style={{ marginRight: 4 }} />}>
        Đang chuẩn bị: {m}:{s}
      </Tag>
    );
  };

  const OrderCard: React.FC<{ order: MerchantOrder }> = ({ order }) => (
    <Card
      style={{
        borderRadius: 12,
        marginBottom: 12,
        borderLeft: `4px solid ${ORDER_STATUS_COLORS[order.status] ?? "#999"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div>
          <Text strong>#{order.orderNumber}</Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            {formatRelativeTime(order.createdAt)}
          </Text>
        </div>
        <Tag color={ORDER_STATUS_COLORS[order.status] ?? "default"}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Tag>
      </div>

      {/* Items list when present */}
      {("items" in order) && Array.isArray((order as MerchantOrder & { items?: unknown }).items) && (
        <div style={{ marginBottom: 8 }}>
          {((order as MerchantOrder & { items?: { id: string; name: string; quantity: number; note?: string }[] }).items ?? []).map(
            (item) => (
              <div key={item.id} style={{ fontSize: 13, padding: "2px 0" }}>
                <Text>
                  {item.quantity}x {item.name}
                </Text>
                {item.note && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    ({item.note})
                  </Text>
                )}
              </div>
            ),
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Text strong style={{ color: "var(--primary)" }}>
            {formatVND(Number(order.totalAmount ?? 0))}
          </Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            {order.paymentMethod === "cod" ? "COD" : "Đã thanh toán"}
          </Text>
        </div>

        {order.status === "pending" && (
          <Space>
            <Button type="primary" icon={<Check size={14} />} onClick={() => handleAccept(order.id)}>
              Xác nhận
            </Button>
            <Button danger icon={<X size={14} />} onClick={() => setRejectModal(order.id)}>
              Từ chối
            </Button>
          </Space>
        )}

        {order.status === "confirmed" && (
          <Space>
            <PrepTimer startedAt={order.confirmedAt} />
            <Button
              type="primary"
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              icon={<PackageCheck size={14} />}
              onClick={() => handleReady(order.id)}
            >
              Đã chuẩn bị xong
            </Button>
          </Space>
        )}

        {(["ready_for_pickup", "driver_assigned", "driver_at_store"].includes(order.status)) && (
          <Tag color="orange" icon={<Clock size={14} style={{ marginRight: 4 }} />}>
            Chờ tài xế lấy món
          </Tag>
        )}
        {order.status === "picked_up" && (
          <Tag color="blue" icon={<Clock size={14} style={{ marginRight: 4 }} />}>
            Tài xế đang giao
          </Tag>
        )}
      </div>
    </Card>
  );

  if (loading) return <Skeleton active />;

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Đơn hàng
        </Title>
        {stores.length > 1 && (
          <Select
            value={storeId}
            onChange={handleStoreChange}
            style={{ width: 250 }}
            placeholder="Chọn chi nhánh"
            options={stores.map((s) => ({ label: s.name, value: s.id }))}
          />
        )}
      </div>

      <Tabs
        items={[
          {
            key: "pending",
            label: (
              <Badge count={pending.length} size="small" offset={[6, 0]}>
                <span>Chờ xác nhận</span>
              </Badge>
            ),
            children:
              pending.length === 0 ? (
                <Empty description="Không có đơn chờ" />
              ) : (
                pending.map((o) => <OrderCard key={o.id} order={o} />)
              ),
          },
          {
            key: "active",
            label: `Đang xử lý (${active.length})`,
            children:
              active.length === 0 ? (
                <Empty description="Không có đơn" />
              ) : (
                active.map((o) => <OrderCard key={o.id} order={o} />)
              ),
          },
          {
            key: "done",
            label: `Hoàn tất (${done.length})`,
            children:
              done.length === 0 ? (
                <Empty description="Không có đơn" />
              ) : (
                done.map((o) => <OrderCard key={o.id} order={o} />)
              ),
          },
        ]}
      />

      <Modal
        title="Từ chối đơn hàng"
        open={!!rejectModal}
        onOk={handleReject}
        onCancel={() => setRejectModal(null)}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim() }}
      >
        <Text>Lý do từ chối:</Text>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="VD: Hết nguyên liệu..."
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
};

export default OrderInbox;
