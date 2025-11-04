import { ProductModel } from '../models/product.model';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export class ProductService {
  // Lấy danh sách sản phẩm với filter
  static async getProducts(params: {
    page?: number;
    limit?: number;
    category_id?: number;
    brand_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    min_price?: number;
    max_price?: number;
    is_featured?: boolean;
    is_trending?: boolean;
    is_bestseller?: boolean;
    is_new?: boolean;
    is_sale?: boolean;
  }) {
    const {
      page = 1,
      limit = 12,
      category_id,
      brand_id,
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
    } = params;

    const offset = (page - 1) * limit;
    let whereConditions = ['p.is_active = 1'];
    let queryParams: any[] = [];

    // Build where conditions
    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    if (brand_id) {
      whereConditions.push('p.brand_id = ?');
      queryParams.push(brand_id);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (min_price) {
      whereConditions.push('p.price >= ?');
      queryParams.push(min_price);
    }

    if (max_price) {
      whereConditions.push('p.price <= ?');
      queryParams.push(max_price);
    }

    if (is_featured) {
      whereConditions.push('p.is_featured = 1');
    }

    if (is_trending) {
      whereConditions.push('p.is_trending = 1');
    }

    if (is_bestseller) {
      whereConditions.push('p.is_bestseller = 1');
    }

    if (is_new) {
      whereConditions.push('p.is_new = 1');
    }

    if (is_sale) {
      whereConditions.push('p.sale_price IS NOT NULL AND p.sale_price > 0');
    }

    // Validate sort
    const allowedSortFields = ['created_at', 'price', 'name', 'view_count'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

    // Get products
    const [products] = await pool.execute<RowDataPacket[]>(
      `SELECT 
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
        b.name as brand_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as average_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    return {
      products,
      total: countResult[0].total,
      page,
      limit,
      total_pages: Math.ceil(countResult[0].total / limit),
    };
  }

  // Lấy chi tiết sản phẩm
  static async getProductDetail(id: number) {
    const product = await ProductModel.findById(id);
    if (!product || !product.is_active) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Lấy hình ảnh
    const images = await ProductModel.getImages(id);

    // Lấy thuộc tính
    const attributes = await ProductModel.getAttributes(id);

    // Lấy đánh giá
    const [reviews] = await pool.execute<RowDataPacket[]>(
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
    await ProductModel.incrementViewCount(id);

    return {
      ...product,
      images,
      attributes,
      reviews,
    };
  }

  // Lấy sản phẩm liên quan
  static async getRelatedProducts(productId: number, limit: number = 4) {
    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    const [relatedProducts] = await pool.execute<RowDataPacket[]>(
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
      [product.category_id, productId, limit]
    );

    return relatedProducts;
  }

  // Lấy sản phẩm nổi bật
  static async getFeaturedProducts(limit: number = 8) {
    const [products] = await pool.execute<RowDataPacket[]>(
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
      [limit]
    );

    return products;
  }

  // Lấy sản phẩm bán chạy
  static async getBestSellerProducts(limit: number = 8) {
    const [products] = await pool.execute<RowDataPacket[]>(
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
      [limit]
    );

    return products;
  }
}

