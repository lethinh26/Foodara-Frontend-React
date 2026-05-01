import React, { useState } from 'react';
import { Card, Typography, Button, Space, Modal, Form, Input, message, Empty } from 'antd';
import { MapPinned, Plus } from 'lucide-react';

const { Title, Text } = Typography;

const ZoneManager: React.FC = () => {
  const [modal, setModal] = useState(false);

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

      <Card title="Vùng hoạt động" style={{ borderRadius: 12 }}>
        <Empty description="Quản lý vùng hoạt động theo tỉnh/quận/phường (v4 schema)" />
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
