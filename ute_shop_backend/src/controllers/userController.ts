import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import { AuthRequest, UpdateProfileRequest } from '../types';
import { updateProfileSchema, validateInput } from '../utils/validation';

// Lấy thông tin profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không được xác thực'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Lấy thông tin profile thành công',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Cập nhật thông tin profile
export const updateProfile = async (req: AuthRequest<{}, {}, UpdateProfileRequest>, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không được xác thực'
      });
      return;
    }

    // Validate input
    const validation = validateInput(updateProfileSchema, req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
      return;
    }

    const updateData = validation.data;
    
    // Loại bỏ các field rỗng
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== '')
    );

    if (Object.keys(filteredUpdateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật'
      });
      return;
    }

    // Cập nhật thông tin user
    await User.update(filteredUpdateData, { 
      where: { id: user.id } 
    });

    // Lấy thông tin user đã cập nhật
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Đổi mật khẩu
export const changePassword = async (req: AuthRequest<{}, {}, { currentPassword: string; newPassword: string }>, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không được xác thực'
      });
      return;
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
      return;
    }

    // Lấy thông tin user với password
    const userWithPassword = await User.findByPk(user.id);
    if (!userWithPassword) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
      return;
    }

    // Kiểm tra mật khẩu mới không trùng với mật khẩu hiện tại
    const isSamePassword = await bcrypt.compare(newPassword, userWithPassword.password);
    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
      });
      return;
    }

    // Hash mật khẩu mới
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật mật khẩu
    await User.update(
      { password: hashedNewPassword },
      { where: { id: user.id } }
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Xóa tài khoản
export const deleteAccount = async (req: AuthRequest<{}, {}, { password: string }>, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { password } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không được xác thực'
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu là bắt buộc để xóa tài khoản'
      });
      return;
    }

    // Lấy thông tin user với password
    const userWithPassword = await User.findByPk(user.id);
    if (!userWithPassword) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
      return;
    }

    // Xóa tài khoản
    await User.destroy({ where: { id: user.id } });

    res.json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};