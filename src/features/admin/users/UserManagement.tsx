import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Modal, message, Avatar } from 'antd';
import { Search, UserCheck, Eye, Ban, CheckCircle2 } from 'lucide-react';
import { mockCustomer, mockMerchant, mockAdmin } from '../../../mocks/users';
import { formatDate } from '../../../utils/format';
import type { User } from '../../../types/user';

const { Title, Text } = Typography;

const allUsers: User[] = [
  mockCustomer,
  mockMerchant,
  mockAdmin,
  { id: 'user-004', email: 'dung@gmail.com', fullName: 'Phạm Thị Dung', phone: '0934567890', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dung', role: 'customer', status: 'active', emailVerified: true, phoneVerified: true, createdAt: '2024-11-01T00:00:00Z', updatedAt: '2025-01-05T00:00:00Z', lastLoginAt: '2025-03-14T08:00:00Z' },
  { id: 'user-005', email: 'em@gmail.com', fullName: 'Hoàng Văn Em', phone: '0945678901', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Em', role: 'customer', status: 'active', emailVerified: false, phoneVerified: true, createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-02-20T00:00:00Z', lastLoginAt: '2025-03-13T12:00:00Z' },
  { id: 'user-006', email: 'phu@restaurant.com', fullName: 'Trần Văn Phú', phone: '0903456789', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Phu', role: 'merchant', status: 'pending', emailVerified: true, phoneVerified: true, createdAt: '2025-03-12T00:00:00Z', updatedAt: '2025-03-12T00:00:00Z', lastLoginAt: null },
  { id: 'user-007', email: 'giang@gmail.com', fullName: 'Đặng Văn Giang', phone: '0956789012', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Giang', role: 'customer', status: 'suspended', emailVerified: true, phoneVerified: true, createdAt: '2024-08-01T00:00:00Z', updatedAt: '2025-02-20T00:00:00Z', lastLoginAt: '2025-02-19T00:00:00Z' },
];

const roleColors: Record<string, string> = { customer: 'blue', merchant: 'green', admin: 'purple' };
const roleLabels: Record<string, string> = { customer: 'Khách hàng', merchant: 'Đối tác', admin: 'Admin' };
const statusColors: Record<string, string> = { active: 'green', pending: 'orange', suspended: 'red' };
const statusLabels: Record<string, string> = { active: 'Hoạt động', pending: 'Chờ duyệt', suspended: 'Khoá' };

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState(allUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const filtered = users.filter(u => {
    if (search && !u.fullName.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : u.status === 'suspended' ? 'active' : u.status } : u));
    message.success('Đã cập nhật trạng thái');
  };

  const handleApprove = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    message.success('Đã duyệt tài khoản');
  };

  const columns = [
    { title: 'Người dùng', key: 'user', render: (_: unknown, r: User) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar src={r.avatar} size={36}>{r.fullName[0]}</Avatar>
        <div><Text strong>{r.fullName}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.email}</Text></div>
      </div>
    )},
    { title: 'Vai trò', dataIndex: 'role', key: 'role', width: 100, render: (r: string) => <Tag color={roleColors[r]}>{roleLabels[r]}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'created', width: 110, render: (d: string) => formatDate(d) },
    { title: '', key: 'actions', width: 160, render: (_: unknown, r: User) => (
      <Space>
        <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailUser(r)}>Chi tiết</Button>
        {r.status === 'pending' && <Button size="small" type="primary" icon={<CheckCircle2 size={12} />} onClick={() => handleApprove(r.id)}>Duyệt</Button>}
        {r.status !== 'pending' && <Button size="small" danger={r.status === 'active'} icon={r.status === 'active' ? <Ban size={12} /> : <UserCheck size={12} />} onClick={() => handleToggleStatus(r.id)}>{r.status === 'active' ? 'Khoá' : 'Mở'}</Button>}
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <Title level={4}>Quản lý người dùng</Title>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm theo tên hoặc email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260, borderRadius: 8 }} allowClear />
        <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 140 }} options={[{ label: 'Tất cả vai trò', value: 'all' }, { label: 'Khách hàng', value: 'customer' }, { label: 'Đối tác', value: 'merchant' }, { label: 'Admin', value: 'admin' }]} />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} options={[{ label: 'Tất cả trạng thái', value: 'all' }, { label: 'Hoạt động', value: 'active' }, { label: 'Chờ duyệt', value: 'pending' }, { label: 'Khoá', value: 'suspended' }]} />
      </div>
      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />
      </Card>

      <Modal open={!!detailUser} onCancel={() => setDetailUser(null)} title="Chi tiết người dùng" footer={null} width={500}>
        {detailUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar src={detailUser.avatar} size={64}>{detailUser.fullName[0]}</Avatar>
              <div><Title level={5} style={{ margin: 0 }}>{detailUser.fullName}</Title><Tag color={roleColors[detailUser.role]}>{roleLabels[detailUser.role]}</Tag><Tag color={statusColors[detailUser.status]}>{statusLabels[detailUser.status]}</Tag></div>
            </div>
            <div><Text type="secondary">Email:</Text> <Text>{detailUser.email}</Text> {detailUser.emailVerified && <CheckCircle2 size={12} color="var(--success)" />}</div>
            <div><Text type="secondary">SĐT:</Text> <Text>{detailUser.phone}</Text> {detailUser.phoneVerified && <CheckCircle2 size={12} color="var(--success)" />}</div>
            <div><Text type="secondary">Ngày tạo:</Text> <Text>{formatDate(detailUser.createdAt)}</Text></div>
            <div><Text type="secondary">Đăng nhập gần nhất:</Text> <Text>{detailUser.lastLoginAt ? formatDate(detailUser.lastLoginAt) : 'Chưa đăng nhập'}</Text></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
