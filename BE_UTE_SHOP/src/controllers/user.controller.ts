import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { AuthRequest } from '../types';
import bcrypt from 'bcrypt';
import pool from '../config/database';

// Lấy danh sách users (Admin only)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, search, role_id, is_active } = req.query;

    const result = await UserModel.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string,
      role_id: role_id ? Number(role_id) : undefined,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách users thành công',
      data: {
        users: result.users,
        pagination: {
          current_page: Number(page) || 1,
          per_page: Number(limit) || 20,
          total: result.total,
          total_pages: Math.ceil(result.total / (Number(limit) || 20)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách users',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy thông tin user theo ID (Admin only)
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(Number(id));

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
      });
      return;
    }

    // Remove password from response
    delete user.password;

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin user thành công',
      data: user,
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật thông tin user
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { first_name, last_name, phone, date_of_birth, gender, avatar } = req.body;

    const updateData: any = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (date_of_birth) updateData.date_of_birth = date_of_birth;
    if (gender) updateData.gender = gender;
    if (avatar) updateData.avatar = avatar;

    const updated = await UserModel.update(userId, updateData);

    if (!updated) {
      res.status(400).json({
        success: false,
        message: 'Không thể cập nhật thông tin user',
      });
      return;
    }

    const user = await UserModel.findById(userId);
    delete user!.password;

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin user thành công',
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đổi mật khẩu
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc',
      });
      return;
    }

    // Kiểm tra mật khẩu cũ
    const user = await UserModel.findById(userId);
    if (!user || !user.password) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(old_password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Mật khẩu cũ không chính xác',
      });
      return;
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Cập nhật mật khẩu
    await UserModel.update(userId, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa user (Admin only - soft delete)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await UserModel.softDelete(Number(id));

    if (!deleted) {
      res.status(400).json({
        success: false,
        message: 'Không thể xóa user',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa user thành công',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy thống kê users (Admin only)
export const getUserStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await UserModel.getStatistics();

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê users thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê users',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật user (Admin)
export const updateUserByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, date_of_birth, gender, role_id, is_active, avatar } = req.body;

    // Kiểm tra user tồn tại
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if ((users as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
      });
      return;
    }

    // Nếu có email mới, kiểm tra trùng lặp
    if (email) {
      const [existingEmails] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if ((existingEmails as any[]).length > 0) {
        res.status(400).json({
          success: false,
          message: 'Email đã tồn tại',
        });
        return;
      }
    }

    // Build update query động
    const updates: string[] = [];
    const values: any[] = [];

    if (first_name !== undefined) { updates.push('first_name = ?'); values.push(first_name); }
    if (last_name !== undefined) { updates.push('last_name = ?'); values.push(last_name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (date_of_birth !== undefined) { updates.push('date_of_birth = ?'); values.push(date_of_birth); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
    if (role_id !== undefined) { updates.push('role_id = ?'); values.push(role_id); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    res.status(200).json({
      success: true,
      message: 'Cập nhật user thành công',
    });
  } catch (error) {
    console.error('Update user by admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Kích hoạt user (Admin)
export const activateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if ((users as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
      });
      return;
    }

    await pool.execute('UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Kích hoạt user thành công',
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kích hoạt user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Vô hiệu hóa user (Admin)
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if ((users as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
      });
      return;
    }

    await pool.execute('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Vô hiệu hóa user thành công',
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi vô hiệu hóa user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy đơn hàng của user (Admin)
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [orders] = await pool.execute(
      `SELECT 
        o.id, o.order_number, o.total_amount, o.status_id,
        os.status_name, o.created_at
      FROM orders o
      LEFT JOIN order_statuses os ON o.status_id = os.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [id, Number(limit), offset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [id]
    );
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: 'Lấy đơn hàng của user thành công',
      data: {
        orders,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đơn hàng của user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
