import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Lấy danh sách coupon (Admin)
export const getAllCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, is_active, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = ['1=1'];
    let queryParams: any[] = [];

    if (is_active !== undefined) {
      whereConditions.push('is_active = ?');
      queryParams.push(is_active === 'true' ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(code LIKE ? OR name LIKE ? OR description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [coupons] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM coupons 
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), offset]
    );

    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM coupons WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách coupon thành công',
      data: {
        coupons,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total: countResult[0].total,
          total_pages: Math.ceil(countResult[0].total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách coupon',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết coupon theo ID (Admin)
export const getCouponById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [coupons] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM coupons WHERE id = ?',
      [id]
    );

    if (coupons.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết coupon thành công',
      data: coupons[0],
    });
  } catch (error) {
    console.error('Get coupon by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết coupon',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy coupon khả dụng cho user
export const getAvailableCoupons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [coupons] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        c.*,
        (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = c.id AND user_id = ?) as user_usage_count
      FROM coupons c
      WHERE c.is_active = 1 
      AND c.starts_at <= NOW() 
      AND c.expires_at >= NOW()
      AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
      ORDER BY c.value DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách coupon khả dụng thành công',
      data: coupons,
    });
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách coupon',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Validate coupon
export const validateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { code, subtotal } = req.body;

    if (!code || subtotal === undefined) {
      res.status(400).json({
        success: false,
        message: 'Code và subtotal là bắt buộc',
      });
      return;
    }

    const [coupons] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM coupons 
       WHERE code = ? 
       AND is_active = 1 
       AND starts_at <= NOW() 
       AND expires_at >= NOW()`,
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    const coupon = coupons[0];

    // Kiểm tra minimum order amount
    if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
      res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${Number(coupon.minimum_amount).toLocaleString('vi-VN')} VNĐ để sử dụng mã này`,
      });
      return;
    }

    // Kiểm tra usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết lượt sử dụng',
      });
      return;
    }

    // Kiểm tra user đã dùng coupon này chưa
    const [userUsage] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
      [coupon.id, userId]
    );

    // Tính discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (subtotal * Number(coupon.value)) / 100;
      if (coupon.maximum_discount && discountAmount > Number(coupon.maximum_discount)) {
        discountAmount = Number(coupon.maximum_discount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Number(coupon.value);
    }

    res.status(200).json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          minimum_amount: coupon.minimum_amount,
          maximum_discount: coupon.maximum_discount,
        },
        discount_amount: discountAmount,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi validate coupon',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Tạo coupon (Admin)
export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minimum_amount = 0.00,
      maximum_discount,
      usage_limit,
      is_active = true,
      starts_at,
      expires_at,
    } = req.body;

    // Validation các trường bắt buộc
    if (!code || !name || !type || value === undefined || !starts_at || !expires_at) {
      res.status(400).json({
        success: false,
        message: 'Các trường bắt buộc: code, name, type, value, starts_at, expires_at',
      });
      return;
    }

    // Validate type
    if (!['percentage', 'fixed'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Type phải là "percentage" hoặc "fixed"',
      });
      return;
    }

    // Validate value
    if (Number(value) <= 0) {
      res.status(400).json({
        success: false,
        message: 'Value phải lớn hơn 0',
      });
      return;
    }

    if (type === 'percentage' && Number(value) > 100) {
      res.status(400).json({
        success: false,
        message: 'Percentage value không được vượt quá 100',
      });
      return;
    }

    // Kiểm tra code đã tồn tại
    const [existingCoupons] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM coupons WHERE code = ?',
      [code.toUpperCase()]
    );

    if (existingCoupons.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Mã coupon đã tồn tại',
      });
      return;
    }

    // Kiểm tra thời gian
    const startDate = new Date(starts_at);
    const endDate = new Date(expires_at);
    if (endDate <= startDate) {
      res.status(400).json({
        success: false,
        message: 'expires_at phải sau starts_at',
      });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO coupons (
        code, name, description, type, value, 
        minimum_amount, maximum_discount, usage_limit, 
        used_count, is_active, starts_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        code.toUpperCase(),
        name,
        description || null,
        type,
        Number(value),
        Number(minimum_amount) || 0.00,
        maximum_discount ? Number(maximum_discount) : null,
        usage_limit ? Number(usage_limit) : null,
        is_active ? 1 : 0,
        starts_at,
        expires_at,
      ]
    );

    const [newCoupon] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM coupons WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo coupon thành công',
      data: newCoupon[0],
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo coupon',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật coupon (Admin)
export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      type,
      value,
      minimum_amount,
      maximum_discount,
      usage_limit,
      is_active,
      starts_at,
      expires_at,
    } = req.body;

    // Kiểm tra coupon tồn tại
    const [existingCoupons] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM coupons WHERE id = ?',
      [id]
    );

    if (existingCoupons.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon',
      });
      return;
    }

    const existingCoupon = existingCoupons[0];

    // Nếu có code mới, kiểm tra trùng lặp
    if (code && code.toUpperCase() !== existingCoupon.code) {
      const [duplicateCoupons] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM coupons WHERE code = ? AND id != ?',
        [code.toUpperCase(), id]
      );

      if (duplicateCoupons.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Mã coupon đã tồn tại',
        });
        return;
      }
    }

    // Validate type nếu có
    if (type && !['percentage', 'fixed'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Type phải là "percentage" hoặc "fixed"',
      });
      return;
    }

    // Validate value nếu có
    const finalValue = value !== undefined ? Number(value) : existingCoupon.value;
    const finalType = type || existingCoupon.type;
    
    if (finalValue <= 0) {
      res.status(400).json({
        success: false,
        message: 'Value phải lớn hơn 0',
      });
      return;
    }

    if (finalType === 'percentage' && finalValue > 100) {
      res.status(400).json({
        success: false,
        message: 'Percentage value không được vượt quá 100',
      });
      return;
    }

    // Kiểm tra thời gian nếu có
    const finalStartsAt = starts_at || existingCoupon.starts_at;
    const finalExpiresAt = expires_at || existingCoupon.expires_at;
    
    if (starts_at || expires_at) {
      const startDate = new Date(finalStartsAt);
      const endDate = new Date(finalExpiresAt);
      if (endDate <= startDate) {
        res.status(400).json({
          success: false,
          message: 'expires_at phải sau starts_at',
        });
        return;
      }
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (code !== undefined) {
      fields.push('code = ?');
      values.push(code.toUpperCase());
    }
    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (type !== undefined) {
      fields.push('type = ?');
      values.push(type);
    }
    if (value !== undefined) {
      fields.push('value = ?');
      values.push(Number(value));
    }
    if (minimum_amount !== undefined) {
      fields.push('minimum_amount = ?');
      values.push(Number(minimum_amount));
    }
    if (maximum_discount !== undefined) {
      fields.push('maximum_discount = ?');
      values.push(maximum_discount ? Number(maximum_discount) : null);
    }
    if (usage_limit !== undefined) {
      fields.push('usage_limit = ?');
      values.push(usage_limit ? Number(usage_limit) : null);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    if (starts_at !== undefined) {
      fields.push('starts_at = ?');
      values.push(starts_at);
    }
    if (expires_at !== undefined) {
      fields.push('expires_at = ?');
      values.push(expires_at);
    }

    if (fields.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
      return;
    }

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE coupons SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon',
      });
      return;
    }

    const [updatedCoupon] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM coupons WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật coupon thành công',
      data: updatedCoupon[0],
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật coupon',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa coupon (Admin)
export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Kiểm tra coupon tồn tại
    const [coupons] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM coupons WHERE id = ?',
      [id]
    );

    if (coupons.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon',
      });
      return;
    }

    // Kiểm tra coupon đã được sử dụng chưa
    const [usageCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?',
      [id]
    );

    if (usageCount[0].count > 0) {
      // Nếu đã có sử dụng, chỉ soft delete (set is_active = 0)
      await pool.execute<ResultSetHeader>(
        'UPDATE coupons SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      res.status(200).json({
        success: true,
        message: 'Coupon đã được vô hiệu hóa (đã có lịch sử sử dụng)',
      });
      return;
    }

    // Nếu chưa có sử dụng, xóa hoàn toàn
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM coupons WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa coupon thành công',
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa coupon',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

