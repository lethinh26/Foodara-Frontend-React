import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  TimePicker,
  Switch,
  Tag,
  Typography,
  Divider,
  Tooltip,
  message,
} from "antd";
import { Clock, Copy, RotateCcw, Calendar, Briefcase, Sun, CalendarDays } from "lucide-react";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface OperatingHoursModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (hours: OperatingHour[]) => void;
  initialData?: OperatingHour[];
}

const DAY_LABELS: Record<number, { short: string; full: string }> = {
  1: { short: "T2", full: "Thứ 2" },
  2: { short: "T3", full: "Thứ 3" },
  3: { short: "T4", full: "Thứ 4" },
  4: { short: "T5", full: "Thứ 5" },
  5: { short: "T6", full: "Thứ 6" },
  6: { short: "T7", full: "Thứ 7" },
  0: { short: "CN", full: "Chủ nhật" },
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon -> Sun

const QUICK_PRESETS = [
  {
    label: "T2 - T6",
    days: [1, 2, 3, 4, 5],
    icon: Briefcase,
  },
  {
    label: "T7 - CN",
    days: [6, 0],
    icon: Sun,
  },
  {
    label: "Tất cả",
    days: [1, 2, 3, 4, 5, 6, 0],
    icon: CalendarDays,
  },
];

const DEFAULT_HOURS: OperatingHour[] = DAY_ORDER.map((day) => ({
  dayOfWeek: day,
  openTime: "08:00",
  closeTime: "22:00",
  isClosed: false,
}));

const timeFormat = "HH:mm";

const OperatingHoursModal: React.FC<OperatingHoursModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const [hours, setHours] = useState<OperatingHour[]>(DEFAULT_HOURS);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [batchOpenTime, setBatchOpenTime] = useState<dayjs.Dayjs | null>(
    dayjs("08:00", timeFormat)
  );
  const [batchCloseTime, setBatchCloseTime] = useState<dayjs.Dayjs | null>(
    dayjs("22:00", timeFormat)
  );

  // Initialize from existing data
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const mapped = DAY_ORDER.map((day) => {
        const found = initialData.find((d) => d.dayOfWeek === day);
        return found
          ? { ...found }
          : {
              dayOfWeek: day,
              openTime: "08:00",
              closeTime: "22:00",
              isClosed: false,
            };
      });
      setHours(mapped);
    } else {
      setHours(DEFAULT_HOURS);
    }
    setSelectedDays([]);
  }, [initialData, open]);

  const toggleDaySelection = useCallback((day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const selectPreset = useCallback((days: number[]) => {
    setSelectedDays((prev) => {
      const allSelected = days.every((d) => prev.includes(d));
      if (allSelected) {
        return prev.filter((d) => !days.includes(d));
      }
      return [...new Set([...prev, ...days])];
    });
  }, []);

  const applyBatchTime = useCallback(() => {
    if (selectedDays.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 ngày");
      return;
    }
    if (!batchOpenTime || !batchCloseTime) {
      message.warning("Vui lòng chọn giờ mở và đóng cửa");
      return;
    }
    setHours((prev) =>
      prev.map((h) =>
        selectedDays.includes(h.dayOfWeek)
          ? {
              ...h,
              openTime: batchOpenTime.format(timeFormat),
              closeTime: batchCloseTime.format(timeFormat),
              isClosed: false,
            }
          : h
      )
    );
    message.success(
      `Đã áp dụng cho ${selectedDays.map((d) => DAY_LABELS[d].short).join(", ")}`
    );
    setSelectedDays([]);
  }, [selectedDays, batchOpenTime, batchCloseTime]);

  const setBatchClosed = useCallback(() => {
    if (selectedDays.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 ngày");
      return;
    }
    setHours((prev) =>
      prev.map((h) =>
        selectedDays.includes(h.dayOfWeek) ? { ...h, isClosed: true } : h
      )
    );
    message.success(
      `Đã đặt nghỉ cho ${selectedDays.map((d) => DAY_LABELS[d].short).join(", ")}`
    );
    setSelectedDays([]);
  }, [selectedDays]);

  const updateSingleDay = useCallback(
    (
      dayOfWeek: number,
      field: "openTime" | "closeTime" | "isClosed",
      value: string | boolean
    ) => {
      setHours((prev) =>
        prev.map((h) =>
          h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
        )
      );
    },
    []
  );

  const copyToAll = useCallback(
    (sourceDayOfWeek: number) => {
      const source = hours.find((h) => h.dayOfWeek === sourceDayOfWeek);
      if (!source) return;
      setHours((prev) =>
        prev.map((h) => ({
          ...h,
          openTime: source.openTime,
          closeTime: source.closeTime,
          isClosed: source.isClosed,
        }))
      );
      message.success(
        `Đã sao chép lịch ${DAY_LABELS[sourceDayOfWeek].full} cho tất cả`
      );
    },
    [hours]
  );

  const resetAll = useCallback(() => {
    setHours(DEFAULT_HOURS);
    setSelectedDays([]);
    message.info("Đã đặt lại mặc định");
  }, []);

  const handleSave = () => {
    // Validate: check closeTime > openTime for non-closed days
    const invalid = hours.find(
      (h) =>
        !h.isClosed &&
        dayjs(h.closeTime, timeFormat).isBefore(dayjs(h.openTime, timeFormat))
    );
    if (invalid) {
      message.error(
        `${DAY_LABELS[invalid.dayOfWeek].full}: Giờ đóng phải sau giờ mở`
      );
      return;
    }
    onSave(hours);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={680}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={20} color="#4CAF50" />
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 16 }}>
              Giờ hoạt động
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Thiết lập lịch mở cửa cho quán
            </Text>
          </div>
        </div>
      }
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            icon={<RotateCcw size={14} />}
            onClick={resetAll}
            type="text"
            style={{ color: "#9E9E9E" }}
          >
            Đặt lại mặc định
          </Button>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onClose}>Huỷ</Button>
            <Button type="primary" onClick={handleSave}>
              Lưu lịch hoạt động
            </Button>
          </div>
        </div>
      }
      styles={{
        body: { padding: "16px 24px", maxHeight: "65vh", overflowY: "auto" },
        header: { padding: "16px 24px", borderBottom: "1px solid #EEEEEE" },
      }}
    >
      {/* ===== BATCH SECTION ===== */}
      <div
        style={{
          background: "#F5F5F5",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          border: "1px solid #E0E0E0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <Calendar size={15} color="#4CAF50" />
          <Text strong style={{ fontSize: 13, color: "#212121" }}>
            Áp dụng nhanh
          </Text>
          <Text
            type="secondary"
            style={{ fontSize: 12, marginLeft: 4 }}
          >
            — Chọn nhiều ngày, đặt cùng giờ
          </Text>
        </div>

        {/* Quick select presets */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {QUICK_PRESETS.map((preset) => {
            const allSelected = preset.days.every((d) =>
              selectedDays.includes(d)
            );
            const PresetIcon = preset.icon;
            return (
              <Button
                key={preset.label}
                size="small"
                type={allSelected ? "primary" : "default"}
                icon={<PresetIcon size={13} />}
                onClick={() => selectPreset(preset.days)}
                style={{
                  borderRadius: 8,
                  fontSize: 12,
                  height: 32,
                }}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>

        {/* Individual day pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {DAY_ORDER.map((day) => {
            const isSelected = selectedDays.includes(day);
            const isWeekend = day === 6 || day === 0;
            return (
              <div
                key={day}
                onClick={() => toggleDaySelection(day)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: isSelected
                    ? "2px solid #4CAF50"
                    : "1.5px solid #E0E0E0",
                  background: isSelected
                    ? "#4CAF50"
                    : "#fff",
                  color: isSelected ? "#fff" : isWeekend ? "#F44336" : "#212121",
                  fontWeight: 600,
                  fontSize: 13,
                  userSelect: "none",
                }}
              >
                {DAY_LABELS[day].short}
              </div>
            );
          })}
        </div>

        {/* Batch time inputs */}
        {selectedDays.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <TimePicker
              value={batchOpenTime}
              onChange={setBatchOpenTime}
              format={timeFormat}
              minuteStep={15}
              size="middle"
              placeholder="Giờ mở"
              style={{ width: 110, borderRadius: 8 }}
              needConfirm={false}
            />
            <Text style={{ color: "#9E9E9E" }}>→</Text>
            <TimePicker
              value={batchCloseTime}
              onChange={setBatchCloseTime}
              format={timeFormat}
              minuteStep={15}
              size="middle"
              placeholder="Giờ đóng"
              style={{ width: 110, borderRadius: 8 }}
              needConfirm={false}
            />
            <Button
              type="primary"
              size="middle"
              onClick={applyBatchTime}
              style={{ borderRadius: 8 }}
            >
              Áp dụng
            </Button>
            <Button
              size="middle"
              danger
              onClick={setBatchClosed}
              style={{ borderRadius: 8 }}
            >
              Đặt nghỉ
            </Button>
          </div>
        )}
      </div>

      {/* ===== PER-DAY LIST ===== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {DAY_ORDER.map((day) => {
          const h = hours.find((x) => x.dayOfWeek === day)!;
          const isWeekend = day === 6 || day === 0;
          return (
            <div
              key={day}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                background: h.isClosed
                  ? "#FAFAFA"
                  : isWeekend
                    ? "#FFF8E1"
                    : "#FAFAFA",
                border: h.isClosed
                  ? "1px solid #EEEEEE"
                  : isWeekend
                    ? "1px solid #FFF1B8"
                    : "1px solid #EEEEEE",
                opacity: h.isClosed ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {/* Day label */}
              <div style={{ width: 56, flexShrink: 0 }}>
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    color: isWeekend ? "#FFC107" : "#212121",
                  }}
                >
                  {DAY_LABELS[day].full}
                </Text>
              </div>

              {/* Open/Close toggle */}
              <Switch
                checked={!h.isClosed}
                onChange={(checked) =>
                  updateSingleDay(day, "isClosed", !checked)
                }
                checkedChildren="Mở"
                unCheckedChildren="Nghỉ"
                size="small"
              />

              {/* Time pickers */}
              {!h.isClosed ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <TimePicker
                    value={dayjs(h.openTime, timeFormat)}
                    onChange={(val) =>
                      updateSingleDay(
                        day,
                        "openTime",
                        val?.format(timeFormat) || "08:00"
                      )
                    }
                    format={timeFormat}
                    minuteStep={15}
                    size="small"
                    style={{ width: 90, borderRadius: 6 }}
                    needConfirm={false}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    đến
                  </Text>
                  <TimePicker
                    value={dayjs(h.closeTime, timeFormat)}
                    onChange={(val) =>
                      updateSingleDay(
                        day,
                        "closeTime",
                        val?.format(timeFormat) || "22:00"
                      )
                    }
                    format={timeFormat}
                    minuteStep={15}
                    size="small"
                    style={{ width: 90, borderRadius: 6 }}
                    needConfirm={false}
                  />
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: 6,
                      margin: 0,
                      fontSize: 11,
                    }}
                  >
                    {(() => {
                      const open = dayjs(h.openTime, timeFormat);
                      const close = dayjs(h.closeTime, timeFormat);
                      const diff = close.diff(open, "hour", true);
                      return diff > 0
                        ? `${diff.toFixed(1)}h`
                        : "—";
                    })()}
                  </Tag>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <Tag
                    color="default"
                    style={{
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#9E9E9E",
                    }}
                  >
                    Nghỉ cả ngày
                  </Tag>
                </div>
              )}

              {/* Copy action */}
              {!h.isClosed && (
                <Tooltip title="Sao chép cho tất cả các ngày">
                  <Button
                    type="text"
                    size="small"
                    icon={<Copy size={13} />}
                    onClick={() => copyToAll(day)}
                    style={{
                      color: "#9E9E9E",
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <Divider style={{ margin: "16px 0 12px" }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Tổng kết:
        </Text>
        {hours.filter((h) => !h.isClosed).length > 0 ? (
          <>
            <Tag color="green" style={{ borderRadius: 6 }}>
              {hours.filter((h) => !h.isClosed).length} ngày mở cửa
            </Tag>
            {hours.filter((h) => h.isClosed).length > 0 && (
              <Tag color="default" style={{ borderRadius: 6 }}>
                {hours.filter((h) => h.isClosed).length} ngày nghỉ
              </Tag>
            )}
          </>
        ) : (
          <Tag color="red" style={{ borderRadius: 6 }}>
            Tất cả ngày đều nghỉ
          </Tag>
        )}
      </div>
    </Modal>
  );
};

export default OperatingHoursModal;
