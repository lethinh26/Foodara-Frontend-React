import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Badge, message, Modal, List, Space } from 'antd';
import { Clock, ChefHat, CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import type { Order } from '../../../types/order';
import { merchantOrderApi, merchantService } from '../../../services/merchantService';

const { Title, Text } = Typography;

const statusConfig: Record<string, any> = {
  preparing: { color: 'blue', label: 'Đang nấu', icon: <ChefHat size={14} /> },
  ready_for_pickup: { color: 'green', label: 'Sẵn sàng', icon: <CheckCircle2 size={14} /> },
  completed: { color: 'green', label: 'Đã hoàn tất', icon: <CheckCircle2 size={14} /> },
};

const KitchenQueuePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      const stores = await merchantService.getStores();
      setStoreId(stores[0]?.id || null);
      if (stores.length === 0) return;
      const ordersGet = await merchantOrderApi.getOrders(stores[0].id);

      setOrders(ordersGet.filter(o => o.status == "ready_for_pickup" || o.status == "preparing"));
    } catch (error: any) {
      message.error(error?.message || "Không tải được đơn hàng");
    }
  };

  useEffect(() => {
    loadOrders();
    console.log(orders);
  }, []);

  const moveToReady = async(orderId: string) => {
    if(!storeId) return;
    setLoadingAction(orderId);
    try {
      await merchantOrderApi.ready(storeId, orderId);
      message.success('Đã hoàn tất món!');
      loadOrders();
    } catch (error: any) {
            message.error(error?.message || 'Lỗi cập nhật trạng thái');
    } finally{
      setLoadingAction(null)
    }
  }

  const moveToCompleted = async (orderId: string) => {
    if (!storeId) return;
    setLoadingAction(orderId);
    try {
      await merchantOrderApi.completed(storeId, orderId);
      message.success('Đã hoàn tất món!');
      loadOrders();
    } catch (error: any) {
      message.error(error?.message || 'Lỗi cập nhật trạng thái');
    } finally {
      setLoadingAction(null);
    }
  };

  const columns = ['preparing', 'ready_for_pickup'] as const;

  const showOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  return (
    <div className="animate-fade-in">
      <Title level={4}>Hàng chờ chế biến</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, minHeight: 400 }}>
        {columns.map(status => {
          const items = orders.filter(o => o.status === status);
          const config = statusConfig[status] || { color: 'gray', label: status, icon: <Clock size={14} /> };
          return (
            <div key={status}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                {config.icon}
                <Text strong>{config.label}</Text>
                <Badge count={items.length} style={{ marginLeft: 'auto' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Trống</div>
                ) : items.map(item => (
                  <Card 
                    key={item.id} 
                    size="small" 
                    style={{ borderRadius: 10, borderLeft: `3px solid var(--${config.color === 'orange' ? 'warning' : config.color === 'blue' ? 'info' : 'success'})`, cursor: 'pointer' }}
                    onClick={() => showOrderDetail(item)}
                    hoverable
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>#{item.orderNumber}</Text>
                    </div>
                    {item.items.map((mi, i) => (
                      <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>
                        <Text>{mi.quantity}x {mi.name}</Text>
                        {mi.note && <Text type="danger" style={{ fontSize: 11 }}> ({mi.note})</Text>}
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}><Clock size={11} /> {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                      {status !== 'ready_for_pickup' && (
                        <Button 
                          size="small" 
                          type="primary"
                          loading={loadingAction === item.id} 
                          icon={<ArrowRight size={12} />} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            moveToReady(item.id); 
                          }}
                        >
                          Hoàn tất
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        title={
          <Space>
            <ShoppingBag size={20} className="text-primary" />
            <Text strong style={{ fontSize: 18 }}>Chi tiết đơn hàng {selectedOrder ? `#${selectedOrder.orderNumber}` : ''}</Text>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
        style={{ top: 20 }}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface-hover)', padding: 16, borderRadius: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Khách hàng:</Text>
                  <Text strong>{selectedOrder.customerName}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Số điện thoại:</Text>
                  <Text strong>{selectedOrder.customerPhone}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Thời gian đặt:</Text>
                  <Text strong>{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</Text>
                </div>
                {selectedOrder.note && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text type="secondary">Ghi chú:</Text>
                    <Text type="danger" strong style={{ maxWidth: '60%', textAlign: 'right' }}>{selectedOrder.note}</Text>
                  </div>
                )}
              </Space>
            </div>

            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>Danh sách món</Text>
              <List
                dataSource={selectedOrder.items}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                      <div style={{ 
                        background: 'var(--surface-hover)', 
                        padding: '4px 8px', 
                        borderRadius: 6, 
                        height: 'fit-content',
                        minWidth: 32,
                        textAlign: 'center'
                      }}>
                        <Text strong>{item.quantity}x</Text>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block' }}>{item.name}</Text>
                        {(item.selectedSize || item.selectedVariant || (item.selectedToppings && item.selectedToppings.length > 0)) && (
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                            {item.selectedSize && <div>Size: {item.selectedSize.name}</div>}
                            {item.selectedVariant && <div>Loại: {item.selectedVariant.name}</div>}
                            {item.selectedToppings && item.selectedToppings.length > 0 && (
                              <div>Topping: {item.selectedToppings.map(t => t.name).join(', ')}</div>
                            )}
                          </div>
                        )}
                        {item.note && (
                          <Text type="danger" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                            * Ghi chú: {item.note}
                          </Text>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>

            {selectedOrder.status !== 'ready_for_pickup' && (
              <Button 
                type="primary" 
                size="large" 
                icon={<CheckCircle2 size={18} />} 
                loading={loadingAction === selectedOrder.id}
                onClick={() => {
                  moveToCompleted(selectedOrder.id);
                  setIsModalVisible(false);
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

export default KitchenQueuePage;
