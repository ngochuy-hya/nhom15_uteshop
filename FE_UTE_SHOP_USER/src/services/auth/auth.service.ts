/**
 * Authentication Service
 * Service để gọi các API authentication từ backend
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../config/api';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '../../types/auth';

/**
 * Đăng ký tài khoản mới
 * @param data - Thông tin đăng ký
 * @returns Promise với response từ API
 */
export const register = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  try {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Đăng nhập
 * @param data - Thông tin đăng nhập (email, password)
 * @returns Promise với response chứa user và token
 */
export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Xác thực OTP sau khi đăng ký
 * @param data - Email và mã OTP
 * @returns Promise với response chứa user và token
 */
export const verifyOTP = async (
  data: VerifyOTPRequest
): Promise<VerifyOTPResponse> => {
  try {
    const response = await apiClient.post<VerifyOTPResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      data
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Gửi lại mã OTP
 * @param data - Email của user
 * @returns Promise với response xác nhận
 */
export const resendOTP = async (
  data: ResendOTPRequest
): Promise<ResendOTPResponse> => {
  try {
    const response = await apiClient.post<ResendOTPResponse>(
      API_ENDPOINTS.AUTH.RESEND_OTP,
      data
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Quên mật khẩu - Gửi OTP qua email
 * @param data - Email của user
 * @returns Promise với response xác nhận đã gửi OTP
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  try {
    const response = await apiClient.post<ForgotPasswordResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm tra user đã đăng nhập chưa
 * @returns boolean
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("authToken") || localStorage.getItem("access_token");
  const user = localStorage.getItem("app_user");
  return !!token && !!user;
};

/**
 * Lấy token hiện tại
 * @returns string | null
 */
export const getCurrentToken = (): string | null => {
  if (typeof window === "undefined") return null;
  // Thử lấy từ authToken trước, nếu không có thì lấy từ access_token
  return localStorage.getItem("authToken") || localStorage.getItem("access_token");
};

/**
 * Lấy user hiện tại
 * @returns User | null
 */
export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("app_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Export tất cả auth services
 */
export const authService = {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  isAuthenticated,
  getCurrentToken,
  getCurrentUser,
};

export default authService;

