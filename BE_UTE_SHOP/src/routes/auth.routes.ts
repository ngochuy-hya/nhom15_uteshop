import { Router } from 'express';
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  getProfile,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  googleLogin,
  googleLoginRedirect,
  googleCallback,
  facebookLogin,
  facebookLoginRedirect,
  facebookCallback,
  registerValidation,
  loginValidation,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Đăng ký
router.post('/register', registerValidation, register);

// Xác thực OTP
router.post('/verify-otp', verifyOTP);

// Gửi lại OTP
router.post('/resend-otp', resendOTP);

// Đăng nhập
router.post('/login', loginValidation, login);

// Đăng nhập Google OAuth (với ID Token)
router.post('/google', googleLogin);

// Đăng nhập Google OAuth (Redirect flow - Đơn giản hơn)
router.get('/google/login', googleLoginRedirect);
router.get('/google/callback', googleCallback);

// Đăng nhập Facebook OAuth (với Access Token)
router.post('/facebook', facebookLogin);

// Đăng nhập Facebook OAuth (Redirect flow - Đơn giản hơn)
router.get('/facebook/login', facebookLoginRedirect);
router.get('/facebook/callback', facebookCallback);

// Quên mật khẩu
router.post('/forgot-password', forgotPassword);

// Đặt lại mật khẩu
router.post('/reset-password', resetPassword);

// Refresh token
router.post('/refresh-token', refreshToken);

// Lấy thông tin profile (cần đăng nhập)
router.get('/profile', authenticateToken, getProfile);

// Đăng xuất
router.post('/logout', authenticateToken, logout);

export default router;
