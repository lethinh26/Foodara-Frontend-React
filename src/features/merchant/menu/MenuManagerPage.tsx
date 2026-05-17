import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
  Space,
  message,
  Tabs,
  Select,
  Skeleton,
  Segmented,
  InputNumber as Qty,
} from 'antd';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  merchantService,
  merchantMenuApi,
} from '../../../services/merchantService';
import { apiClient } from '../../../services/apiClient';
import { formatVND } from '../../../utils/format';
import type {
  MerchantMenuCategory,
  MerchantMenuItem,
  MerchantCombo,
  MerchantComboRequestBody,
  MerchantOptionGroup,
  StoreResponse,
} from '../../../types/merchant';

const { Title, Text } = Typography;

interface MenuItemFormValues {
  storeId: string;
  categoryId: string;
  name: string;
  basePrice: number;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  trackInventory?: boolean;
  stockQuantity?: number;
  maxQuantityPerOrder?: number;
  dailyLimit?: number;
  optionGroupIds?: string[];
}

interface CategoryFormValues {
  storeId: string;
  name: string;
  description?: string;
}

interface ItemRow extends MerchantMenuItem {
  /** UI-only fallback for table rendering. */
  image: string;
  categoryName?: string;
}

const FALLBACK_IMAGE = '/logo/secondary_logo.png';

const MenuManagerPage: React.FC = () => {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [categories, setCategories] = useState<MerchantMenuCategory[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [combos, setCombos] = useState<MerchantCombo[]>([]);
  /** Option groups grouped by storeId so the form can filter by selected store. */
  const [optionGroupsByStore, setOptionGroupsByStore] = useState<Record<string, MerchantOptionGroup[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [view, setView] = useState<'items' | 'combos' | 'options'>('items');
  const [comboStoreId, setComboStoreId] = useState<string | null>(null);

  const [itemModal, setItemModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [comboModal, setComboModal] = useState(false);
  const [optionGroupModal, setOptionGroupModal] = useState(false);
  const [optionStoreId, setOptionStoreId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MerchantMenuItem | null>(null);
  const [editingCombo, setEditingCombo] = useState<MerchantCombo | null>(null);

  const [itemForm] = Form.useForm<MenuItemFormValues>();
  const [catForm] = Form.useForm<CategoryFormValues>();
  const [comboForm] = Form.useForm();
  const [optionGroupForm] = Form.useForm();

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedStores = await merchantService.getStores();
      setStores(fetchedStores);

      if (fetchedStores.length === 0) {
        setCategories([]);
        setItems([]);
        return;
      }

      const allStoresResults = await Promise.all(
        fetchedStores.map(async (store) => {
          const [cats, itms, optGroups] = await Promise.all([
            merchantMenuApi.getCategories(store.id),
            merchantMenuApi.getItems(store.id),
            merchantMenuApi.listOptionGroups(store.id).catch(() => [] as MerchantOptionGroup[]),
          ]);
          return { store, cats, itms, optGroups };
        }),
      );

      const allCategories: MerchantMenuCategory[] = allStoresResults.flatMap(
        ({ store, cats }) =>
          cats.map((cat) => ({
            ...cat,
            storeId: cat.storeId ?? store.id,
          })),
      );

      const allItems: ItemRow[] = allStoresResults.flatMap(({ store, itms, cats }) =>
        itms.map((item) => {
          const category = cats.find((c) => c.id === item.categoryId);
          return {
            ...item,
            storeId: item.storeId ?? store.id,
            basePrice: Number(item.basePrice ?? 0),
            image: item.imageUrl || FALLBACK_IMAGE,
            categoryName: category?.name,
          };
        }),
      );

      const groupedOptions: Record<string, MerchantOptionGroup[]> = {};
      allStoresResults.forEach(({ store, optGroups }) => {
        groupedOptions[store.id] = optGroups;
      });

      setCategories(allCategories);
      setItems(allItems);
      setOptionGroupsByStore(groupedOptions);

      if (fetchedStores[0]) {
        const firstId = fetchedStores[0].id;
        setComboStoreId((prev) => prev ?? firstId);
        setOptionStoreId((prev) => prev ?? firstId);
        try {
          const list = await merchantMenuApi.listCombos(firstId);
          setCombos(list);
        } catch {
          // silent: combos optional, still render the page
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể tải thực đơn';
      message.error(msg);
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
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isAvailable: checked } : i)),
      );
      message.success('Đã cập nhật trạng thái');
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const handleSaveItem = async (values: MenuItemFormValues) => {
    try {
      const { storeId, ...rest } = values;
      const payload = {
        ...rest,
        storeId,
        basePrice: Number(values.basePrice ?? 0),
      };
      if (editingItem) {
        await merchantMenuApi.updateItem(editingItem.id, payload);
        message.success('Cập nhật món ăn thành công');
      } else {
        await merchantMenuApi.createItem(storeId, payload);
        message.success('Thêm món ăn thành công');
      }
      setItemModal(false);
      await loadMenu();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Lỗi xử lý món ăn';
      message.error(msg);
    }
  };

  const handleAddCategory = async (values: CategoryFormValues) => {
    try {
      const { storeId, ...rest } = values;
      await merchantMenuApi.createCategory(storeId, rest);
      message.success('Đã thêm danh mục');
      setCatModal(false);
      catForm.resetFields();
      await loadMenu();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Lỗi khi tạo danh mục';
      message.error(msg);
    }
  };

  const handleDeleteItem = (item: MerchantMenuItem) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa món "${item.name}" không?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await merchantMenuApi.deleteItem(item.id);
          message.success('Đã xóa món ăn');
          await loadMenu();
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Lỗi khi xóa món ăn';
          message.error(msg);
        }
      },
    });
  };

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter((i) => i.categoryId === activeTab);

  const selectedStoreInForm = Form.useWatch('storeId', itemForm);

  const columns = [
    {
      title: 'Món',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ItemRow) => (
        <Space size={12}>
          <img
            src={record.image}
            alt={name}
            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
          />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.categoryName ?? '—'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'basePrice',
      key: 'price',
      render: (p: number) => <Text strong>{formatVND(p)}</Text>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_: unknown, record: ItemRow) => (
        <Switch
          checked={record.isAvailable}
          onChange={(checked) => handleToggleItem(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: 'Tồn kho',
      key: 'stock',
      width: 90,
      render: (_: unknown, record: ItemRow) => {
        if (!record.trackInventory) return <Text type="secondary">—</Text>;
        const stock = record.stockQuantity ?? 0;
        return <Text type={stock <= 0 ? 'danger' : stock <= 5 ? 'warning' : undefined}>{stock}</Text>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: ItemRow) => (
        <Space>
          <Button
            size="small"
            icon={<Edit2 size={12} />}
            onClick={async () => {
              setEditingItem(record);
              let assignedOptionGroupIds: string[] = [];
              try {
                assignedOptionGroupIds = await merchantMenuApi.getMenuItemOptionGroups(record.id);
              } catch {
                // Non-fatal — fall back to empty selection
              }
              itemForm.setFieldsValue({
                storeId: record.storeId,
                categoryId: record.categoryId ?? '',
                name: record.name,
                basePrice: record.basePrice,
                description: record.description,
                imageUrl: record.imageUrl,
                isAvailable: record.isAvailable,
                trackInventory: record.trackInventory ?? false,
                stockQuantity: record.stockQuantity,
                maxQuantityPerOrder: record.maxQuantityPerOrder,
                dailyLimit: record.dailyLimit,
                optionGroupIds: assignedOptionGroupIds,
              });
              setItemModal(true);
            }}
          />
          <Button
            size="small"
            danger
            icon={<Trash2 size={12} />}
            onClick={() => handleDeleteItem(record)}
          />
        </Space>
      ),
    },
  ];

  if (loading) return <Skeleton active />;

  const reloadCombos = async (storeId: string | null) => {
    if (!storeId) {
      setCombos([]);
      return;
    }
    try {
      const list = await merchantMenuApi.listCombos(storeId);
      setCombos(list);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể tải danh sách combo');
    }
  };

  const openComboModal = (combo?: MerchantCombo) => {
    setEditingCombo(combo ?? null);
    if (combo) {
      comboForm.setFieldsValue({
        name: combo.name,
        description: combo.description,
        imageUrl: combo.imageUrl,
        comboPrice: combo.comboPrice,
        originalPrice: combo.originalPrice,
        isActive: combo.isActive,
        items: combo.items.map((it) => ({
          menuItemId: it.menuItemId,
          quantity: it.quantity,
        })),
      });
    } else {
      comboForm.resetFields();
      comboForm.setFieldsValue({ isActive: true, items: [{ menuItemId: undefined, quantity: 1 }] });
    }
    setComboModal(true);
  };

  const handleSaveCombo = async (values: {
    name: string;
    description?: string;
    imageUrl?: string;
    comboPrice: number;
    originalPrice?: number;
    isActive?: boolean;
    items: { menuItemId: string; quantity: number }[];
  }) => {
    if (!comboStoreId) {
      message.error('Vui lòng chọn cửa hàng cho combo');
      return;
    }
    if (!values.items || values.items.length === 0) {
      message.error('Combo cần ít nhất 1 món');
      return;
    }
    const body: MerchantComboRequestBody = {
      comboRequest: {
        name: values.name,
        description: values.description,
        imageUrl: values.imageUrl,
        comboPrice: Number(values.comboPrice ?? 0),
        originalPrice: values.originalPrice != null ? Number(values.originalPrice) : undefined,
        isActive: values.isActive ?? true,
      },
      comboItems: values.items.map((it) => ({
        menuItemId: it.menuItemId,
        quantity: Number(it.quantity ?? 1),
      })),
    };

    try {
      if (editingCombo) {
        await merchantMenuApi.updateCombo(editingCombo.id, body);
        message.success('Cập nhật combo thành công');
      } else {
        await merchantMenuApi.createCombo(comboStoreId, body);
        message.success('Tạo combo thành công');
      }
      setComboModal(false);
      await reloadCombos(comboStoreId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể lưu combo');
    }
  };

  const handleCreateOptionGroup = async (values: {
    storeId: string;
    name: string;
    isRequired?: boolean;
    minSelections?: number;
    maxSelections?: number;
    optionItems?: Array<{ name: string; priceAdjustment?: number }>;
  }) => {
    try {
      const groupPayload = {
        storeId: values.storeId,
        name: values.name,
        isRequired: values.isRequired ?? false,
        minSelections: values.minSelections ?? 0,
        maxSelections: values.maxSelections ?? 1,
      };
      const created = await apiClient.post<{ id: string }>(`/v1/merchant/stores/${values.storeId}/option-groups`, groupPayload);
      if (values.optionItems && values.optionItems.length > 0) {
        await apiClient.post(`/v1/merchant/option-groups/${created.id}/items`, values.optionItems.map((oi) => ({
          name: oi.name,
          priceAdjustment: oi.priceAdjustment ?? 0,
          isAvailable: true,
        })));
      }
      message.success('Đã tạo nhóm tuỳ chọn');
      setOptionGroupModal(false);
      optionGroupForm.resetFields();
      await loadMenu();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể tạo nhóm tuỳ chọn');
    }
  };

  const handleDeleteCombo = (combo: MerchantCombo) => {
    Modal.confirm({
      title: 'Xác nhận xoá',
      content: `Xoá combo "${combo.name}"?`,
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await merchantMenuApi.deleteCombo(combo.id);
          message.success('Đã xoá combo');
          await reloadCombos(comboStoreId);
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể xoá combo');
        }
      },
    });
  };

  const itemsByStore = items.filter((i) => !comboStoreId || i.storeId === comboStoreId);

  const comboColumns = [
    {
      title: 'Combo',
      key: 'info',
      render: (_: unknown, c: MerchantCombo) => (
        <Space direction="vertical" size={0}>
          <Text strong>{c.name}</Text>
          {c.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {c.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Giá combo',
      key: 'price',
      render: (_: unknown, c: MerchantCombo) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: 'var(--primary)' }}>
            {formatVND(Number(c.comboPrice ?? 0))}
          </Text>
          {c.originalPrice && c.originalPrice > c.comboPrice && (
            <Text delete type="secondary" style={{ fontSize: 12 }}>
              {formatVND(Number(c.originalPrice))}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Món',
      key: 'items',
      render: (_: unknown, c: MerchantCombo) => (
        <Text>{c.items.length} món</Text>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      render: (_: unknown, c: MerchantCombo) =>
        c.isActive ? <Text type="success">Đang bán</Text> : <Text type="secondary">Tạm tắt</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      render: (_: unknown, c: MerchantCombo) => (
        <Space>
          <Button size="small" icon={<Edit2 size={12} />} onClick={() => openComboModal(c)} />
          <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => handleDeleteCombo(c)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Quản lý thực đơn
        </Title>
        <Space>
          <Segmented
            value={view}
            onChange={(v) => setView(v as 'items' | 'combos' | 'options')}
            options={[
              { label: 'Món ăn', value: 'items' },
              { label: 'Combo', value: 'combos' },
              { label: 'Nhóm tuỳ chọn', value: 'options' },
            ]}
          />
          {view === 'items' ? (
            <>
              <Button icon={<Plus size={14} />} onClick={() => setCatModal(true)}>
                Thêm danh mục
              </Button>
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => {
                  setEditingItem(null);
                  itemForm.resetFields();
                  if (stores.length > 0) {
                    itemForm.setFieldValue('storeId', stores[0].id);
                  }
                  setItemModal(true);
                }}
              >
                Thêm món
              </Button>
            </>
          ) : view === 'combos' ? (
            <Button type="primary" icon={<Plus size={14} />} onClick={() => openComboModal()}>
              Tạo combo
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => setOptionGroupModal(true)}
            >
              Tạo nhóm tuỳ chọn
            </Button>
          )}
        </Space>
      </div>

      {view === 'items' ? (
        <>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'all', label: `Tất cả (${items.length})` },
              ...categories.map((cat) => ({
                key: cat.id,
                label: `${cat.name} (${items.filter((i) => i.categoryId === cat.id).length})`,
              })),
            ]}
          />

          <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, overflow: 'hidden' }}>
            <Table
              columns={columns}
              dataSource={filteredItems}
              rowKey="id"
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </>
      ) : view === 'combos' ? (
        <>
          <Space style={{ marginBottom: 12 }}>
            <Text>Cửa hàng:</Text>
            <Select
              value={comboStoreId ?? undefined}
              onChange={(v) => {
                setComboStoreId(v);
                void reloadCombos(v);
              }}
              options={stores.map((s) => ({ label: s.name, value: s.id }))}
              style={{ width: 240 }}
            />
          </Space>
          <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, overflow: 'hidden' }}>
            <Table columns={comboColumns} dataSource={combos} rowKey="id" pagination={{ pageSize: 8 }} />
          </Card>
        </>
      ) : (
        /* Option groups view */
        <>
          <Space style={{ marginBottom: 12 }}>
            <Text>Cửa hàng:</Text>
            <Select
              value={optionStoreId ?? undefined}
              onChange={(v) => setOptionStoreId(v)}
              options={stores.map((s) => ({ label: s.name, value: s.id }))}
              style={{ width: 240 }}
            />
          </Space>
          {(optionStoreId ? optionGroupsByStore[optionStoreId] ?? [] : []).length === 0 ? (
            <Card><Text type="secondary">Chưa có nhóm tuỳ chọn nào.</Text></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(optionGroupsByStore[optionStoreId ?? ''] ?? []).map((group) => (
                <Card key={group.id} size="small" title={group.name} extra={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {group.isRequired ? 'Bắt buộc' : 'Tuỳ chọn'} · min {group.minSelections} / max {group.maxSelections}
                  </Text>
                }>
                  <Text type="secondary" style={{ fontSize: 12 }}>ID: {group.id}</Text>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Item modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
        open={itemModal}
        onCancel={() => setItemModal(false)}
        onOk={() => itemForm.submit()}
        width={600}
        destroyOnClose
      >
        <Form<MenuItemFormValues> form={itemForm} layout="vertical" onFinish={handleSaveItem}>
          <Form.Item name="storeId" label="Cửa hàng" rules={[{ required: true }]}>
            <Select
              options={stores.map((s) => ({ label: s.name, value: s.id }))}
              disabled={!!editingItem}
            />
          </Form.Item>

          <Form.Item name="name" label="Tên món" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="categoryId"
              label="Danh mục"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Chọn danh mục"
                options={categories
                  .filter((c) => c.storeId === selectedStoreInForm)
                  .map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item
              name="basePrice"
              label="Giá bán"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                addonAfter="₫"
              />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="optionGroupIds"
            label="Nhóm tuỳ chọn (topping, size, ...)"
            tooltip="Chọn các nhóm tuỳ chọn áp dụng cho món này. Bỏ trống nếu món không có topping."
          >
            <Select
              mode="multiple"
              placeholder="Chọn nhóm tuỳ chọn"
              allowClear
              options={(selectedStoreInForm ? optionGroupsByStore[selectedStoreInForm] ?? [] : []).map((g) => ({
                label: `${g.name}${g.isRequired ? ' (bắt buộc)' : ''}`,
                value: g.id,
              }))}
              notFoundContent={selectedStoreInForm ? 'Cửa hàng này chưa có nhóm tuỳ chọn nào' : 'Vui lòng chọn cửa hàng trước'}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="imageUrl" label="Link ảnh món ăn" style={{ flex: 1 }}>
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item
              name="isAvailable"
              label="Trạng thái"
              valuePropName="checked"
              initialValue
            >
              <Switch checkedChildren="Mở" unCheckedChildren="Tắt" />
            </Form.Item>
          </div>

          <Text strong style={{ display: 'block', marginBottom: 8, marginTop: 4 }}>Quản lý tồn kho</Text>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="trackInventory" label="Theo dõi tồn kho" valuePropName="checked" initialValue={false}>
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
            <Form.Item name="stockQuantity" label="Số lượng tồn">
              <InputNumber min={0} style={{ width: 120 }} placeholder="0" />
            </Form.Item>
            <Form.Item name="maxQuantityPerOrder" label="Tối đa/đơn">
              <InputNumber min={1} style={{ width: 100 }} placeholder="10" />
            </Form.Item>
            <Form.Item name="dailyLimit" label="Giới hạn/ngày">
              <InputNumber min={0} style={{ width: 100 }} placeholder="0 = không giới hạn" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Category modal */}
      <Modal
        title="Thêm danh mục"
        open={catModal}
        onCancel={() => setCatModal(false)}
        onOk={() => catForm.submit()}
      >
        <Form<CategoryFormValues>
          form={catForm}
          layout="vertical"
          onFinish={handleAddCategory}
          initialValues={{ storeId: stores[0]?.id }}
        >
          <Form.Item name="storeId" label="Chọn cửa hàng" rules={[{ required: true }]}>
            <Select options={stores.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Combo modal */}
      <Modal
        title={editingCombo ? 'Sửa combo' : 'Tạo combo mới'}
        open={comboModal}
        onCancel={() => setComboModal(false)}
        onOk={() => comboForm.submit()}
        width={680}
        destroyOnClose
      >
        <Form form={comboForm} layout="vertical" onFinish={handleSaveCombo}>
          <Form.Item name="name" label="Tên combo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Link ảnh combo">
            <Input placeholder="https://..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="comboPrice"
              label="Giá combo"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} addonAfter="₫" min={0} />
            </Form.Item>
            <Form.Item name="originalPrice" label="Giá gốc tham chiếu" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} addonAfter="₫" min={0} />
            </Form.Item>
            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked" initialValue>
              <Switch checkedChildren="Bán" unCheckedChildren="Tắt" />
            </Form.Item>
          </div>

          <Text strong>Món trong combo</Text>
          <Form.List name="items" rules={[{
            validator: async (_, items) => {
              if (!items || items.length === 0) {
                return Promise.reject(new Error('Combo cần ít nhất 1 món'));
              }
            },
          }]}>
            {(fields, { add, remove }, { errors }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ width: '100%' }}>
                    <Form.Item
                      {...rest}
                      name={[name, 'menuItemId']}
                      rules={[{ required: true, message: 'Chọn món' }]}
                      style={{ flex: 1, minWidth: 280, marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn món"
                        options={itemsByStore.map((m) => ({ label: m.name, value: m.id }))}
                        filterOption={(input, opt) =>
                          (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        style={{ width: 320 }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, 'quantity']}
                      rules={[{ required: true }]}
                      initialValue={1}
                      style={{ marginBottom: 0 }}
                    >
                      <Qty min={1} style={{ width: 80 }} />
                    </Form.Item>
                    <Button danger size="small" onClick={() => remove(name)}>
                      Xoá
                    </Button>
                  </Space>
                ))}
                <Button onClick={() => add({ menuItemId: undefined, quantity: 1 })} icon={<Plus size={12} />}>
                  Thêm món vào combo
                </Button>
                <Form.ErrorList errors={errors} />
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Option Group modal */}
      <Modal
        title="Tạo nhóm tuỳ chọn mới"
        open={optionGroupModal}
        onCancel={() => setOptionGroupModal(false)}
        onOk={() => optionGroupForm.submit()}
        destroyOnClose
      >
        <Form form={optionGroupForm} layout="vertical" onFinish={handleCreateOptionGroup}>
          <Form.Item name="storeId" label="Cửa hàng" rules={[{ required: true }]}>
            <Select options={stores.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="name" label="Tên nhóm" rules={[{ required: true }]}>
            <Input placeholder="VD: Topping, Size, Đá/Đường..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="isRequired" label="Bắt buộc chọn" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            <Form.Item name="minSelections" label="Min" initialValue={0}>
              <InputNumber min={0} style={{ width: 80 }} />
            </Form.Item>
            <Form.Item name="maxSelections" label="Max" initialValue={1}>
              <InputNumber min={1} style={{ width: 80 }} />
            </Form.Item>
          </div>
          <Text strong>Option items</Text>
          <Form.List name="optionItems">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline">
                    <Form.Item {...rest} name={[name, 'name']} rules={[{ required: true, message: 'Tên option' }]} style={{ marginBottom: 0 }}>
                      <Input placeholder="Tên (VD: Trân châu)" style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'priceAdjustment']} initialValue={0} style={{ marginBottom: 0 }}>
                      <InputNumber placeholder="Giá thêm" addonAfter="₫" style={{ width: 140 }} />
                    </Form.Item>
                    <Button size="small" danger onClick={() => remove(name)}>Xoá</Button>
                  </Space>
                ))}
                <Button onClick={() => add({ name: '', priceAdjustment: 0 })} icon={<Plus size={12} />}>
                  Thêm option item
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagerPage;
