import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Typography, Space, Modal, Form, Input, InputNumber, Select, message, DatePicker } from 'antd';
import { Plus, Edit2, Trash2, Megaphone } from 'lucide-react';
import dayjs from 'dayjs';
import { formatVND } from '../../../utils/format';
import { merchantPromotionApi, merchantService } from '../../../services/merchantService';
import type { CampaignJoinRequest, CampaignJoinResponse, CampaignResponse, Voucher } from '../../../types/promotion';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PromotionPage: React.FC = () => {
  const [promos, setPromos] = useState<Voucher[]>([]);
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [campaignModal, setCampaignModal] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [campaignsJoined, setCampaignsJoined] = useState<CampaignJoinResponse[]>([]);

  const columns = [
    { 
      title: 'Voucher', 
      key: 'info', 
      render: (r: Voucher) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Mã: {r.code}</Text>
        </Space>
      ) 
    },
    { 
      title: 'Loại', 
      dataIndex: 'discountType', 
      key: 'discountType', 
      render: (type: string) => (
        <Tag color={type === 'percentage' ? 'blue' : 'green'}>
          {type === 'percentage' ? 'Phần trăm' : 'Cố định'}
        </Tag>
      ) 
    },
    { 
      title: 'Giá trị', 
      key: 'value', 
      render: (r: Voucher) => r.discountType === 'percentage' ? `${r.discountValue}%` : formatVND(Number(r.discountValue)) 
    },
    { 
      title: 'Sử dụng', 
      key: 'usage', 
      render: (r: Voucher) => <Tag>{r.usedCount || 0} / {r.totalQuantity}</Tag> 
    },
    { 
      title: 'Hiệu lực', 
      key: 'dates', 
      render: (r: Voucher) => (
        <div style={{ fontSize: 12 }}>
          {dayjs(r.startsAt).format('DD/MM/YYYY')} <br/> 
          → {dayjs(r.expiresAt).format('DD/MM/YYYY')}
        </div>
      ) 
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      render: (s: boolean) => <Tag color={s ? 'green' : 'default'}>{s ? 'Đang chạy' : 'Tắt'}</Tag> 
    },
    { 
      title: '', 
      key: 'actions', 
      width: 100, 
      render: (record: Voucher) => (
        <Space>
          <Button size="small" icon={<Edit2 size={12} />} onClick={() => handleOpenEditModal(record)} />
          <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => handleDeleteVoucher(record.id)} />
        </Space>
      ) 
    },
  ];

  const handleJoinCampaign = async () => {
  setLoading(true); // Nên là true khi bắt đầu call
  try {
    const store = await merchantService.getStores();
    if (!store || store.length === 0) throw new Error("Không tìm thấy thông tin cửa hàng");

    const request: CampaignJoinRequest = {
      campaignId,
      storeId: store[0].id
    };
    await merchantPromotionApi.joinCampaign(request);
    message.success('Bạn đã tham gia chiến dịch thành công');
    setCampaignModal(false);
    
    // Quan trọng: Tải lại dữ liệu để cập nhật danh sách campaignsJoined
    await loadData(); 
  } catch (error: any) {
    message.error(error.message || "Tham gia không thành công");
  } finally {
    setLoading(false);
  }
};

  const loadData = async () => {
    try {
      const data = await merchantPromotionApi.getVouchers();
      setPromos(data);

      const campaigns = await merchantPromotionApi.getAvailableCampaigns();
      setCampaigns(campaigns)
      
      console.log(campaigns);

      const campaignsJoined = await merchantPromotionApi.getJoinedCampaigns();
      setCampaignsJoined(campaignsJoined)
      console.log(campaignsJoined);
      
    } catch (error: any) {
      message.error(error.message ||"Không thể tải danh sách khuyến mãi");
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. Xử lý mở Modal Sửa
  const handleOpenEditModal = (record: Voucher) => {
    setIsEdit(true);
    setModal(true);
    form.setFieldsValue({
      ...record,
      // DatePicker yêu cầu kiểu dữ liệu dayjs
      dateRange: [dayjs(record.startsAt), dayjs(record.expiresAt)]
    });
  };

  // 3. Xử lý Add/Update
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const store = await merchantService.getStores();
      const payload = {
        ...values, storeId: store[0]?.id,
        startsAt: values.dateRange[0].toISOString(),
        expiresAt: values.dateRange[1].toISOString(),
      };
      console.log(payload);
      
      if (isEdit) {
        const updated = await merchantPromotionApi.updateVoucher(values.id, payload);
        setPromos(promos.map(p => p.id === values.id ? updated : p));
        message.success('Cập nhật thành công');
      } else {
        const newItem = await merchantPromotionApi.createVoucher(payload);
        setPromos([...promos, newItem]);
        message.success('Tạo mới thành công');
      }
      setModal(false);
    } catch (error: any) {
      message.error(error.message || "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = (id: string) => {
    try {
      Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa voucher này?',
      onOk: async () => {
        await merchantPromotionApi.deleteVoucher(id).then(() => 
        {
          setPromos(promos.filter(p => p.id !== id));
          message.success('Đã xóa');

        }
        );
      }
    });
    } catch (error: any) {
      message.error(error.message || "Xóa không thành công");
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Title level={4} style={{ margin: 0 }}>Quản lý Khuyến mãi</Title>
        <Button 
          type="primary" 
          icon={<Plus size={14} />} 
          onClick={() => { setModal(true); setIsEdit(false); form.resetFields(); }}
        >
          Tạo khuyến mãi
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
        <Table columns={columns} dataSource={promos} rowKey="id" pagination={{ pageSize: 5 }} size="middle" />
      </Card>

      {/* Campaign Nền tảng (Giữ nguyên style) */}
        <Card 
  title={<Space><Megaphone size={16} color="#fa8c16" /><span>Chiến dịch từ hệ thống</span></Space>} 
  style={{ borderRadius: 12 }}
>
  {campaigns.filter(c => c.isActive).map(camp => {
    // Kiểm tra xem camp này đã được join chưa
    const isJoined = campaignsJoined.some(joined => joined.campaignId === camp.id);

    return (
      <div key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img 
            src={camp.bannerUrl} 
            alt={camp.name} 
            style={{ width: "200px", height: "100px", objectFit: "cover", borderRadius: "10px" }}
          />
          <div>
            <Text strong style={{ fontSize: 16 }}>{camp.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 14 }}>{camp.description}</Text>
          </div>
        </div>

        {isJoined ? (
          <Tag color="success" style={{ padding: '4px 12px', borderRadius: 20 }}>
            Đã tham gia
          </Tag>
        ) : (
          <Button 
            type="primary" 
            onClick={() => { setCampaignModal(true); setCampaignId(camp.id); }}
          >
            Tham gia ngay
          </Button>
        )}
      </div>
    );
  })}
</Card>
      

      {/* MODAL ĐỒNG BỘ VỚI ENTITY */}

      <Modal 
        title={isEdit ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"} 
        open={modal} 
        onCancel={() => setModal(false)} 
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="title" label="Tiêu đề hiển thị" rules={[{ required: true }]} style={{ flex: 1, width: 330 }}>
              <Input placeholder="Ví dụ: Giảm 20k cho đơn từ 100k" />
            </Form.Item>
            <Form.Item name="code" label="Mã Voucher" rules={[{ required: true }]}>
              <Input placeholder="VDU: KM20K" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="discountType" label="Loại giảm giá" initialValue="percentage" style={{ width: 150 }}>
              <Select options={[{ label: 'Phần trăm (%)', value: 'percentage' }, { label: 'Số tiền cố định', value: 'fixed' }]} />
            </Form.Item>
            <Form.Item name="discountValue" label="Giá trị giảm" rules={[{ required: true }]}>
              <InputNumber style={{ width: 180 }} min={0} placeholder="Nhập số tiền hoặc %" />
            </Form.Item>
            <Form.Item name="totalQuantity" label="Tổng số lượng" rules={[{ required: true }]}>
              <InputNumber style={{ width: 170 }} min={1} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="minOrderValue" label="Đơn tối thiểu" initialValue={0}>
              <InputNumber style={{ width: 265 }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="maxDiscountValue" label="Giảm tối đa (nếu giảm %)" initialValue={0}>
              <InputNumber style={{ width: 265 }} min={0} />
            </Form.Item>
          </Space>

          <Form.Item name="dateRange" label="Thời gian áp dụng" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea rows={2} placeholder="Nhập điều kiện áp dụng..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        open={campaignModal} 
        onCancel={() => setCampaignModal(false)}
        onOk={() => {handleJoinCampaign()}}
        width={600}
      >
        {campaigns.filter(c => c.id === campaignId).map(camp => (
          <div key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
            <img src={camp.bannerUrl} 
              alt={camp.name} 
              style={{width: "30%", height: "150px", objectFit: "cover", borderRadius: "8px" }}/>
            <div style={{flex: 1, margin: "0 20px"}}>
              <Text strong style={{fontSize: 25}}>{camp.name}</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 20 }}>{camp.description}</Text>
              <Text type="secondary" style={{ fontSize: 20 }}>Áp dụng đến: {dayjs(camp.endsAt).format('DD/MM/YYYY')}</Text>
            </div>
          </div>
        ))}
      </Modal>
    </div>
  );
};

export default PromotionPage;
