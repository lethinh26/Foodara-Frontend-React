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
  Skeleton,
} from "antd";
import { Store, Clock, Phone, MapPin, Mail } from "lucide-react";
import { merchantMenuApi, merchantService } from "../../../services/merchantService";
import type {
  MerchantProfileResponse,
  StoreOperatingHoursRequest,
  StoreResponse,
  StoreUpdateRequest,
} from "../../../types/merchant";
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

interface ProfileFormValues {
  storeId: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  prepTime: number;
  logo: string;
  coverImage: string;
}

const MerchantProfilePage: React.FC = () => {
  const [merchant, setMerchant] = useState<MerchantProfileResponse | null>(null);
  const [primaryStore, setPrimaryStore] = useState<StoreResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [snapshot, setSnapshot] = useState<{
    formValues: ProfileFormValues;
    operatingHours: OperatingHour[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm<ProfileFormValues>();

  const buildFormValues = (
    m: MerchantProfileResponse,
    s: StoreResponse | null,
  ): ProfileFormValues => ({
    storeId: s?.id ?? "",
    name: s?.name ?? m.name,
    description: s?.description ?? "",
    address: s?.addressLine ?? "",
    phone: s?.phone ?? m.businessPhone,
    email: m.businessEmail,
    prepTime: s?.avgPreparationTime ?? 0,
    logo: s?.logoUrl ?? m.logoUrl,
    coverImage: s?.coverImageUrl ?? m.coverImageUrl,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const merchantData = await merchantService.getProfile();
        setMerchant(merchantData);

        const stores = await merchantService.getStores();
        const first = stores[0] ?? null;
        setPrimaryStore(first);

        if (first) {
          const hours = await merchantService.getOperatingHours(first.id);
          setOperatingHours(
            hours.map((o) => ({
              dayOfWeek: o.dayOfWeek,
              openTime: o.openTime,
              closeTime: o.closeTime,
              isClosed: o.isClosed,
            })),
          );
        }

        form.setFieldsValue(buildFormValues(merchantData, first));
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Không thể tải thông tin";
        message.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [form]);

  const handleSave = async (values: ProfileFormValues) => {
    if (!values.storeId) {
      message.error("Chưa có chi nhánh để cập nhật");
      return;
    }
    setSaving(true);
    try {
      const update: StoreUpdateRequest = {
        name: values.name,
        description: values.description,
        addressLine: values.address,
        phone: values.phone,
        coverImageUrl: values.coverImage,
        logoUrl: values.logo,
        avgPreparationTime: Number(values.prepTime),
      };
      const updated = await merchantService.updateStore(values.storeId, update);
      setPrimaryStore(updated);

      if (operatingHours.length > 0) {
        const payload: StoreOperatingHoursRequest[] = operatingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        }));
        await merchantService.updateOperatingHours(values.storeId, payload);
      }

      message.success("Đã lưu thay đổi");
      setEditing(false);
      setSnapshot(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không thể lưu thông tin";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async () => {
    if (!primaryStore) return;
    try {
      const updated = await merchantService.toggleStore(primaryStore.id);
      setPrimaryStore(updated);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không thể đổi trạng thái";
      message.error(msg);
    }
  };

  const handleEditToggle = () => {
    if (!editing) {
      setSnapshot({
        formValues: form.getFieldsValue(),
        operatingHours: [...operatingHours],
      });
      setEditing(true);
    } else {
      if (snapshot) {
        form.setFieldsValue(snapshot.formValues);
        setOperatingHours(snapshot.operatingHours);
      }
      setEditing(false);
    }
  };

  const summaryGroups = (() => {
    if (operatingHours.length === 0) return null;
    const sorted = DAY_ORDER.map(
      (d) =>
        operatingHours.find((h) => h.dayOfWeek === d) ?? {
          dayOfWeek: d,
          openTime: "",
          closeTime: "",
          isClosed: true,
        },
    );
    const groups: {
      days: number[];
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }[] = [];
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
  })();

  if (loading) return <Skeleton active />;

  if (!merchant) {
    return (
      <div className="animate-fade-in">
        <Title level={4}>Hồ sơ đối tác</Title>
        <Card>
          <Text type="secondary">Chưa có hồ sơ merchant. Vui lòng đăng ký trước.</Text>
        </Card>
      </div>
    );
  }

  const isOpen = primaryStore?.isOpen ?? false;

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
              onChange={toggleOpen}
              checkedChildren="Mở"
              unCheckedChildren="Đóng"
              disabled={!primaryStore}
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
        {(primaryStore?.coverImageUrl ?? merchant.coverImageUrl) && (
          <img
            src={primaryStore?.coverImageUrl ?? merchant.coverImageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
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
            src={primaryStore?.logoUrl ?? merchant.logoUrl}
            size={64}
            style={{ border: "3px solid white" }}
          />
          <div>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>
              {primaryStore?.name ?? merchant.name}
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
        extra={<Button onClick={handleEditToggle}>{editing ? "Hủy" : "Sửa"}</Button>}
      >
        <Form<ProfileFormValues>
          form={form}
          layout="vertical"
          disabled={!editing}
          onFinish={handleSave}
        >
          <Form.Item name="storeId" hidden>
            <Input />
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
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="phone" label="Số điện thoại" style={{ flex: 1 }}>
              <Input prefix={<Phone size={14} />} />
            </Form.Item>
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input prefix={<Mail size={14} />} disabled />
            </Form.Item>
          </div>
          <Form.Item name="prepTime" label="TG chuẩn bị (phút)">
            <InputPrep />
          </Form.Item>

          {/* Operating Hours */}
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
              >
                {summaryGroups && summaryGroups.length > 0 ? "Chỉnh sửa" : "Thiết lập"}
              </Button>
            </div>

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
                        <Text type="secondary" style={{ fontSize: 12 }}>
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
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu thay đổi
            </Button>
          )}
        </Form>
      </Card>

      <OperatingHoursModal
        open={hoursModalOpen}
        onClose={() => setHoursModalOpen(false)}
        onSave={(hours) => setOperatingHours(hours)}
        initialData={operatingHours}
      />
    </div>
  );
};

// Wrapper to pass-through Input as numeric without breaking AntD Form binding
const InputPrep: React.FC<{ value?: number; onChange?: (val: number) => void }> = ({
  value,
  onChange,
}) => (
  <Input
    type="number"
    min={0}
    value={value ?? ""}
    onChange={(e) => onChange?.(Number(e.target.value))}
  />
);

export default MerchantProfilePage;
