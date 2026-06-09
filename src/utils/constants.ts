export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  ready_for_pickup: 'Sẵn sàng lấy hàng',
  driver_assigned: 'Tài xế đã nhận',
  driver_at_store: 'Tài xế đến quán',
  picked_up: 'Đã lấy hàng',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
  failed: 'Thất bại',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#FFC107',
  confirmed: '#2196F3',
  ready_for_pickup: '#9C27B0',
  driver_assigned: '#2196F3',
  driver_at_store: '#2196F3',
  picked_up: '#00BCD4',
  delivering: '#4CAF50',
  delivered: '#4CAF50',
  cancelled: '#F44336',
  failed: '#F44336',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng',
  ewallet: 'Ví điện tử',
  card: 'Thẻ tín dụng / ghi nợ',
  bank_transfer: 'Chuyển khoản ngân hàng',
  qr: 'Quét mã QR',
};

export const VIETNAMESE_PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Long An', 'Bà Rịa - Vũng Tàu',
];

export const RESTAURANT_CATEGORIES = [
  { id: 'cat-1', name: 'Cơm', icon: 'UtensilsCrossed' },
  { id: 'cat-2', name: 'Phở & Bún', icon: 'Soup' },
  { id: 'cat-3', name: 'Trà sữa', icon: 'CupSoda' },
  { id: 'cat-4', name: 'Cà phê', icon: 'Coffee' },
  { id: 'cat-5', name: 'Bánh mì', icon: 'Sandwich' },
  { id: 'cat-6', name: 'Pizza & Burger', icon: 'Pizza' },
  { id: 'cat-7', name: 'Gà rán', icon: 'Drumstick' },
  { id: 'cat-8', name: 'Lẩu & Nướng', icon: 'Flame' },
  { id: 'cat-9', name: 'Chay', icon: 'Leaf' },
  { id: 'cat-10', name: 'Tráng miệng', icon: 'IceCreamCone' },
  { id: 'cat-11', name: 'Ăn vặt', icon: 'Popcorn' },
  { id: 'cat-12', name: 'Healthy', icon: 'Salad' },
];

export const SORT_OPTIONS = [
  { label: 'Gần nhất', value: 'distance' },
  { label: 'Phổ biến nhất', value: 'popular' },
  { label: 'Đánh giá cao', value: 'rating' },
  { label: 'Giá rẻ nhất', value: 'delivery_fee' },
  { label: 'Giao nhanh nhất', value: 'eta' },
];

export const ROLES = {
  CUSTOMER: 'customer' as const,
  MERCHANT: 'merchant' as const,
  ADMIN: 'admin' as const,
};
