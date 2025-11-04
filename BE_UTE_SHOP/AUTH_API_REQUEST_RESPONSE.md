# 🔐 Authentication API - Request & Response Objects

## Base URL
```
http://localhost:5000/api/auth
```

---

## 📋 Table of Contents
1. [Register - Đăng ký](#1-register---đăng-ký)
2. [Verify OTP - Xác thực OTP](#2-verify-otp---xác-thực-otp)
3. [Resend OTP - Gửi lại OTP](#3-resend-otp---gửi-lại-otp)
4. [Login - Đăng nhập](#4-login---đăng-nhập)
5. [Get Profile - Lấy thông tin profile](#5-get-profile---lấy-thông-tin-profile)
6. [Logout - Đăng xuất](#6-logout---đăng-xuất)
7. [Forgot Password - Quên mật khẩu](#7-forgot-password---quên-mật-khẩu)
8. [Reset Password - Đặt lại mật khẩu](#8-reset-password---đặt-lại-mật-khẩu)
9. [Refresh Token - Làm mới token](#9-refresh-token---làm-mới-token)
10. [Google Login (ID Token) - Đăng nhập Google](#10-google-login-id-token---đăng-nhập-google)
11. [Google Login (Redirect) - Đăng nhập Google (Redirect)](#11-google-login-redirect---đăng-nhập-google-redirect)
12. [Facebook Login (Access Token) - Đăng nhập Facebook](#12-facebook-login-access-token---đăng-nhập-facebook)
13. [Facebook Login (Redirect) - Đăng nhập Facebook (Redirect)](#13-facebook-login-redirect---đăng-nhập-facebook-redirect)

---

## 1. Register - Đăng ký

### Endpoint
```
POST /api/auth/register
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface RegisterRequest {
  email: string;           // Email (bắt buộc, phải hợp lệ)
  password: string;        // Mật khẩu (bắt buộc, tối thiểu 6 ký tự)
  
  // Có thể dùng 'name' (họ và tên đầy đủ) HOẶC 'first_name' + 'last_name'
  name?: string;           // Họ và tên đầy đủ (tùy chọn)
  first_name?: string;     // Tên (tùy chọn nếu có 'name')
  last_name?: string;      // Họ (tùy chọn nếu có 'name')
  
  phone?: string;          // Số điện thoại (tùy chọn, 10 số bắt đầu bằng 0)
  date_of_birth?: string;  // Ngày sinh (tùy chọn, format: YYYY-MM-DD)
  gender?: string;         // Giới tính (tùy chọn: 'male', 'female', 'other')
}
```

### Request Example
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nguyễn Văn An",
  "phone": "0123456789",
  "date_of_birth": "1990-01-01",
  "gender": "male"
}
```

### Response Success (201)
```typescript
interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user_id: number;
    email: string;
    email_sent: boolean;
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "email_sent": true
  }
}
```

### Response Error (400 - Validation Error)
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "msg": "Email không hợp lệ",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### Response Error (400 - Email Exists)
```json
{
  "success": false,
  "message": "Email đã được sử dụng"
}
```

### Response Error (500)
```json
{
  "success": false,
  "message": "Lỗi server khi đăng ký"
}
```

---

## 2. Verify OTP - Xác thực OTP

### Endpoint
```
POST /api/auth/verify-otp
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface VerifyOTPRequest {
  email: string;    // Email (bắt buộc)
  otp: string;      // Mã OTP 6 số (bắt buộc)
}
```

### Request Example
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Response Success (200)
```typescript
interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role_id: number;
      email_verified: boolean;
    };
    token: string;  // JWT token
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Xác thực email thành công!",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Văn An",
      "last_name": "Nguyễn",
      "role_id": 1,
      "email_verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (400 - Missing Fields)
```json
{
  "success": false,
  "message": "Email và mã OTP là bắt buộc"
}
```

### Response Error (400 - Invalid OTP)
```json
{
  "success": false,
  "message": "Mã OTP không chính xác"
}
```

### Response Error (400 - Expired OTP)
```json
{
  "success": false,
  "message": "Mã OTP đã hết hạn"
}
```

---

## 3. Resend OTP - Gửi lại OTP

### Endpoint
```
POST /api/auth/resend-otp
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface ResendOTPRequest {
  email: string;    // Email (bắt buộc)
}
```

### Request Example
```json
{
  "email": "user@example.com"
}
```

### Response Success (200)
```typescript
interface ResendOTPResponse {
  success: boolean;
  message: string;
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Đã gửi lại mã OTP. Vui lòng kiểm tra email."
}
```

### Response Error (400 - Already Verified)
```json
{
  "success": false,
  "message": "Tài khoản đã được xác thực"
}
```

### Response Error (404 - User Not Found)
```json
{
  "success": false,
  "message": "Không tìm thấy tài khoản với email này"
}
```

---

## 4. Login - Đăng nhập

### Endpoint
```
POST /api/auth/login
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface LoginRequest {
  email: string;      // Email (bắt buộc)
  password: string;   // Mật khẩu (bắt buộc)
}
```

### Request Example
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response Success (200)
```typescript
interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role_id: number;
      email_verified: boolean;
    };
    token: string;  // JWT token
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Văn An",
      "last_name": "Nguyễn",
      "role_id": 1,
      "email_verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (400 - Validation Error)
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "msg": "Email không hợp lệ",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### Response Error (401 - Invalid Credentials)
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không chính xác"
}
```

### Response Error (401 - Account Locked)
```json
{
  "success": false,
  "message": "Tài khoản đã bị khóa"
}
```

### Response Error (401 - Email Not Verified)
```json
{
  "success": false,
  "message": "Vui lòng xác thực email trước khi đăng nhập"
}
```

---

## 5. Get Profile - Lấy thông tin profile

### Endpoint
```
GET /api/auth/profile
```

### Request Headers
```json
{
  "Authorization": "Bearer <token>"
}
```

### Request Body
```
Không có body
```

### Response Success (200)
```typescript
interface GetProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    avatar: string | null;
    role_id: number;
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Lấy thông tin user thành công",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Văn An",
    "last_name": "Nguyễn",
    "phone": "0123456789",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "avatar": "https://example.com/avatar.jpg",
    "role_id": 1,
    "is_active": true,
    "email_verified": true,
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
```

### Response Error (401 - Unauthorized)
```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

### Response Error (404 - User Not Found)
```json
{
  "success": false,
  "message": "Không tìm thấy user"
}
```

---

## 6. Logout - Đăng xuất

### Endpoint
```
POST /api/auth/logout
```

### Request Headers
```json
{
  "Authorization": "Bearer <token>"
}
```

### Request Body
```
Không có body
```

### Response Success (200)
```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

### Response Error (401 - Unauthorized)
```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

---

## 7. Forgot Password - Quên mật khẩu

### Endpoint
```
POST /api/auth/forgot-password
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface ForgotPasswordRequest {
  email: string;    // Email (bắt buộc)
}
```

### Request Example
```json
{
  "email": "user@example.com"
}
```

### Response Success (200)
```typescript
interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Mã OTP đã được gửi đến email của bạn",
  "data": {
    "email": "user@example.com"
  }
}
```

### Response Error (400 - Missing Email)
```json
{
  "success": false,
  "message": "Email là bắt buộc"
}
```

### Response Error (404 - User Not Found)
```json
{
  "success": false,
  "message": "Không tìm thấy tài khoản với email này"
}
```

---

## 8. Reset Password - Đặt lại mật khẩu

### Endpoint
```
POST /api/auth/reset-password
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface ResetPasswordRequest {
  email: string;         // Email (bắt buộc)
  otp: string;           // Mã OTP 6 số (bắt buộc)
  new_password: string;  // Mật khẩu mới (bắt buộc, tối thiểu 6 ký tự)
}
```

### Request Example
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newpassword123"
}
```

### Response Success (200)
```typescript
interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công"
}
```

### Response Error (400 - Missing Fields)
```json
{
  "success": false,
  "message": "Email, OTP và mật khẩu mới là bắt buộc"
}
```

### Response Error (400 - Password Too Short)
```json
{
  "success": false,
  "message": "Mật khẩu mới phải có ít nhất 6 ký tự"
}
```

### Response Error (400 - Invalid OTP)
```json
{
  "success": false,
  "message": "Mã OTP không chính xác"
}
```

### Response Error (400 - Expired OTP)
```json
{
  "success": false,
  "message": "Mã OTP đã hết hạn"
}
```

---

## 9. Refresh Token - Làm mới token

### Endpoint
```
POST /api/auth/refresh-token
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface RefreshTokenRequest {
  refresh_token: string;  // Refresh token (bắt buộc)
}
```

### Request Example
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Success (200)
```typescript
interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;  // JWT token mới
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Refresh token thành công",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (400 - Missing Token)
```json
{
  "success": false,
  "message": "Refresh token là bắt buộc"
}
```

### Response Error (401 - Invalid Token)
```json
{
  "success": false,
  "message": "Refresh token không hợp lệ hoặc đã hết hạn"
}
```

### Response Error (401 - User Not Found)
```json
{
  "success": false,
  "message": "User không tồn tại hoặc đã bị vô hiệu hóa"
}
```

---

## 10. Google Login (ID Token) - Đăng nhập Google

### Endpoint
```
POST /api/auth/google
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface GoogleLoginRequest {
  idToken: string;  // Google ID token (bắt buộc)
}
```

### Request Example
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ..."
}
```

### Response Success (200)
```typescript
interface GoogleLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role_id: number;
      email_verified: boolean;
      auth_provider: string;
    };
    token: string;  // JWT token
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Đăng nhập Google thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "user@gmail.com",
      "first_name": "John",
      "last_name": "Doe",
      "role_id": 1,
      "email_verified": true,
      "auth_provider": "google"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (400 - Missing Token)
```json
{
  "success": false,
  "message": "Google ID token là bắt buộc"
}
```

### Response Error (400 - Invalid Token)
```json
{
  "success": false,
  "message": "Đăng nhập Google thất bại"
}
```

---

## 11. Google Login (Redirect) - Đăng nhập Google (Redirect)

### Endpoint 1: Initiate Login
```
GET /api/auth/google/login
```

### Request Headers
```
Không cần headers
```

### Request Body
```
Không có body
```

### Response
```
Redirect đến Google OAuth page
```

---

### Endpoint 2: Callback
```
GET /api/auth/google/callback?code=<authorization_code>
```

### Query Parameters
```typescript
interface GoogleCallbackQuery {
  code: string;  // Authorization code từ Google
}
```

### Response Success
```
Redirect về frontend với token và user data trong URL:
http://localhost:5173?token=<jwt_token>&user=<encoded_user_data>
```

### Response Error
```
Redirect về frontend với error message:
http://localhost:5173?error=<error_message>
```

---

## 12. Facebook Login (Access Token) - Đăng nhập Facebook

### Endpoint
```
POST /api/auth/facebook
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```typescript
interface FacebookLoginRequest {
  accessToken: string;  // Facebook access token (bắt buộc)
}
```

### Request Example
```json
{
  "accessToken": "EAABsbCS1iHgBO..."
}
```

### Response Success (200)
```typescript
interface FacebookLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role_id: number;
      email_verified: boolean;
      auth_provider: string;
    };
    token: string;  // JWT token
  };
}
```

### Response Success Example
```json
{
  "success": true,
  "message": "Đăng nhập Facebook thành công",
  "data": {
    "user": {
      "id": 2,
      "email": "user@facebook.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "role_id": 1,
      "email_verified": true,
      "auth_provider": "facebook"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (400 - Missing Token)
```json
{
  "success": false,
  "message": "Facebook access token là bắt buộc"
}
```

### Response Error (400 - Invalid Token)
```json
{
  "success": false,
  "message": "Đăng nhập Facebook thất bại"
}
```

---

## 13. Facebook Login (Redirect) - Đăng nhập Facebook (Redirect)

### Endpoint 1: Initiate Login
```
GET /api/auth/facebook/login
```

### Request Headers
```
Không cần headers
```

### Request Body
```
Không có body
```

### Response
```
Redirect đến Facebook OAuth page
```

---

### Endpoint 2: Callback
```
GET /api/auth/facebook/callback?code=<authorization_code>
```

### Query Parameters
```typescript
interface FacebookCallbackQuery {
  code: string;  // Authorization code từ Facebook
}
```

### Response Success
```
Redirect về frontend với token và user data trong URL:
http://localhost:5173?token=<jwt_token>&user=<encoded_user_data>
```

### Response Error
```
Redirect về frontend với error message:
http://localhost:5173?error=<error_message>
```

---

## 🔑 Common Response Types

### Standard Success Response
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
}
```

### Standard Error Response
```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
  error?: any;  // Chỉ có trong development mode
}
```

---

## 🔒 Authentication & Authorization

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: number;
  email: string;
  roleId: number;
  iat: number;     // Issued at
  exp: number;     // Expiration time
}
```

### Authorization Header Format
```
Authorization: Bearer <jwt_token>
```

---

## 📝 Notes

### Password Requirements
- Minimum 6 characters
- Recommended: Mix of uppercase, lowercase, numbers, and special characters

### Phone Number Format (Vietnam)
- Must start with 0 and have 10 digits: `0xxxxxxxxx`
- Or start with +84 or 84: `+84xxxxxxxxx` or `84xxxxxxxxx`

### OTP Validity
- OTP expires after 15 minutes
- New OTP can be requested after 1 minute

### Email Verification
- Required before login for local accounts
- Google and Facebook accounts are automatically verified

### User Roles
- `role_id: 1` - Regular User
- `role_id: 2` - Admin
- `role_id: 3` - Super Admin

---

## 🐛 Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (Invalid credentials or token) |
| 403 | Forbidden (Access denied) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

**Last Updated:** 2024-11-02
**Version:** 2.0

