import { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';

// Lấy danh sách thương hiệu
export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20 } = req.query;

    const [brands] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        logo,
        description,
        website,
        sort_order,
        (SELECT COUNT(*) FROM products WHERE brand_id = b.id AND is_active = 1) as product_count
      FROM brands b
      WHERE is_active = 1
      ORDER BY sort_order, name
      LIMIT ?`,
      [Number(limit)]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thương hiệu thành công',
      data: brands,
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thương hiệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết thương hiệu
export const getBrandById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [brands] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        logo,
        description,
        website,
        sort_order,
        (SELECT COUNT(*) FROM products WHERE brand_id = ? AND is_active = 1) as product_count
      FROM brands 
      WHERE id = ? AND is_active = 1`,
      [id, id]
    );

    const brand = (brands as any[])[0];
    if (!brand) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết thương hiệu thành công',
      data: brand,
    });
  } catch (error) {
    console.error('Get brand by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết thương hiệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy thương hiệu theo slug
export const getBrandBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const [brands] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        logo,
        description,
        website,
        sort_order,
        (SELECT COUNT(*) FROM products WHERE brand_id = b.id AND is_active = 1) as product_count
      FROM brands b
      WHERE slug = ? AND is_active = 1`,
      [slug]
    );

    const brand = (brands as any[])[0];
    if (!brand) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thương hiệu theo slug thành công',
      data: brand,
    });
  } catch (error) {
    console.error('Get brand by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thương hiệu theo slug',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

//Đoạn này Admin á nha Khôi

// Validation rules
export const brandValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Tên thương hiệu không được để trống'),
];

// Tạo thương hiệu mới (Admin)
export const createBrand = async (req: Request, res: Response): Promise<void> => {
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

    const { name, slug, logo, description, website, sort_order = 0 } = req.body;

    // Tạo slug tự động nếu không có
    const brandSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Kiểm tra slug đã tồn tại chưa
    const [existingSlugs] = await pool.execute('SELECT id FROM brands WHERE slug = ?', [brandSlug]);

    if ((existingSlugs as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Slug đã tồn tại',
      });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO brands (name, slug, logo, description, website, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, brandSlug, logo, description, website, sort_order]
    );

    const brandId = (result as any).insertId;

    res.status(201).json({
      success: true,
      message: 'Tạo thương hiệu thành công',
      data: { id: brandId, name, slug: brandSlug },
    });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thương hiệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật thương hiệu (Admin)
export const updateBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, logo, description, website, sort_order, is_active } = req.body;

    // Kiểm tra thương hiệu tồn tại
    const [brands] = await pool.execute('SELECT id FROM brands WHERE id = ?', [id]);
    if ((brands as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu',
      });
      return;
    }

    // Nếu có slug mới, kiểm tra trùng lặp
    if (slug) {
      const [existingSlugs] = await pool.execute(
        'SELECT id FROM brands WHERE slug = ? AND id != ?',
        [slug, id]
      );
      if ((existingSlugs as any[]).length > 0) {
        res.status(400).json({
          success: false,
          message: 'Slug đã tồn tại',
        });
        return;
      }
    }

    // Build update query động
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
    if (logo !== undefined) { updates.push('logo = ?'); values.push(logo); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (website !== undefined) { updates.push('website = ?'); values.push(website); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE brands SET ${updates.join(', ')} WHERE id = ?`, values);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thương hiệu thành công',
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thương hiệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa thương hiệu (Admin)
export const deleteBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Kiểm tra thương hiệu tồn tại
    const [brands] = await pool.execute('SELECT id FROM brands WHERE id = ?', [id]);
    if ((brands as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu',
      });
      return;
    }

    // Kiểm tra có sản phẩm nào đang sử dụng thương hiệu này không
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE brand_id = ? AND is_active = 1 LIMIT 1',
      [id]
    );

    if ((products as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Không thể xóa thương hiệu đang có sản phẩm',
      });
      return;
    }

    // Soft delete
    await pool.execute('UPDATE brands SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Xóa thương hiệu thành công',
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thương hiệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// ==========================================
// ADMIN DASHBOARD APIs (Tương tự products)
// ==========================================

// Lấy danh sách brands cho Admin (bao gồm cả inactive)
export const getBrandsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      is_active,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    // Filter by search
    if (search) {
      whereConditions.push('(name LIKE ? OR slug LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Filter by is_active (nếu có)
    if (is_active !== undefined) {
      whereConditions.push('is_active = ?');
      const isActiveValue = String(is_active) === 'true' || String(is_active) === '1' ? 1 : 0;
      queryParams.push(isActiveValue);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Valid sort columns
    const validSortColumns = ['name', 'slug', 'created_at', 'updated_at', 'sort_order'];
    const sortColumn = validSortColumns.includes(String(sort_by)) ? String(sort_by) : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM brands ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // Get brands
    const [brands] = await pool.execute(
      `SELECT 
        b.*,
        (SELECT COUNT(*) FROM products WHERE brand_id = b.id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM products WHERE brand_id = b.id) as total_product_count
      FROM brands b
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), offset]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thương hiệu thành công',
      data: {
        brands,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get brands admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thương hiệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết brand cho Admin (bao gồm cả inactive)
export const getBrandByIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [brands] = await pool.execute(
      `SELECT 
        b.*,
        (SELECT COUNT(*) FROM products WHERE brand_id = b.id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM products WHERE brand_id = b.id) as total_product_count
      FROM brands b
      WHERE b.id = ?`,
      [id]
    );

    const brand = (brands as any[])[0];
    if (!brand) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thương hiệu',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết thương hiệu thành công',
      data: brand,
    });
  } catch (error) {
    console.error('Get brand by id admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết thương hiệu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};