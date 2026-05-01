import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Divider, Typography, message, Tabs, Modal, Avatar } from 'antd';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { loginSuccess, selectIsAuthenticated } from '../../store/authSlice';
import { authService, type UserResponse } from '../../services/authService';
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

  const [isMerchantExistsModalOpen, setIsMerchantExistsModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserResponse | null>(null);

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
      if (role == "merchant") {
        // check có phải merchant không
        const resultGetUser = await checkMerchant({ email: values.email, password: values.password });
        if (!resultGetUser?.checkMerchant) {
          message.error('Đăng nhập thất bại. Vui lòng thử lại.');
          return
        }
        // merchant đăng nhập
      } else if (role == "admin") {
        // check admin đăng nhập
      } else if (role == "customer") {
        // check customer đăng nhập
      }

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

  const checkMerchant = async (data: { email: string, password: string }): Promise<UserResponse | null> => {
    setLoading(true)
    // goi api check user
    try {
      console.log("fetch data");
      const result = await authService.getUserResponse(data);
      
      return result

    } catch (error: any) {
      console.log(error);
      return null;
    } finally {
      setLoading(false)
    }
  };


  const handleRegister = async (values: { email: string; password: string; fullName: string; phone: string }) => {
    setLoading(true);
    try {
      if (role == "merchant") {
        // merchant đăng ký
        const resultGetUser = await checkMerchant({ email: values.email, password: values.password });

        if (resultGetUser && !resultGetUser?.checkMerchant) {
          setIsMerchantExistsModalOpen(true);
          setLoading(false);
          setPendingUser({ email: resultGetUser.email, fullName: resultGetUser.fullName, userId: resultGetUser.userId, checkMerchant: resultGetUser.checkMerchant, avatarUrl: resultGetUser.avatarUrl });

          return;
        }

        const result = await authService.register(values);
        // dang ky role cho merchant
        await authService.postUserRole({ userId: result.user.id, userRole: "merchant" })
        dispatch(loginSuccess({ user: { ...result.user, role }, token: result.token }));
        message.success('Đăng ký thành công!');
        navigate(from, { replace: true });
      } else if (role == "admin") {
        // admin không cho đăng ký
      } else if (role == "customer") {
        // customer đăng ký
        const result = await authService.register(values);
        dispatch(loginSuccess({ user: { ...result.user, role }, token: result.token }));
        message.success('Đăng ký thành công!');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      message.error(err?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi nhấn ACCEPT hoặc REJECT
  const handleAccept = async () => {
    console.log("pendingUser:", pendingUser);

    const result = await authService.postUserRole({
      userId: pendingUser?.userId || "",
      userRole: "merchant"
    });

    console.log("API RESULT:", result);
    setActiveTab("login")
    setIsMerchantExistsModalOpen(false)
  };


  const handleReject = () => {
    setIsMerchantExistsModalOpen(false);
    setPendingUser(null);
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

      {/* Modal Custom theo giao diện hình ảnh */}
      <Modal
        open={isMerchantExistsModalOpen}
        onCancel={handleReject}
        footer={null}
        closable={false}
        centered
        width={400}
        bodyStyle={{ padding: 0 }}
        modalRender={(node) => (
          <div style={{
            border: '1px solid #1fde6c',
            borderRadius: 8,
            backgroundColor: '#fff',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            {node}
          </div>
        )}
      >
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <Title level={4} style={{ color: '#1fde6c', marginTop: 0, marginBottom: 24 }}>
            Bạn có muốn liên kết tài khoản không?
          </Title>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              border: '4px solid #1fde6c',
              borderRadius: '50%',
              padding: 4,
              display: 'inline-flex'
            }}>
              <Avatar
                size={110}
                src={pendingUser?.avatarUrl}
                alt='none'
              />
            </div>
          </div>
          <div style={{
            border: '2px solid #1fde6c',
            borderRadius: 4,
            padding: '16px',
            textAlign: 'left',
            marginBottom: 32
          }}>
            {/* <div style={{ textAlign: 'right', marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 13, color: '#333' }}>
                Received: Just now
              </Text>
            </div> */}
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 16, color: '#333' }}>
                Username: <span style={{ fontWeight: 'normal' }}>{pendingUser?.fullName || 'N/A'}</span>
              </Text>
            </div>
            <div>
              <Text strong style={{ fontSize: 16, color: '#333' }}>
                Email: <span style={{ fontWeight: 'normal' }}>{pendingUser?.email || 'N/A'}</span>
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              loading={loading}
              block
              onClick={handleAccept}
              style={{
                height: 50,
                border: '3px solid #3ffc0b',
                color: '#1fde6c',
                fontWeight: 'bold',
                fontSize: 16,
                borderRadius: 4
              }}
            >
              Đồng ý
            </Button>
            <Button
              block
              onClick={handleReject}
              style={{
                height: 50,
                border: '3px solid #6A0000', // Đỏ sậm
                color: '#C00000',
                fontWeight: 'bold',
                fontSize: 16,
                borderRadius: 4
              }}
            >
              Từ chối!
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
