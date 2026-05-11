import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Typography,
  message,
  Space,
  Tag,
  Avatar,
} from "antd";
import { Store, Clock, Phone, MapPin, Mail } from "lucide-react";
import { merchantService } from "../../../services/merchantService";
import type { MerchantProfileResponse, StoreOperatingHoursRequest, StoreOperatingHoursResponse, StoreResponse, StoreUpdateRequest } from "../../../types/merchant";
import OperatingHoursModal from "./OperatingHoursModal";

const { Title, Text } = Typography;

const DAY_LABELS: Record<number, string> = {
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
  0: "CN",
};
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface profile{
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    approvalStatus: string;
    prepTime: number;
    logo: string;
    coverImage: string;
    commissionRate: number;
    settlementCycle: string;
    bankName: string;
    bankAccount: string;
}


const MerchantProfilePage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [originalOperatingHours, setOriginalOperatingHours] = useState<OperatingHour[]>([]);
  const [originalFormValues, setOriginalFormValues] = useState<any>(null);

  const [profile, setProfile] = useState<profile>({
    name: "Phở Hà Nội Xưa",
    description: "Phở truyền thống Hà Nội, nước dùng ninh xương 12 tiếng",
    address: "123 Nguyễn Trãi, Quận 1, TP.HCM",
    phone: "0901111222",
    email: "merchant@gmail.com",
    approvalStatus: "pending",
    prepTime: 10,
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=PHX",
    coverImage:
      "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=800",
    commissionRate: 20,
    settlementCycle: "Hàng tuần",
    bankName: "Vietcombank",
    bankAccount: "****5678",
  });




  const [form] = Form.useForm();
  const [storeId, setStoreId] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const merchant: MerchantProfileResponse = await merchantService.getProfile();

        setProfile({
          ...profile,
          name: merchant.name,
          phone: merchant.businessPhone,
          email: merchant.businessEmail,
          approvalStatus: merchant.approvalStatus,
          coverImage: merchant.coverImageUrl,
          logo: merchant.logoUrl,
        })        

        

        const store : StoreResponse[] = await merchantService.getStores();
        if(store && store[0]){
          profile.name = store[0].name;
          profile.description = store[0].description;
          profile.address = store[0].addressLine;
          profile.phone = store[0].phone;
          profile.coverImage = store[0].coverImageUrl;
          profile.logo = store[0].logoUrl;
          profile.prepTime = store[0].avgPreparationTime;
          setStoreId(store[0].id);

          const operation : StoreOperatingHoursResponse[] = await merchantService.getOperatingHours(store[0].id);
          if(operation && operation.length > 0){
            setOperatingHours(
              operation.map((o) => ({
                dayOfWeek: o.dayOfWeek,
                openTime: o.openTime,
                closeTime: o.closeTime,
                isClosed: o.isClosed,
              }))
            );
          }
        }

        form.setFieldsValue({...profile, storeId: store[0]?.id});
        
      } catch (error) {
        message.error("Không thể tải thông tin profile");
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const values = form.getFieldsValue();
      
      const store : StoreUpdateRequest = {
        name: values.name,
        description: values.description,
        addressLine: values.address,
        phone: values.phone,
        coverImageUrl: values.coverImage,
        logoUrl: values.logo,
        avgPreparationTime: values.prepTime,
      }
      if(store){
        console.log(store);
        
        await merchantService.updateStore(values.storeId || storeId, store);
        console.log(2);
      }

      // update store operating hours
      console.log(operatingHours);
      if (operatingHours.length > 0) {
        const hoursPayload: StoreOperatingHoursRequest[] = operatingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        }));
        await merchantService.updateOperatingHours(values.storeId || storeId, hoursPayload);
        console.log(3);
      }

      message.success("Đã lưu!");
      setEditing(false);
    } catch (error) {
      message.error("Không thể lưu thông tin");
    }
  }

  // Group consecutive days with same hours for summary display
  const getOperatingHoursSummary = () => {
    if (operatingHours.length === 0) return null;

    const sorted = DAY_ORDER.map(
      (d) =>
        operatingHours.find((h) => h.dayOfWeek === d) || {
          dayOfWeek: d,
          openTime: "",
          closeTime: "",
          isClosed: true,
        }
    );

    // Group days with same schedule
    const groups: { days: number[]; openTime: string; closeTime: string; isClosed: boolean }[] = [];

    sorted.forEach((h) => {
      const last = groups[groups.length - 1];
      if (
        last &&
        last.openTime === h.openTime &&
        last.closeTime === h.closeTime &&
        last.isClosed === h.isClosed
      ) {
        last.days.push(h.dayOfWeek);
      } else {
        groups.push({
          days: [h.dayOfWeek],
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        });
      }
    });

    return groups;
  };

  const summaryGroups = getOperatingHoursSummary();

  const handleEdit = () => {
    if (!editing) {
      // Bắt đầu edit: Lưu lại dữ liệu hiện tại
      setOriginalOperatingHours([...operatingHours]);
      setOriginalFormValues(form.getFieldsValue());
      setEditing(true);
    } else {
      // Hủy edit: Khôi phục lại dữ liệu cũ
      setOperatingHours(originalOperatingHours);
      if (originalFormValues) {
        form.setFieldsValue(originalFormValues);
      }
      setEditing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Hồ sơ đối tác
        </Title>
        <Space>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text>Trạng thái quán:</Text>
            <Switch
              checked={isOpen}
              onChange={(v) => {
                setIsOpen(v);
                message.success(v ? "Đã mở quán" : "Đã đóng quán");
              }}
              checkedChildren="Mở"
              unCheckedChildren="Đóng"
            />
          </div>
        </Space>
      </div>

      <div
        style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 24,
          height: 200,
        }}
      >
        <img
          src={profile.coverImage}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Avatar
            src={profile.logo}
            size={64}
            style={{ border: "3px solid white" }}
          />
          <div>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>
              {profile.name}
            </Text>
            <br />
            <Tag color={isOpen ? "green" : "red"}>
              {isOpen ? "Đang mở" : "Đã đóng"}
            </Tag>
          </div>
        </div>
      </div>

      <Card
        title="Thông tin cơ bản"
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={
          <Button onClick={handleEdit}>
            {editing ? "Huỷ" : "Sửa"}
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          disabled={!editing}
          initialValues={profile}
          onFinish={handleSave}
        >
          <Form.Item name="storeId" label="Store ID" hidden>
            <Input prefix={<Store size={14} />} />
          </Form.Item>
          <Form.Item name="name" label="Tên quán">
            <Input prefix={<Store size={14} />} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input prefix={<MapPin size={14} />} />
          </Form.Item>
          <div style={{display: "flex", gap: 16}}>
            <Form.Item name="phone" label="Số điện thoại" style={{ flex: 1 }}>
              <Input prefix={<Phone size={14} />} />
            </Form.Item>
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input prefix={<Mail size={14} />} />
            </Form.Item>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <Form.Item
              name="prepTime"
              label="TG chuẩn bị (phút)"
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
          </div>

          {/* Operating Hours Section */}
          <div
            style={{
              marginTop: 4,
              marginBottom: 16,
              padding: 16,
              borderRadius: 8,
              background: "#F5F5F5",
              border: "1px solid #E0E0E0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: summaryGroups && summaryGroups.length > 0 ? 12 : 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#4CAF50" />
                <div>
                  <Text strong style={{ fontSize: 14 }}>
                    Giờ hoạt động
                  </Text>
                  {(!summaryGroups || summaryGroups.length === 0) && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Chưa thiết lập giờ mở cửa
                      </Text>
                    </div>
                  )}
                </div>
              </div>
              <Button
                type="primary"
                size="small"
                icon={<Clock size={13} />}
                onClick={() => setHoursModalOpen(true)}
                disabled={!editing}
                style={{
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                {summaryGroups && summaryGroups.length > 0
                  ? "Chỉnh sửa"
                  : "Thiết lập"}
              </Button>
            </div>

            {/* Summary display */}
            {summaryGroups && summaryGroups.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {summaryGroups.map((group, idx) => {
                  const dayRange =
                    group.days.length === 1
                      ? DAY_LABELS[group.days[0]]
                      : `${DAY_LABELS[group.days[0]]} - ${DAY_LABELS[group.days[group.days.length - 1]]}`;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: group.isClosed
                          ? "rgba(0,0,0,0.03)"
                          : "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <Tag
                        color={group.isClosed ? "default" : "green"}
                        style={{
                          borderRadius: 6,
                          margin: 0,
                          fontWeight: 600,
                          fontSize: 12,
                          minWidth: 64,
                          textAlign: "center",
                        }}
                      >
                        {dayRange}
                      </Tag>
                      {group.isClosed ? (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          Nghỉ
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 13 }}>
                          <span style={{ color: "#52c41a", fontWeight: 600 }}>
                            {group.openTime}
                          </span>
                          {" → "}
                          <span style={{ color: "#f5222d", fontWeight: 600 }}>
                            {group.closeTime}
                          </span>
                        </Text>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {editing && (
            <Button type="primary" htmlType="submit">
              Lưu thay đổi
            </Button>
          )}
        </Form>
      </Card>

      <Card title="Thông tin hợp đồng" style={{ borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Tỷ lệ hoa hồng</Text>
            <Text strong>{profile.commissionRate}%</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Chu kỳ đối soát</Text>
            <Text strong>{profile.settlementCycle}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Ngân hàng</Text>
            <Text strong>{profile.bankName}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Số tài khoản</Text>
            <Text strong>{profile.bankAccount}</Text>
          </div>
        </Space>
      </Card>

      {/* Operating Hours Modal */}
      <OperatingHoursModal
        open={hoursModalOpen}
        onClose={() => setHoursModalOpen(false)}
        onSave={(hours) => setOperatingHours(hours)}
        initialData={operatingHours}
      />
    </div>
  );
};

export default MerchantProfilePage;
