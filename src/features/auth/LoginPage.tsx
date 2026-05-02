import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Divider, Typography, message, Tabs, Modal, Avatar } from 'antd';
import { Mail, Lock, User, Phone, Link2, UserCheck, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { loginSuccess, selectIsAuthenticated } from '../../store/authSlice';
import { authService, type RegisterCheckResponse } from '../../services/authService';
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

  // State cho modal liên kết tài khoản (dùng chung cho mọi role)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [pendingCheckResult, setPendingCheckResult] = useState<RegisterCheckResponse | null>(null);
  const [pendingFormData, setPendingFormData] = useState<{ email: string; password: string; fullName: string; phone: string } | null>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const roleLabels: Record<UserRole, string> = {
    customer: 'Khách hàng',
    merchant: 'Đối tác quán',
    admin: 'Quản trị viên',
  };

  const roleLinkLabels: Record<string, string> = {
    customer: 'khách hàng',
    merchant: 'đối tác quán',
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
      // BUG#1 Fix: Kiểm tra user có role phù hợp với portal đang login không
      if (role !== 'admin') {
        const check = await authService.checkRegister(
          { email: values.email, password: values.password, fullName: 'temp', phone: '0000000000' },
          role
        );
        if (check.exists && check.passwordMatched) {
          const normalizedRole = role.toUpperCase();
          const upperRoles = check.roles.map((r: string) => r.toUpperCase());
          if (!upperRoles.includes(normalizedRole)) {
            message.error(
              `Tài khoản này không có quyền ${roleLinkLabels[role] || role}. Vui lòng đăng ký để liên kết vai trò.`
            );
            setLoading(false);
            return;
          }
        }
      }

      const result = await authService.login(values, role);
      dispatch(loginSuccess({ user: { ...result.user, role }, token: result.token }));
      message.success('Đăng nhập thành công!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async (values: { email: string; password: string; fullName: string; phone: string }) => {
    if (role === 'admin') {
      message.error('Quản trị viên không thể tự đăng ký.');
      return;
    }

    setLoading(true);
    try {
      // Bước 1: Kiểm tra email đã tồn tại chưa qua API chuẩn
      const checkResult = await authService.checkRegister(values, role);
      console.log('[DEBUG checkRegister]', JSON.stringify(checkResult, null, 2));

      if (checkResult.exists) {
        if (checkResult.canLinkRole) {
          // Email đã tồn tại, password đúng, có thể liên kết role mới → hiện modal
          setPendingCheckResult(checkResult);
          setPendingFormData(values);
          setIsLinkModalOpen(true);
          setLoading(false);
          return;
        } else if (!checkResult.passwordMatched) {
          // Email tồn tại nhưng mật khẩu sai
          message.error('Email đã được đăng ký. Nếu đây là tài khoản của bạn, vui lòng nhập đúng mật khẩu để liên kết.');
          setLoading(false);
          return;
        } else {
          const normalizedRole = role.toUpperCase();
          const upperRoles = checkResult.roles.map((r: string) => r.toUpperCase());
          const alreadyHasRole = upperRoles.includes(normalizedRole);
          if (alreadyHasRole) {
            message.error(`Tài khoản này đã có vai trò ${roleLinkLabels[role] || role}. Vui lòng đăng nhập.`);
            setActiveTab('login');
          } else {
            message.error('Không thể liên kết tài khoản. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
          }
          setLoading(false);
          return;
        }
      }

      // Bước 2: Email chưa tồn tại → đăng ký mới bình thường
      const result = await authService.register(values, role);

      // BUG#2 Fix: Nếu đăng ký merchant, dùng linkRole API chuẩn thay vì postUserRole cũ
      // Backend register mặc định gán CUSTOMER, cần link thêm MERCHANT
      if (role === 'merchant') {
        const linkResult = await authService.linkRole(
          { email: values.email, password: values.password },
          'merchant'
        );
        dispatch(loginSuccess({ user: { ...linkResult.user, role }, token: linkResult.token }));
        message.success('Đăng ký thành công!');
        navigate(from, { replace: true });
        return;
      }

      dispatch(loginSuccess({ user: { ...result.user, role }, token: result.token }));
      message.success('Đăng ký thành công!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi user đồng ý liên kết tài khoản
  const handleLinkAccept = async () => {
    if (!pendingFormData) return;
    setLoading(true);
    try {
      const result = await authService.linkRole(
        { email: pendingFormData.email, password: pendingFormData.password },
        role
      );
      dispatch(loginSuccess({ user: { ...result.user, role }, token: result.token }));
      message.success('Liên kết tài khoản thành công!');
      // BUG#3 Fix: Cleanup state để tránh data cũ nếu navigate chậm
      setIsLinkModalOpen(false);
      setPendingCheckResult(null);
      setPendingFormData(null);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Liên kết thất bại. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleLinkReject = () => {
    setIsLinkModalOpen(false);
    setPendingCheckResult(null);
    setPendingFormData(null);
  };

  // Lấy danh sách role hiện tại để hiển thị trong modal
  const existingRolesText = pendingCheckResult?.roles
    ?.map((r) => {
      const map: Record<string, string> = { CUSTOMER: 'Khách hàng', MERCHANT: 'Đối tác quán', ADMIN: 'Quản trị viên' };
      return map[r] || r;
    })
    .join(', ') || '';

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

      {/* Modal liên kết tài khoản — dùng chung cho merchant & customer */}
      <Modal
        open={isLinkModalOpen}
        onCancel={handleLinkReject}
        footer={null}
        closable={false}
        centered
        width={420}
        styles={{ body: { padding: 0 } }}
        modalRender={(node) => (
          <div style={{
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--surface)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}>
            {node}
          </div>
        )}
      >
        {/* Header với gradient */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          padding: '28px 24px 36px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Nút đóng */}
          <button
            onClick={handleLinkReject}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <X size={16} color="#fff" />
          </button>

          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Link2 size={24} color="#fff" />
          </div>
          <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 'var(--font-size-lg)' }}>
            Liên kết tài khoản
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'var(--font-size-sm)' }}>
            Tài khoản này đã tồn tại. Bạn muốn liên kết thêm vai trò {roleLinkLabels[role] || role}?
          </Text>
        </div>

        {/* Nội dung */}
        <div style={{ padding: '24px' }}>
          {/* Card thông tin người dùng */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            background: 'var(--surface-soft)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-soft)',
            marginBottom: 16,
          }}>
            <div style={{
              flexShrink: 0,
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              border: '3px solid var(--primary-bg)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--primary-bg)',
            }}>
              <Avatar
                size={58}
                src={pendingFormData ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${pendingFormData.fullName}` : undefined}
                style={{ backgroundColor: 'var(--primary-light)' }}
                icon={<User size={28} />}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{
                display: 'block',
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {pendingFormData?.fullName || 'N/A'}
              </Text>
              <Text style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
              }}>
                <Mail size={13} />
                {pendingFormData?.email || 'N/A'}
              </Text>
            </div>
          </div>

          {/* Roles hiện tại */}
          {existingRolesText && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'var(--secondary-bg)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
              border: '1px solid rgba(255, 152, 0, 0.2)',
            }}>
              <User size={16} color="var(--secondary-dark)" style={{ flexShrink: 0 }} />
              <Text style={{ fontSize: 'var(--font-size-sm)', color: 'var(--secondary-dark)' }}>
                Vai trò hiện tại: <strong>{existingRolesText}</strong>
              </Text>
            </div>
          )}

          {/* Thông báo */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
            background: 'var(--primary-bg)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            border: '1px solid rgba(76, 175, 80, 0.2)',
          }}>
            <UserCheck size={18} color="var(--primary-dark)" style={{ flexShrink: 0, marginTop: 1 }} />
            <Text style={{ fontSize: 'var(--font-size-sm)', color: 'var(--primary-dark)', lineHeight: 1.5 }}>
              Sau khi liên kết, bạn có thể đăng nhập bằng tài khoản này với vai trò <strong>{roleLinkLabels[role] || role}</strong>.
            </Text>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              block
              onClick={handleLinkReject}
              size="large"
              style={{
                height: 46,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: 'var(--font-size-base)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Từ chối
            </Button>
            <Button
              loading={loading}
              block
              type="primary"
              onClick={handleLinkAccept}
              size="large"
              style={{
                height: 46,
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 'var(--font-size-base)',
                background: 'var(--primary)',
                borderColor: 'var(--primary)',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Đồng ý liên kết
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
