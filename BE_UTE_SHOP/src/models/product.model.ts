import pool from '../config/database';
import { Product } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProductModel {
  // Tạo sản phẩm mới
  static async create(productData: Partial<Product>): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO products (name, slug, description, short_description, sku, price, sale_price, cost_price, stock_quantity, category_id, brand_id, is_active, is_featured, is_trending, is_bestseller, is_new, is_sale) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productData.name,
        productData.slug,
        productData.description || null,
        productData.short_description || null,
        productData.sku || null,
        productData.price,
        productData.sale_price || null,
        productData.cost_price || null,
        productData.stock_quantity || 0,
        productData.category_id,
        productData.brand_id || null,
        productData.is_active !== undefined ? productData.is_active : true,
        productData.is_featured || false,
        productData.is_trending || false,
        productData.is_bestseller || false,
        productData.is_new || false,
        productData.is_sale || false,
      ]
    );
    return result.insertId;
  }

  // Tìm sản phẩm theo ID
  static async findById(id: number): Promise<any | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as average_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND is_approved = 1) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Tìm sản phẩm theo slug
  static async findBySlug(slug: string): Promise<any | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ? AND p.is_active = 1`,
      [slug]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Cập nhật sản phẩm
  static async update(id: number, data: Partial<Product>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Xóa sản phẩm (soft delete)
  static async softDelete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Cập nhật stock
  static async updateStock(id: number, quantity: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [quantity, id]
    );
    return result.affectedRows > 0;
  }

  // Tăng view count
  static async incrementViewCount(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE products SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Lấy hình ảnh sản phẩm
  static async getImages(productId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
      [productId]
    );
    return rows;
  }

  // Thêm hình ảnh sản phẩm
  static async addImage(productId: number, imageData: {
    image_url: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
      [
        productId,
        imageData.image_url,
        imageData.alt_text || null,
        imageData.sort_order || 0,
        imageData.is_primary || false,
      ]
    );
    return result.insertId;
  }

  // Lấy thuộc tính sản phẩm
  static async getAttributes(productId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM product_attributes WHERE product_id = ? AND is_active = 1 ORDER BY attribute_type, attribute_name',
      [productId]
    );
    return rows;
  }

  // Thêm thuộc tính sản phẩm
  static async addAttribute(productId: number, attributeData: {
    attribute_type: string;
    attribute_name: string;
    attribute_value: string;
    price_adjustment?: number;
    stock_quantity?: number;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO product_attributes (product_id, attribute_type, attribute_name, attribute_value, price_adjustment, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [
        productId,
        attributeData.attribute_type,
        attributeData.attribute_name,
        attributeData.attribute_value,
        attributeData.price_adjustment || 0,
        attributeData.stock_quantity || 0,
      ]
    );
    return result.insertId;
  }

  // Lấy thống kê sản phẩm
  static async getStatistics(): Promise<any> {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN stock_quantity > 0 THEN 1 ELSE 0 END) as in_stock_products,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_products,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_products,
        SUM(CASE WHEN is_sale = 1 THEN 1 ELSE 0 END) as sale_products,
        AVG(price) as average_price,
        SUM(stock_quantity) as total_stock
      FROM products
    `);

    return stats[0];
  }
}

