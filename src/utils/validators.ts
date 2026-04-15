export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^(0[3-9])\d{8}$/;

export const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Email không được để trống';
  if (!EMAIL_REGEX.test(email)) return 'Email không hợp lệ';
  return undefined;
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone) return 'Số điện thoại không được để trống';
  if (!PHONE_REGEX.test(phone)) return 'Số điện thoại không hợp lệ (VD: 0912345678)';
  return undefined;
};

export const validateRequired = (value: string, fieldName: string = 'Trường này'): string | undefined => {
  if (!value || !value.trim()) return `${fieldName} không được để trống`;
  return undefined;
};

export const validateMinLength = (value: string, min: number, fieldName: string = 'Trường này'): string | undefined => {
  if (value.length < min) return `${fieldName} phải có ít nhất ${min} ký tự`;
  return undefined;
};

export const validateMaxLength = (value: string, max: number, fieldName: string = 'Trường này'): string | undefined => {
  if (value.length > max) return `${fieldName} không được quá ${max} ký tự`;
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Mật khẩu không được để trống';
  if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
  if (!/[A-Z]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
  if (!/[0-9]/.test(password)) return 'Mật khẩu phải chứa ít nhất 1 số';
  return undefined;
};

export const validateMinOrder = (total: number, minOrder: number): string | undefined => {
  if (total < minOrder) return `Đơn hàng tối thiểu ${minOrder.toLocaleString('vi-VN')}đ`;
  return undefined;
};
