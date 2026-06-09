import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Button, Typography } from 'antd';
import { LayoutDashboard, Users, Store, Bike, Megaphone, ShoppingBag, ShieldCheck, Bell, LogOut, Menu as MenuIcon, MessageSquare, CreditCard, Settings } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { selectUser, logout } from '../store/authSlice';
import { selectUnreadCount } from '../store/notificationSlice';
import { authService } from '../services/authService';
import NotificationPanel from '../components/NotificationPanel';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: '/admin/users', icon: <Users size={18} />, label: 'Người dùng' },
  { key: '/admin/merchants', icon: <Store size={18} />, label: 'Quán ăn' },
  { key: '/admin/drivers', icon: <Bike size={18} />, label: 'Tài xế' },
  { key: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Đơn hàng & Giao vận' },
  { key: '/admin/campaigns', icon: <Megaphone size={18} />, label: 'Khuyến mãi' },
  { key: '/admin/reviews', icon: <MessageSquare size={18} />, label: 'Đánh giá' },
  { key: '/admin/pricing', icon: <Settings size={18} />, label: 'Cấu hình' },
  { key: '/admin/audit', icon: <ShieldCheck size={18} />, label: 'Audit Logs' },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const selectedKey = menuItems
    .map(item => item.key)
    .filter(key => location.pathname === key || location.pathname.startsWith(key + '/'))
    .sort((a, b) => b.length - a.length)[0] || '';

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
          <img
            src={collapsed ? "/logo/logo_foodara.png" : "/logo/secondary_logo.png"}
            alt="Foodara Admin"
            style={{ height: collapsed ? 36 : 48, transition: 'all 0.2s' }}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none', padding: '8px 0' }}
        />
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, padding: '0 16px' }}>
          <Button type="text" block icon={<LogOut size={16} />} onClick={handleLogout} danger style={{ justifyContent: 'flex-start', padding: '0 16px' }}>
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
              <Button type="text" icon={<Bell size={20} />} onClick={() => setNotifOpen(true)} />
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar src={user?.avatar} size={32} style={{ background: 'var(--primary)' }}>{user?.fullName?.[0] || 'A'}</Avatar>
              <div>
                <div>
                  <Typography.Text strong style={{ fontSize: 14, color: '#000000', display: 'block' }}>
                    {user?.fullName || 'Admin'}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                    {user?.role?.toLocaleUpperCase() || "ADMIN"}
                  </Typography.Text>
                </div>
              </div>
            </div>
          </div>
        </Header>

        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: 'var(--background)' }}>
          <Outlet />
        </Content>

        <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      </Layout>
    </Layout>
  );
};
