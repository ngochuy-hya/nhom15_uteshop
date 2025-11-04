import crypto from 'crypto';

// Tạo mã OTP 6 chữ số
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Tạo mã OTP với độ dài tùy chỉnh
export const generateCustomOTP = (length: number = 6): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max).toString();
};

// Tạo token ngẫu nhiên
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash OTP để lưu vào database
export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// So sánh OTP
export const compareOTP = (otp: string, hashedOTP: string): boolean => {
  const hashedInput = hashOTP(otp);
  return hashedInput === hashedOTP;
};

// Tạo thời gian hết hạn cho OTP
export const getOTPExpiryTime = (minutes: number = 15): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// Kiểm tra OTP có hết hạn không
export const isOTPExpired = (expiryTime: string): boolean => {
  return new Date() > new Date(expiryTime);
};
