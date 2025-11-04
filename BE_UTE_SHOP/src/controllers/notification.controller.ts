import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';

// Lấy danh sách thông báo của user
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [notifications] = await pool.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user!.id, Number(limit), offset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [req.user!.id]
    );
    const total = (countResult as any[])[0].total;

    // Đếm số thông báo chưa đọc
    const [unreadResult] = await pool.execute(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user!.id]
    );
    const unread = (unreadResult as any[])[0].unread;

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: {
        notifications,
        unread_count: unread,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thông báo',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Kiểm tra thông báo tồn tại và thuộc về user
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );

    if ((notifications as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
      return;
    }

    await pool.execute(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Đánh dấu đã đọc thành công',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu thông báo',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [req.user!.id]
    );

    res.status(200).json({
      success: true,
      message: 'Đánh dấu tất cả thông báo đã đọc thành công',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu tất cả thông báo',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa thông báo
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Kiểm tra thông báo tồn tại và thuộc về user
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );

    if ((notifications as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
      return;
    }

    await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Xóa thông báo thành công',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thông báo',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Helper function: Tạo thông báo mới (dùng nội bộ)
export const createNotification = async (
  userId: number,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<void> => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

