import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import User from '../models/user';

export const authenticate = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false,
        message: 'Token không được cung cấp. Vui lòng đăng nhập.' 
      });
      return;
    }

    // Lấy token (bỏ "Bearer " ở đầu)
    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = verifyToken(token);

    // Tìm user trong database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      res.status(401).json({ 
        success: false,
        message: 'Người dùng không tồn tại hoặc token không hợp lệ' 
      });
      return;
    }

    // Kiểm tra user đã được xác thực chưa
    if (!user.isVerified) {
      res.status(403).json({ 
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.' 
      });
      return;
    }

    // Gắn thông tin user vào request
    req.user = user;
    next();

  } catch (error: any) {
    console.error('Authentication error:', error);
    
    if (error.message === 'Token không hợp lệ hoặc đã hết hạn') {
      res.status(401).json({ 
        success: false,
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Lỗi xác thực. Vui lòng thử lại.' 
      });
    }
  }
};