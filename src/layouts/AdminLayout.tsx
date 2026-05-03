import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Button } from 'antd';
import { LayoutDashboard, Users, MapPinned, DollarSign, Megaphone, ShoppingBag, ShieldCheck, Bell, LogOut, Menu as MenuIcon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { selectUser, logout } from '../store/authSlice';
import { selectUnreadCount } from '../store/notificationSlice';
import { authService } from '../services/authService';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: '/admin/users', icon: <Users size={18} />, label: 'Người dùng' },
  { key: '/admin/zones', icon: <MapPinned size={18} />, label: 'Vùng hoạt động' },
  { key: '/admin/pricing', icon: <DollarSign size={18} />, label: 'Giá & SLA' },
  { key: '/admin/campaigns', icon: <Megaphone size={18} />, label: 'Campaign' },
  { key: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Đơn hàng' },
  { key: '/admin/audit', icon: <ShieldCheck size={18} />, label: 'Audit' },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
    }
    dispatch(logout());
    navigate('/customer/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={260}
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border-soft)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 200,
          overflow: 'auto',
        }}
        trigger={null}
      >
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-soft)' }}>
          <img src="/logo/secondary_logo.png" alt="Foodara Admin" style={{ height: collapsed ? 28 : 32, transition: 'height 0.2s' }} />
          {!collapsed && <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>ADMIN</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none', padding: '8px 0' }}
        />
        <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, padding: '0 8px' }}>
          <Button type="text" block icon={<LogOut size={16} />} onClick={handleLogout} danger style={{ justifyContent: 'flex-start' }}>
            {!collapsed && 'Đăng xuất'}
          </Button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border-soft)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 64,
        }}>
          <Button type="text" icon={<MenuIcon size={20} />} onClick={() => setCollapsed(!collapsed)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<Bell size={20} />} />
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar src={user?.avatar} size={32} style={{ background: 'var(--primary)' }}>{user?.fullName?.[0] || 'A'}</Avatar>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.fullName || 'Admin'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Super Admin</div>
              </div>
            </div>
          </div>
        </Header>

        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: 'var(--background)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
