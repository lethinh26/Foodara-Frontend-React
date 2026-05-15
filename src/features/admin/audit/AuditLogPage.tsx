import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Typography, Space, Empty, Tag, Drawer, Button, Input, Select } from 'antd';
import { Search, Eye } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatDate } from '../../../utils/format';
import type { AdminAuditLog } from '../../../types/admin';
import type { TablePaginationConfig } from 'antd';

const { Text, Title } = Typography;
const PAGE_SIZE = 15;

const AuditLogPage: React.FC = () => {
  const [data, setData] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [error, setError] = useState(false);
  const [detailLog, setDetailLog] = useState<AdminAuditLog | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await adminService.getAuditLogs({
        page: page - 1, size: PAGE_SIZE,
        search: searchTerm || undefined,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
      });
      setData(res.content); setTotal(res.totalElements);
    } catch { setError(true); setData([]); }
    finally { setLoading(false); }
  }, [page, searchTerm, moduleFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const columns = [
    { title: 'Admin', key: 'admin', render: (_: unknown, r: AdminAuditLog) => <Text>{r.adminName || r.adminId}</Text> },
    { title: 'Hành động', dataIndex: 'action', key: 'action', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Module', dataIndex: 'module', key: 'module', render: (v: string | null) => v || '—' },
    { title: 'Đối tượng', key: 'entity', render: (_: unknown, r: AdminAuditLog) => r.entityType ? `${r.entityType} (${r.entityId})` : '—' },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ip', width: 120 },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'time', width: 140, render: (v: string) => formatDate(v, 'DD/MM/YYYY HH:mm') },
    { title: '', key: 'actions', width: 80, render: (_: unknown, r: AdminAuditLog) => (
      <Button size="small" icon={<Eye size={12} />} onClick={() => setDetailLog(r)}>Xem</Button>
    )},
  ];

  const formatJson = (str: string | null) => {
    if (!str) return 'Không có dữ liệu';
    try { return JSON.stringify(JSON.parse(str), null, 2); }
    catch { return str; }
  };

  return (
    <div className="animate-fade-in">
      <Title level={4} style={{ marginBottom: 16 }}>Nhật ký hệ thống (Audit Logs)</Title>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input prefix={<Search size={14} />} placeholder="Tìm kiếm hành động, admin..." value={search}
          onChange={e => { setSearch(e.target.value); if (!e.target.value) { setSearchTerm(''); setPage(1); } }}
          onPressEnter={() => { setSearchTerm(search); setPage(1); }} style={{ width: 260, borderRadius: 8 }} allowClear />
        <Select value={moduleFilter} onChange={v => { setModuleFilter(v); setPage(1); }} style={{ width: 140 }} options={[
          { label: 'Tất cả module', value: 'all' },
          { label: 'Auth', value: 'auth' },
          { label: 'Users', value: 'users' },
          { label: 'Stores', value: 'stores' },
          { label: 'Orders', value: 'orders' },
          { label: 'Promotions', value: 'promotions' },
          { label: 'Config', value: 'config' }
        ]} />
      </div>

      {error ? <Empty description="Không thể tải lịch sử." /> : (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="small" scroll={{ x: 900 }}
            pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, showTotal: t => `${t} logs` }}
            onChange={(p: TablePaginationConfig) => setPage(p.current || 1)} />
        </Card>
      )}

      <Drawer title="Chi tiết thay đổi" open={!!detailLog} onClose={() => setDetailLog(null)} width={500}>
        {detailLog && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text type="secondary">Hành động:</Text> <Text strong>{detailLog.action}</Text>
              <br /><Text type="secondary">Admin:</Text> <Text strong>{detailLog.adminName || detailLog.adminId}</Text>
              <br /><Text type="secondary">IP:</Text> <Text strong>{detailLog.ipAddress}</Text>
              <br /><Text type="secondary">Thời gian:</Text> <Text strong>{formatDate(detailLog.createdAt, 'DD/MM/YYYY HH:mm:ss')}</Text>
            </div>
            
            {(detailLog.oldValues || detailLog.newValues) && (
              <div>
                <Text strong>Dữ liệu cũ:</Text>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto' }}>
                  {formatJson(detailLog.oldValues)}
                </pre>
                
                <Text strong style={{ marginTop: 12, display: 'block' }}>Dữ liệu mới:</Text>
                <pre style={{ background: '#f6ffed', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto', border: '1px solid #b7eb8f' }}>
                  {formatJson(detailLog.newValues)}
                </pre>
              </div>
            )}
            
            <div>
              <Text strong>User Agent:</Text>
              <div style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginTop: 4, wordBreak: 'break-all' }}>
                {detailLog.userAgent || '—'}
              </div>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default AuditLogPage;
