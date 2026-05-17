import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Switch,
  Tag,
  InputNumber,
  Typography,
  message,
  Input,
  Space,
  Button,
  Skeleton,
} from 'antd';
import { AlertTriangle, Search } from 'lucide-react';
import {
  merchantMenuApi,
  merchantService,
} from '../../../services/merchantService';
import type { MerchantMenuItem } from '../../../types/merchant';

const { Title, Text } = Typography;

const FALLBACK_IMAGE = '/logo/secondary_logo.png';

interface InventoryRow extends MerchantMenuItem {
  storeName: string;
  image: string;
  stockQuantitySafe: number;
}

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const stores = await merchantService.getStores();
      if (stores.length === 0) {
        setItems([]);
        return;
      }

      const itemArrays = await Promise.all(
        stores.map((store) => merchantMenuApi.getItems(store.id)),
      );

      const allItems: InventoryRow[] = itemArrays.flatMap((itms, index) => {
        const store = stores[index];
        return itms.map((item) => ({
          ...item,
          storeId: item.storeId ?? store.id,
          storeName: store.name,
          basePrice: Number(item.basePrice ?? 0),
          image: item.imageUrl || FALLBACK_IMAGE,
          stockQuantitySafe: Number(item.stockQuantity ?? 0),
        }));
      });

      setItems(allItems);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể tải dữ liệu tồn kho';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleToggleTrackInventory = async (item: InventoryRow) => {
    const newVal = !item.trackInventory;
    try {
      await merchantMenuApi.updateItem(item.id, {
        storeId: item.storeId,
        name: item.name,
        basePrice: item.basePrice,
        trackInventory: newVal,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, trackInventory: newVal } : i)),
      );
      message.success(newVal ? 'Đã bật theo dõi tồn kho' : 'Đã tắt theo dõi tồn kho');
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const handleUpdateStock = async (itemId: string, qty: number) => {
    try {
      await merchantMenuApi.updateStock(itemId, qty);
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, stockQuantity: qty, stockQuantitySafe: qty } : i,
        ),
      );
      message.success('Đã cập nhật số lượng');
    } catch {
      message.error('Không thể cập nhật số lượng');
    }
  };

  const handleUpdateField = async (itemId: string, field: 'maxQuantityPerOrder' | 'dailyLimit', value: number | null) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    try {
      await merchantMenuApi.updateItem(itemId, {
        storeId: item.storeId,
        name: item.name,
        basePrice: item.basePrice,
        [field]: value,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
      );
      message.success('Đã cập nhật');
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.storeName.toLowerCase().includes(search.toLowerCase()),
  );

  const lowStockCount = items.filter((i) => i.trackInventory && i.stockQuantitySafe <= 5 && i.stockQuantitySafe >= 0).length;

  const columns = [
    {
      title: 'Món ăn',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r: InventoryRow) => (
        <Space size={10}>
          <img
            src={r.image}
            alt={name}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
          />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.storeName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Theo dõi tồn kho',
      key: 'trackInventory',
      width: 140,
      render: (_: unknown, r: InventoryRow) => (
        <Switch
          checked={Boolean(r.trackInventory)}
          onChange={() => handleToggleTrackInventory(r)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: 'Số lượng tồn',
      key: 'stock',
      width: 130,
      render: (_: unknown, r: InventoryRow) => (
        <InputNumber
          min={0}
          max={9999}
          value={r.stockQuantitySafe}
          disabled={!r.trackInventory}
          onBlur={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            if (!isNaN(val) && val !== r.stockQuantitySafe) {
              handleUpdateStock(r.id, val);
            }
          }}
          onPressEnter={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            if (!isNaN(val)) handleUpdateStock(r.id, val);
          }}
          size="small"
          style={{ width: 90 }}
        />
      ),
    },
    {
      title: 'Tối đa/đơn',
      key: 'maxQty',
      width: 110,
      render: (_: unknown, r: InventoryRow) => (
        <InputNumber
          min={1}
          max={100}
          value={r.maxQuantityPerOrder ?? undefined}
          placeholder="∞"
          onBlur={(e) => {
            const val = Number((e.target as HTMLInputElement).value) || null;
            if (val !== r.maxQuantityPerOrder) handleUpdateField(r.id, 'maxQuantityPerOrder', val);
          }}
          onPressEnter={(e) => {
            const val = Number((e.target as HTMLInputElement).value) || null;
            handleUpdateField(r.id, 'maxQuantityPerOrder', val);
          }}
          size="small"
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Giới hạn/ngày',
      key: 'dailyLimit',
      width: 120,
      render: (_: unknown, r: InventoryRow) => (
        <InputNumber
          min={0}
          max={9999}
          value={r.dailyLimit ?? undefined}
          placeholder="∞"
          onBlur={(e) => {
            const val = Number((e.target as HTMLInputElement).value) || null;
            if (val !== r.dailyLimit) handleUpdateField(r.id, 'dailyLimit', val);
          }}
          onPressEnter={(e) => {
            const val = Number((e.target as HTMLInputElement).value) || null;
            handleUpdateField(r.id, 'dailyLimit', val);
          }}
          size="small"
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Tình trạng',
      key: 'status',
      width: 110,
      render: (_: unknown, r: InventoryRow) => {
        if (!r.trackInventory) return <Tag>Không theo dõi</Tag>;
        if (r.stockQuantitySafe <= 0) return <Tag color="red">Hết hàng</Tag>;
        if (r.stockQuantitySafe <= 5) return <Tag color="orange">Sắp hết</Tag>;
        return <Tag color="green">Còn hàng</Tag>;
      },
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
          marginBottom: 24,
        }}
      >
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý tồn kho
          </Title>
          <Text type="secondary">
            Theo dõi và cập nhật số lượng tồn kho theo thời gian thực
          </Text>
        </Space>
        {lowStockCount > 0 && (
          <Tag icon={<AlertTriangle size={12} />} color="warning">
            {lowStockCount} món sắp/đã hết hàng
          </Tag>
        )}
      </div>

      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Input
          prefix={<Search size={14} />}
          placeholder="Tìm tên món hoặc chi nhánh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 350, borderRadius: 8 }}
          allowClear
        />
        <Button onClick={loadInventory}>Làm mới</Button>
      </div>

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default InventoryPage;
