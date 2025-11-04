import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Lấy danh sách địa chỉ
export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [addresses] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách địa chỉ thành công',
      data: addresses,
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách địa chỉ',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thêm địa chỉ mới
export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
    } = req.body;

    if (!full_name || !phone || !address_line1 || !city || !country) {
      res.status(400).json({
        success: false,
        message: 'Các trường bắt buộc: full_name, phone, address_line1, city, country',
      });
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Nếu set default, bỏ default của các địa chỉ khác
      if (is_default) {
        await connection.execute(
          'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      // Thêm địa chỉ mới
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO user_addresses (user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          full_name,
          phone,
          address_line1,
          address_line2 || null,
          city,
          state || null,
          postal_code || null,
          country,
          is_default || false,
        ]
      );

      await connection.commit();

      const [newAddress] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM user_addresses WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Thêm địa chỉ thành công',
        data: newAddress[0],
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm địa chỉ',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật địa chỉ
export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    } = req.body;

    // Kiểm tra địa chỉ có thuộc về user không
    const [addresses] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ',
      });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (full_name) {
      fields.push('full_name = ?');
      values.push(full_name);
    }
    if (phone) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (address_line1) {
      fields.push('address_line1 = ?');
      values.push(address_line1);
    }
    if (address_line2 !== undefined) {
      fields.push('address_line2 = ?');
      values.push(address_line2);
    }
    if (city) {
      fields.push('city = ?');
      values.push(city);
    }
    if (state !== undefined) {
      fields.push('state = ?');
      values.push(state);
    }
    if (postal_code !== undefined) {
      fields.push('postal_code = ?');
      values.push(postal_code);
    }
    if (country) {
      fields.push('country = ?');
      values.push(country);
    }

    if (fields.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
      return;
    }

    values.push(id);
    await pool.execute(
      `UPDATE user_addresses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedAddress] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_addresses WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật địa chỉ thành công',
      data: updatedAddress[0],
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật địa chỉ',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa địa chỉ
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa địa chỉ thành công',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa địa chỉ',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đặt địa chỉ mặc định
export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Kiểm tra địa chỉ có thuộc về user không
    const [addresses] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ',
      });
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Bỏ default của tất cả địa chỉ
      await connection.execute(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );

      // Set default cho địa chỉ được chọn
      await connection.execute(
        'UPDATE user_addresses SET is_default = 1 WHERE id = ?',
        [id]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Đặt địa chỉ mặc định thành công',
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt địa chỉ mặc định',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

