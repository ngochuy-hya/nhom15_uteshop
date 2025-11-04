import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse, Product } from '../types';
import { body, validationResult } from 'express-validator';
import fs from 'fs';

// Lấy danh sách sản phẩm
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      category_id,
      brand_id,
      gender,
      season,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      min_price,
      max_price,
      is_featured,
      is_trending,
      is_bestseller,
      is_new,
      is_sale,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    // Trả về tất cả sản phẩm (cả is_active = 0 và 1), frontend sẽ tự filter
    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Filter theo category
    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    // Filter theo brand
    if (brand_id) {
      whereConditions.push('p.brand_id = ?');
      queryParams.push(brand_id);
    }

    // Filter theo gender
    if (gender) {
      whereConditions.push('p.gender = ?');
      queryParams.push(gender);
    }

    // Filter theo season
    if (season) {
      whereConditions.push('(p.season = ? OR p.season = "all")');
      queryParams.push(season);
    }

    // Search theo tên sản phẩm
    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Filter theo giá
    if (min_price) {
      whereConditions.push('p.price >= ?');
      queryParams.push(min_price);
    }
    if (max_price) {
      whereConditions.push('p.price <= ?');
      queryParams.push(max_price);
    }

    // Filter theo trạng thái
    if (is_featured === 'true') {
      whereConditions.push('p.is_featured = 1');
    }
    if (is_trending === 'true') {
      whereConditions.push('p.is_trending = 1');
    }
    if (is_bestseller === 'true') {
      whereConditions.push('p.is_bestseller = 1');
    }
    if (is_new === 'true') {
      whereConditions.push('p.is_new = 1');
    }
    if (is_sale === 'true') {
      whereConditions.push('p.sale_price IS NOT NULL AND p.sale_price > 0');
    }

    // Validate sort_by
    const allowedSortFields = ['created_at', 'price', 'name', 'view_count'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // Query chính - Luôn trả về is_active
    const query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.short_description,
        p.sku,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.is_featured,
        p.is_trending,
        p.is_bestseller,
        p.is_new,
        p.is_sale,
        p.view_count,
        p.created_at,
        p.is_active,
        c.name as category_name,
        b.name as brand_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as average_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(Number(limit), offset);

    const [products] = await pool.execute(query, queryParams);

    // Đếm tổng số sản phẩm
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
    `;
    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total: total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy sản phẩm mới
export const getNewProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      days = 30, // Sản phẩm mới trong X ngày gần đây
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.short_description,
        p.sku,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.is_featured,
        p.is_trending,
        p.is_bestseller,
        p.is_new,
        p.is_sale,
        p.view_count,
        p.created_at,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as average_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as review_count,
        CASE 
          WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 
          THEN ROUND(((p.price - p.sale_price) / p.price) * 100, 0)
          ELSE 0 
        END as discount_percentage
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = 1 
        AND p.created_at >= ?
        AND (p.is_new = 1 OR p.created_at >= ?)
      ORDER BY p.created_at DESC, p.view_count DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [daysAgo, daysAgo, Number(limit), offset];

    const [products] = await pool.execute(query, queryParams);

    // Đếm tổng số sản phẩm mới
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.is_active = 1 
        AND p.created_at >= ?
        AND (p.is_new = 1 OR p.created_at >= ?)
    `;
    const [countResult] = await pool.execute(countQuery, [daysAgo, daysAgo]);
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: `Lấy danh sách sản phẩm mới thành công (trong ${days} ngày gần đây)`,
      data: {
        products,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total: total,
          total_pages: Math.ceil(total / Number(limit)),
        },
        filter: {
          days: Number(days),
          from_date: daysAgo.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get new products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm mới',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết sản phẩm
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Lấy thông tin sản phẩm
    const [products] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ? AND p.is_active = 1`,
      [id]
    );

    const product = (products as any[])[0];
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    // Lấy hình ảnh sản phẩm
    const [images] = await pool.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
      [id]
    );

    // Lấy thuộc tính sản phẩm - TRẢ VỀ TẤT CẢ (không filter is_active) để admin có thể chỉnh sửa
    const [attributes] = await pool.execute(
      'SELECT * FROM product_attributes WHERE product_id = ? ORDER BY attribute_type, attribute_name',
      [id]
    );

    // Lấy đánh giá sản phẩm
    const [reviews] = await pool.execute(
      `SELECT 
        pr.*,
        u.first_name,
        u.last_name,
        u.avatar
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ? AND pr.is_approved = 1
      ORDER BY pr.created_at DESC
      LIMIT 10`,
      [id]
    );

    // Tăng view count
    await pool.execute(
      'UPDATE products SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: {
        ...product,
        images,
        attributes,
        reviews,
      },
    });
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy sản phẩm liên quan
export const getRelatedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Lấy category_id của sản phẩm hiện tại
    const [products] = await pool.execute(
      'SELECT category_id FROM products WHERE id = ?',
      [id]
    );

    const currentProduct = (products as any[])[0];
    if (!currentProduct) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    // Lấy sản phẩm cùng category
    const [relatedProducts] = await pool.execute(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.is_featured,
        p.is_trending,
        p.is_bestseller,
        p.is_new,
        p.is_sale,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as average_rating
      FROM products p
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY RAND()
      LIMIT ?`,
      [currentProduct.category_id, id, Number(limit)]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm liên quan thành công',
      data: relatedProducts,
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm liên quan',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy sản phẩm nổi bật
export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 8 } = req.query;

    const [products] = await pool.execute(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.is_featured,
        p.is_trending,
        p.is_bestseller,
        p.is_new,
        p.is_sale,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as average_rating
      FROM products p
      WHERE p.is_featured = 1 AND p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ?`,
      [Number(limit)]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm nổi bật thành công',
      data: products,
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm nổi bật',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy sản phẩm bán chạy
export const getBestSellerProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 8 } = req.query;

    const [products] = await pool.execute(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.is_featured,
        p.is_trending,
        p.is_bestseller,
        p.is_new,
        p.is_sale,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as average_rating,
        COUNT(oi.id) as sales_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE p.is_bestseller = 1 AND p.is_active = 1
      AND (o.status_id = 3 OR o.status_id = 4)
      GROUP BY p.id
      ORDER BY sales_count DESC, p.created_at DESC
      LIMIT ?`,
      [Number(limit)]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm bán chạy thành công',
      data: products,
    });
  } catch (error) {
    console.error('Get bestseller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm bán chạy',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// ADMIN

// Validation rules cho product
export const productValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Tên sản phẩm không được để trống'),
  body('price').isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
  body('category_id').isInt().withMessage('Category ID không hợp lệ'),
  // Images là bắt buộc khi tạo sản phẩm mới
  body('images').isArray({ min: 1 }).withMessage('Sản phẩm phải có ít nhất 1 ảnh'),
  body('images.*.image_url').notEmpty().withMessage('URL ảnh không được để trống'),
];

// Tạo sản phẩm mới (Admin)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
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
      short_description,
      sku,
      price,
      sale_price,
      cost_price,
      stock_quantity = 0, // Sẽ được tính tự động từ attributes
      category_id,
      gender = 'unisex',
      season = 'all',
      brand_id,
      is_featured = false,
      is_trending = false,
      is_bestseller = false,
      is_new = true,
      is_sale = false,
      attributes, // Array của attributes nếu có
      images, // Array của images nếu có: [{image_url, is_primary, sort_order}]
    } = req.body;

    // Tạo slug tự động nếu không có
    const productSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Kiểm tra slug đã tồn tại chưa
    const [existingSlugs] = await pool.execute(
      'SELECT id FROM products WHERE slug = ?',
      [productSlug]
    );

    if ((existingSlugs as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Slug đã tồn tại',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Tạo sản phẩm với stock_quantity = 0 tạm thời
      const [result] = await connection.execute(
        `INSERT INTO products (
          name, slug, description, short_description, sku, price, sale_price, cost_price,
          stock_quantity, category_id, gender, season, brand_id, is_featured, is_trending, is_bestseller,
          is_new, is_sale, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name, productSlug, description, short_description, sku, price, sale_price || null,
          cost_price || null, 0, category_id, gender, season, brand_id || null, is_featured,
          is_trending, is_bestseller, is_new, is_sale
        ]
      );

      const productId = (result as any).insertId;

      // Nếu có attributes, thêm vào và tính tổng stock_quantity
      let totalStock = 0;
      if (attributes && Array.isArray(attributes) && attributes.length > 0) {
        for (const attr of attributes) {
          const { attribute_type, attribute_name, attribute_value, price_adjustment = 0, stock_quantity: attrStock = 0, is_active = true } = attr;
          
          if (!attribute_type || !attribute_name || !attribute_value) {
            continue; // Skip invalid attributes
          }

          await connection.execute(
            `INSERT INTO product_attributes (product_id, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [productId, attribute_type, attribute_name, attribute_value, price_adjustment, attrStock, is_active ? 1 : 0]
          );

          totalStock += attrStock;
        }
      }

      // Cập nhật stock_quantity của product = tổng stock từ attributes
      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, productId]
      );

      // Images là BẮT BUỘC khi tạo sản phẩm mới
      if (!images || !Array.isArray(images) || images.length === 0) {
        await connection.rollback();
        connection.release();
        res.status(400).json({
          success: false,
          message: 'Sản phẩm phải có ít nhất 1 ảnh',
        });
        return;
      }

      // Kiểm tra tất cả images có image_url không
      const invalidImages = images.filter((img: any) => !img.image_url);
      if (invalidImages.length > 0) {
        await connection.rollback();
        connection.release();
        res.status(400).json({
          success: false,
          message: 'Tất cả ảnh phải có URL hợp lệ',
        });
        return;
      }

      // Nếu có ảnh primary, set tất cả ảnh cũ thành non-primary
      const hasPrimary = images.some((img: any) => img.is_primary);
      if (hasPrimary) {
        await connection.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
      }

      // Thêm tất cả ảnh vào product_images
      for (const image of images) {
        await connection.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [productId, image.image_url, image.is_primary ? 1 : 0, image.sort_order || 0]
        );
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: {
          id: productId,
          name,
          slug: productSlug,
          stock_quantity: totalStock,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo sản phẩm',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật sản phẩm (Admin)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      short_description,
      sku,
      price,
      sale_price,
      cost_price,
      stock_quantity,
      category_id,
      gender,
      season,
      brand_id,
      is_featured,
      is_trending,
      is_bestseller,
      is_new,
      is_sale,
      is_active,
      attributes, // Array của attributes để update
      images, // Array của images để update: [{id?, image_url, is_primary, sort_order}] - nếu có id thì update, không có thì insert
    } = req.body;

    // Kiểm tra sản phẩm tồn tại
    const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
    if ((products as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    // Nếu có slug mới, kiểm tra trùng lặp
    if (slug) {
      const [existingSlugs] = await pool.execute(
        'SELECT id FROM products WHERE slug = ? AND id != ?',
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
    if (short_description !== undefined) { updates.push('short_description = ?'); values.push(short_description); }
    if (sku !== undefined) { updates.push('sku = ?'); values.push(sku); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (sale_price !== undefined) { updates.push('sale_price = ?'); values.push(sale_price); }
    if (cost_price !== undefined) { updates.push('cost_price = ?'); values.push(cost_price); }
    if (stock_quantity !== undefined) { updates.push('stock_quantity = ?'); values.push(stock_quantity); }
    if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
    if (season !== undefined) { updates.push('season = ?'); values.push(season); }
    if (brand_id !== undefined) { updates.push('brand_id = ?'); values.push(brand_id); }
    if (is_featured !== undefined) { updates.push('is_featured = ?'); values.push(is_featured); }
    if (is_trending !== undefined) { updates.push('is_trending = ?'); values.push(is_trending); }
    if (is_bestseller !== undefined) { updates.push('is_bestseller = ?'); values.push(is_bestseller); }
    if (is_new !== undefined) { updates.push('is_new = ?'); values.push(is_new); }
    if (is_sale !== undefined) { updates.push('is_sale = ?'); values.push(is_sale); }
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
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Nếu có attributes, cập nhật attributes
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        if (attr.id) {
          // Update existing attribute
          await pool.execute(
            `UPDATE product_attributes 
             SET attribute_type = ?, attribute_name = ?, attribute_value = ?, 
                 price_adjustment = ?, stock_quantity = ?, is_active = ?
             WHERE id = ? AND product_id = ?`,
            [
              attr.attribute_type, attr.attribute_name, attr.attribute_value,
              attr.price_adjustment || 0, attr.stock_quantity || 0, attr.is_active ? 1 : 0,
              attr.id, id
            ]
          );
        } else if (attr.attribute_type && attr.attribute_name && attr.attribute_value) {
          // Insert new attribute
          await pool.execute(
            `INSERT INTO product_attributes (product_id, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id, attr.attribute_type, attr.attribute_name, attr.attribute_value,
              attr.price_adjustment || 0, attr.stock_quantity || 0, attr.is_active !== false ? 1 : 0
            ]
          );
        }
      }
    }

    // Nếu có images, cập nhật images
    if (images && Array.isArray(images)) {
      for (const image of images) {
        if (image.id) {
          // Update existing image
          await pool.execute(
            `UPDATE product_images 
             SET image_url = ?, is_primary = ?, sort_order = ?
             WHERE id = ? AND product_id = ?`,
            [image.image_url, image.is_primary ? 1 : 0, image.sort_order || 0, image.id, id]
          );
        } else if (image.image_url) {
          // Insert new image
          if (image.is_primary) {
            await pool.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [id]);
          }
          await pool.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
            [id, image.image_url, image.is_primary ? 1 : 0, image.sort_order || 0]
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa sản phẩm (Admin)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Kiểm tra sản phẩm tồn tại
    const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
    if ((products as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    // Soft delete: set is_active = 0
    await pool.execute('UPDATE products SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Upload ảnh sản phẩm (Admin)
/**
 * Thêm ảnh vào sản phẩm đã có (JSON với image_url sẵn có)
 * 
 * NOTE: Function này đã bị comment vì không dùng nữa.
 * Thay vào đó, dùng POST /products/with-images để tạo product + upload ảnh từ local.
 * Hoặc có thể thêm ảnh khi update product bằng PUT /products/:id
 * 
 * Nếu cần dùng lại, uncomment function này và route trong product.routes.ts
 */
/*
export const uploadProductImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { images } = req.body; // Array of {image_url, is_primary, sort_order}

    if (!images || images.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Danh sách ảnh không được để trống',
      });
      return;
    }

    // Kiểm tra sản phẩm tồn tại
    const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
    if ((products as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    // Nếu có ảnh primary mới, set tất cả ảnh cũ thành non-primary
    const hasPrimary = images.some((img: any) => img.is_primary);
    if (hasPrimary) {
      await pool.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [id]);
    }

    // Thêm ảnh mới
    for (const image of images) {
      await pool.execute(
        'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
        [id, image.image_url, image.is_primary || 0, image.sort_order || 0]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Upload ảnh sản phẩm thành công',
    });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload ảnh sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
*/

// Xóa ảnh sản phẩm (Admin)
export const deleteProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, imageId } = req.params;

    // Kiểm tra ảnh tồn tại
    const [images] = await pool.execute(
      'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, id]
    );

    if ((images as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy ảnh',
      });
      return;
    }

    await pool.execute('DELETE FROM product_images WHERE id = ?', [imageId]);

    res.status(200).json({
      success: true,
      message: 'Xóa ảnh sản phẩm thành công',
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa ảnh sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thêm thuộc tính sản phẩm (Admin) - DEPRECATED: Sử dụng /api/product-attributes/product/:productId thay thế
export const addProductAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      attribute_type,
      attribute_name,
      attribute_value,
      price_adjustment = 0,
      stock_quantity = 0,
      is_active = true,
    } = req.body;

    if (!attribute_type || !attribute_name || !attribute_value) {
      res.status(400).json({
        success: false,
        message: 'Loại, tên và giá trị thuộc tính là bắt buộc',
      });
      return;
    }

    // Kiểm tra sản phẩm tồn tại
    const [products] = await pool.execute('SELECT id FROM products WHERE id = ?', [id]);
    if ((products as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Thêm attribute
      const [result] = await connection.execute(
        `INSERT INTO product_attributes 
        (product_id, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active ? 1 : 0]
      );

      const attributeId = (result as any).insertId;

      // Tính tổng stock và cập nhật product
      const [stockResult] = await connection.execute(
        'SELECT SUM(stock_quantity) as total_stock FROM product_attributes WHERE product_id = ? AND is_active = 1',
        [id]
      );

      const totalStock = (stockResult as any[])[0]?.total_stock || 0;

      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, id]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: 'Thêm thuộc tính sản phẩm thành công',
        data: {
          id: attributeId,
          product_stock_updated: totalStock,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Add product attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm thuộc tính sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật thuộc tính sản phẩm (Admin) - DEPRECATED: Sử dụng /api/product-attributes/product/:productId/:attributeId thay thế
export const updateProductAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, attrId } = req.params;
    const { attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active } = req.body;

    // Kiểm tra thuộc tính tồn tại
    const [attributes] = await pool.execute(
      'SELECT * FROM product_attributes WHERE id = ? AND product_id = ?',
      [attrId, id]
    );

    if ((attributes as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuộc tính',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (attribute_type !== undefined) { updates.push('attribute_type = ?'); values.push(attribute_type); }
      if (attribute_name !== undefined) { updates.push('attribute_name = ?'); values.push(attribute_name); }
      if (attribute_value !== undefined) { updates.push('attribute_value = ?'); values.push(attribute_value); }
      if (price_adjustment !== undefined) { updates.push('price_adjustment = ?'); values.push(price_adjustment); }
      if (stock_quantity !== undefined) { updates.push('stock_quantity = ?'); values.push(stock_quantity); }
      if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

      if (updates.length === 0) {
        await connection.rollback();
        connection.release();
        res.status(400).json({
          success: false,
          message: 'Không có dữ liệu để cập nhật',
        });
        return;
      }

      values.push(attrId, id);

      await connection.execute(
        `UPDATE product_attributes SET ${updates.join(', ')} WHERE id = ? AND product_id = ?`,
        values
      );

      // Tính lại tổng stock và cập nhật product
      const [stockResult] = await connection.execute(
        'SELECT SUM(stock_quantity) as total_stock FROM product_attributes WHERE product_id = ? AND is_active = 1',
        [id]
      );

      const totalStock = (stockResult as any[])[0]?.total_stock || 0;

      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, id]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({
        success: true,
        message: 'Cập nhật thuộc tính sản phẩm thành công',
        data: {
          product_stock_updated: totalStock,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update product attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thuộc tính sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Tạo sản phẩm mới với upload ảnh từ form-data (Admin)
export const createProductWithImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    
    // Kiểm tra có ít nhất 1 ảnh
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Sản phẩm phải có ít nhất 1 ảnh',
      });
      return;
    }

    // Parse JSON từ form-data
    let productData: any = {};
    try {
      if (req.body.productData) {
        productData = typeof req.body.productData === 'string' 
          ? JSON.parse(req.body.productData) 
          : req.body.productData;
        // Đảm bảo brand_id được parse đúng (có thể là string từ form-data)
        if (productData.brand_id !== undefined && productData.brand_id !== null && productData.brand_id !== '') {
          productData.brand_id = parseInt(String(productData.brand_id)) || null;
        } else {
          productData.brand_id = null;
        }
      } else {
        // Nếu không có productData field, parse từ các field riêng lẻ
        productData = {
          name: req.body.name,
          slug: req.body.slug,
          description: req.body.description,
          short_description: req.body.short_description,
          sku: req.body.sku,
          price: req.body.price ? parseFloat(req.body.price) : undefined,
          sale_price: req.body.sale_price ? parseFloat(req.body.sale_price) : null,
          cost_price: req.body.cost_price ? parseFloat(req.body.cost_price) : null,
          category_id: req.body.category_id ? parseInt(req.body.category_id) : undefined,
          gender: req.body.gender || 'unisex',
          season: req.body.season || 'all',
          brand_id: req.body.brand_id && req.body.brand_id !== '' ? parseInt(req.body.brand_id) : null,
          is_featured: req.body.is_featured === 'true' || req.body.is_featured === true,
          is_trending: req.body.is_trending === 'true' || req.body.is_trending === true,
          is_bestseller: req.body.is_bestseller === 'true' || req.body.is_bestseller === true,
          is_new: req.body.is_new !== 'false',
          is_sale: req.body.is_sale === 'true' || req.body.is_sale === true,
        };

        // Parse attributes nếu có
        if (req.body.attributes) {
          try {
            productData.attributes = typeof req.body.attributes === 'string' 
              ? JSON.parse(req.body.attributes) 
              : req.body.attributes;
          } catch (e) {
            productData.attributes = [];
          }
        }
      }
    } catch (parseError) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu sản phẩm không hợp lệ',
        error: process.env.NODE_ENV === 'development' ? parseError : undefined,
      });
      return;
    }

    // Validation cơ bản
    if (!productData.name || !productData.price || !productData.category_id) {
      res.status(400).json({
        success: false,
        message: 'Tên sản phẩm, giá và danh mục là bắt buộc',
      });
      return;
    }

    // Import Cloudinary utility
    const { uploadMultipleToCloudinary } = await import('../utils/cloudinary.util');

    // Upload tất cả ảnh lên Cloudinary
    const cloudinaryResults = await uploadMultipleToCloudinary(files, 'products');

    // Xóa files local sau khi upload
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    // Tạo mảng images từ Cloudinary results
    const images = cloudinaryResults.map((result, index) => {
      // File đầu tiên là primary mặc định
      return {
        image_url: result.secure_url,
        is_primary: index === 0,
        sort_order: index + 1,
      };
    });

    // Nếu có primary_image_index từ request, set primary image theo index
    if (req.body.primary_image_index !== undefined) {
      const primaryIndex = parseInt(req.body.primary_image_index);
      if (primaryIndex >= 0 && primaryIndex < images.length) {
        images.forEach((img, idx) => {
          img.is_primary = idx === primaryIndex;
        });
      }
    }

    // Gộp images vào productData
    productData.images = images;

    // Tạo slug tự động nếu không có
    if (!productData.slug && productData.name) {
      productData.slug = productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    // Kiểm tra slug đã tồn tại chưa
    const [existingSlugs] = await pool.execute(
      'SELECT id FROM products WHERE slug = ?',
      [productData.slug]
    );

    if ((existingSlugs as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Slug đã tồn tại',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Tạo sản phẩm
      const [result] = await connection.execute(
        `INSERT INTO products (
          name, slug, description, short_description, sku, price, sale_price, cost_price,
          stock_quantity, category_id, gender, season, brand_id, is_featured, is_trending, is_bestseller,
          is_new, is_sale, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          productData.name,
          productData.slug,
          productData.description || null,
          productData.short_description || null,
          productData.sku || null,
          productData.price,
          productData.sale_price || null,
          productData.cost_price || null,
          0, // stock_quantity tạm thời
          productData.category_id,
          productData.gender || 'unisex',
          productData.season || 'all',
          productData.brand_id || null,
          productData.is_featured ? 1 : 0,
          productData.is_trending ? 1 : 0,
          productData.is_bestseller ? 1 : 0,
          productData.is_new !== false ? 1 : 0,
          productData.is_sale ? 1 : 0,
        ]
      );

      const productId = (result as any).insertId;

      // Xử lý attributes nếu có
      let totalStock = 0;
      if (productData.attributes && Array.isArray(productData.attributes) && productData.attributes.length > 0) {
        for (const attr of productData.attributes) {
          const { attribute_type, attribute_name, attribute_value, price_adjustment = 0, stock_quantity: attrStock = 0, is_active = true } = attr;
          
          if (!attribute_type || !attribute_name || !attribute_value) {
            continue;
          }

          await connection.execute(
            `INSERT INTO product_attributes (product_id, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [productId, attribute_type, attribute_name, attribute_value, price_adjustment, attrStock, is_active ? 1 : 0]
          );

          totalStock += attrStock;
        }
      }

      // Cập nhật stock_quantity
      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, productId]
      );

      // Thêm images vào product_images
      const hasPrimary = images.some((img: any) => img.is_primary);
      if (hasPrimary) {
        await connection.execute('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
      }

      for (const image of images) {
        await connection.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [productId, image.image_url, image.is_primary ? 1 : 0, image.sort_order || 0]
        );
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: {
          id: productId,
          name: productData.name,
          slug: productData.slug,
          stock_quantity: totalStock,
          images_uploaded: cloudinaryResults.length,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create product with images error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết sản phẩm cho Admin (trả về tất cả attributes và images, không filter is_active)
export const getProductByIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Lấy thông tin sản phẩm
    const [products] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?`,
      [id]
    );

    const product = (products as any[])[0];
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
      return;
    }

    // Lấy hình ảnh sản phẩm - TẤT CẢ
    const [images] = await pool.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
      [id]
    );

    // Lấy thuộc tính sản phẩm - TẤT CẢ (không filter is_active)
    const [attributes] = await pool.execute(
      'SELECT * FROM product_attributes WHERE product_id = ? ORDER BY attribute_type, attribute_name',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: {
        ...product,
        images,
        attributes,
      },
    });
  } catch (error) {
    console.error('Get product by id admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa thuộc tính sản phẩm (Admin) - DEPRECATED: Sử dụng /api/product-attributes/product/:productId/:attributeId thay thế
export const deleteProductAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, attrId } = req.params;

    // Kiểm tra thuộc tính tồn tại
    const [attributes] = await pool.execute(
      'SELECT id FROM product_attributes WHERE id = ? AND product_id = ?',
      [attrId, id]
    );

    if ((attributes as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuộc tính',
      });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute('DELETE FROM product_attributes WHERE id = ?', [attrId]);

      // Tính lại tổng stock và cập nhật product
      const [stockResult] = await connection.execute(
        'SELECT SUM(stock_quantity) as total_stock FROM product_attributes WHERE product_id = ? AND is_active = 1',
        [id]
      );

      const totalStock = (stockResult as any[])[0]?.total_stock || 0;

      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [totalStock, id]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({
        success: true,
        message: 'Xóa thuộc tính sản phẩm thành công',
        data: {
          product_stock_updated: totalStock,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete product attribute error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thuộc tính sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
