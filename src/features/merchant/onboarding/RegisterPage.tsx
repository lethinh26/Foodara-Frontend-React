import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Steps, Form, Input, Upload, Button, Typography, Select, Space, Tag, message } from 'antd';
import { Upload as UploadIcon, CheckCircle2, Store, FileText, Building2 } from 'lucide-react';
import { merchantService } from '../../../services/merchantService';
import { useDispatch } from 'react-redux';
import { switchRole } from '../../../store/authSlice';
import type { UploadProps } from 'antd';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [documentsForm] = Form.useForm();
  const [bankForm] = Form.useForm();
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  const [messageApi, contextHolder] = message.useMessage();

  const steps = [
    { title: 'Thông tin quán', icon: <Store size={16} /> },
    { title: 'Giấy tờ', icon: <FileText size={16} /> },
    { title: 'Tài khoản ngân hàng', icon: <Building2 size={16} /> },
    { title: 'Hoàn tất', icon: <CheckCircle2 size={16} /> },
  ];

  const handleStoreInfoSubmit = async () => {
    try {
      const values = await form.validateFields();
      setCurrentStep(1);
    } catch {
      // Validation failed
    }
  };

  const handleDocumentsSubmit = async () => {
    try {
      const values = await documentsForm.validateFields();
      setCurrentStep(2);
    } catch {
      // Validation failed
    }
  };

  const handleBankAccountSubmit = async () => {
    try {
      const values = await bankForm.validateFields();
      setLoading(true);

      const storeData = form.getFieldsValue();
      await merchantService.registerMerchant({
        name: storeData.businessName,
        taxCode: storeData.taxCode,
        businessEmail: storeData.email,
        businessPhone: storeData.phone,
      });

      for (const [docType, url] of Object.entries(uploadedDocuments)) {
        await merchantService.uploadDocument({
          documentType: docType as 'business_license' | 'food_safety_cert' | 'id_card_front' | 'id_card_back' | 'other',
          documentUrl: url,
        });
      }

      if (values.bankName) {
        await merchantService.addBankAccount({
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          accountHolder: values.accountHolder,
          branch: values.branch,
          isDefault: true,
        });
      }

      dispatch(switchRole('merchant'));
      setCurrentStep(3);
      setLoading(false);
    } catch (error: any) {
      messageApi.error(error.message || 'Đã xảy ra lỗi khi đăng ký');
      setLoading(false);
    }
  };

  const documentUploadProps: UploadProps = (type: string) => ({
    name: 'file',
    multiple: false,
    action: '#',
    accept: '.pdf,.jpg,.jpeg,.png',
    beforeUpload: async (file) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        messageApi.error('File phải nhỏ hơn 5MB');
        return false;
      }
      const fakeUrl = `https://fake-upload.example.com/${type}/${file.name}`;
      setUploadedDocuments(prev => ({ ...prev, [type]: fakeUrl }));
      messageApi.success('Tải lên thành công');
      return false;
    },
    onRemove: () => {
      return new Promise((resolve) => {
        resolve(true);
      });
    },
  });

  const renderStep0StoreInfo = () => (
    <Card style={{ borderRadius: 12 }}>
      <Form form={form} layout="vertical" initialValues={{ businessType: 'restaurant' }}>
        <Form.Item
          name="businessName"
          label="Tên quán"
          rules={[{ required: true, message: 'Vui lòng nhập tên quán' }]}
        >
          <Input placeholder="VD: Phở Hà Nội Xưa" size="large" />
        </Form.Item>

        <Form.Item
          name="businessType"
          label="Loại hình kinh doanh"
          rules={[{ required: true, message: 'Vui lòng chọn loại hình' }]}
        >
          <Select size="large" placeholder="Chọn loại hình">
            <Select.Option value="restaurant">Nhà hàng</Select.Option>
            <Select.Option value="cafe">Quán cafe</Select.Option>
            <Select.Option value="bakery">Tiệm bánh</Select.Option>
            <Select.Option value="street_food">Đồ ăn đường phố</Select.Option>
            <Select.Option value="other">Khác</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="address"
          label="Địa chỉ quán"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
        >
          <Input placeholder="VD: 123 Nguyễn Trãi, Quận 1" size="large" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại liên hệ"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            { pattern: /^0\d{9}$/, message: 'Số điện thoại không hợp lệ' },
          ]}
        >
          <Input placeholder="VD: 0901234567" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email kinh doanh"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input placeholder="VD: contact@phohanoi.vn" size="large" />
        </Form.Item>

        <Form.Item name="taxCode" label="Mã số thuế">
          <Input placeholder="VD: 0123456789" size="large" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả quán">
          <TextArea rows={3} placeholder="Giới thiệu ngắn về quán của bạn..." />
        </Form.Item>

        <Button
          type="primary"
          htmlType="button"
          block
          size="large"
          style={{ borderRadius: 10, marginTop: 8 }}
          onClick={handleStoreInfoSubmit}
        >
          Tiếp tục
        </Button>
      </Form>
    </Card>
  );

  const renderStep1Documents = () => (
    <Card style={{ borderRadius: 12 }}>
      <Form form={documentsForm} layout="vertical">
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Vui lòng tải lên các giấy tờ sau:</h4>

          <Form.Item
            label="Giấy phép kinh doanh (GPLĐ)"
            required
            validateStatus={uploadedDocuments.business_license ? 'success' : ''}
            help={uploadedDocuments.business_license ? 'Đã tải lên' : 'Chưa tải lên'}
          >
            <Upload.Dragger {...documentUploadProps('business_license')}>
              <p><UploadIcon size={32} color="var(--text-muted)" /></p>
              <p>Kéo thả hoặc click để tải lên</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, JPG, PNG (tối đa 5MB)</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            label="Giấy chứng nhận an toàn thực phẩm (ATTP)"
            required
            validateStatus={uploadedDocuments.food_safety_cert ? 'success' : ''}
            help={uploadedDocuments.food_safety_cert ? 'Đã tải lên' : 'Chưa tải lên'}
          >
            <Upload.Dragger {...documentUploadProps('food_safety_cert')}>
              <p><UploadIcon size={32} color="var(--text-muted)" /></p>
              <p>Kéo thả hoặc click để tải lên</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, JPG, PNG (tối đa 5MB)</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item label="CCCD / CMND chủ quán (mặt trước)">
            <Upload.Dragger {...documentUploadProps('id_card_front')}>
              <p><UploadIcon size={32} color="var(--text-muted)" /></p>
              <p>Kéo thả hoặc click để tải lên</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, JPG, PNG (tối đa 5MB)</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item label="CCCD / CMND chủ quán (mặt sau)">
            <Upload.Dragger {...documentUploadProps('id_card_back')}>
              <p><UploadIcon size={32} color="var(--text-muted)" /></p>
              <p>Kéo thả hoặc click để tải lên</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, JPG, PNG (tối đa 5MB)</p>
            </Upload.Dragger>
          </Form.Item>
        </div>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={() => setCurrentStep(0)} size="large">Quay lại</Button>
          <Button
            type="primary"
            htmlType="button"
            onClick={handleDocumentsSubmit}
            size="large"
            style={{ borderRadius: 10 }}
          >
            Tiếp tục
          </Button>
        </Space>
      </Form>
    </Card>
  );

  const renderStep2BankAccount = () => (
    <Card style={{ borderRadius: 12 }}>
      <Form form={bankForm} layout="vertical">
        <Title level={5}>Thông tin tài khoản ngân hàng</Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Nhập thông tin tài khoản ngân hàng để nhận thanh toán từ Foodara
        </Paragraph>

        <Form.Item
          name="bankName"
          label="Tên ngân hàng"
          rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
        >
          <Select
            size="large"
            placeholder="Chọn ngân hàng"
            showSearch
            optionFilterProp="children"
          >
            <Select.Option value=" Vietcombank">Vietcombank</Select.Option>
            <Select.Option value=" VietinBank">VietinBank</Select.Option>
            <Select.Option value=" BIDV">BIDV</Select.Option>
            <Select.Option value=" Agribank">Agribank</Select.Option>
            <Select.Option value=" ACB">ACB</Select.Option>
            <Select.Option value=" Techcombank">Techcombank</Select.Option>
            <Select.Option value=" VPBANK">VPBANK</Select.Option>
            <Select.Option value=" DongA Bank">DongA Bank</Select.Option>
            <Select.Option value=" TPBank">TPBank</Select.Option>
            <Select.Option value=" MB Bank">MB Bank</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="accountNumber"
          label="Số tài khoản"
          rules={[
            { required: true, message: 'Vui lòng nhập số tài khoản' },
            { pattern: /^\d{6,20}$/, message: 'Số tài khoản không hợp lệ' },
          ]}
        >
          <Input placeholder="VD: 1234567890" size="large" />
        </Form.Item>

        <Form.Item
          name="accountHolder"
          label="Tên chủ tài khoản"
          rules={[
            { required: true, message: 'Vui lòng nhập tên chủ tài khoản' },
            { min: 2, message: 'Tên chủ tài khoản quá ngắn' },
          ]}
        >
          <Input placeholder="VD: NGUYEN VAN A" size="large" style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item name="branch" label="Chi nhánh">
          <Input placeholder="VD: Chi nhánh Quận 1, TP.HCM" size="large" />
        </Form.Item>

        <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => setCurrentStep(1)} size="large">Quay lại</Button>
          <Button
            type="primary"
            htmlType="button"
            onClick={handleBankAccountSubmit}
            loading={loading}
            size="large"
            style={{ borderRadius: 10 }}
          >
            Hoàn tất đăng ký
          </Button>
        </Space>
      </Form>
    </Card>
  );

  const renderStep3Complete = () => (
    <Card style={{ borderRadius: 12, textAlign: 'center', padding: 24 }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'var(--success-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <CheckCircle2 size={40} color="var(--success)" />
      </div>

      <Title level={4}>Đăng ký thành công!</Title>

      <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 16 }}>
        Hồ sơ của bạn đang chờ xét duyệt. Chúng tôi sẽ liên hệ trong <strong>1-3 ngày làm việc</strong>.
      </Paragraph>

      <Tag color="orange" style={{ fontSize: 14, padding: '4px 16px', marginBottom: 24 }}>
        Đang xét duyệt
      </Tag>

      <div style={{ background: 'var(--background-secondary)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <Paragraph style={{ margin: 0, textAlign: 'left' }}>
          <strong>Điều tiếp theo:</strong>
        </Paragraph>
        <ul style={{ textAlign: 'left', marginTop: 8, paddingLeft: 20 }}>
          <li>Chờ đội ngũ Foodara xác minh giấy tờ</li>
          <li>Nhận email xác nhận khi được duyệt</li>
          <li>Sau khi duyệt, bạn có thể đăng nhập và quản lý cửa hàng</li>
        </ul>
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Button
          type="primary"
          block
          size="large"
          style={{ borderRadius: 10 }}
          onClick={() => navigate('/merchant/profile')}
        >
          Truy cập trang quản lý
        </Button>
        <Button
          block
          size="large"
          style={{ borderRadius: 10 }}
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </Button>
      </Space>
    </Card>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '24px 16px' }}>
      {contextHolder}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo/primary_logo.png"
            alt="Foodara"
            style={{ height: 40, marginBottom: 16 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <Title level={3} style={{ margin: 0 }}>Đăng ký đối tác Foodara</Title>
          <Paragraph type="secondary">
            Trở thành đối tác của chúng tôi để mở rộng kinh doanh
          </Paragraph>
        </div>

        <Steps
          current={currentStep}
          style={{ marginBottom: 32 }}
          items={steps.map(step => ({
            title: step.title,
          }))}
        />

        {currentStep === 0 && renderStep0StoreInfo()}
        {currentStep === 1 && renderStep1Documents()}
        {currentStep === 2 && renderStep2BankAccount()}
        {currentStep === 3 && renderStep3Complete()}
      </div>
    </div>
  );
};

export default RegisterPage;
