import { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';

// Lấy danh sách danh mục
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parent_id } = req.query;

    let whereCondition = 'is_active = 1';
    let queryParams: any[] = [];

    if (parent_id) {
      whereCondition += ' AND parent_id = ?';
      queryParams.push(parent_id);
    } else {
      whereCondition += ' AND parent_id IS NULL';
    }

    const [categories] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        description,
        image,
        parent_id,
        sort_order,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      WHERE ${whereCondition}
      ORDER BY sort_order, name`,
      queryParams
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết danh mục
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [categories] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        description,
        image,
        parent_id,
        sort_order,
        meta_title,
        meta_description,
        (SELECT COUNT(*) FROM products WHERE category_id = ? AND is_active = 1) as product_count
      FROM categories 
      WHERE id = ? AND is_active = 1`,
      [id, id]
    );

    const category = (categories as any[])[0];
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
      return;
    }

    // Lấy danh mục con
    const [subCategories] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        description,
        image,
        sort_order,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      WHERE parent_id = ? AND is_active = 1
      ORDER BY sort_order, name`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết danh mục thành công',
      data: {
        ...category,
        sub_categories: subCategories,
      },
    });
  } catch (error) {
    console.error('Get category by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết danh mục',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy danh mục theo slug
export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const [categories] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        description,
        image,
        parent_id,
        sort_order,
        meta_title,
        meta_description,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      WHERE slug = ? AND is_active = 1`,
      [slug]
    );

    const category = (categories as any[])[0];
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
      return;
    }

    // Lấy danh mục con
    const [subCategories] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        description,
        image,
        sort_order,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      WHERE parent_id = ? AND is_active = 1
      ORDER BY sort_order, name`,
      [category.id]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh mục theo slug thành công',
      data: {
        ...category,
        sub_categories: subCategories,
      },
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh mục theo slug',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

//Admin nhá

// Validation rules
export const categoryValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Tên danh mục không được để trống'),
];

// Tạo danh mục mới (Admin)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
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
      name,
      slug,
      description,
      image,
      parent_id,
      gender = 'all',
      sort_order = 0,
      meta_title,
      meta_description,
    } = req.body;

    // Tạo slug tự động nếu không có
    const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Kiểm tra slug đã tồn tại chưa
    const [existingSlugs] = await pool.execute(
      'SELECT id FROM categories WHERE slug = ?',
      [categorySlug]
    );

    if ((existingSlugs as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Slug đã tồn tại',
      });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO categories (name, slug, description, image, parent_id, gender, sort_order, meta_title, meta_description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, categorySlug, description, image, parent_id || null, gender, sort_order, meta_title, meta_description]
    );

    const categoryId = (result as any).insertId;

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: {
        id: categoryId,
        name,
        slug: categorySlug,
      },
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo danh mục',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật danh mục (Admin)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      image,
      parent_id,
      gender,
      sort_order,
      meta_title,
      meta_description,
      is_active,
    } = req.body;

    // Kiểm tra danh mục tồn tại
    const [categories] = await pool.execute('SELECT id FROM categories WHERE id = ?', [id]);
    if ((categories as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
      return;
    }

    // Nếu có slug mới, kiểm tra trùng lặp
    if (slug) {
      const [existingSlugs] = await pool.execute(
        'SELECT id FROM categories WHERE slug = ? AND id != ?',
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
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (image !== undefined) { updates.push('image = ?'); values.push(image); }
    if (parent_id !== undefined) { updates.push('parent_id = ?'); values.push(parent_id); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (meta_title !== undefined) { updates.push('meta_title = ?'); values.push(meta_title); }
    if (meta_description !== undefined) { updates.push('meta_description = ?'); values.push(meta_description); }
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

    await pool.execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật danh mục',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa danh mục (Admin)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Kiểm tra danh mục tồn tại
    const [categories] = await pool.execute('SELECT id FROM categories WHERE id = ?', [id]);
    if ((categories as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
      return;
    }

    // Kiểm tra có sản phẩm nào đang sử dụng danh mục này không
    const [products] = await pool.execute(
      'SELECT id FROM products WHERE category_id = ? AND is_active = 1 LIMIT 1',
      [id]
    );

    if ((products as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục đang có sản phẩm',
      });
      return;
    }

    // Soft delete
    await pool.execute('UPDATE categories SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa danh mục',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// ==========================================
// ADMIN DASHBOARD APIs (Tương tự products)
// ==========================================

// Lấy danh sách categories cho Admin (bao gồm cả inactive)
export const getCategoriesAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      is_active,
      parent_id,
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

    // Filter by parent_id
    if (parent_id !== undefined) {
      if (parent_id === 'null' || parent_id === null || parent_id === '') {
        whereConditions.push('parent_id IS NULL');
      } else {
        whereConditions.push('parent_id = ?');
        queryParams.push(Number(parent_id));
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Valid sort columns
    const validSortColumns = ['name', 'slug', 'created_at', 'updated_at', 'sort_order'];
    const sortColumn = validSortColumns.includes(String(sort_by)) ? String(sort_by) : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM categories ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // Get categories
    const [categories] = await pool.execute(
      `SELECT 
        c.*,
        parent.name as parent_name,
        parent.slug as parent_slug,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) as total_product_count,
        (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as sub_category_count
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), offset]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công',
      data: {
        categories,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get categories admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy categories dạng tree (phân cấp) cho Admin
export const getCategoriesTreeAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { is_active } = req.query;

    // Lấy tất cả categories
    let whereClause = '';
    const queryParams: any[] = [];

    if (is_active !== undefined) {
      whereClause = 'WHERE is_active = ?';
      const isActiveValue = String(is_active) === 'true' || String(is_active) === '1' ? 1 : 0;
      queryParams.push(isActiveValue);
    }

    const [allCategories] = await pool.execute(
      `SELECT 
        c.*,
        parent.name as parent_name,
        parent.slug as parent_slug,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) as total_product_count,
        (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as sub_category_count
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      ${whereClause}
      ORDER BY sort_order, name`,
      queryParams
    );

    const categories = allCategories as any[];

    // Hàm đệ quy để build tree
    const buildTree = (parentId: number | null): any[] => {
      return categories
        .filter((cat) => {
          if (parentId === null) {
            return cat.parent_id === null;
          }
          return cat.parent_id === parentId;
        })
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }))
        .sort((a, b) => {
          // Sort theo sort_order, sau đó theo name
          if (a.sort_order !== b.sort_order) {
            return (a.sort_order || 0) - (b.sort_order || 0);
          }
          return (a.name || '').localeCompare(b.name || '');
        });
    };

    const tree = buildTree(null);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục dạng tree thành công',
      data: tree,
    });
  } catch (error) {
    console.error('Get categories tree admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục dạng tree',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy categories dạng tree (phân cấp) cho Public (chỉ active)
export const getCategoriesTree = async (req: Request, res: Response): Promise<void> => {
  try {
    // Lấy tất cả categories active
    const [allCategories] = await pool.execute(
      `SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image,
        c.parent_id,
        c.sort_order,
        c.gender,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      WHERE c.is_active = 1
      ORDER BY sort_order, name`
    );

    const categories = allCategories as any[];

    // Hàm đệ quy để build tree
    const buildTree = (parentId: number | null): any[] => {
      return categories
        .filter((cat) => {
          if (parentId === null) {
            return cat.parent_id === null;
          }
          return cat.parent_id === parentId;
        })
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }))
        .sort((a, b) => {
          // Sort theo sort_order, sau đó theo name
          if (a.sort_order !== b.sort_order) {
            return (a.sort_order || 0) - (b.sort_order || 0);
          }
          return (a.name || '').localeCompare(b.name || '');
        });
    };

    const tree = buildTree(null);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục dạng tree thành công',
      data: tree,
    });
  } catch (error) {
    console.error('Get categories tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục dạng tree',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết category cho Admin (bao gồm cả inactive)
export const getCategoryByIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [categories] = await pool.execute(
      `SELECT 
        c.*,
        parent.name as parent_name,
        parent.slug as parent_slug,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) as total_product_count,
        (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as sub_category_count
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.id = ?`,
      [id]
    );

    const category = (categories as any[])[0];
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
      return;
    }

    // Lấy danh mục con (không filter is_active)
    const [subCategories] = await pool.execute(
      `SELECT 
        id,
        name,
        slug,
        description,
        image,
        sort_order,
        is_active,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      WHERE parent_id = ?
      ORDER BY sort_order, name`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết danh mục thành công',
      data: {
        ...category,
        sub_categories: subCategories,
      },
    });
  } catch (error) {
    console.error('Get category by id admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết danh mục',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};