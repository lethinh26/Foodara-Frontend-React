import React, { useEffect, useState } from 'react';
import { Card, Tag, Empty, Typography } from 'antd';
import { Ticket, Calendar } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { formatDate } from '../../../utils/format';
import type { Voucher } from '../../../types/promotion';

const { Title, Text } = Typography;

const VoucherListPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getVouchers().then(v => { setVouchers(v); setLoading(false); });
  }, []);

  if (!loading && vouchers.length === 0) return <div style={{ padding: 24 }}><Empty description="Không có voucher" /></div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Title level={4}>Voucher của tôi</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {vouchers.map(v => (
          <Card key={v.id} style={{ borderRadius: 12, borderLeft: `4px solid ${v.scope === 'platform' ? 'var(--primary)' : 'var(--secondary)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Ticket size={16} color="var(--primary)" />
                  <Text strong style={{ fontSize: 15 }}>{v.title}</Text>
                  <Tag color={v.scope === 'platform' ? 'green' : 'orange'}>{v.scope === 'platform' ? 'Foodara' : v.restaurantName}</Tag>
                </div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{v.description}</Text>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {v.conditions.map((c, i) => <Tag key={i} style={{ fontSize: 11 }}>{c}</Tag>)}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{formatDate(v.startDate)} - {formatDate(v.endDate)}</span>
                  {v.isStackable && <Tag color="blue" style={{ fontSize: 10 }}>Cộng dồn</Tag>}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 16px', borderLeft: '1px dashed var(--border)', marginLeft: 16 }}>
                <Text strong style={{ fontSize: 18, color: 'var(--primary)', display: 'block' }}>{v.code}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Mã voucher</Text>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VoucherListPage;
