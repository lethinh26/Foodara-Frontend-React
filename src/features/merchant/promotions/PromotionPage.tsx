import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  DatePicker,
  Skeleton,
} from 'antd';
import { Plus, Edit2, Trash2, Megaphone } from 'lucide-react';
import dayjs from 'dayjs';
import { formatVND } from '../../../utils/format';
import {
  merchantPromotionApi,
  merchantService,
} from '../../../services/merchantService';
import type {
  CampaignJoinResponse,
  CampaignResponse,
  Voucher,
} from '../../../types/promotion';
import type { MerchantVoucherRequest, StoreResponse } from '../../../types/merchant';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface VoucherFormValues {
  id?: string;
  storeId: string;
  code: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'free_ship';
  discountValue: number;
  totalQuantity: number;
  minOrderValue: number;
  maxDiscountValue: number;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
}

const PromotionPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [joined, setJoined] = useState<CampaignJoinResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // voucher modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<VoucherFormValues>();

  // campaign join modal
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [voucherList, storeList, campaignList, joinedList] = await Promise.all([
        merchantPromotionApi.getVouchers(),
        merchantService.getStores(),
        merchantPromotionApi.getAvailableCampaigns(),
        merchantPromotionApi.getJoinedCampaigns(),
      ]);
      setVouchers(voucherList);
      setStores(storeList);
      setCampaigns(campaignList);
      setJoined(joinedList);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể tải dữ liệu';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setIsEdit(false);
    form.resetFields();
    if (stores.length > 0) {
      form.setFieldValue('storeId', stores[0].id);
    }
    setModalOpen(true);
  };

  const openEdit = (record: Voucher) => {
    setIsEdit(true);
    form.setFieldsValue({
      id: record.id,
      storeId: record.storeId ?? '',
      code: record.code,
      title: record.title,
      description: record.description,
      discountType: (record.discountType as VoucherFormValues['discountType']) ?? 'percentage',
      discountValue: Number(record.discountValue ?? 0),
      totalQuantity: Number(record.totalQuantity ?? 0),
      minOrderValue: Number(record.minOrderValue ?? 0),
      maxDiscountValue: Number(record.maxDiscount ?? 0),
      dateRange: [
        dayjs(record.startsAt ?? record.startDate),
        dayjs(record.expiresAt ?? record.endDate),
      ],
    });
    setModalOpen(true);
  };

  const submitVoucher = async (values: VoucherFormValues) => {
    setSubmitting(true);
    try {
      const payload: MerchantVoucherRequest = {
        code: values.code.trim().toUpperCase(),
        title: values.title,
        description: values.description,
        discountType: values.discountType,
        discountValue: values.discountValue,
        totalQuantity: values.totalQuantity,
        minOrderValue: values.minOrderValue,
        maxDiscountValue: values.maxDiscountValue,
        startsAt: values.dateRange[0].toISOString(),
        expiresAt: values.dateRange[1].toISOString(),
        isActive: true,
      };

      if (isEdit && values.id) {
        const updated = await merchantPromotionApi.updateVoucher(values.id, payload);
        setVouchers((prev) => prev.map((v) => (v.id === values.id ? updated : v)));
        message.success('Cập nhật khuyến mãi thành công');
      } else {
        const created = await merchantPromotionApi.createVoucher({
          ...payload,
          storeId: values.storeId,
        });
        setVouchers((prev) => [created, ...prev]);
        message.success('Tạo khuyến mãi thành công');
      }
      setModalOpen(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Thao tác thất bại';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa voucher này?',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await merchantPromotionApi.deleteVoucher(id);
          setVouchers((prev) => prev.filter((v) => v.id !== id));
          message.success('Đã xóa');
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Xóa không thành công';
          message.error(msg);
        }
      },
    });
  };

  const openJoinModal = (campaignId: string) => {
    setPendingCampaignId(campaignId);
    setPendingStoreId(stores[0]?.id ?? null);
    setCampaignModalOpen(true);
  };

  const submitJoin = async () => {
    if (!pendingCampaignId || !pendingStoreId) {
      message.error('Vui lòng chọn cửa hàng để tham gia');
      return;
    }
    try {
      await merchantPromotionApi.joinCampaign({
        campaignId: pendingCampaignId,
        storeId: pendingStoreId,
      });
      message.success('Đã tham gia chiến dịch');
      setCampaignModalOpen(false);
      await loadData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Tham gia không thành công';
      message.error(msg);
    }
  };

  const columns = [
    {
      title: 'Voucher',
      key: 'info',
      render: (_: unknown, r: Voucher) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Mã: {r.code}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (type: string) => (
        <Tag color={type === 'percentage' ? 'blue' : type === 'free_ship' ? 'purple' : 'green'}>
          {type === 'percentage' ? 'Phần trăm' : type === 'free_ship' ? 'Miễn ship' : 'Cố định'}
        </Tag>
      ),
    },
    {
      title: 'Giá trị',
      key: 'value',
      render: (_: unknown, r: Voucher) =>
        r.discountType === 'percentage'
          ? `${r.discountValue}%`
          : formatVND(Number(r.discountValue)),
    },
    {
      title: 'Sử dụng',
      key: 'usage',
      render: (_: unknown, r: Voucher) => (
        <Tag>
          {r.usedQuantity ?? r.usedCount ?? 0} / {r.totalQuantity ?? r.usageLimit ?? 0}
        </Tag>
      ),
    },
    {
      title: 'Hiệu lực',
      key: 'dates',
      render: (_: unknown, r: Voucher) => (
        <div style={{ fontSize: 12 }}>
          {dayjs(r.startsAt ?? r.startDate).format('DD/MM/YYYY')}
          <br />→ {dayjs(r.expiresAt ?? r.endDate).format('DD/MM/YYYY')}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Đang chạy' : 'Tắt'}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Voucher) => (
        <Space>
          <Button size="small" icon={<Edit2 size={12} />} onClick={() => openEdit(record)} />
          <Button
            size="small"
            danger
            icon={<Trash2 size={12} />}
            onClick={() => confirmDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  if (loading) return <Skeleton active />;

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Quản lý khuyến mãi
        </Title>
        <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>
          Tạo khuyến mãi
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 24 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={vouchers}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>

      <Card
        title={
          <Space>
            <Megaphone size={16} color="#fa8c16" />
            <span>Chiến dịch từ hệ thống</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        {campaigns.filter((c) => c.isActive).length === 0 ? (
          <Text type="secondary">Hiện không có chiến dịch nào đang chạy</Text>
        ) : (
          campaigns
            .filter((c) => c.isActive)
            .map((campaign) => {
              const isJoined = joined.some((j) => j.campaignId === campaign.id);
              return (
                <div
                  key={campaign.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {campaign.bannerUrl && (
                      <img
                        src={campaign.bannerUrl}
                        alt={campaign.name}
                        style={{
                          width: 200,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 10,
                        }}
                      />
                    )}
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {campaign.name}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        {campaign.description}
                      </Text>
                    </div>
                  </div>
                  {isJoined ? (
                    <Tag color="success" style={{ padding: '4px 12px', borderRadius: 20 }}>
                      Đã tham gia
                    </Tag>
                  ) : (
                    <Button type="primary" onClick={() => openJoinModal(campaign.id)}>
                      Tham gia ngay
                    </Button>
                  )}
                </div>
              );
            })
        )}
      </Card>

      {/* Voucher form modal */}
      <Modal
        title={isEdit ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={600}
        destroyOnClose
      >
        <Form<VoucherFormValues> form={form} layout="vertical" onFinish={submitVoucher}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="storeId" label="Cửa hàng" rules={[{ required: true }]}>
            <Select
              options={stores.map((s) => ({ label: s.name, value: s.id }))}
              disabled={isEdit}
            />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item
              name="title"
              label="Tiêu đề hiển thị"
              rules={[{ required: true }]}
              style={{ flex: 1, width: 330 }}
            >
              <Input placeholder="Ví dụ: Giảm 20k cho đơn từ 100k" />
            </Form.Item>
            <Form.Item name="code" label="Mã voucher" rules={[{ required: true }]}>
              <Input placeholder="VD: KM20K" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item
              name="discountType"
              label="Loại giảm giá"
              initialValue="percentage"
              style={{ width: 150 }}
            >
              <Select
                options={[
                  { label: 'Phần trăm (%)', value: 'percentage' },
                  { label: 'Số tiền cố định', value: 'fixed' },
                  { label: 'Miễn ship', value: 'free_ship' },
                ]}
              />
            </Form.Item>
            <Form.Item name="discountValue" label="Giá trị giảm" rules={[{ required: true }]}>
              <InputNumber style={{ width: 180 }} min={0} />
            </Form.Item>
            <Form.Item name="totalQuantity" label="Tổng số lượng" rules={[{ required: true }]}>
              <InputNumber style={{ width: 170 }} min={1} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="minOrderValue" label="Đơn tối thiểu" initialValue={0}>
              <InputNumber style={{ width: 265 }} min={0} />
            </Form.Item>
            <Form.Item
              name="maxDiscountValue"
              label="Giảm tối đa (cho voucher %)"
              initialValue={0}
            >
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

      {/* Join campaign confirm modal */}
      <Modal
        title="Tham gia chiến dịch"
        open={campaignModalOpen}
        onCancel={() => setCampaignModalOpen(false)}
        onOk={submitJoin}
        okText="Tham gia"
        cancelText="Hủy"
      >
        {(() => {
          const campaign = campaigns.find((c) => c.id === pendingCampaignId);
          if (!campaign) return null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {campaign.bannerUrl && (
                <img
                  src={campaign.bannerUrl}
                  alt={campaign.name}
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <div>
                <Text strong style={{ fontSize: 18 }}>
                  {campaign.name}
                </Text>
                <br />
                <Text type="secondary">{campaign.description}</Text>
                {campaign.endsAt && (
                  <>
                    <br />
                    <Text type="secondary">
                      Áp dụng đến: {dayjs(campaign.endsAt).format('DD/MM/YYYY')}
                    </Text>
                  </>
                )}
              </div>
              {stores.length > 1 && (
                <div>
                  <Text>Chọn cửa hàng tham gia:</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    value={pendingStoreId ?? undefined}
                    onChange={(v) => setPendingStoreId(v)}
                    options={stores.map((s) => ({ label: s.name, value: s.id }))}
                  />
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default PromotionPage;
