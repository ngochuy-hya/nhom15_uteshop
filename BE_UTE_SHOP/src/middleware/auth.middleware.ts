import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { AuthRequest } from '../types';
import pool from '../config/database';

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Kiểm tra user có tồn tại và active không
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, role_id, is_active, email_verified FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    const user = (users as any[])[0];
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Thêm thông tin user vào request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

// Middleware kiểm tra quyền admin
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role_id !== 2) { // role_id = 2 là admin
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

// Middleware kiểm tra email đã verify
export const requireEmailVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
    });
  }

  next();
};

// Middleware optional authentication (không bắt buộc phải đăng nhập)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const [users] = await pool.execute(
          'SELECT id, email, first_name, last_name, role_id, is_active, email_verified FROM users WHERE id = ? AND is_active = 1',
          [decoded.userId]
        );

        const user = (users as any[])[0];
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Nếu có lỗi, vẫn tiếp tục mà không set user
    next();
  }
};

// Alias cho authenticateToken
export const requireAuth = authenticateToken;
