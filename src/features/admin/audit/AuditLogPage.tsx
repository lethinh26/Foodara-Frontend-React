import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Input, Select, DatePicker, Space } from 'antd';
import { Search } from 'lucide-react';
import { mockAuditLogs } from '../../../mocks/dashboardMetrics';
import { formatRelativeTime } from '../../../utils/format';

const { Title, Text } = Typography;

const AuditLogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const modules = [...new Set(mockAuditLogs.map(l => l.module))];
  const filtered = mockAuditLogs.filter(l => {
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.userName.toLowerCase().includes(search.toLowerCase())) return false;
    if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
    return true;
  });

  const columns = [
    { title: 'Thời gian', dataIndex: 'timestamp', render: (t: string) => <Text style={{ fontSize: 12 }}>{formatRelativeTime(t)}</Text>, width: 120 },
    { title: 'Người thực hiện', dataIndex: 'userName', render: (n: string, r: typeof mockAuditLogs[0]) => <Space><Text strong>{n}</Text><Tag>{r.userRole}</Tag></Space> },
    { title: 'Hành động', dataIndex: 'action', render: (a: string) => <Text>{a}</Text> },
    { title: 'Module', dataIndex: 'module', render: (m: string) => <Tag color="blue">{m}</Tag> },
    { title: 'Đối tượng', dataIndex: 'targetName' },
    { title: 'Chi tiết', dataIndex: 'details', render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{d}</Text> },
    { title: 'Kết quả', dataIndex: 'status', render: (s: string) => <Tag color={s === 'success' ? 'green' : 'red'}>{s === 'success' ? 'OK' : 'Lỗi'}</Tag>, width: 70 },
  ];

  return (
    <div className="animate-fade-in">
      <Title level={4}>Nhật ký hoạt động</Title>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm theo hành động, người thực hiện..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280, borderRadius: 8 }} allowClear />
        <Select value={moduleFilter} onChange={setModuleFilter} style={{ width: 160 }} options={[{ label: 'Tất cả module', value: 'all' }, ...modules.map(m => ({ label: m, value: m }))]} />
        <DatePicker.RangePicker />
      </div>
      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 20 }} size="middle" />
      </Card>
    </div>
  );
};

export default AuditLogPage;
