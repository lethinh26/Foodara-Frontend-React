import React, { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Button, Tag, message, Empty, Alert, Skeleton } from 'antd';
import { Truck, CheckCircle2, QrCode, Phone } from 'lucide-react';
import {
  merchantDriverApi,
  merchantOrderApi,
  merchantService,
} from '../../../services/merchantService';
import type {
  MerchantDriverInfo,
  MerchantOrder,
} from '../../../types/merchant';

const { Title, Text } = Typography;

interface HandoverEntry {
  order: MerchantOrder;
  driver: MerchantDriverInfo | null;
}

/**
 * Statuses where the merchant has the order ready for the driver but
 * has not yet handed it over (handover button visible).
 */
const READY_STATUSES = ['ready_for_pickup', 'driver_assigned', 'driver_at_store'];
/** Already handed over to driver, awaiting/in delivery. */
const HANDED_OVER_STATUSES = ['picked_up', 'delivering', 'delivered'];

const HandoverPage: React.FC = () => {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [entries, setEntries] = useState<HandoverEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const orders = await merchantOrderApi.getOrders(id);

      // Only orders relevant to handover view
      const filtered = orders.filter((o) =>
        [...READY_STATUSES, ...HANDED_OVER_STATUSES].includes(o.status),
      );

      const enriched = await Promise.all(
        filtered.map(async (order): Promise<HandoverEntry> => {
          if (!order.driverId) return { order, driver: null };
          try {
            const driver = await merchantDriverApi.getDriver(order.driverId);
            return { order, driver };
          } catch {
            return { order, driver: null };
          }
        }),
      );
      setEntries(enriched);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không tải được đơn hàng';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const stores = await merchantService.getStores();
        const firstId = stores[0]?.id ?? null;
        setStoreId(firstId);
        if (firstId) {
          await load(firstId);
        } else {
          setLoading(false);
        }
      } catch {
        message.error('Không tải được danh sách cửa hàng');
        setLoading(false);
      }
    };
    init();
  }, [load]);

  const handleConfirm = async (orderId: string) => {
    if (!storeId) return;
    setActionId(orderId);
    try {
      await merchantOrderApi.handover(storeId, orderId);
      message.success('Đã bàn giao đơn');
      await load(storeId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể bàn giao';
      message.error(msg);
    } finally {
      setActionId(null);
    }
  };

  const waiting = entries.filter((e) => READY_STATUSES.includes(e.order.status));
  const completed = entries.filter((e) => HANDED_OVER_STATUSES.includes(e.order.status));

  if (loading) return <Skeleton active />;

  return (
    <div className="animate-fade-in">
      <Title level={4}>Bàn giao cho tài xế</Title>
      <Alert
        message="Xác minh mã lấy hàng và thông tin tài xế trước khi bàn giao"
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 10 }}
      />

      {waiting.length === 0 ? (
        <Empty description="Không có đơn chờ bàn giao" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {waiting.map(({ order, driver }) => (
            <Card key={order.id} style={{ borderRadius: 12, borderLeft: '4px solid var(--info)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text strong>#{order.orderNumber}</Text>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--primary-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Truck size={20} color="var(--primary)" />
                    </div>
                    <div>
                      <Text strong>{driver?.fullName ?? 'Chưa có tài xế'}</Text>
                      {driver && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {driver.phone}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
                {order.pickupCode && (
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        background: 'var(--surface-soft)',
                        borderRadius: 10,
                        padding: '12px 20px',
                        border: '2px dashed var(--primary)',
                      }}
                    >
                      <QrCode size={24} color="var(--primary)" style={{ marginBottom: 4 }} />
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          letterSpacing: 4,
                          color: 'var(--primary)',
                        }}
                      >
                        {order.pickupCode}
                      </div>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        Mã lấy hàng
                      </Text>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={14} />}
                  loading={actionId === order.id}
                  onClick={() => handleConfirm(order.id)}
                  disabled={!driver}
                >
                  Xác nhận bàn giao
                </Button>
                {driver?.phone && (
                  <Button
                    icon={<Phone size={14} />}
                    onClick={() => {
                      window.location.href = `tel:${driver.phone}`;
                    }}
                  >
                    Gọi tài xế
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <Text strong style={{ marginBottom: 12, display: 'block' }}>
            Đã bàn giao ({completed.length})
          </Text>
          {completed.map(({ order, driver }) => (
            <Card key={order.id} size="small" style={{ borderRadius: 10, marginBottom: 8, opacity: 0.75 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>
                  #{order.orderNumber}
                  {driver && ` → ${driver.fullName}`}
                </Text>
                <Tag color="green" icon={<CheckCircle2 size={10} />}>
                  Đã giao
                </Tag>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HandoverPage;
