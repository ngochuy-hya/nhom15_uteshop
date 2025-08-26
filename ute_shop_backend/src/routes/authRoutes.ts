import express from 'express';
import { 
  register, 
  verifyOTP, 
  login, 
  forgotPassword, 
  resetPassword, 
  resendOTP 
} from '../controllers/authController';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Đăng ký tài khoản mới
// @access  Public
router.post('/register', asyncHandler(register));

// @route   POST /api/auth/verify-otp
// @desc    Xác thực OTP để kích hoạt tài khoản
// @access  Public
router.post('/verify-otp', asyncHandler(verifyOTP));

// @route   POST /api/auth/login
// @desc    Đăng nhập
// @access  Public
router.post('/login', asyncHandler(login));

// @route   POST /api/auth/forgot-password
// @desc    Quên mật khẩu - gửi OTP
// @access  Public
router.post('/forgot-password', asyncHandler(forgotPassword));

// @route   POST /api/auth/reset-password
// @desc    Đặt lại mật khẩu với OTP
// @access  Public
router.post('/reset-password', asyncHandler(resetPassword));

// @route   POST /api/auth/resend-otp
// @desc    Gửi lại mã OTP
// @access  Public
router.post('/resend-otp', asyncHandler(resendOTP));

export default router;