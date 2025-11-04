# Auth Pages - Frontend

Các trang authentication đầy đủ cho ứng dụng React/TypeScript, tích hợp với auth service.

## 📁 Cấu trúc files

```
src/pages/auth/
├── login/
│   └── index.tsx           # Trang đăng nhập
├── register/
│   └── index.tsx           # Trang đăng ký
├── forgot-password/
│   └── index.tsx           # Trang quên mật khẩu
├── reset-password/
│   └── index.tsx           # Trang reset mật khẩu
├── index.ts               # Export tất cả
├── auth.css               # Styles cho auth pages
└── README.md              # Hướng dẫn này
```

## 🚀 Các trang đã tạo

### 1. Login Page (`/auth/login`)
- ✅ Form đăng nhập với email/password
- ✅ Hiển thị/ẩn mật khẩu
- ✅ Ghi nhớ đăng nhập
- ✅ Link quên mật khẩu
- ✅ Đăng nhập với Google/Facebook (UI ready)
- ✅ Redirect sau khi đăng nhập thành công
- ✅ Error handling và loading states

### 2. Register Page (`/auth/register`)
- ✅ Form đăng ký đầy đủ thông tin
- ✅ Validation mật khẩu mạnh
- ✅ Xác nhận mật khẩu
- ✅ Thông tin bổ sung (phone, dateOfBirth, gender)
- ✅ Đồng ý điều khoản
- ✅ Đăng ký với Google/Facebook (UI ready)
- ✅ Error handling và loading states

### 3. Forgot Password Page (`/auth/forgot-password`)
- ✅ Form nhập email
- ✅ Validation email
- ✅ Thông báo gửi email thành công
- ✅ Nút gửi lại email
- ✅ Link quay lại đăng nhập/đăng ký

### 4. Reset Password Page (`/auth/reset-password`)
- ✅ Form reset mật khẩu với token
- ✅ Validation mật khẩu mạnh
- ✅ Hiển thị yêu cầu mật khẩu
- ✅ Xác nhận mật khẩu
- ✅ Redirect về login sau khi thành công

## 🎨 UI/UX Features

### Design
- ✅ **Modern Gradient Background** - Gradient đẹp mắt
- ✅ **Card-based Layout** - Layout card với shadow
- ✅ **Responsive Design** - Tương thích mobile
- ✅ **Consistent Styling** - Style nhất quán

### User Experience
- ✅ **Real-time Validation** - Validation ngay khi nhập
- ✅ **Loading States** - Hiển thị loading khi submit
- ✅ **Error Handling** - Xử lý lỗi thân thiện
- ✅ **Success Messages** - Thông báo thành công
- ✅ **Auto Redirect** - Tự động chuyển trang
- ✅ **Password Strength** - Hiển thị độ mạnh mật khẩu

### Accessibility
- ✅ **Proper Labels** - Label cho tất cả input
- ✅ **ARIA Attributes** - Hỗ trợ screen reader
- ✅ **Keyboard Navigation** - Điều hướng bằng phím
- ✅ **Focus Management** - Quản lý focus

## 🔧 Cách sử dụng

### 1. Import và sử dụng

```tsx
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';

// Trong router
<Route path="/auth/login" element={<LoginPage />} />
<Route path="/auth/register" element={<RegisterPage />} />
<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/auth/reset-password" element={<ResetPasswordPage />} />
```

### 2. Import CSS

```tsx
// Trong App.tsx hoặc main.tsx
import '@/pages/auth/auth.css';
```

### 3. Router Setup

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        
        {/* Other routes */}
        <Route path="/" element={<HomePage />} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

## 📱 Responsive Design

### Desktop (≥768px)
- Form width: 50% container
- 2 columns cho register form
- Horizontal social buttons

### Mobile (<768px)
- Form width: 100% container
- Single column layout
- Vertical social buttons
- Reduced padding

## 🔒 Security Features

### Password Validation
- ✅ Minimum 6 characters
- ✅ At least 1 lowercase letter
- ✅ At least 1 uppercase letter
- ✅ At least 1 number
- ✅ Real-time validation feedback

### Form Validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ Password confirmation matching
- ✅ Phone number format (optional)

### Token Handling
- ✅ Reset password token validation
- ✅ Automatic redirect on invalid token
- ✅ Secure token passing via URL params

## 🎯 Integration với Auth Service

### useAuth Hook
Tất cả các trang đều sử dụng `useAuth` hook:

```tsx
const { 
  login, 
  register, 
  forgotPassword, 
  resetPassword,
  isLoading, 
  error, 
  isAuthenticated,
  clearError 
} = useAuth();
```

### State Management
- ✅ **Loading States** - Hiển thị spinner khi đang xử lý
- ✅ **Error States** - Hiển thị lỗi với nút close
- ✅ **Success States** - Thông báo thành công
- ✅ **Auto Redirect** - Chuyển trang sau khi thành công

## 🎨 Customization

### Colors
```css
/* Thay đổi màu chính */
.tf-login-btn,
.tf-register-btn,
.tf-forgot-password-btn,
.tf-reset-password-btn {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Layout
```css
/* Thay đổi background */
.tf-login-page,
.tf-register-page,
.tf-forgot-password-page,
.tf-reset-password-page {
  background: linear-gradient(135deg, #your-bg-1 0%, #your-bg-2 100%);
}
```

## 📊 Form Fields

### Login Form
- Email (required)
- Password (required)
- Remember me checkbox
- Forgot password link

### Register Form
- Name (required)
- Email (required)
- Phone (optional)
- Date of birth (optional)
- Gender (optional)
- Password (required)
- Confirm password (required)
- Terms agreement (required)

### Forgot Password Form
- Email (required)

### Reset Password Form
- New password (required)
- Confirm password (required)
- Password requirements display

## 🔗 Navigation Flow

```
Login Page
├── Register Page
├── Forgot Password Page
│   └── Reset Password Page (with token)
└── Dashboard/Home (after login)

Register Page
├── Login Page
└── Dashboard/Home (after register)

Forgot Password Page
├── Login Page
├── Register Page
└── Reset Password Page (after email sent)

Reset Password Page
└── Login Page (after reset)
```

## 🎉 Sẵn sàng sử dụng!

Các trang auth đã được tích hợp đầy đủ với:
- ✅ Auth Service
- ✅ React Router
- ✅ TypeScript
- ✅ Responsive Design
- ✅ Error Handling
- ✅ Loading States
- ✅ Form Validation
- ✅ Security Features

**Chỉ cần import CSS và setup routes là có thể sử dụng ngay! 🎉**
