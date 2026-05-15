import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Skeleton, Empty, Tabs, Form, InputNumber, Switch, TimePicker, Modal } from 'antd';
import { CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import toast from 'react-hot-toast';
import type { PlatformConfig, DeliveryFeeConfig } from '../../../types/admin';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

// Platform Config Tab
const PlatformConfigTab: React.FC = () => {
  const [data, setData] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try { setData(await adminService.getPlatformConfigs()); }
    catch { toast.error('Không thể tải cấu hình nền tảng'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (key: string) => {
    try {
      await adminService.updatePlatformConfig(key, editValue);
      toast.success('Đã lưu cấu hình');
      setEditingKey(null);
      loadData();
    } catch { toast.error('Lỗi khi lưu'); }
  };

  const columns = [
    { title: 'Key', dataIndex: 'configKey', key: 'key', width: 200, render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Kiểu', dataIndex: 'configType', key: 'type', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Mô tả', dataIndex: 'description', key: 'desc' },
    { title: 'Giá trị', key: 'value', render: (_: unknown, r: PlatformConfig) => {
      if (editingKey === r.configKey) {
        if (r.configType === 'boolean') {
          return <Select value={editValue} onChange={setEditValue} options={[{ label: 'true', value: 'true' }, { label: 'false', value: 'false' }]} style={{ width: 100 }} />;
        }
        return <Input value={editValue} onChange={e => setEditValue(e.target.value)} />;
      }
      return r.configValue;
    }},
    { title: '', key: 'actions', width: 150, render: (_: unknown, r: PlatformConfig) => {
      if (!r.isEditable) return <Tag color="default">Read-only</Tag>;
      if (editingKey === r.configKey) {
        return (
          <Space>
            <Button size="small" type="primary" icon={<CheckCircle size={14} />} onClick={() => handleSave(r.configKey)} />
            <Button size="small" icon={<XCircle size={14} />} onClick={() => setEditingKey(null)} />
          </Space>
        );
      }
      return <Button size="small" onClick={() => { setEditingKey(r.configKey); setEditValue(r.configValue); }}>Sửa</Button>;
    }},
  ];

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;
  if (data.length === 0) return <Empty description="Chưa có cấu hình" />;

  return (
    <Card style={{ borderRadius: 12 }}>
      <Table columns={columns} dataSource={data} rowKey="id" pagination={false} size="small" />
    </Card>
  );
};

// Delivery Fee Config Tab
const DeliveryFeeTab: React.FC = () => {
  const [data, setData] = useState<DeliveryFeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryFeeConfig | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try { setData(await adminService.getDeliveryFeeConfigs()); }
    catch { toast.error('Không thể tải cấu hình phí giao hàng'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (item: DeliveryFeeConfig) => {
    setEditingItem(item);
    form.setFieldsValue({
      baseFee: item.baseFee,
      baseDistanceKm: item.baseDistanceKm,
      perKmFee: item.perKmFee,
      surgeEnabled: item.surgeEnabled,
      surgeMultiplier: item.surgeMultiplier,
      surgeStartTime: item.surgeStartTime ? dayjs(item.surgeStartTime, 'HH:mm:ss') : null,
      surgeEndTime: item.surgeEndTime ? dayjs(item.surgeEndTime, 'HH:mm:ss') : null,
      rainSurgeMultiplier: item.rainSurgeMultiplier,
      isActive: item.isActive,
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    try {
      const vals = await form.validateFields();
      const payload: Record<string, unknown> = {
        baseFee: vals.baseFee,
        baseDistanceKm: vals.baseDistanceKm,
        perKmFee: vals.perKmFee,
        surgeEnabled: vals.surgeEnabled,
        surgeMultiplier: vals.surgeMultiplier,
        surgeStartTime: vals.surgeStartTime ? vals.surgeStartTime.format('HH:mm:ss') : null,
        surgeEndTime: vals.surgeEndTime ? vals.surgeEndTime.format('HH:mm:ss') : null,
        rainSurgeMultiplier: vals.rainSurgeMultiplier,
        isActive: vals.isActive,
      };
      await adminService.updateDeliveryFeeConfig(editingItem.id, payload);
      toast.success('Đã cập nhật cước phí');
      setEditModal(false);
      loadData();
    } catch { toast.error('Lỗi khi cập nhật'); }
  };

  const handleQuickToggle = async (id: string, field: string, value: boolean) => {
    try {
      await adminService.updateDeliveryFeeConfig(id, { [field]: value });
      toast.success('Đã cập nhật');
      loadData();
    } catch { toast.error('Lỗi khi cập nhật'); }
  };

  const columns = [
    { title: 'Phí cơ bản', key: 'base', render: (_: unknown, r: DeliveryFeeConfig) => (
      <Space direction="vertical" size={2}>
        <Text strong>{r.baseFee.toLocaleString()}đ</Text>
        <Text type="secondary">Trong: {r.baseDistanceKm}km</Text>
        <Text type="secondary">Vượt: {r.perKmFee.toLocaleString()}đ/km</Text>
      </Space>
    )},
    { title: 'Giờ cao điểm', key: 'surge', render: (_: unknown, r: DeliveryFeeConfig) => (
      <Space direction="vertical" size={2}>
        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" checked={r.surgeEnabled} onChange={v => handleQuickToggle(r.id, 'surgeEnabled', v)} size="small" />
        {r.surgeEnabled && (
          <>
            <Text type="secondary">{r.surgeStartTime?.substring(0,5) || '—'} - {r.surgeEndTime?.substring(0,5) || '—'}</Text>
            <Text type="warning">x{r.surgeMultiplier}</Text>
          </>
        )}
      </Space>
    )},
    { title: 'Mưa', dataIndex: 'rainSurgeMultiplier', key: 'rain', render: (v: number) => <Text style={{ color: '#1890ff' }}>x{v}</Text> },
    { title: 'Active', dataIndex: 'isActive', key: 'active', render: (v: boolean, r: DeliveryFeeConfig) => <Switch checked={v} onChange={c => handleQuickToggle(r.id, 'isActive', c)} size="small" /> },
    { title: '', key: 'actions', width: 80, render: (_: unknown, r: DeliveryFeeConfig) => (
      <Button size="small" onClick={() => openEdit(r)}>Sửa</Button>
    )},
  ];

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <>
      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={data} rowKey="id" pagination={false} size="small" />
      </Card>

      <Modal title="Chỉnh sửa cước phí vận chuyển" open={editModal} onCancel={() => setEditModal(false)} onOk={handleSave} okText="Lưu" cancelText="Huỷ" width={480}>
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="baseFee" label="Phí cơ bản (đ)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="baseDistanceKm" label="Km miễn phí" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} addonAfter="km" />
            </Form.Item>
            <Form.Item name="perKmFee" label="Phí mỗi km vượt (đ)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="rainSurgeMultiplier" label="Hệ số mưa" rules={[{ required: true }]}>
              <InputNumber min={1} max={5} step={0.1} style={{ width: '100%' }} addonAfter="x" />
            </Form.Item>
          </div>
          <Form.Item name="surgeEnabled" label="Giờ cao điểm" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.surgeEnabled !== cur.surgeEnabled}>
            {({ getFieldValue }) => getFieldValue('surgeEnabled') ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                <Form.Item name="surgeStartTime" label="Bắt đầu">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="surgeEndTime" label="Kết thúc">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="surgeMultiplier" label="Hệ số">
                  <InputNumber min={1} max={5} step={0.1} style={{ width: '100%' }} addonAfter="x" />
                </Form.Item>
              </div>
            ) : null}
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const PricingConfigPage: React.FC = () => (
  <div className="animate-fade-in">
    <Title level={4} style={{ marginBottom: 16 }}>Cấu hình hệ thống</Title>
    <Tabs defaultActiveKey="platform" items={[
      { key: 'platform', label: 'Biến hệ thống', children: <PlatformConfigTab /> },
      { key: 'delivery', label: 'Cước phí vận chuyển', children: <DeliveryFeeTab /> },
    ]} />
  </div>
);

export default PricingConfigPage;
