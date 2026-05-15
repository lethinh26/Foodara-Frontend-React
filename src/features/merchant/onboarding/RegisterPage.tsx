import React, { useState } from "react";
import { Card, Steps, Form, Typography, message } from "antd";
import {
  Upload as UploadIcon,
  CheckCircle2,
  Store,
  FileText,
  Building2,
} from "lucide-react";
import { uploadToCloudinary } from "../../../services/uploadService";
import StoreInfoStep from "./StoreInfoStep";
import DocumentStep from "./DocumentStep";
import BankStep from "./BankStep";
import CompleteStep from "./CompleteStep";
import Spin from "antd/lib/spin";

const { Title, Paragraph } = Typography;

const RegisterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const next = () => setCurrentStep((prev) => prev + 1);
  const prev = () => setCurrentStep((prev) => prev - 1);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [documentsForm] = Form.useForm();
  const [bankForm] = Form.useForm();
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, string>
  >({});
  const [messageApi, contextHolder] = message.useMessage();

  const steps = [
    { title: "Thông tin quán", icon: <Store size={16} /> },
    { title: "Giấy tờ", icon: <FileText size={16} /> },
    { title: "Tài khoản ngân hàng", icon: <Building2 size={16} /> },
    { title: "Hoàn tất", icon: <CheckCircle2 size={16} /> },
  ];

  const handleStoreInfoSubmit = async (values: any) => {
    setLoading(true);
    try {
      const logoFile = values.logoUrl?.[0]?.originFileObj;
      const coverFile = values.coverImageUrl?.[0]?.originFileObj;

      let finalLogoUrl = "";
      let finalCoverImageUrl = "";
      const uploadPromises = [];

      if (logoFile) {
        uploadPromises.push(
          uploadToCloudinary(logoFile).then(url => finalLogoUrl = url)
        );
      }

      if (coverFile) {
        uploadPromises.push(
          uploadToCloudinary(coverFile).then(url => finalCoverImageUrl = url)
        );
      }

      await Promise.all(uploadPromises);

      const finalData = {
        ...values,
        logoUrl: finalLogoUrl,           // Ghi đè list file bằng URL thật
        coverImageUrl: finalCoverImageUrl // Ghi đè list file bằng URL thật
      };

      // console.log('Dữ liệu gửi về Server:', finalData);
      message.success('Đăng ký thông tin cửa hàng thành công!');
      next()
    } catch (error) {
      console.error("Lỗi hoàn tất form:", error);
      message.error('Tải ảnh hoặc lưu dữ liệu thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Spin spinning={loading} tip="Đang xử lý thông tin và tải ảnh lên...">
      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          padding: "24px 16px",
        }}
      >
        {contextHolder}
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src="/logo/primary_logo.png"
              alt="Foodara"
              style={{ height: 40, marginBottom: 16 }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <Title level={3} style={{ margin: 0 }}>
              Đăng ký đối tác Foodara
            </Title>
            <Paragraph type="secondary">
              Trở thành đối tác của chúng tôi để mở rộng kinh doanh
            </Paragraph>
          </div>

          <Steps
            current={currentStep}
            style={{ marginBottom: 32 }}
            items={steps.map((step) => ({
              title: step.title,
            }))}
          />

          {currentStep === 0 && (
            <Card style={{ borderRadius: 12 }}>
              <StoreInfoStep onSuccess={handleStoreInfoSubmit} next={next} />
            </Card>
          )}
          {currentStep === 1 && <DocumentStep onBack={prev} onSuccess={next} />}
          {currentStep === 2 && <BankStep onBack={prev} onSuccess={next} />}
          {currentStep === 3 && <CompleteStep />}
        </div>
      </div>
    </Spin>
  );
};

export default RegisterPage;
