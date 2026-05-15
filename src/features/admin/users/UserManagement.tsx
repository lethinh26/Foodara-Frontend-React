import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Input, Select, Typography, Space, Drawer, Avatar, Skeleton, Empty, Tabs, Popconfirm, Descriptions, Checkbox, Modal, Form } from 'antd';
import { Search, Eye, Ban, UserCheck, ShieldCheck, Trash2, LogOut } from 'lucide-react';
import { useAppSelector } from '../../../hooks/useStore';
import { selectUser } from '../../../store/authSlice';
import { adminService } from '../../../services/adminService';
import { formatDate } from '../../../utils/format';
import toast from 'react-hot-toast';
import type { AdminUserDetail, AdminUserStatus, AdminSession, AdminRoleWithPermissions, AdminPermission } from '../../../types/admin';
import type { TablePaginationConfig } from 'antd';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  customer: 'blue', merchant: 'green', driver: 'orange', admin: 'purple', superadmin: 'red',
};
const ROLE_LABELS: Record<string, string> = {
  customer: 'Khách hàng', merchant: 'Đối tác', driver: 'Tài xế', admin: 'Admin', superadmin: 'Super Admin',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'green', suspended: 'orange', banned: 'red', deleted: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động', suspended: 'Tạm khoá', banned: 'Cấm', deleted: 'Đã xoá',
};

const PAGE_SIZE = 10;

// User detail drawer
interface UserDetailDrawerProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusChanged: () => void;
  currentUserId: string | null;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ userId, open, onClose, onStatusChanged, currentUserId }) => {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const detail = await adminService.getUserDetail(userId);
      setUser(detail);
    } catch {
      toast.error('Không thể tải thông tin người dùng.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setSessionsLoading(true);
    try {
      const data = await adminService.getUserSessions(userId);
      setSessions(data);
    } catch {
      // Sessions may not be available
    } finally {
      setSessionsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      loadUser();
      loadSessions();
    }
    if (!open) {
      setUser(null);
      setSessions([]);
    }
  }, [open, userId, loadUser, loadSessions]);

  const handleStatusChange = async (newStatus: AdminUserStatus) => {
    if (!userId) return;
    try {
      await adminService.updateUserStatus(userId, { status: newStatus });
      toast.success('Đã cập nhật trạng thái.');
      loadUser();
      onStatusChanged();
    } catch {
      toast.error('Không thể cập nhật trạng thái.');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!userId) return;
    try {
      await adminService.revokeSession(userId, sessionId);
      toast.success('Đã thu hồi phiên đăng nhập.');
      loadSessions();
    } catch {
      toast.error('Không thể thu hồi phiên.');
    }
  };

  const sessionColumns = [
    { title: 'IP', dataIndex: 'ipAddress', key: 'ip', render: (v: string | null) => v || '—' },
    { title: 'Thiết bị', dataIndex: 'userAgent', key: 'ua', ellipsis: true, render: (v: string | null) => v || '—' },
    { title: 'Hết hạn', dataIndex: 'expiresAt', key: 'exp', width: 140, render: (v: string) => formatDate(v, 'DD/MM/YYYY HH:mm') },
    { title: 'Trạng thái', key: 'status', width: 90,
      render: (_: unknown, r: AdminSession) => r.revokedAt ? <Tag color="red">Đã huỷ</Tag> : <Tag color="green">Active</Tag>,
    },
    { title: '', key: 'actions', width: 80,
      render: (_: unknown, r: AdminSession) => !r.revokedAt ? (
        <Popconfirm title="Thu hồi phiên này?" onConfirm={() => handleRevokeSession(r.id)} okText="Thu hồi" cancelText="Huỷ">
          <Button size="small" danger icon={<LogOut size={12} />}>Kick</Button>
        </Popconfirm>
      ) : null,
    },
  ];

  return (
    <Drawer title="Chi tiết người dùng" open={open} onClose={onClose} width={560} destroyOnClose>
      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : !user ? (
        <Empty description="Không tải được thông tin" />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Avatar src={user.avatarUrl} size={64} style={{ background: 'var(--primary)' }}>
              {user.fullName?.[0] || '?'}
            </Avatar>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {user.fullName || 'Chưa đặt tên'}
                {currentUserId === user.id && <Tag color="blue" style={{ marginLeft: 8, verticalAlign: 'middle' }}>Bạn</Tag>}
              </Title>
              <Space size={4} style={{ marginTop: 4 }}>
                {user.roles.map(r => (
                  <Tag key={r.id} color={ROLE_COLORS[r.name] || 'default'}>{ROLE_LABELS[r.name] || r.name}</Tag>
                ))}
                <Tag color={STATUS_COLORS[user.status]}>{STATUS_LABELS[user.status] || user.status}</Tag>
              </Space>
            </div>
          </div>

          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="SĐT">{user.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Email xác thực">{user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : 'Chưa xác thực'}</Descriptions.Item>
            <Descriptions.Item label="Đăng nhập gần nhất">{user.lastLoginAt ? formatDate(user.lastLoginAt, 'DD/MM/YYYY HH:mm') : 'Chưa đăng nhập'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDate(user.createdAt)}</Descriptions.Item>
          </Descriptions>

          {(() => {
            const isSelf = currentUserId === user.id;
            const isSuperAdmin = user.roles.some(r => r.name === 'superadmin');
            const canModify = !isSelf && !isSuperAdmin;
            return (
              <div style={{ marginTop: 16 }}>
                <Text strong>Hành động:</Text>
                {!canModify && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--background)', border: '1px solid var(--border-soft)' }}>
                    <Text type="secondary">
                      {isSelf ? '⚠️ Không thể thay đổi trạng thái chính mình' : '🛡️ Không thể thay đổi trạng thái Super Admin'}
                    </Text>
                  </div>
                )}
                {canModify && (
                  <Space style={{ marginTop: 8, display: 'flex' }}>
                    {user.status === 'active' && (
                      <Popconfirm title="Tạm khoá tài khoản?" onConfirm={() => handleStatusChange('suspended')} okText="Khoá" cancelText="Huỷ">
                        <Button size="small" danger icon={<Ban size={12} />}>Tạm khoá</Button>
                      </Popconfirm>
                    )}
                    {user.status === 'suspended' && (
                      <Popconfirm title="Mở khoá tài khoản?" onConfirm={() => handleStatusChange('active')} okText="Mở" cancelText="Huỷ">
                        <Button size="small" type="primary" icon={<UserCheck size={12} />}>Mở khoá</Button>
                      </Popconfirm>
                    )}
                    {user.status !== 'banned' && user.status !== 'deleted' && (
                      <Popconfirm title="Cấm vĩnh viễn tài khoản này?" onConfirm={() => handleStatusChange('banned')} okText="Cấm" cancelText="Huỷ">
                        <Button size="small" danger type="primary" icon={<Ban size={12} />}>Cấm</Button>
                      </Popconfirm>
                    )}
                    {user.status === 'banned' && (
                      <Popconfirm title="Bỏ cấm tài khoản?" onConfirm={() => handleStatusChange('active')} okText="Bỏ cấm" cancelText="Huỷ">
                        <Button size="small" type="primary" icon={<UserCheck size={12} />}>Bỏ cấm</Button>
                      </Popconfirm>
                    )}
                  </Space>
                )}
              </div>
            );
          })()}

          <div style={{ marginTop: 24 }}>
            <Title level={5}>Phiên đăng nhập</Title>
            {sessionsLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : sessions.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phiên nào" />
            ) : (
              <Table dataSource={sessions} columns={sessionColumns} rowKey="id" size="small" pagination={false} />
            )}
          </div>
        </>
      )}
    </Drawer>
  );
};

// Roles & Permissions tab
interface RolesTabProps {
  roles: AdminRoleWithPermissions[];
  permissions: AdminPermission[];
  loading: boolean;
  onRefresh: () => void;
}

const RolesTab: React.FC<RolesTabProps> = ({ roles, permissions, loading, onRefresh }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const permsByModule = permissions.reduce<Record<string, AdminPermission[]>>((acc, p) => {
    const mod = p.module || 'Khác';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const handleTogglePermission = async (roleId: string, permId: string, checked: boolean, currentPerms: AdminPermission[]) => {
    const currentIds = currentPerms.map(p => p.id);
    const newIds = checked ? [...currentIds, permId] : currentIds.filter(id => id !== permId);
    try {
      await adminService.updateRolePermissions(roleId, newIds);
      toast.success('Đã cập nhật quyền.');
      onRefresh();
    } catch {
      toast.error('Không thể cập nhật quyền.');
    }
  };

  const handleCreateRole = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await adminService.createRole(values);
      toast.success('Đã tạo role.');
      setCreateOpen(false);
      form.resetFields();
      onRefresh();
    } catch {
      // validation or API error
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await adminService.deleteRole(roleId);
      toast.success('Đã xoá role.');
      onRefresh();
    } catch {
      toast.error('Không thể xoá role.');
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  if (roles.length === 0 && permissions.length === 0) {
    return <Empty description="Chưa có dữ liệu roles/permissions" />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text strong>Ma trận phân quyền</Text>
        <Button size="small" type="primary" onClick={() => setCreateOpen(true)}>Tạo Role</Button>
      </div>

      {Object.keys(permsByModule).length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border-soft)', minWidth: 200 }}>Module / Quyền</th>
                {roles.map(r => (
                  <th key={r.id} style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '2px solid var(--border-soft)', minWidth: 100 }}>
                    <div>{ROLE_LABELS[r.name] || r.name}</div>
                    {!['admin', 'superadmin', 'customer'].includes(r.name) && (
                      <Popconfirm title="Xoá role này?" onConfirm={() => handleDeleteRole(r.id)} okText="Xoá" cancelText="Huỷ">
                        <Button type="link" size="small" danger icon={<Trash2 size={11} />} style={{ padding: 0, height: 'auto' }} />
                      </Popconfirm>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permsByModule).map(([mod, perms]) => (
                <React.Fragment key={mod}>
                  <tr>
                    <td colSpan={roles.length + 1} style={{ padding: '6px 12px', fontWeight: 600, background: 'var(--background)', borderBottom: '1px solid var(--border-soft)' }}>
                      {mod}
                    </td>
                  </tr>
                  {perms.map(perm => (
                    <tr key={perm.id}>
                      <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                        <div>{perm.name}</div>
                        {perm.description && <Text type="secondary" style={{ fontSize: 11 }}>{perm.description}</Text>}
                      </td>
                      {roles.map(role => {
                        const hasPerm = role.permissions.some(p => p.id === perm.id);
                        return (
                          <td key={role.id} style={{ textAlign: 'center', padding: '6px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                            <Checkbox
                              checked={hasPerm}
                              onChange={(e) => handleTogglePermission(role.id, perm.id, e.target.checked, role.permissions)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal title="Tạo Role mới" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreateRole} confirmLoading={creating} okText="Tạo" cancelText="Huỷ">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên role" rules={[{ required: true, message: 'Nhập tên role' }]}>
            <Input placeholder="vd: moderator" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả vai trò" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Main page
const UserManagement: React.FC = () => {
  const currentUser = useAppSelector(selectUser);
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState(false);

  // Roles tab
  const [roles, setRoles] = useState<AdminRoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminService.getUsers({
        page: page - 1,
        size: PAGE_SIZE,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      setUsers(res.content);
      setTotal(res.totalElements);
    } catch {
      setError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, searchTerm]);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const [r, p] = await Promise.all([adminService.getRoles(), adminService.getPermissions()]);
      setRoles(r);
      setPermissions(p);
    } catch {
      // may not have data yet
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleOpenDetail = (userId: string) => {
    setDetailUserId(userId);
    setDrawerOpen(true);
  };

  const handleQuickStatus = async (userId: string, newStatus: AdminUserStatus) => {
    try {
      await adminService.updateUserStatus(userId, { status: newStatus });
      toast.success('Đã cập nhật trạng thái.');
      loadUsers();
    } catch {
      toast.error('Không thể cập nhật trạng thái.');
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
  };

  const handleTabChange = (key: string) => {
    if (key === 'roles' && roles.length === 0) loadRoles();
  };

  const columns = [
    { title: 'Người dùng', key: 'user', render: (_: unknown, r: AdminUserDetail) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar src={r.avatarUrl} size={36} style={{ background: 'var(--primary)' }}>{r.fullName?.[0] || '?'}</Avatar>
        <div>
          <Text strong>{r.fullName || 'Chưa đặt tên'}</Text><br />
          <Text type="secondary" style={{ fontSize: 11 }}>{r.email}</Text>
        </div>
      </div>
    )},
    { title: 'SĐT', dataIndex: 'phone', key: 'phone', width: 120, render: (v: string) => v || '—' },
    { title: 'Vai trò', key: 'roles', width: 160, render: (_: unknown, r: AdminUserDetail) => (
      <Space size={4} wrap>
        {r.roles.length > 0 ? r.roles.map(role => (
          <Tag key={role.id} color={ROLE_COLORS[role.name] || 'default'}>{ROLE_LABELS[role.name] || role.name}</Tag>
        )) : <Text type="secondary">—</Text>}
      </Space>
    )},
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 100,
      render: (s: AdminUserStatus) => <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s] || s}</Tag>,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'created', width: 110, render: (d: string) => formatDate(d) },
    { title: '', key: 'actions', width: 200, render: (_: unknown, r: AdminUserDetail) => (
      <Space>
        <Button size="small" icon={<Eye size={12} />} onClick={() => handleOpenDetail(r.id)}>Chi tiết</Button>
        {r.status === 'active' && (
          <Popconfirm title="Tạm khoá tài khoản này?" onConfirm={() => handleQuickStatus(r.id, 'suspended')} okText="Khoá" cancelText="Huỷ">
            <Button size="small" danger icon={<Ban size={12} />}>Khoá</Button>
          </Popconfirm>
        )}
        {r.status === 'suspended' && (
          <Popconfirm title="Mở khoá tài khoản?" onConfirm={() => handleQuickStatus(r.id, 'active')} okText="Mở" cancelText="Huỷ">
            <Button size="small" type="primary" icon={<UserCheck size={12} />}>Mở</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <Tabs defaultActiveKey="users" onChange={handleTabChange} items={[
        {
          key: 'users',
          label: 'Người dùng',
          children: (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <Input
                  prefix={<Search size={14} />}
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    if (!e.target.value) { setSearchTerm(''); setPage(1); }
                  }}
                  onPressEnter={() => { setSearchTerm(search); setPage(1); }}
                  style={{ width: 260, borderRadius: 8 }}
                  allowClear
                />
                <Select
                  value={roleFilter}
                  onChange={v => { setRoleFilter(v); setPage(1); }}
                  style={{ width: 150 }}
                  options={[
                    { label: 'Tất cả vai trò', value: 'all' },
                    { label: 'Khách hàng', value: 'customer' },
                    { label: 'Đối tác', value: 'merchant' },
                    { label: 'Tài xế', value: 'driver' },
                    { label: 'Admin', value: 'admin' },
                  ]}
                />
                <Select
                  value={statusFilter}
                  onChange={v => { setStatusFilter(v); setPage(1); }}
                  style={{ width: 150 }}
                  options={[
                    { label: 'Tất cả trạng thái', value: 'all' },
                    { label: 'Hoạt động', value: 'active' },
                    { label: 'Tạm khoá', value: 'suspended' },
                    { label: 'Cấm', value: 'banned' },
                  ]}
                />
              </div>

              {error ? (
                <div style={{ textAlign: 'center', paddingTop: 60 }}>
                  <Empty description="Không thể tải danh sách người dùng." />
                </div>
              ) : (
                <Card style={{ borderRadius: 12 }}>
                  <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: (t) => `Tổng ${t} người dùng` }}
                    onChange={handleTableChange}
                    size="middle"
                  />
                </Card>
              )}
            </>
          ),
        },
        {
          key: 'roles',
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} /> Roles & Permissions
            </span>
          ),
          children: <RolesTab roles={roles} permissions={permissions} loading={rolesLoading} onRefresh={loadRoles} />,
        },
      ]} />

      <UserDetailDrawer
        userId={detailUserId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChanged={loadUsers}
        currentUserId={currentUser?.id || null}
      />
    </div>
  );
};

export default UserManagement;
