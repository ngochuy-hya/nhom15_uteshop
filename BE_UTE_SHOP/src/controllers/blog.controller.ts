import { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';

// Validation rules
export const blogValidation = [
  body('title').trim().isLength({ min: 1 }).withMessage('Tiêu đề không được để trống'),
  body('content').trim().isLength({ min: 1 }).withMessage('Nội dung không được để trống'),
];

// Lấy danh sách blog
export const getBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = ['b.is_published = 1'];
    let queryParams: any[] = [];

    if (category) {
      whereConditions.push('b.category = ?');
      queryParams.push(category);
    }

    if (search) {
      whereConditions.push('(b.title LIKE ? OR b.content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const [blogs] = await pool.execute(
      `SELECT 
        b.id, b.title, b.slug, b.excerpt, b.featured_image, b.category,
        b.view_count, b.published_at, b.created_at,
        u.first_name, u.last_name,
        (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id AND is_approved = 1) as comment_count
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY b.published_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM blogs b WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách blog thành công',
      data: {
        blogs,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách blog',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết blog
export const getBlogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [blogs] = await pool.execute(
      `SELECT 
        b.*, 
        u.first_name, u.last_name, u.avatar
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.id = ? AND b.is_published = 1`,
      [id]
    );

    const blog = (blogs as any[])[0];
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy blog',
      });
      return;
    }

    // Tăng view count
    await pool.execute('UPDATE blogs SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết blog thành công',
      data: blog,
    });
  } catch (error) {
    console.error('Get blog by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết blog',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy blog theo slug
export const getBlogBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const [blogs] = await pool.execute(
      `SELECT 
        b.*, 
        u.first_name, u.last_name, u.avatar
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.slug = ? AND b.is_published = 1`,
      [slug]
    );

    const blog = (blogs as any[])[0];
    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy blog',
      });
      return;
    }

    // Tăng view count
    await pool.execute('UPDATE blogs SET view_count = view_count + 1 WHERE slug = ?', [slug]);

    res.status(200).json({
      success: true,
      message: 'Lấy blog theo slug thành công',
      data: blog,
    });
  } catch (error) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy blog theo slug',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// ==================== ADMIN APIs ====================

// Tạo blog mới (Admin)
export const createBlog = async (req: AuthRequest, res: Response): Promise<void> => {
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
      slug,
      excerpt,
      content,
      featured_image,
      category,
      tags,
      meta_title,
      meta_description,
      is_published = false,
    } = req.body;

    const blogSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Kiểm tra slug trùng
    const [existingSlugs] = await pool.execute('SELECT id FROM blogs WHERE slug = ?', [blogSlug]);
    if ((existingSlugs as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Slug đã tồn tại',
      });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO blogs (
        author_id, title, slug, excerpt, content, featured_image, category, tags,
        meta_title, meta_description, is_published, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id,
        title,
        blogSlug,
        excerpt,
        content,
        featured_image,
        category,
        tags,
        meta_title,
        meta_description,
        is_published,
        is_published ? new Date() : null,
      ]
    );

    const blogId = (result as any).insertId;

    res.status(201).json({
      success: true,
      message: 'Tạo blog thành công',
      data: { id: blogId, title, slug: blogSlug },
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo blog',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật blog (Admin)
export const updateBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      category,
      tags,
      meta_title,
      meta_description,
      is_published,
    } = req.body;

    // Kiểm tra blog tồn tại
    const [blogs] = await pool.execute('SELECT id FROM blogs WHERE id = ?', [id]);
    if ((blogs as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy blog',
      });
      return;
    }

    // Kiểm tra slug trùng
    if (slug) {
      const [existingSlugs] = await pool.execute(
        'SELECT id FROM blogs WHERE slug = ? AND id != ?',
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

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
    if (excerpt !== undefined) { updates.push('excerpt = ?'); values.push(excerpt); }
    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (featured_image !== undefined) { updates.push('featured_image = ?'); values.push(featured_image); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (tags !== undefined) { updates.push('tags = ?'); values.push(tags); }
    if (meta_title !== undefined) { updates.push('meta_title = ?'); values.push(meta_title); }
    if (meta_description !== undefined) { updates.push('meta_description = ?'); values.push(meta_description); }
    if (is_published !== undefined) {
      updates.push('is_published = ?');
      values.push(is_published);
      if (is_published) {
        updates.push('published_at = NOW()');
      }
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
      return;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, values);

    res.status(200).json({
      success: true,
      message: 'Cập nhật blog thành công',
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật blog',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa blog (Admin)
export const deleteBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [blogs] = await pool.execute('SELECT id FROM blogs WHERE id = ?', [id]);
    if ((blogs as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy blog',
      });
      return;
    }

    await pool.execute('DELETE FROM blogs WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Xóa blog thành công',
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa blog',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy comments của blog
export const getBlogComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [comments] = await pool.execute(
      `SELECT 
        bc.*, 
        u.first_name, u.last_name, u.avatar
      FROM blog_comments bc
      LEFT JOIN users u ON bc.user_id = u.id
      WHERE bc.blog_id = ? AND bc.is_approved = 1
      ORDER BY bc.created_at DESC
      LIMIT ? OFFSET ?`,
      [id, Number(limit), offset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM blog_comments WHERE blog_id = ? AND is_approved = 1',
      [id]
    );
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: 'Lấy comments thành công',
      data: {
        comments,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get blog comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy comments',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thêm comment (User)
export const addBlogComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Nội dung comment không được để trống',
      });
      return;
    }

    // Kiểm tra blog tồn tại
    const [blogs] = await pool.execute('SELECT id FROM blogs WHERE id = ? AND is_published = 1', [id]);
    if ((blogs as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy blog',
      });
      return;
    }

    await pool.execute(
      'INSERT INTO blog_comments (blog_id, user_id, content, is_approved) VALUES (?, ?, ?, 0)',
      [id, req.user!.id, content]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm comment thành công. Comment đang chờ duyệt.',
    });
  } catch (error) {
    console.error('Add blog comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm comment',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

