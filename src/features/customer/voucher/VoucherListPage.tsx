import React, { useEffect, useState } from 'react';
import { Card, Tag, Empty, Typography, Button, message } from 'antd';
import { Ticket, Calendar, Download } from 'lucide-react';
import { voucherService } from '../../../services/voucherService';
import { formatDate, formatVND } from '../../../utils/format';
import type { Voucher } from '../../../types/promotion';

const { Title, Text } = Typography;

const VoucherListPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await voucherService.getMyVouchers();
      setVouchers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCollect = async (voucher: Voucher) => {
    setCollectingId(voucher.id);
    try {
      const result = await voucherService.collectVoucher(voucher.id);
      setVouchers(prev => prev.map(v => (v.id === voucher.id ? { ...v, ...result, isCollected: true } : v)));
      message.success(`Đã thu thập voucher ${voucher.code}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể thu thập voucher. Vui lòng thử lại.');
    } finally {
      setCollectingId(null);
    }
  };

  if (!loading && vouchers.length === 0) {
    return <div style={{ padding: 24 }}><Empty description="Không có voucher" /></div>;
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Title level={4}>Voucher cua toi</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {vouchers.map(v => (
          <Card key={v.id} style={{ borderRadius: 12, borderLeft: `4px solid ${v.scope === 'platform' ? 'var(--primary)' : 'var(--secondary)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Ticket size={16} color="var(--primary)" />
                  <Text strong style={{ fontSize: 15 }}>{v.title}</Text>
                  <Tag color={v.scope === 'platform' ? 'green' : 'orange'}>{v.scope === 'platform' ? 'Foodara' : 'Voucher quan'}</Tag>
                  {v.isCollected ? <Tag color="green">Đã thu thập</Tag> : <Tag color="gold">Chưa thu thập</Tag>}
                </div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{v.description}</Text>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {v.conditions.map((c, i) => <Tag key={i} style={{ fontSize: 11 }}>{c}</Tag>)}
                  {v.potentialDiscount > 0 && <Tag color="cyan">Tiết kiệm tối đa {formatVND(v.potentialDiscount)}</Tag>}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{formatDate(v.startDate)} - {formatDate(v.endDate)}</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>Đơn tối thiểu: {formatVND(v.minOrderValue)}</Text>
                  {v.isStackable && <Tag color="blue" style={{ fontSize: 10 }}>Được dồn</Tag>}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 0 8px 16px', borderLeft: '1px dashed var(--border)', marginLeft: 16 }}>
                <Text strong style={{ fontSize: 18, color: 'var(--primary)', display: 'block' }}>{v.code}</Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>Mã voucher</Text>
                {!v.isCollected && (
                  <Button
                    size="small"
                    icon={<Download size={14} />}
                    loading={collectingId === v.id}
                    onClick={() => void handleCollect(v)}
                  >
                    Thu thập
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VoucherListPage;
