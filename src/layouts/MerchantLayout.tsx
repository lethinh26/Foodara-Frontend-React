import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Button } from 'antd';
import { LayoutDashboard, UtensilsCrossed, Package, ChefHat, ClipboardList, Truck, Megaphone, BarChart3, Store, Bell, LogOut, Menu as MenuIcon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { selectUser, logout } from '../store/authSlice';
import { selectUnreadCount } from '../store/notificationSlice';
import { authService } from '../services/authService';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/merchant', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: '/merchant/orders', icon: <ClipboardList size={18} />, label: 'Đơn hàng' },
  { key: '/merchant/kitchen', icon: <ChefHat size={18} />, label: 'Bếp' },
  { key: '/merchant/handover', icon: <Truck size={18} />, label: 'Giao tài xế' },
  { key: '/merchant/menu', icon: <UtensilsCrossed size={18} />, label: 'Thực đơn' },
  { key: '/merchant/inventory', icon: <Package size={18} />, label: 'Tồn kho' },
  { key: '/merchant/promotions', icon: <Megaphone size={18} />, label: 'Khuyến mãi' },
  { key: '/merchant/reports', icon: <BarChart3 size={18} />, label: 'Báo cáo' },
  { key: '/merchant/profile', icon: <Store size={18} />, label: 'Hồ sơ quán' },
];

export const MerchantLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = menuItems
    .map(item => item.key)
    .filter(key => location.pathname === key || location.pathname.startsWith(key + '/'))
    .sort((a, b) => b.length - a.length)[0] || '';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Even if API fails, still logout locally
    }
    dispatch(logout());
    navigate('/merchant/login');
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
        }}
        trigger={null}
      >
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-soft)' }}>
          <img src="/logo/secondary_logo.png" alt="Foodara" style={{ height: collapsed ? 28 : 32, transition: 'height 0.2s' }} />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
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
              <Avatar src={user?.avatar} size={32}>{user?.fullName?.[0]}</Avatar>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.fullName || 'Merchant'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quản lý quán</div>
              </div>
            </div>
          </div>
        </Header>

        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
