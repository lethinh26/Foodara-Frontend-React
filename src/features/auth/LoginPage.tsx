import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Divider, Typography, message, Tabs } from 'antd';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { loginSuccess, selectIsAuthenticated } from '../../store/authSlice';
import { authService } from '../../services/authService';
import type { UserRole } from '../../types/user';

const { Title, Text } = Typography;

interface LoginPageProps {
  role: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  const roleLabels: Record<UserRole, string> = {
    customer: 'Khách hàng',
    merchant: 'Đối tác quán',
    admin: 'Quản trị viên',
  };

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || `/${role}`;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await authService.login(values);
      dispatch(loginSuccess({ user: { ...result.user, role }, token: result.token }));
      message.success('Đăng nhập thành công!');
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string; fullName: string; phone: string }) => {
    setLoading(true);
    try {
      const result = await authService.register(values);
      dispatch(loginSuccess({ user: { ...result.user, role }, token: result.token }));
      message.success('Đăng ký thành công!');
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: 24,
    }}>
      <Card style={{ width: '100%', maxWidth: 440, borderRadius: 16, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo/primary_logo.png" alt="Foodara" style={{ height: 48, marginBottom: 16 }} />
          <Title level={4} style={{ margin: 0 }}>{roleLabels[role]}</Title>
          <Text type="secondary">Chào mừng bạn đến với Foodara</Text>
        </div>

        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as 'login' | 'register')} centered items={[
          {
            key: 'login',
            label: 'Đăng nhập',
            children: (
              <Form layout="vertical" onFinish={handleLogin} requiredMark={false}>
                <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
                  <Input prefix={<Mail size={16} />} placeholder="Email" size="large" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
                  <Input.Password prefix={<Lock size={16} />} placeholder="Mật khẩu" size="large" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={loading}
                    style={{ height: 48, borderRadius: 10, fontWeight: 600, fontSize: 15 }}>
                    Đăng nhập
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          ...(role !== 'admin' ? [{
            key: 'register',
            label: 'Đăng ký',
            children: (
              <Form layout="vertical" onFinish={handleRegister} requiredMark={false}>
                <Form.Item name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                  <Input prefix={<User size={16} />} placeholder="Họ và tên" size="large" />
                </Form.Item>
                <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
                  <Input prefix={<Mail size={16} />} placeholder="Email" size="large" />
                </Form.Item>
                <Form.Item name="phone" rules={[
                  { required: true, message: 'Vui lòng nhập SĐT' },
                  { pattern: /^0[0-9]{9}$/, message: 'SĐT phải có 10 chữ số, bắt đầu bằng 0' }
                ]}>
                  <Input prefix={<Phone size={16} />} placeholder="0901234567" size="large" maxLength={10} />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}>
                  <Input.Password prefix={<Lock size={16} />} placeholder="Mật khẩu" size="large" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={loading}
                    style={{ height: 48, borderRadius: 10, fontWeight: 600, fontSize: 15 }}>
                    Đăng ký
                  </Button>
                </Form.Item>
              </Form>
            ),
          }] : []),
        ]} />

        {role === 'customer' && (
          <>
            <Divider style={{ margin: '12px 0' }}>hoặc</Divider>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button block size="large" style={{ borderRadius: 10 }}>Google</Button>
              <Button block size="large" style={{ borderRadius: 10 }}>Facebook</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
