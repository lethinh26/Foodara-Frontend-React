import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Switch, Typography, Space, message, Tabs, Select } from 'antd';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { merchantService, merchantMenuApi } from '../../../services/merchantService';
import { formatVND } from '../../../utils/format';
import type { MenuItem, MenuCategory } from '../../../types/menu';
import type { StoreResponse } from '../../../types/merchant';

const { Title, Text } = Typography;

const MenuManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Modals state
  const [itemModal, setItemModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();

  // 1. Hàm load dữ liệu dùng chung
  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const storesData = await merchantService.getStores();
      setStores(storesData);
      
      if (!storesData || storesData.length === 0) return;

      const storeDataPromises = storesData.map(async (store) => {
        const [cats, itms] = await Promise.all([
          merchantMenuApi.getCategories(store.id),
          merchantMenuApi.getItems(store.id),
        ]);
        return { storeId: store.id, cats, itms };
      });

      const allStoresResults = await Promise.all(storeDataPromises);

      const allCategories = allStoresResults.flatMap(({ storeId, cats }) => 
        cats.map((cat: any) => ({
          id: cat.id,
          restaurantId: storeId,
          name: cat.name,
          description: cat.description || '',
          sortOrder: cat.displayOrder || 0,
          isActive: cat.isActive ?? true,
        }))
      );

      const allItems = allStoresResults.flatMap(({ storeId, itms }) => 
        itms.map((item: any) => ({
          ...item,
          restaurantId: storeId,
          basePrice: Number(item.basePrice || 0),
          image: item.imageUrl || '/logo/secondary_logo.png',
        }))
      );

      setCategories(allCategories as MenuCategory[]);
      setItems(allItems);
    } catch (error: any) {
      message.error('Không thể tải thực đơn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    try {
      await merchantMenuApi.updateAvailability(itemId, checked);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: checked } : i));
      message.success('Đã cập nhật trạng thái');
    } catch (error) {
      message.error('Cập nhật thất bại');
    }
  };

  const handleSaveItem = async (values: any) => {
    try {
      const { storeId, ...itemData } = values;
      if (editingItem) {
        await merchantMenuApi.updateItem(editingItem.id, { ...itemData, storeId });
        message.success('Cập nhật món ăn thành công');
      } else {
        await merchantMenuApi.createItem(storeId, itemData);
        message.success('Thêm món ăn thành công');
      }
      setItemModal(false);
      loadMenu(); // Refresh data
    } catch (error: any) {
      message.error(error?.message || 'Lỗi xử lý món ăn');
    }
  };

  const handleAddCategory = async (values: any) => {
    try {
      const { storeId, ...categoryData } = values;
      await merchantMenuApi.createCategory(storeId, categoryData);
      message.success('Đã thêm danh mục thành công');
      setCatModal(false);
      form.resetFields();
      loadMenu();
    } catch (error: any) {
      message.error('Lỗi khi tạo danh mục');
    }
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(i => i.categoryId === activeTab);

  const columns = [
    { 
      title: 'Món', 
      dataIndex: 'name', 
      key: 'name', 
      render: (name: string, record: MenuItem) => (
        <Space size={12}>
          <img src={record.image} alt={name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {categories.find(c => c.id === record.categoryId)?.name}
            </Text>
          </div>
        </Space>
      )
    },
    { title: 'Giá', dataIndex: 'basePrice', key: 'price', render: (p: number) => <Text strong>{formatVND(p)}</Text> },
    { title: 'Trạng thái', key: 'status', width: 100, render: (_: any, record: MenuItem) => (
      <Switch checked={record.isAvailable} onChange={(checked) => handleToggleItem(record.id, checked)} size="small" />
    )},
    { title: 'Thao tác', key: 'actions', width: 100, render: (_: any, record: MenuItem) => (
      <Space>
        <Button size="small" icon={<Edit2 size={12} />} onClick={() => {
          setEditingItem(record);
          itemForm.setFieldsValue({
            ...record,
            storeId: record.restaurantId
          });
          setItemModal(true);
        }} />
        <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => handleDeleteItem(record)} />
      </Space>
    )},
  ];

  const handleDeleteItem = (item: MenuItem) => {
  Modal.confirm({
    title: 'Xác nhận xóa',
    content: `Bạn có chắc chắn muốn xóa món "${item.name}" không? Hành động này không thể hoàn tác.`,
    okText: 'Xóa',
    okType: 'danger',
    cancelText: 'Hủy',
    onOk: async () => {
      try {
        setLoading(true);
        // Gọi API xóa
        await merchantMenuApi.deleteItem(item.id);
        
        message.success('Đã xóa món ăn thành công');
        
        // Cập nhật lại danh sách hiển thị
        // Cách 1: Gọi lại loadMenu để đồng bộ chuẩn nhất từ server
        await loadMenu();
        
        // Cách 2 (Tối ưu UI): Lọc trực tiếp món vừa xóa ra khỏi state items
        // setItems(prev => prev.filter(i => i.id !== item.id));
        
      } catch (error: any) {
        message.error(error?.message || 'Lỗi khi xóa món ăn');
      } finally {
        setLoading(false);
      }
    },
  });
};

  // Watch storeId để lọc category trong Item Form
  const selectedStoreInForm = Form.useWatch('storeId', itemForm);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Quản lý thực đơn</Title>
        <Space>
          <Button icon={<Plus size={14} />} onClick={() => setCatModal(true)}>Thêm danh mục</Button>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => {
            setEditingItem(null);
            itemForm.resetFields();
            if(stores.length > 0) itemForm.setFieldValue('storeId', stores[0].id);
            setItemModal(true);
          }}>Thêm món</Button>
        </Space>
      </div>

      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: `Tất cả (${items.length})` },
          ...categories.map(cat => ({
            key: cat.id,
            label: `${cat.name} (${items.filter(i => i.categoryId === cat.id).length})`,
          })),
        ]} 
      />

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={filteredItems} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Modal Item */}
      <Modal 
        title={editingItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'} 
        open={itemModal} 
        onCancel={() => setItemModal(false)}
        onOk={() => itemForm.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical" onFinish={handleSaveItem}>
          <Form.Item name="storeId" label="Cửa hàng" rules={[{ required: true }]}>
            <Select 
              options={stores.map(s => ({ label: s.name, value: s.id }))} 
              disabled={!!editingItem} // Không cho đổi store khi đang sửa
            />
          </Form.Item>

          <Form.Item name="name" label="Tên món" rules={[{ required: true }]}><Input /></Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select 
                placeholder="Chọn danh mục"
                options={categories
                  .filter(c => c.restaurantId === selectedStoreInForm)
                  .map(c => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item name="basePrice" label="Giá bán" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
             <Form.Item name="imageUrl" label="Link ảnh món ăn" style={{ flex: 1 }}><Input placeholder="https://..." /></Form.Item>
             <Form.Item name="isAvailable" label="Trạng thái" valuePropName="checked" initialValue={true}><Switch checkedChildren="Mở" unCheckedChildren="Tắt" /></Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Modal Category (Đã giữ nguyên logic bạn yêu cầu trước đó) */}
      <Modal title="Thêm danh mục" open={catModal} onCancel={() => setCatModal(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAddCategory} initialValues={{ storeId: stores[0]?.id }}>
          <Form.Item name="storeId" label="Chọn cửa hàng" rules={[{ required: true }]}>
            <Select options={stores.map(s => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagerPage;
