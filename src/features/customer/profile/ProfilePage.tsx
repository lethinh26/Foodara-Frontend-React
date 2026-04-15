import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Typography, Tabs, Tag, message, Space, Select, Modal, Empty, Spin } from 'antd';
import { User, Phone, MapPin, Plus, Edit2, Trash2, Shield, LogOut, Star, Monitor, Globe } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useStore';
import { selectUser, updateProfile } from '../../../store/authSlice';
import { authService } from '../../../services/authService';
import type { AddressResponse, AddressRequest, SessionResponse } from '../../../services/authService';
import { locationService } from '../../../services/locationService';
import type { ProvinceItem, DistrictItem, WardItem } from '../../../services/locationService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const labelOptions = [
  { value: 'home', label: 'Nhà' },
  { value: 'work', label: 'Văn phòng' },
  { value: 'other', label: 'Khác' },
];

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState<AddressResponse | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm] = Form.useForm();

  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadAddresses();
    loadProvinces();
    loadSessions();
  }, []);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const result = await authService.getAddresses();
      setAddresses(result);
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const result = await locationService.getProvinces();
      setProvinces(result);
    } catch {
      // 
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async (provinceCode: number) => {
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);
    try {
      const result = await locationService.getDistricts(provinceCode);
      setDistricts(result);
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWards = async (districtCode: number) => {
    setLoadingWards(true);
    setWards([]);
    try {
      const result = await locationService.getWards(districtCode);
      setWards(result);
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const result = await authService.getSessions();
      setSessions(result);
    } catch (err: any) {
      console.warn('Failed to load sessions:', err?.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleProfileUpdate = async (values: { fullName: string; phone: string }) => {
    setLoadingProfile(true);
    try {
      const updated = await authService.updateProfile(values);
      dispatch(updateProfile({ fullName: updated.fullName, phone: updated.phone }));
      message.success('Cập nhật thành công!');
      setEditingProfile(false);
    } catch (err: any) {
      message.error(err?.message || 'Cập nhật thất bại');
    } finally {
      setLoadingProfile(false);
    }
  };

  const openAddressModal = (addr?: AddressResponse) => {
    setEditAddress(addr || null);
    setDistricts([]);
    setWards([]);

    if (addr) {
      addressForm.setFieldsValue({
        label: addr.label || 'home',
        recipientName: addr.recipientName,
        recipientPhone: addr.recipientPhone,
        addressLine: addr.addressLine,
        ward: addr.ward,
        deliveryNote: addr.deliveryNote,
        isDefault: addr.isDefault,
      });
    } else {
      addressForm.resetFields();
      addressForm.setFieldsValue({ label: 'home', isDefault: false });
    }
    setAddressModal(true);
  };

  const handleSaveAddress = async (values: any) => {
    setSavingAddress(true);
    try {
      const selectedProvince = provinces.find(p => p.code === values.provinceCode);
      const selectedDistrict = districts.find(d => d.code === values.districtCode);
      const selectedWard = wards.find(w => w.code === values.wardCode);

      const request: AddressRequest = {
        label: values.label,
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        addressLine: values.addressLine,
        ward: selectedWard?.name || values.ward || '',
        cityId: selectedProvince?.code?.toString() || '',
        districtId: selectedDistrict?.code?.toString() || '',
        deliveryNote: values.deliveryNote,
        isDefault: values.isDefault || false,
      };

      if (editAddress) {
        await authService.updateAddress(editAddress.id, request);
        message.success('Đã cập nhật địa chỉ');
      } else {
        await authService.createAddress(request);
        message.success('Đã thêm địa chỉ mới');
      }

      setAddressModal(false);
      addressForm.resetFields();
      await loadAddresses();
    } catch (err: any) {
      message.error(err?.message || 'Lưu địa chỉ thất bại');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    Modal.confirm({
      title: 'Xoá địa chỉ',
      content: 'Bạn có chắc muốn xoá địa chỉ này?',
      okText: 'Xoá',
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await authService.deleteAddress(id);
          message.success('Đã xoá địa chỉ');
          await loadAddresses();
        } catch (err: any) {
          message.error(err?.message || 'Xoá thất bại');
        }
      },
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      await authService.setDefaultAddress(id);
      message.success('Đã đặt làm mặc định');
      await loadAddresses();
    } catch (err: any) {
      message.error(err?.message || 'Thao tác thất bại');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    Modal.confirm({
      title: 'Đăng xuất phiên',
      content: 'Bạn có chắc muốn đăng xuất khỏi phiên này?',
      okText: 'Đăng xuất',
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await authService.deleteSession(sessionId);
          message.success('Đã xoá phiên đăng nhập');
          await loadSessions();
        } catch (err: any) {
          message.error(err?.message || 'Xoá phiên thất bại');
        }
      },
    });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }} className="animate-fade-in">
      <Title level={4}>Hồ sơ cá nhân</Title>
      <Tabs items={[
        {
          key: 'profile', label: 'Thông tin',
          children: (
            <Card style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Avatar src={user?.avatar} size={72}>{user?.fullName?.[0]}</Avatar>
                <div>
                  <Title level={5} style={{ margin: 0 }}>{user?.fullName}</Title>
                  <Text type="secondary">{user?.email}</Text>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {user?.emailVerified ? <Tag color="green" icon={<Shield size={10} />}>Email đã xác thực</Tag> : <Tag color="red" icon={<Shield size={10} />}>Email chưa xác thực</Tag>}
                    {user?.phoneVerified ? <Tag color="green" icon={<Shield size={10} />}>SĐT đã xác thực</Tag> : <Tag color="red" icon={<Shield size={10} />}>SĐT chưa xác thực</Tag>}
                  </div>
                </div>
                <Button style={{ marginLeft: 'auto' }} icon={<Edit2 size={14} />} onClick={() => setEditingProfile(!editingProfile)}>Sửa</Button>
              </div>
              {editingProfile && (
                <Form layout="vertical" initialValues={{ fullName: user?.fullName, phone: user?.phone }} onFinish={handleProfileUpdate}>
                  <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                    <Input prefix={<User size={14} />} />
                  </Form.Item>
                  <Form.Item name="phone" label="Số điện thoại" rules={[
                    { required: true, message: 'Vui lòng nhập SĐT' },
                    { pattern: /^0[0-9]{9}$/, message: 'SĐT phải có 10 chữ số, bắt đầu bằng 0' }
                  ]}>
                    <Input prefix={<Phone size={14} />} placeholder="0901234567" maxLength={10} />
                  </Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loadingProfile}>Lưu thay đổi</Button>
                    <Button onClick={() => setEditingProfile(false)}>Huỷ</Button>
                  </Space>
                </Form>
              )}
            </Card>
          ),
        },

        {
          key: 'addresses', label: `Địa chỉ (${addresses.length})`,
          children: (
            <div>
              <Button icon={<Plus size={14} />} type="dashed" block style={{ marginBottom: 16, borderRadius: 10, height: 44 }} onClick={() => openAddressModal()}>
                Thêm địa chỉ mới
              </Button>
              {loadingAddresses ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="Đang tải..." /></div>
              ) : addresses.length === 0 ? (
                <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có địa chỉ. Thêm địa chỉ giao hàng để đặt món nhanh hơn." />
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {addresses.map(addr => (
                    <Card key={addr.id} style={{ borderRadius: 12, borderColor: addr.isDefault ? 'var(--primary)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <Space>
                            <MapPin size={14} color="var(--primary)" />
                            <Text strong>
                              {addr.label === 'home' ? 'Nhà' : addr.label === 'work' ? 'Văn phòng' : `${addr.label}`}
                            </Text>
                            {addr.isDefault && <Tag color="green" style={{ fontSize: 10 }}>Mặc định</Tag>}
                          </Space>
                          <Text style={{ display: 'block', marginTop: 4 }}>{addr.addressLine}</Text>
                          {addr.ward && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                              {addr.ward}
                            </Text>
                          )}
                          {(addr.recipientName || addr.recipientPhone) && (
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                              👤 {addr.recipientName} {addr.recipientPhone && `• ${addr.recipientPhone}`}
                            </Text>
                          )}
                          {addr.deliveryNote && <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>📝 {addr.deliveryNote}</Text>}
                        </div>
                        <Space direction="vertical" size={4}>
                          <Button size="small" icon={<Edit2 size={12} />} onClick={() => openAddressModal(addr)} title="Sửa" />
                          <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => handleDeleteAddress(addr.id)} title="Xoá" />
                          <Button 
                            size="small" 
                            icon={<Star size={12} fill={addr.isDefault ? "#faad14" : "none"} color={addr.isDefault ? "#faad14" : "currentColor"} />} 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!addr.isDefault) handleSetDefault(addr.id);
                            }} 
                            title={addr.isDefault ? "Địa chỉ mặc định" : "Đặt làm địa chỉ mặc định"}
                          />
                        </Space>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ),
        },

        {
          key: 'sessions', label: `Phiên đăng nhập (${sessions.length})`,
          children: (
            <div>
              {loadingSessions ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="Đang tải..." /></div>
              ) : sessions.length === 0 ? (
                <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phiên đăng nhập nào." />
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sessions.map(session => (
                    <Card key={session.id} style={{ borderRadius: 12, borderColor: session.current ? 'var(--primary)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <Monitor size={20} color="var(--text-secondary)" />
                          <div>
                            <div>
                              <Text strong>Phiên đăng nhập</Text>
                              {session.current && <Tag color="green" style={{ marginLeft: 8 }}>Thiết bị hiện tại</Tag>}
                            </div>
                            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                              <Globe size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                              IP: {session.ipAddress || '—'}
                            </Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>
                              Tạo: {formatDate(session.createdAt)}
                            </Text>
                          </div>
                        </div>
                        {!session.current && (
                          <Button size="small" danger icon={<LogOut size={12} />} onClick={() => handleDeleteSession(session.id)}>
                            Đăng xuất
                          </Button>
                        )}
                        {session.current && (
                          <Button size="small" danger icon={<LogOut size={12} />} onClick={() => {
                            Modal.confirm({
                              title: 'Đăng xuất thiết bị hiện tại',
                              content: 'Bạn sẽ bị đăng xuất khỏi web. Tiếp tục?',
                              okText: 'Đăng xuất',
                              cancelText: 'Huỷ',
                              okButtonProps: { danger: true },
                              onOk: async () => {
                                try {
                                  await authService.logout();
                                  
                                  dispatch({ type: 'auth/logout' });
                                  
                                  localStorage.removeItem('persist:foodara');
                                  
                                  message.success('Đã đăng xuất');
                                  
                                  setTimeout(() => {
                                    window.location.href = '/customer/login';
                                  }, 500);
                                } catch (err: any) {
                                  dispatch({ type: 'auth/logout' });
                                  localStorage.removeItem('persist:foodara');
                                  window.location.href = '/customer/login';
                                }
                              },
                            });
                          }}>
                            Đăng xuất
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ),
        },
      ]} />

      <Modal
        title={editAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
        open={addressModal}
        onCancel={() => { setAddressModal(false); addressForm.resetFields(); }}
        footer={null}
        width={540}
        destroyOnHidden
      >
        <Form form={addressForm} layout="vertical" onFinish={handleSaveAddress} style={{ marginTop: 16 }}>
          <Form.Item name="label" label="Loại địa chỉ" rules={[{ required: true, message: 'Chọn loại địa chỉ' }]}>
            <Select options={labelOptions} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="recipientName" label="Tên người nhận">
              <Input prefix={<User size={14} />} placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item name="recipientPhone" label="SĐT người nhận" rules={[
              { pattern: /^0[0-9]{9}$/, message: 'SĐT phải có 10 chữ số' }
            ]}>
              <Input prefix={<Phone size={14} />} placeholder="0901234567" maxLength={10} />
            </Form.Item>
          </div>

          <Form.Item name="addressLine" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
            <Input prefix={<MapPin size={14} />} placeholder="Số nhà, tên đường" />
          </Form.Item>

          <Form.Item name="provinceCode" label="Tỉnh / Thành phố">
            <Select
              showSearch
              placeholder="Chọn tỉnh/thành phố"
              loading={loadingProvinces}
              options={provinces.map(p => ({ value: p.code, label: p.name }))}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(val) => {
                addressForm.setFieldsValue({ districtCode: undefined, wardCode: undefined });
                setDistricts([]);
                setWards([]);
                if (val) loadDistricts(val);
              }}
              allowClear
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="districtCode" label="Quận / Huyện">
              <Select
                showSearch
                placeholder="Chọn quận/huyện"
                loading={loadingDistricts}
                options={districts.map(d => ({ value: d.code, label: d.name }))}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={(val) => {
                  addressForm.setFieldValue('wardCode', undefined);
                  setWards([]);
                  if (val) loadWards(val);
                }}
                allowClear
                disabled={districts.length === 0}
              />
            </Form.Item>
            <Form.Item name="wardCode" label="Phường / Xã">
              <Select
                showSearch
                placeholder="Chọn phường/xã"
                loading={loadingWards}
                options={wards.map(w => ({ value: w.code, label: w.name }))}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                allowClear
                disabled={wards.length === 0}
              />
            </Form.Item>
          </div>

          <Form.Item name="deliveryNote" label="Ghi chú giao hàng">
            <TextArea rows={2} placeholder="Tầng 3, phòng 302, gọi trước khi giao..." />
          </Form.Item>

          <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" />
              ⭐ Đặt làm địa chỉ mặc định
            </label>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => { setAddressModal(false); addressForm.resetFields(); }}>Huỷ</Button>
            <Button type="primary" htmlType="submit" loading={savingAddress}>
              {editAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
