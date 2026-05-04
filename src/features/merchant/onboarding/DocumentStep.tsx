import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  message,
  Typography,
  Card,
  Spin,
  Upload,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { Upload as UploadIcon } from "lucide-react";
import { uploadToCloudinary } from "../../../services/uploadService";
import { merchantService } from "../../../services/merchantService";

const { Title, Text } = Typography;

interface DocumentStepProps {
  onBack: () => void;
  onSuccess: () => void;
}

const DocumentStep: React.FC<DocumentStepProps> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, string>
  >({});
  const [form] = Form.useForm();

  // 1. Logic lấy tài liệu đã có khi vừa vào trang
  useEffect(() => {
    const fetchAndCheckDocs = async () => {
      try {
        setLoading(true);
        const response = await merchantService.getDocuments();

        if (response && Array.isArray(response)) {
          const docsMap: Record<string, string> = {};
          response.forEach((doc: any) => {
            docsMap[doc.documentType] = doc.documentUrl;
          });

          setUploadedDocuments(docsMap);

          // LOGIC KIỂM TRA ĐỂ TỰ ĐỘNG NEXT
          const hasAllFour =
            docsMap.business_license &&
            docsMap.food_safety_cert &&
            docsMap.id_card_front &&
            docsMap.id_card_back;

          if (hasAllFour) {
            onSuccess(); // Tự động chuyển sang bước tiếp theo
            // message.loading("Đang xác thực hồ sơ...", 1).then(() => {
            // });
          }
        }
      } catch (error) {
        console.error("Lỗi fetch tài liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCheckDocs();
  }, []); // Chỉ chạy 1 lần khi component mount

  // 2. Kiểm tra xem các tài liệu BẮT BUỘC đã đủ chưa
  // business_license và food_safety_cert là bắt buộc
  const isReadyToNext = !!(
    uploadedDocuments.business_license && uploadedDocuments.food_safety_cert
  );

  const handleCustomUpload = async (file: File, type: string) => {
    try {
      setLoading(true);
      const url = await uploadToCloudinary(file);

      await merchantService.uploadDocument({
        documentType: type as any,
        documentUrl: url,
      });

      setUploadedDocuments((prev) => ({ ...prev, [type]: url }));
      message.success("Tải lên tài liệu thành công");
    } catch (error: any) {
      message.error(error.message || "Tải tài liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const getUploadProps = (type: string) => ({
    name: "file",
    multiple: false,
    showUploadList: false,
    customRequest: ({ file }: any) => handleCustomUpload(file as File, type),
    beforeUpload: (file: File) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("File phải nhỏ hơn 5MB");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
  });

  const renderDraggerContent = (type: string, label: string) => {
    const url = uploadedDocuments[type];
    if (url) {
      return (
        <div style={{ padding: "8px" }}>
          <CheckCircleFilled
            style={{ fontSize: 24, color: "#52c41a", marginBottom: 8 }}
          />
          <p style={{ color: "#52c41a", fontWeight: 500, margin: 0 }}>
            Đã có tài liệu
          </p>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Nhấp để tải lên bản mới
          </Text>
        </div>
      );
    }
    return (
      <div style={{ padding: "8px" }}>
        <p>
          <UploadIcon size={28} color="#bfbfbf" />
        </p>
        <p style={{ margin: "4px 0", fontSize: 13 }}>{label}</p>
        <Text type="secondary" style={{ fontSize: 11 }}>
          PDF, JPG, PNG (Tối đa 5MB)
        </Text>
      </div>
    );
  };

  return (
    <Spin spinning={loading} tip="Đang xử lý tài liệu...">
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <Title level={4}>Hồ sơ pháp lý</Title>
          <Text type="secondary">
            Tải lên các giấy tờ cần thiết để xác minh cửa hàng của bạn.
          </Text>
        </div>

        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                label={
                  <strong>
                    Giấy phép kinh doanh (GPLĐ){" "}
                    <span style={{ color: "red" }}>*</span>
                  </strong>
                }
                validateStatus={
                  uploadedDocuments.business_license ? "success" : ""
                }
                help={
                  uploadedDocuments.business_license ? "Hợp lệ" : "Bắt buộc"
                }
              >
                <Upload.Dragger
                  {...getUploadProps("business_license")}
                  style={{ borderRadius: 8, background: "#fafafa" }}
                >
                  {renderDraggerContent(
                    "business_license",
                    "Tải lên Giấy phép kinh doanh",
                  )}
                </Upload.Dragger>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label={
                  <strong>
                    Giấy chứng nhận ATTP <span style={{ color: "red" }}>*</span>
                  </strong>
                }
                validateStatus={
                  uploadedDocuments.food_safety_cert ? "success" : ""
                }
                help={
                  uploadedDocuments.food_safety_cert ? "Hợp lệ" : "Bắt buộc"
                }
              >
                <Upload.Dragger
                  {...getUploadProps("food_safety_cert")}
                  style={{ borderRadius: 8, background: "#fafafa" }}
                >
                  {renderDraggerContent(
                    "food_safety_cert",
                    "Tải lên Giấy chứng nhận ATTP",
                  )}
                </Upload.Dragger>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label={<strong>CCCD (Mặt trước)</strong>}>
                <Upload.Dragger
                  {...getUploadProps("id_card_front")}
                  style={{ borderRadius: 8 }}
                >
                  {renderDraggerContent("id_card_front", "Tải lên mặt trước")}
                </Upload.Dragger>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label={<strong>CCCD (Mặt sau)</strong>}>
                <Upload.Dragger
                  {...getUploadProps("id_card_back")}
                  style={{ borderRadius: 8 }}
                >
                  {renderDraggerContent("id_card_back", "Tải lên mặt sau")}
                </Upload.Dragger>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Button
              onClick={onBack}
              size="large"
              icon={<ArrowLeftOutlined />}
              style={{ borderRadius: 8, minWidth: 120 }}
            >
              Quay lại
            </Button>

            <Button
              type="primary"
              onClick={onSuccess}
              size="large"
              // Chỉ cho phép Next khi đã có 2 tài liệu bắt buộc
              disabled={!isReadyToNext}
              style={{
                borderRadius: 8,
                minWidth: 150,
                backgroundColor: isReadyToNext ? "#4CAF50" : "#d9d9d9",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Tiếp tục <ArrowRightOutlined style={{ marginLeft: 8 }} />
            </Button>
          </div>

          {!isReadyToNext && (
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <Text type="danger" style={{ fontSize: 12 }}>
                * Bạn cần tải lên GPLĐ và Giấy ATTP để tiếp tục
              </Text>
            </div>
          )}
        </Form>
      </Card>
    </Spin>
  );
};

export default DocumentStep;
