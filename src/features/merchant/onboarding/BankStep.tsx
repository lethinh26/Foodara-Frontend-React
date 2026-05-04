import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Space, Card, Typography } from 'antd';
import { merchantService } from '../../../services/merchantService';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface BankStepProps {
  onBack: () => void;
  onSuccess: () => void;
}

const BankStep: React.FC<BankStepProps> = ({ onBack, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()
  useEffect(() => {
    merchantService.getBankAccounts().then(() => {
      onSuccess()
    })
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await merchantService.addBankAccount({
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolder: values.accountHolder.toUpperCase(),
        branch: values.branch,
        isDefault: true,
      });

      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ borderRadius: 12 }}>
      <Title level={5}>Tài khoản ngân hàng</Title>
      <Form form={form} layout="vertical">
        <Form.Item name="bankName" label="Ngân hàng" rules={[{ required: true }]}>
          <Select placeholder="Chọn ngân hàng" showSearch>
            <Select.Option value="Vietcombank">Vietcombank</Select.Option>
            <Select.Option value="Techcombank">Techcombank</Select.Option>
            <Select.Option value="MBBank">MB Bank</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="accountNumber" label="Số tài khoản" rules={[{ required: true }]}>
          <Input placeholder="Nhập số tài khoản" size="large" />
        </Form.Item>

        <Form.Item name="accountHolder" label="Tên chủ tài khoản" rules={[{ required: true }]}>
          <Input placeholder="NGUYEN VAN A" size="large" style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
          <Button onClick={onBack}>Quay lại</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Hoàn tất đăng ký
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default BankStep;