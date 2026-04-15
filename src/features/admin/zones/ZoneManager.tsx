import React, { useState } from 'react';
import { Card, Tree, Tag, Button, Typography, Space, Modal, Form, Input, message } from 'antd';
import { MapPinned, Plus } from 'lucide-react';
import { mockRegions } from '../../../mocks/dashboardMetrics';

const { Title, Text } = Typography;

const ZoneManager: React.FC = () => {
  const [regions] = useState(mockRegions);
  const [modal, setModal] = useState(false);

  const treeData = regions.map(region => ({
    title: <Space><Text strong>{region.name}</Text><Tag color={region.isActive ? 'green' : 'default'}>{region.code}</Tag></Space>,
    key: region.id,
    children: region.cities.map(city => ({
      title: <Space><Text>{city.name}</Text><Tag color={city.isActive ? 'blue' : 'default'}>{city.code}</Tag>{!city.isActive && <Tag color="orange">Chưa mở</Tag>}</Space>,
      key: city.id,
      children: city.districts.map(dist => ({
        title: <Space><Text>{dist.name}</Text><Tag>{dist.code}</Tag>{dist.isActive ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tắt</Tag>}</Space>,
        key: dist.id,
      })),
    })),
  }));

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Quản lý vùng hoạt động</Title>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setModal(true)}>Thêm vùng</Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--surface-soft)', borderRadius: 12, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <MapPinned size={32} style={{ marginBottom: 8 }} />
            <div>Bản đồ vùng hoạt động</div>
            <Text type="secondary" style={{ fontSize: 12 }}>Cấu hình VITE_MAPBOX_TOKEN để hiển thị</Text>
          </div>
        </div>
      </Card>

      <Card title="Cây vùng hoạt động" style={{ borderRadius: 12 }}>
        <Tree treeData={treeData} defaultExpandAll showLine />
      </Card>

      <Modal title="Thêm vùng" open={modal} onCancel={() => setModal(false)} onOk={() => { setModal(false); message.success('Đã thêm!'); }}>
        <Form layout="vertical">
          <Form.Item name="name" label="Tên vùng" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="Mã vùng" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ZoneManager;
