# Redux Integration Guide

Hướng dẫn về việc tích hợp Redux Toolkit vào UTE Shop Frontend.

## Cấu trúc Redux Store

### 1. Store Configuration (`src/store/index.ts`)
- Redux Toolkit store với Redux Persist
- Persist chỉ auth state để duy trì đăng nhập
- Configured để bỏ qua serializable check cho persist actions

### 2. Typed Hooks (`src/store/hooks.ts`)
- `useAppDispatch`: Typed dispatch hook
- `useAppSelector`: Typed selector hook  
- `useAppState`: Helper hook với proper typing cho app state

### 3. Auth Slice (`src/store/slices/authSlice.ts`)
Quản lý authentication state với các async thunks:
- `loginAsync`: Đăng nhập với email/password
- `registerAsync`: Đăng ký tài khoản mới
- `verifyOTPAsync`: Xác thực OTP
- `forgotPasswordAsync`: Gửi OTP reset password
- `resetPasswordAsync`: Reset password với OTP
- `resendOTPAsync`: Gửi lại OTP

**State bao gồm:**
- `user`: Thông tin user đã đăng nhập
- `token`: JWT access token
- `isLoading`: Loading state
- `error`: Error messages
- `isAuthenticated`: Authentication status

### 4. User Slice (`src/store/slices/userSlice.ts`)
Quản lý user profile với các async thunks:
- `getProfileAsync`: Lấy thông tin profile
- `updateProfileAsync`: Cập nhật profile
- `changePasswordAsync`: Đổi mật khẩu
- `deleteAccountAsync`: Xóa tài khoản

## API Integration

### 1. API Configuration (`src/lib/api.ts`)
- Axios instance với base URL và interceptors
- Tự động thêm Authorization header
- Tự động refresh token khi 401
- Error handling

### 2. Environment Config (`src/config/api.ts`)
- API base URL configuration
- Fallback cho development

## Components Integration

### 1. LoginPage
- Sử dụng `loginAsync` thunk
- Auto redirect khi đã đăng nhập
- Error handling và loading states

### 2. RegisterPage  
- Sử dụng `registerAsync` thunk
- Redirect to OTP verification
- Form validation và error handling

### 3. VerifyOtpPage
- Support cả register và forgot password flows
- `verifyOTPAsync` và `resetPasswordAsync`
- Resend OTP functionality với cooldown

### 4. ForgotPasswordPage
- `forgotPasswordAsync` thunk
- Redirect to OTP verification

### 5. ProfileUserPage
- Load và hiển thị profile với `getProfileAsync`
- Edit profile với `updateProfileAsync`
- Change password với `changePasswordAsync`
- Logout functionality
- Modal cho change password

## Usage Examples

### Dispatching Actions
```typescript
import { useAppDispatch } from '../store/hooks';
import { loginAsync } from '../store/slices/authSlice';

const dispatch = useAppDispatch();

const handleLogin = async () => {
  const result = await dispatch(loginAsync({ email, password, remember }));
  if (loginAsync.fulfilled.match(result)) {
    // Login success
    navigate('/profile');
  }
};
```

### Accessing State
```typescript
import { useAppState } from '../store/hooks';

const { auth, user } = useAppState();
const { isLoading, error, isAuthenticated } = auth;
const { profile } = user;
```

### Error Handling
```typescript
useEffect(() => {
  if (error) {
    setErrors(prev => ({ ...prev, form: error }));
  }
}, [error]);

useEffect(() => {
  return () => {
    dispatch(clearError());
  };
}, [dispatch]);
```

## Backend API Endpoints

### Auth Routes (`/api/auth/`)
- `POST /register` - Đăng ký
- `POST /verify-otp` - Xác thực OTP  
- `POST /login` - Đăng nhập
- `POST /forgot-password` - Quên mật khẩu
- `POST /reset-password` - Reset mật khẩu
- `POST /resend-otp` - Gửi lại OTP

### User Routes (`/api/user/`)
- `GET /profile` - Lấy profile
- `PUT /profile` - Cập nhật profile
- `PUT /change-password` - Đổi mật khẩu
- `DELETE /delete-account` - Xóa tài khoản

## Features Implemented

✅ Redux Toolkit với TypeScript
✅ Redux Persist cho auth state
✅ Async thunks cho tất cả API calls
✅ Error handling và loading states
✅ Token management và auto-refresh
✅ Form validation
✅ Protected routes
✅ Success/error notifications
✅ Modal dialogs
✅ Responsive UI

## Development

### Start Frontend
```bash
cd fe_ute_shop
npm run dev
```

### Start Backend  
```bash
cd ute_shop_backend
npm run dev
```

### Environment Variables
Tạo file `.env` trong `fe_ute_shop/`:
```
VITE_API_URL=http://localhost:3000/api
```
