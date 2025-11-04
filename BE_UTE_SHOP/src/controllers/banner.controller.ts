import { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';

// ============================================
// PUBLIC APIs - Lấy banners
// ============================================

// Lấy danh sách banners active
export const getBanners = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position } = req.query;

    let query = `
      SELECT 
        id, title, subtitle, description, image_url, mobile_image_url,
        link_url, button_text, position, display_order
      FROM banners
      WHERE is_active = 1
    `;

    const queryParams: any[] = [];

    if (position) {
      query += ` AND position = ?`;
      queryParams.push(position);
    }

    // Kiểm tra thời gian hiển thị
    query += ` AND (start_date IS NULL OR start_date <= NOW())
               AND (end_date IS NULL OR end_date >= NOW())`;

    query += ` ORDER BY display_order ASC`;

    const [banners] = await pool.execute(query, queryParams);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách banner thành công',
      data: banners,
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết banner theo ID
export const getBannerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [banners] = await pool.execute(
      `SELECT * FROM banners WHERE id = ? AND is_active = 1`,
      [id]
    );

    if ((banners as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy banner',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin banner thành công',
      data: (banners as any[])[0],
    });
  } catch (error) {
    console.error('Get banner detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// ============================================
// ADMIN APIs - Quản lý banners
// ============================================

// Validation cho banner
export const bannerValidation = [
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('image_url').notEmpty().withMessage('Hình ảnh không được để trống'),
  body('position').isIn(['hero', 'middle', 'sidebar', 'footer']).withMessage('Vị trí không hợp lệ'),
];

// Lấy tất cả banners (bao gồm inactive) - Admin
export const getAllBannersAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, position, is_active } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (position) {
      whereConditions.push('position = ?');
      queryParams.push(position);
    }

    if (is_active !== undefined) {
      whereConditions.push('is_active = ?');
      queryParams.push(is_active === 'true' ? 1 : 0);
    }

    const query = `
      SELECT * FROM banners
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY display_order ASC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(Number(limit), offset);

    const [banners] = await pool.execute(query, queryParams);

    // Đếm tổng số
    const countQuery = `
      SELECT COUNT(*) as total FROM banners
      WHERE ${whereConditions.join(' AND ')}
    `;
    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách banner thành công',
      data: {
        banners,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total: total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all banners admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Tạo banner mới - Admin
export const createBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
      return;
    }

    const {
      title,
      subtitle,
      description,
      image_url,
      mobile_image_url,
      link_url,
      button_text,
      position = 'hero',
      display_order = 0,
      start_date,
      end_date,
      is_active = true,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO banners (
        title, subtitle, description, image_url, mobile_image_url,
        link_url, button_text, position, display_order, start_date, end_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, subtitle || null, description || null, image_url, mobile_image_url || null,
        link_url || null, button_text || null, position, display_order,
        start_date || null, end_date || null, is_active ? 1 : 0
      ]
    );

    const bannerId = (result as any).insertId;

    res.status(201).json({
      success: true,
      message: 'Tạo banner thành công',
      data: { id: bannerId },
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật banner - Admin
export const updateBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      description,
      image_url,
      mobile_image_url,
      link_url,
      button_text,
      position,
      display_order,
      start_date,
      end_date,
      is_active,
    } = req.body;

    // Kiểm tra banner có tồn tại không
    const [existingBanner] = await pool.execute(
      'SELECT id FROM banners WHERE id = ?',
      [id]
    );

    if ((existingBanner as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy banner',
      });
      return;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (subtitle !== undefined) {
      updateFields.push('subtitle = ?');
      updateValues.push(subtitle);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }
    if (mobile_image_url !== undefined) {
      updateFields.push('mobile_image_url = ?');
      updateValues.push(mobile_image_url);
    }
    if (link_url !== undefined) {
      updateFields.push('link_url = ?');
      updateValues.push(link_url);
    }
    if (button_text !== undefined) {
      updateFields.push('button_text = ?');
      updateValues.push(button_text);
    }
    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      updateValues.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      updateValues.push(end_date);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
      return;
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE banners SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật banner thành công',
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa banner - Admin
export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM banners WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy banner',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa banner thành công',
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Toggle trạng thái active của banner - Admin
export const toggleBannerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [banners] = await pool.execute(
      'SELECT is_active FROM banners WHERE id = ?',
      [id]
    );

    if ((banners as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy banner',
      });
      return;
    }

    const currentStatus = (banners as any[])[0].is_active;
    const newStatus = currentStatus ? 0 : 1;

    await pool.execute(
      'UPDATE banners SET is_active = ? WHERE id = ?',
      [newStatus, id]
    );

    res.status(200).json({
      success: true,
      message: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} banner thành công`,
      data: { is_active: newStatus },
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái banner',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

