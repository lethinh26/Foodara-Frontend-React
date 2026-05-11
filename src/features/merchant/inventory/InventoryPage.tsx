import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Switch, Tag, InputNumber, Typography, message, Input, Space, Button } from 'antd';
import { AlertTriangle, Search } from 'lucide-react';
import { merchantMenuApi, merchantService } from '../../../services/merchantService';
import { formatVND } from '../../../utils/format';
import type { MenuItem } from '../../../types/menu';

const { Title, Text } = Typography;

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const stores = await merchantService.getStores();
      if (!stores || stores.length === 0) return;

      const itemPromises = stores.map(store => merchantMenuApi.getItems(store.id));
      const results = await Promise.all(itemPromises);

      const allItems = results.flatMap((itms, index) => 
        
        itms.map((item: any) => ({
          ...item,
          storeName: stores[index].name,
          basePrice: Number(item.basePrice || 0),
          image: item.imageUrl || '/logo/secondary_logo.png',
          maxQuantity: item.stockQuantity || 99,
        }))
      );

      setItems(allItems);
    } catch (error: any) {
      message.error(error?.message || "Không thể tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await merchantMenuApi.updateAvailability(itemId, !currentStatus);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: !currentStatus } : i));
      message.success('Đã cập nhật trạng thái');
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleUpdateStock = async (itemId: string, qty: number) => {
    try {
      await merchantMenuApi.updateStock(itemId, qty);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, maxQuantity: qty } : i));
      message.success('Đã cập nhật số lượng giới hạn');
    } catch (error) {
      message.error('Không thể cập nhật số lượng');
    }
  };

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i as any).storeName?.toLowerCase().includes(search.toLowerCase())
  );

  const unavailableCount = items.filter(i => !i.isAvailable).length;

  const columns = [
    { 
      title: 'Món ăn', 
      dataIndex: 'name', 
      key: 'name', 
      render: (name: string, r: MenuItem) => (
        <Space size={10}>
          <img src={r.image} alt={name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{(r as any).storeName}</Text>
          </div>
        </Space>
      )
    },
    { 
        title: 'Giá niêm yết', 
        dataIndex: 'basePrice', 
        render: (p: number) => <Text>{formatVND(p)}</Text> 
    },
    { 
      title: 'Bán (On/Off)', 
      key: 'available', 
      width: 120, 
      render: (_: any, r: MenuItem) => (
        <Switch 
          checked={r.isAvailable} 
          onChange={() => toggleAvailability(r.id, r.isAvailable)} 
          checkedChildren="Mở"
          unCheckedChildren="Tắt"
        />
      ) 
    },
    { 
      title: 'Giới hạn/ngày', 
      key: 'limit', 
      width: 150, 
      render: (_: any, r: MenuItem) => (
        <InputNumber 
          min={0} 
          max={999} 
          value={r.maxQuantity} 
          onStep={(value) => handleUpdateStock(r.id, value)}
          onPressEnter={(e: any) => handleUpdateStock(r.id, Number(e.target.value))}
          size="small" 
          style={{ width: 90 }} 
        />
      ) 
    },
    { 
      title: 'Tình trạng', 
      key: 'status', 
      width: 120, 
      render: (_: any, r: MenuItem) => (
        r.isAvailable ? <Tag color="green">Đang bán</Tag> : <Tag color="red">Tạm dừng</Tag>
      ) 
    },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>Quản lý tồn kho</Title>
          <Text type="secondary">Cập nhật trạng thái món ăn và giới hạn số lượng bán trong ngày</Text>
        </Space>
        {unavailableCount > 0 && (
          <Tag icon={<AlertTriangle size={12} />} color="warning">
            {unavailableCount} món đang tạm dừng
          </Tag>
        )}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input 
          prefix={<Search size={14} />} 
          placeholder="Tìm tên món hoặc chi nhánh..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ maxWidth: 350, borderRadius: 8 }} 
          allowClear 
        />
        <Button onClick={loadInventory}>Làm mới</Button>
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={filtered} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 10, showSizeChanger: false }} 
          size="middle" 
        />
      </Card>
    </div>
  );
};

export default InventoryPage;
