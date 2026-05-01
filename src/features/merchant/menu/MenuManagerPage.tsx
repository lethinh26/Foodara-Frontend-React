import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, InputNumber, Switch, Typography, Space, message, Tabs, Select } from 'antd';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { merchantService, merchantMenuApi } from '../../../services/merchantService';
import { formatVND } from '../../../utils/format';
import type { MenuItem, MenuCategory } from '../../../types/menu';

const { Title, Text } = Typography;

const MenuManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [catModal, setCatModal] = useState(false);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const stores = await merchantService.getStores();
        const storeId = stores[0]?.id;
        if (!storeId) {
          setLoading(false);
          return;
        }
        const [cats, itms] = await Promise.all([
          merchantMenuApi.getCategories(storeId),
          merchantMenuApi.getItems(storeId),
        ]);
        setCategories(cats.map((cat: any) => ({
          id: cat.id,
          restaurantId: cat.storeId || storeId,
          name: cat.name,
          description: cat.description || '',
          sortOrder: cat.displayOrder || 0,
          isActive: cat.isActive ?? true,
          itemCount: 0,
        })));
        setItems(itms.map((item: any) => ({
          id: item.id,
          restaurantId: item.storeId || storeId,
          categoryId: item.categoryId || '',
          name: item.name,
          description: item.description || '',
          image: item.imageUrl || '/logo/secondary_logo.png',
          basePrice: Number(item.basePrice || 0),
          originalPrice: Number(item.basePrice || 0),
          pricing: { discountedPrice: Number(item.basePrice || 0), estimatedDiscountAmount: 0 },
          sizes: [],
          toppingGroups: [],
          variants: [],
          comboOptions: [],
          isAvailable: item.isAvailable ?? true,
          isPopular: item.isPopular ?? false,
          isNew: item.isNew ?? false,
          isBestSeller: false,
          maxQuantity: item.maxQuantityPerOrder || 99,
          preparationTime: 15,
          calories: 0,
          tags: [],
          soldCount: item.totalSold || 0,
          rating: Number(item.avgRating || 0),
          reviewCount: item.totalRatings || 0,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        })));
      } catch (error: any) {
        message.error(error?.message || 'Kh?ng t?i ???c th?c ??n merchant');
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const handleToggleItem = (itemId: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i));
    message.success('Đã cập nhật trạng thái');
  };

  const columns = [
    { title: 'Món', dataIndex: 'name', key: 'name', render: (name: string, record: MenuItem) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={record.image} alt={name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
        <div><Text strong>{name}</Text>{record.isBestSeller && <Tag color="orange" style={{ marginLeft: 4 }}>Bán chạy</Tag>}<br /><Text type="secondary" style={{ fontSize: 12 }}>{record.description?.slice(0, 50)}...</Text></div>
      </div>
    )},
    { title: 'Giá', dataIndex: 'basePrice', key: 'price', render: (p: number) => <Text strong>{formatVND(p)}</Text>, width: 120 },
    { title: 'Đã bán', dataIndex: 'soldCount', key: 'sold', width: 80 },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (r: number) => <Text>{r} ⭐</Text>, width: 80 },
    { title: 'Trạng thái', key: 'status', width: 100, render: (_: unknown, record: MenuItem) => (
      <Switch checked={record.isAvailable} onChange={() => handleToggleItem(record.id)} checkedChildren="Mở" unCheckedChildren="Tắt" />
    )},
    { title: '', key: 'actions', width: 100, render: (_: unknown, record: MenuItem) => (
      <Space>
        <Button size="small" icon={<Edit2 size={12} />} onClick={() => { setEditingItem(record); setItemModal(true); }} />
        <Button size="small" danger icon={<Trash2 size={12} />} />
      </Space>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Quản lý thực đơn</Title>
        <Space>
          <Button icon={<Plus size={14} />} onClick={() => setCatModal(true)}>Thêm danh mục</Button>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditingItem(null); setItemModal(true); }}>Thêm món</Button>
        </Space>
      </div>

      <Tabs items={[
        { key: 'all', label: `Tất cả (${items.length})` },
        ...categories.map(cat => ({
          key: cat.id,
          label: `${cat.name} (${items.filter(i => i.categoryId === cat.id).length})`,
        })),
      ]} onChange={_key => {
        // Filter handled in render
      }} />

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={items} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
      </Card>

      {/* Item Modal */}
      <Modal title={editingItem ? 'Sửa món' : 'Thêm món mới'} open={itemModal} onCancel={() => setItemModal(false)} footer={null} width={600}>
        <Form layout="vertical" initialValues={editingItem || {}} onFinish={_values => { message.success('Đã lưu!'); setItemModal(false); }}>
          <Form.Item name="name" label="Tên món" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="basePrice" label="Giá" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" /></Form.Item>
            <Form.Item name="preparationTime" label="Thời gian chuẩn bị" style={{ flex: 1 }}><InputNumber style={{ width: '100%' }} addonAfter="phút" /></Form.Item>
          </div>
          <Form.Item name="categoryId" label="Danh mục"><Select options={categories.map(c => ({ label: c.name, value: c.id }))} /></Form.Item>
          <Form.Item name="isAvailable" label="Còn hàng" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" htmlType="submit" block>Lưu</Button>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal title="Thêm danh mục" open={catModal} onCancel={() => setCatModal(false)} onOk={() => { setCatModal(false); message.success('Đã thêm danh mục'); }}>
        <Form layout="vertical">
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagerPage;
