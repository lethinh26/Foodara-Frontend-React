/**
 * Format a number as Vietnamese Dong currency
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a number with thousand separators
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Format distance in km
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

/**
 * Format delivery time estimate
 */
export const formatETA = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}p` : `${hours} giờ`;
};

/**
 * Format date with dayjs
 */
export const formatDate = (date: string, format: string = 'DD/MM/YYYY'): string => {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const replacements: Record<string, string> = {
    'DD': pad(d.getDate()),
    'MM': pad(d.getMonth() + 1),
    'YYYY': d.getFullYear().toString(),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds()),
  };

  let result = format;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(key, value);
  }
  return result;
};

/**
 * Format relative time (e.g., "2 phút trước")
 */
export const formatRelativeTime = (date: string): string => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return formatDate(date);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format phone number display
 */
export const formatPhone = (phone: string): string => {
  if (phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  return phone;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};
