import React, { useState } from 'react';
import { Card, Typography, Button, Tag, message, Empty, Alert } from 'antd';
import { Truck, CheckCircle2, QrCode, Phone } from 'lucide-react';

const { Title, Text } = Typography;

interface Handover {
  orderId: string; orderNumber: string; driverName: string; driverPhone: string;
  vehiclePlate: string; pickupCode: string; status: 'waiting' | 'completed'; items: string[];
}

const mockHandovers: Handover[] = [
  { orderId: 'ord-001', orderNumber: 'FD-250315-001', driverName: 'Lê Văn Hùng', driverPhone: '0971234567', vehiclePlate: '59B1-12345', pickupCode: 'A1B2', status: 'waiting', items: ['2x Phở Bò Tái Nạm'] },
  { orderId: 'ord-004', orderNumber: 'FD-250315-004', driverName: 'Trần Đức Mạnh', driverPhone: '0982345678', vehiclePlate: '59C2-67890', pickupCode: 'E5F6', status: 'waiting', items: ['1x Phở Bò Viên'] },
];

const HandoverPage: React.FC = () => {
  const [handovers, setHandovers] = useState<Handover[]>(mockHandovers);

  const handleConfirm = (orderId: string) => {
    const ho = handovers.find(h => h.orderId === orderId);
    if (!ho) return;
    setHandovers(prev => prev.map(h => h.orderId === orderId ? { ...h, status: 'completed' as const } : h));
    message.success(`Đã bàn giao đơn #${ho.orderNumber}`);
  };

  const waiting = handovers.filter(h => h.status === 'waiting');
  const completed = handovers.filter(h => h.status === 'completed');

  return (
    <div className="animate-fade-in">
      <Title level={4}>Bàn giao cho tài xế</Title>
      <Alert message="Xác minh mã lấy hàng hoặc biển số xe trước khi giao" type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />

      {waiting.length === 0 ? <Empty description="Không có đơn chờ bàn giao" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {waiting.map(ho => (
            <Card key={ho.orderId} style={{ borderRadius: 12, borderLeft: '4px solid var(--info)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text strong>#{ho.orderNumber}</Text>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={20} color="var(--primary)" />
                    </div>
                    <div>
                      <Text strong>{ho.driverName}</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{ho.vehiclePlate} • {ho.driverPhone}</Text>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>{ho.items.join(', ')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: 'var(--surface-soft)', borderRadius: 10, padding: '12px 20px', border: '2px dashed var(--primary)' }}>
                    <QrCode size={24} color="var(--primary)" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: 'var(--primary)' }}>{ho.pickupCode}</div>
                    <Text type="secondary" style={{ fontSize: 10 }}>Mã lấy hàng</Text>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button type="primary" icon={<CheckCircle2 size={14} />} onClick={() => handleConfirm(ho.orderId)}>Xác nhận bàn giao</Button>
                <Button icon={<Phone size={14} />}>Gọi tài xế</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <Text strong style={{ marginBottom: 12, display: 'block' }}>Đã bàn giao ({completed.length})</Text>
          {completed.map(ho => (
            <Card key={ho.orderId} size="small" style={{ borderRadius: 10, marginBottom: 8, opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>#{ho.orderNumber} → {ho.driverName}</Text>
                <Tag color="green" icon={<CheckCircle2 size={10} />}>Đã giao</Tag>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HandoverPage;
