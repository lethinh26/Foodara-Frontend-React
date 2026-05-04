import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Divider,
  Row,
  Col,
  Space,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  PictureOutlined,
  CloudUploadOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import Dragger from "antd/es/upload/Dragger";
import { uploadToCloudinary } from "../../../services/uploadService";
import { merchantService } from "../../../services/merchantService";
import type { MerchantRegisterRequest } from "../../../types/merchant";

const { Text } = Typography;

interface StoreInfoStepProps {
  onSuccess: (merchantId: string) => void; // Callback khi đăng ký thành công để chuyển step
  next: () => void
}

const StoreInfoStep: React.FC<StoreInfoStepProps> = ({ onSuccess, next }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    merchantService.getProfile().then(() => {
      next()
    })
  }, [])

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 1. Lấy file gốc để upload
      const logoFile = values.logoUrl?.[0]?.originFileObj;
      const coverFile = values.coverImageUrl?.[0]?.originFileObj;

      let finalLogoUrl = "";
      let finalCoverImageUrl = "";

      // 2. Upload lên Cloudinary
      const uploadPromises = [];
      if (logoFile) {
        uploadPromises.push(
          uploadToCloudinary(logoFile).then((url) => (finalLogoUrl = url)),
        );
      }
      if (coverFile) {
        uploadPromises.push(
          uploadToCloudinary(coverFile).then(
            (url) => (finalCoverImageUrl = url),
          ),
        );
      }

      await Promise.all(uploadPromises);

      // 3. Khớp dữ liệu với MerchantRegisterRequest
      const requestData: MerchantRegisterRequest = {
        name: values.businessName,
        businessPhone: values.phone,
        businessEmail: values.email,
        taxCode: values.taxCode,
        logoUrl: finalLogoUrl,
        coverImageUrl: finalCoverImageUrl,
      };

      // 4. Gọi API đăng ký
      const result = await merchantService.registerMerchant(requestData);

      if (result) {
        message.success("Thông tin cửa hàng đã được lưu!");
        onSuccess(result.id); // Trả về ID merchant để các bước sau sử dụng
      }
    } catch (error: any) {
      console.error("Store Info Error:", error);
      message.error(error.message || "Không thể lưu thông tin cửa hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ businessType: "restaurant" }}
    >
      {/* Section 1: Hình ảnh */}
      <div style={{ marginBottom: 32 }}>
        <Divider orientation="horizontal">
          <Space>
            <PictureOutlined /> <Text strong>Hình ảnh thương hiệu</Text>
          </Space>
        </Divider>

        <Row gutter={32}>
          <Col xs={24} md={8}>
            <Form.Item
              name="logoUrl"
              label={<Text strong>Logo cửa hàng</Text>}
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: "Vui lòng tải logo!" }]}
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
                onChange={({ fileList }) => setLogoFileList(fileList)}
              >
                {logoFileList.length < 1 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải logo</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item
              name="coverImageUrl"
              label={<Text strong>Ảnh bìa (Banner)</Text>}
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: "Vui lòng tải ảnh bìa!" }]}
            >
              <Dragger
                maxCount={1}
                beforeUpload={() => false}
                onChange={({ fileList }) => setCoverFileList(fileList)}
                style={{
                  borderRadius: 12,
                  background: "#fafafa",
                  height: "112px",
                }}
              >
                <p>
                  <CloudUploadOutlined
                    style={{ color: "#4CAF50", fontSize: 32 }}
                  />
                </p>
                <p className="ant-upload-text">Kéo thả ảnh bìa vào đây</p>
              </Dragger>
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Section 2: Thông tin chi tiết */}
      <Form.Item
        name="businessName"
        label="Tên Đối Tác / Cửa hàng"
        rules={[{ required: true, message: "Vui lòng nhập tên đối tác" }]}
      >
        <Input
          prefix={<ShopOutlined />}
          placeholder="VD: Tạp hóa Mỹ Dung"
          size="large"
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="Số điện thoại kinh doanh"
            rules={[
              { required: true, message: "Vui lòng nhập SĐT" },
              { pattern: /^0\d{9}$/, message: "SĐT không hợp lệ" },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="090..."
              size="large"
              maxLength={10}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="email"
            label="Email kinh doanh"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="contact@domain.com"
              size="large"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="taxCode" label="Mã số thuế (nếu có)">
        <Input
          prefix={<FileTextOutlined />}
          placeholder="Nhập mã số thuế"
          size="large"
        />
      </Form.Item>
      <Row gutter={[16, 16]} justify="center">
        {/* Nút 1: Hành động chính (Lưu & Tiếp tục) */}
        <Col xs={24} sm={12}>
          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            onClick={handleSubmit} // Hàm này xử lý Upload Cloudinary + Gọi API
            style={{
              borderRadius: 10,
              height: 48,
              fontSize: "16px",
              fontWeight: 600,
              backgroundColor: "#4CAF50",
              border: "none",
            }}
          >
            Lưu thông tin & Tiếp tục
          </Button>
        </Col>

        {/* Nút 2: Hành động phụ (Chỉ chuyển bước) */}
        <Col xs={24} sm={12}>
          <Button
            block
            size="large"
            onClick={next} // Chỉ chuyển step, không gọi API
            style={{
              borderRadius: 10,
              height: 48,
              fontSize: "16px",
              color: "#4CAF50",
              borderColor: "#4CAF50",
            }}
          >
            Tiếp Tục (Bỏ qua lưu)
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default StoreInfoStep;
