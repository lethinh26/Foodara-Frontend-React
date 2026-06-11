import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge, Avatar, Dropdown, Button, Input, Drawer } from 'antd';
import { ShoppingCart, Bell, Heart, Search, ChevronDown, Menu as MenuIcon, Home, ClipboardList, Ticket } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { selectUser, logout } from '../store/authSlice';
import { selectCartCount } from '../store/cartSlice';
import { selectUnreadCount, fetchUnreadCount } from '../store/notificationSlice';
import { authService } from '../services/authService';
import NotificationPanel from '../components/NotificationPanel';
import '../styles/global.css';

const { Header, Content, Footer } = Layout;

export const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const cartCount = useAppSelector(selectCartCount);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Even if API fails, still logout locally
    }
    dispatch(logout());
    navigate('/customer/login');
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ của tôi', onClick: () => navigate('/customer/profile') },
    { key: 'orders', label: 'Đơn hàng', onClick: () => navigate('/customer/orders') },
    { key: 'favorites', label: 'Yêu thích', onClick: () => navigate('/customer/favorites') },
    { key: 'vouchers', label: 'Voucher', onClick: () => navigate('/customer/vouchers') },
    { type: 'divider' as const },
    { key: 'logout', label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  const navItems = [
    { key: '/customer', icon: <Home size={18} />, label: 'Trang chủ' },
    { key: '/customer/orders', icon: <ClipboardList size={18} />, label: 'Đơn hàng', authOnly: true },
    { key: '/customer/vouchers', icon: <Ticket size={18} />, label: 'Voucher', authOnly: true },
    { key: '/customer/favorites', icon: <Heart size={18} />, label: 'Yêu thích', authOnly: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
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
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" className="mobile-menu-btn" icon={<MenuIcon size={20} />} onClick={() => setMobileMenuOpen(true)} style={{ display: 'none' }} />
          <img src="/logo/secondary_logo.png" alt="Foodara" style={{ height: 48, cursor: 'pointer' }} onClick={() => navigate('/customer')} />
        </div>

        <div style={{ flex: 1, maxWidth: 480, margin: '0 24px' }}>
          <Input
            prefix={<Search size={16} color="var(--text-muted)" />}
            placeholder="Tìm quán ăn, món ăn..."
            style={{ borderRadius: 20, background: 'var(--surface-soft)' }}
            onFocus={() => navigate('/customer/search')}
            readOnly
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge count={unreadCount} size="small">
            <Button type="text" icon={<Bell size={20} />} onClick={() => setNotifOpen(true)} />
          </Badge>
          <Badge count={cartCount} size="small">
            <Button type="text" icon={<ShoppingCart size={20} />} onClick={() => navigate('/customer/checkout')} />
          </Badge>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                <Avatar src={user.avatar} size={32}>{user.fullName[0]}</Avatar>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{user.fullName}</span>
                <ChevronDown size={12} />
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/customer/login')}>Đăng nhập</Button>
          )}
        </div>
      </Header>

      <Content style={{ minHeight: 'calc(100vh - 64px - 60px)' }}>
        <Outlet />
      </Content>

      <Footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border-soft)',
        padding: '12px 24px',
        textAlign: 'center',
      }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navItems
            .filter(item => !item.authOnly || !!user)
            .map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
            }))}
          onClick={({ key }) => {
            const item = navItems.find(n => n.key === key);
            if (item?.authOnly && !user) {
              navigate('/customer/login', { state: { from: { pathname: key } } });
            } else {
              navigate(key);
            }
          }}
          style={{ justifyContent: 'center', borderBottom: 'none', background: 'transparent' }}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
          © 2025 Foodara. All rights reserved.
        </div>
      </Footer>

      <Drawer title="Menu" placement="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} width={280}>
        <Menu mode="vertical" selectedKeys={[location.pathname]} items={navItems} onClick={({ key }) => { navigate(key); setMobileMenuOpen(false); }} />
      </Drawer>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </Layout>
  );
};
