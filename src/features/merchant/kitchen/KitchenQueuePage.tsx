import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  Badge,
  message,
  Modal,
  List,
  Space,
  Skeleton,
} from 'antd';
import { Clock, ChefHat, CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import {
  merchantOrderApi,
  merchantService,
} from '../../../services/merchantService';
import type {
  MerchantOrderDetail,
} from '../../../types/merchant';

const { Title, Text } = Typography;

interface ColumnConfig {
  status: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  { status: 'preparing', label: 'Đang nấu', color: 'blue', icon: <ChefHat size={14} /> },
  { status: 'ready_for_pickup', label: 'Sẵn sàng', color: 'green', icon: <CheckCircle2 size={14} /> },
];

const TRACKED_STATUSES = COLUMNS.map((c) => c.status);

const KitchenQueuePage: React.FC = () => {
  const [orders, setOrders] = useState<MerchantOrderDetail[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<MerchantOrderDetail | null>(null);

  const loadOrders = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const all = await merchantOrderApi.getOrders(id);
      setOrders(all.filter((o) => TRACKED_STATUSES.includes(o.status)) as MerchantOrderDetail[]);
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
          await loadOrders(firstId);
        } else {
          setLoading(false);
        }
      } catch {
        message.error('Không tải được danh sách cửa hàng');
        setLoading(false);
      }
    };
    init();
  }, [loadOrders]);

  const moveTo = async (
    orderId: string,
    action: 'ready' | 'completed',
    successMsg: string,
  ) => {
    if (!storeId) return;
    setActionId(orderId);
    try {
      if (action === 'ready') {
        await merchantOrderApi.ready(storeId, orderId);
      } else {
        await merchantOrderApi.completed(storeId, orderId);
      }
      message.success(successMsg);
      await loadOrders(storeId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Lỗi cập nhật trạng thái';
      message.error(msg);
    } finally {
      setActionId(null);
    }
  };

  const showDetail = (order: MerchantOrderDetail) => {
    setSelected(order);
    setDetailOpen(true);
  };

  if (loading) return <Skeleton active />;

  return (
    <div className="animate-fade-in">
      <Title level={4}>Hàng chờ chế biến</Title>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          minHeight: 400,
        }}
      >
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: 'var(--surface)',
                  borderRadius: 10,
                  border: '1px solid var(--border-soft)',
                }}
              >
                {col.icon}
                <Text strong>{col.label}</Text>
                <Badge count={items.length} style={{ marginLeft: 'auto' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 24,
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    Trống
                  </div>
                ) : (
                  items.map((item) => (
                    <Card
                      key={item.id}
                      size="small"
                      style={{
                        borderRadius: 10,
                        borderLeft: `3px solid var(--${col.color === 'blue' ? 'info' : 'success'})`,
                        cursor: 'pointer',
                      }}
                      onClick={() => showDetail(item)}
                      hoverable
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <Text strong style={{ fontSize: 13 }}>
                          #{item.orderNumber}
                        </Text>
                      </div>
                      {item.items?.map((mi) => (
                        <div key={mi.id} style={{ fontSize: 12, padding: '2px 0' }}>
                          <Text>
                            {mi.quantity}x {mi.name}
                          </Text>
                          {mi.note && (
                            <Text type="danger" style={{ fontSize: 11 }}>
                              {' '}({mi.note})
                            </Text>
                          )}
                        </div>
                      ))}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 8,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <Clock size={11} />{' '}
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        {col.status === 'preparing' && (
                          <Button
                            size="small"
                            type="primary"
                            loading={actionId === item.id}
                            icon={<ArrowRight size={12} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTo(item.id, 'ready', 'Đã đánh dấu sẵn sàng');
                            }}
                          >
                            Sẵn sàng
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        title={
          <Space>
            <ShoppingBag size={20} />
            <Text strong style={{ fontSize: 18 }}>
              Chi tiết đơn hàng {selected ? `#${selected.orderNumber}` : ''}
            </Text>
          </Space>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={500}
        style={{ top: 20 }}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface-hover)', padding: 16, borderRadius: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <DetailRow label="Khách hàng" value={selected.customerName ?? '—'} />
                <DetailRow label="Số điện thoại" value={selected.customerPhone ?? '—'} />
                <DetailRow
                  label="Thời gian đặt"
                  value={new Date(selected.createdAt).toLocaleString('vi-VN')}
                />
                {selected.deliveryNote && (
                  <DetailRow label="Ghi chú" value={selected.deliveryNote} danger />
                )}
              </Space>
            </div>

            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>
                Danh sách món
              </Text>
              <List
                dataSource={selected.items ?? []}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                      <div
                        style={{
                          background: 'var(--surface-hover)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          height: 'fit-content',
                          minWidth: 32,
                          textAlign: 'center',
                        }}
                      >
                        <Text strong>{item.quantity}x</Text>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block' }}>
                          {item.name}
                        </Text>
                        {item.note && (
                          <Text type="danger" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                            * {item.note}
                          </Text>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>

            {selected.status === 'ready_for_pickup' && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircle2 size={18} />}
                loading={actionId === selected.id}
                onClick={() => {
                  moveTo(selected.id, 'completed', 'Đã hoàn tất đơn');
                  setDetailOpen(false);
                }}
                style={{ width: '100%', marginTop: 8 }}
              >
                Xác nhận hoàn tất đơn này
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string; danger?: boolean }> = ({
  label,
  value,
  danger,
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <Text type="secondary">{label}:</Text>
    <Text strong type={danger ? 'danger' : undefined} style={{ maxWidth: '60%', textAlign: 'right' }}>
      {value}
    </Text>
  </div>
);

export default KitchenQueuePage;
