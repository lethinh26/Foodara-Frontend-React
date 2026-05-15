import React, { useState } from 'react';
import { Card, Form, Input, Switch, Button, Typography, message, Space, Tag, Avatar } from 'antd';
import { Store, Clock, Phone, MapPin } from 'lucide-react';

const { Title, Text } = Typography;

const MerchantProfilePage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [editing, setEditing] = useState(false);

  const profile = {
    name: 'Phở Hà Nội Xưa', description: 'Phở truyền thống Hà Nội, nước dùng ninh xương 12 tiếng',
    address: '123 Nguyễn Trãi, Quận 1, TP.HCM', phone: '0901111222',
    openTime: '06:00', closeTime: '22:00', prepTime: 10, logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PHX',
    coverImage: 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=800',
    commissionRate: 20, bankName: 'Vietcombank', bankAccount: '****5678',
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Hồ sơ quán</Title>
        <Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text>Trạng thái quán:</Text>
            <Switch checked={isOpen} onChange={v => { setIsOpen(v); message.success(v ? 'Đã mở quán' : 'Đã đóng quán'); }} checkedChildren="Mở" unCheckedChildren="Đóng" />
          </div>
        </Space>
      </div>

      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 24, height: 200 }}>
        <img src={profile.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={profile.logo} size={64} style={{ border: '3px solid white' }} />
          <div><Text style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{profile.name}</Text><br /><Tag color={isOpen ? 'green' : 'red'}>{isOpen ? 'Đang mở' : 'Đã đóng'}</Tag></div>
        </div>
      </div>

      <Card title="Thông tin cơ bản" style={{ borderRadius: 12, marginBottom: 16 }} extra={<Button onClick={() => setEditing(!editing)}>{editing ? 'Huỷ' : 'Sửa'}</Button>}>
        <Form layout="vertical" disabled={!editing} initialValues={profile} onFinish={() => { message.success('Đã lưu!'); setEditing(false); }}>
          <Form.Item name="name" label="Tên quán"><Input prefix={<Store size={14} />} /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="address" label="Địa chỉ"><Input prefix={<MapPin size={14} />} /></Form.Item>
          <Form.Item name="phone" label="Số điện thoại"><Input prefix={<Phone size={14} />} /></Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="openTime" label="Giờ mở" style={{ flex: 1 }}><Input prefix={<Clock size={14} />} /></Form.Item>
            <Form.Item name="closeTime" label="Giờ đóng" style={{ flex: 1 }}><Input prefix={<Clock size={14} />} /></Form.Item>
            <Form.Item name="prepTime" label="TG chuẩn bị (phút)" style={{ flex: 1 }}><Input /></Form.Item>
          </div>
          {editing && <Button type="primary" htmlType="submit">Lưu thay đổi</Button>}
        </Form>
      </Card>

      <Card title="Thông tin hợp đồng" style={{ borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Tỷ lệ hoa hồng</Text><Text strong>{profile.commissionRate}%</Text></div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Ngân hàng</Text><Text strong>{profile.bankName}</Text></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Số tài khoản</Text><Text strong>{profile.bankAccount}</Text></div>
        </Space>
      </Card>
    </div>
  );
};

export default MerchantProfilePage;
