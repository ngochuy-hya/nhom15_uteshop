import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  deleteAccount 
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Lấy thông tin profile người dùng
// @access  Private
router.get('/profile', authenticate, asyncHandler(getProfile));

// @route   PUT /api/user/profile
// @desc    Cập nhật thông tin profile
// @access  Private
router.put('/profile', authenticate, asyncHandler(updateProfile));

// @route   PUT /api/user/change-password
// @desc    Đổi mật khẩu
// @access  Private
router.put('/change-password', authenticate, asyncHandler(changePassword));

// @route   DELETE /api/user/delete-account
// @desc    Xóa tài khoản
// @access  Private
router.delete('/delete-account', authenticate, asyncHandler(deleteAccount));

export default router;