/**
 * Authentication Types
 * Types for authentication API requests and responses
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * User information
 */
import { User } from '../user/user.types';

/**
 * JWT Token Payload
 */
export interface JWTPayload {
  userId: number;
  email: string;
  roleId: number;
  iat: number; // Issued at
  exp: number; // Expiration time
}

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
  error?: any; // Only in development mode
}

/**
 * Union type for API Response
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// REGISTER - ĐĂNG KÝ
// ============================================================================

/**
 * Register Request
 */
export interface RegisterRequest {
  email: string; // Email (bắt buộc, phải hợp lệ)
  password: string; // Mật khẩu (bắt buộc, tối thiểu 6 ký tự)
  
  // Có thể dùng 'name' (họ và tên đầy đủ) HOẶC 'first_name' + 'last_name'
  name?: string; // Họ và tên đầy đủ (tùy chọn)
  first_name?: string; // Tên (tùy chọn nếu có 'name')
  last_name?: string; // Họ (tùy chọn nếu có 'name')
  
  phone?: string; // Số điện thoại (tùy chọn, 10 số bắt đầu bằng 0)
  date_of_birth?: string; // Ngày sinh (tùy chọn, format: YYYY-MM-DD)
  gender?: string; // Giới tính (tùy chọn: 'male', 'female', 'other')
}

/**
 * Register Response Data
 */
export interface RegisterResponseData {
  user_id: number;
  email: string;
  email_sent: boolean;
}

/**
 * Register Response
 */
export interface RegisterResponse extends ApiSuccessResponse<RegisterResponseData> {}

// ============================================================================
// VERIFY OTP - XÁC THỰC OTP
// ============================================================================

/**
 * Verify OTP Request
 */
export interface VerifyOTPRequest {
  email: string; // Email (bắt buộc)
  otp: string; // Mã OTP 6 số (bắt buộc)
}

/**
 * Verify OTP Response Data
 */
export interface VerifyOTPResponseData {
  user: User;
  token: string; // JWT token
}

/**
 * Verify OTP Response
 */
export interface VerifyOTPResponse extends ApiSuccessResponse<VerifyOTPResponseData> {}

// ============================================================================
// RESEND OTP - GỬI LẠI OTP
// ============================================================================

/**
 * Resend OTP Request
 */
export interface ResendOTPRequest {
  email: string; // Email (bắt buộc)
}

/**
 * Resend OTP Response
 */
export interface ResendOTPResponse extends ApiSuccessResponse {}

// ============================================================================
// LOGIN - ĐĂNG NHẬP
// ============================================================================

/**
 * Login Request
 */
export interface LoginRequest {
  email: string; // Email (bắt buộc)
  password: string; // Mật khẩu (bắt buộc)
}

/**
 * Login Response Data
 */
export interface LoginResponseData {
  user: User;
  token: string; // JWT token
}

/**
 * Login Response
 */
export interface LoginResponse extends ApiSuccessResponse<LoginResponseData> {}

// ============================================================================
// FORGOT PASSWORD - QUÊN MẬT KHẨU
// ============================================================================

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequest {
  email: string; // Email (bắt buộc)
}

/**
 * Forgot Password Response Data
 */
export interface ForgotPasswordResponseData {
  email: string;
}

/**
 * Forgot Password Response
 */
export interface ForgotPasswordResponse extends ApiSuccessResponse<ForgotPasswordResponseData> {}

// ============================================================================
// RESET PASSWORD - ĐẶT LẠI MẬT KHẨU
// ============================================================================

/**
 * Reset Password Request
 */
export interface ResetPasswordRequest {
  email: string; // Email (bắt buộc)
  otp: string; // Mã OTP 6 số (bắt buộc)
  new_password: string; // Mật khẩu mới (bắt buộc, tối thiểu 6 ký tự)
}

/**
 * Reset Password Response
 */
export interface ResetPasswordResponse extends ApiSuccessResponse {}

// ============================================================================
// GOOGLE LOGIN - ĐĂNG NHẬP GOOGLE
// ============================================================================

/**
 * Google Login Request (với ID Token)
 */
export interface GoogleLoginRequest {
  idToken: string; // Google ID token (bắt buộc)
}

/**
 * Google Login Response Data
 */
export interface GoogleLoginResponseData {
  user: User & {
    auth_provider: 'google';
  };
  token: string; // JWT token
}

/**
 * Google Login Response
 */
export interface GoogleLoginResponse extends ApiSuccessResponse<GoogleLoginResponseData> {}

/**
 * Google Callback Query Parameters
 */
export interface GoogleCallbackQuery {
  code: string; // Authorization code từ Google
}

// ============================================================================
// FACEBOOK LOGIN - ĐĂNG NHẬP FACEBOOK
// ============================================================================

/**
 * Facebook Login Request (với Access Token)
 */
export interface FacebookLoginRequest {
  accessToken: string; // Facebook access token (bắt buộc)
}

/**
 * Facebook Login Response Data
 */
export interface FacebookLoginResponseData {
  user: User & {
    auth_provider: 'facebook';
  };
  token: string; // JWT token
}

/**
 * Facebook Login Response
 */
export interface FacebookLoginResponse extends ApiSuccessResponse<FacebookLoginResponseData> {}

/**
 * Facebook Callback Query Parameters
 */
export interface FacebookCallbackQuery {
  code: string; // Authorization code từ Facebook
}

// ============================================================================
// PROFILE - THÔNG TIN PROFILE
// ============================================================================

/**
 * Get Profile Response Data
 */


/**
 * Get Profile Response
 */


// ============================================================================
// LOGOUT - ĐĂNG XUẤT
// ============================================================================

/**
 * Logout Response
 */
export interface LogoutResponse extends ApiSuccessResponse {}

// ============================================================================
// REFRESH TOKEN - LÀM MỚI TOKEN
// ============================================================================

/**
 * Refresh Token Request
 */
export interface RefreshTokenRequest {
  refresh_token: string; // Refresh token (bắt buộc)
}

/**
 * Refresh Token Response Data
 */
export interface RefreshTokenResponseData {
  access_token: string; // JWT token mới
}

/**
 * Refresh Token Response
 */
export interface RefreshTokenResponse extends ApiSuccessResponse<RefreshTokenResponseData> {}

