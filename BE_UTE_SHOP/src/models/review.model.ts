import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ReviewModel {
  // Tạo đánh giá mới
  static async create(reviewData: {
    user_id: number;
    product_id: number;
    order_id?: number;
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO product_reviews (user_id, product_id, order_id, rating, title, comment, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        reviewData.user_id,
        reviewData.product_id,
        reviewData.order_id || null,
        reviewData.rating,
        reviewData.title || null,
        reviewData.comment || null,
      ]
    );
    return result.insertId;
  }

  // Thêm ảnh đánh giá
  static async addImage(reviewId: number, imageUrl: string): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO review_images (review_id, image_url) VALUES (?, ?)',
      [reviewId, imageUrl]
    );
    return result.insertId;
  }

  // Lấy đánh giá theo product
  static async getByProductId(productId: number, params: {
    page?: number;
    limit?: number;
    rating?: number;
    sort_by?: string;
  }): Promise<{ reviews: any[]; total: number }> {
    const { page = 1, limit = 10, rating, sort_by = 'created_at' } = params;
    const offset = (page - 1) * limit;

    let whereConditions = ['pr.product_id = ?', 'pr.is_approved = 1'];
    let queryParams: any[] = [productId];

    if (rating) {
      whereConditions.push('pr.rating = ?');
      queryParams.push(rating);
    }

    const sortField = sort_by === 'helpful' ? 'pr.helpful_count' : 'pr.created_at';

    const [reviews] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        pr.*,
        u.first_name,
        u.last_name,
        u.avatar,
        (SELECT JSON_ARRAYAGG(image_url) FROM review_images WHERE review_id = pr.id) as images
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${sortField} DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM product_reviews pr WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    return {
      reviews,
      total: countResult[0].total,
    };
  }

  // Lấy đánh giá theo ID
  static async findById(id: number): Promise<any | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        pr.*,
        u.first_name,
        u.last_name,
        u.avatar,
        p.name as product_name
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE pr.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Cập nhật đánh giá
  static async update(id: number, data: {
    rating?: number;
    title?: string;
    comment?: string;
  }): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.rating !== undefined) {
      fields.push('rating = ?');
      values.push(data.rating);
    }
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.comment !== undefined) {
      fields.push('comment = ?');
      values.push(data.comment);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE product_reviews SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Xóa đánh giá
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM product_reviews WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Tăng helpful count
  static async incrementHelpful(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Approve đánh giá (Admin)
  static async approve(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE product_reviews SET is_approved = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Reject đánh giá (Admin)
  static async reject(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE product_reviews SET is_approved = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Lấy đánh giá chờ duyệt (Admin)
  static async getPending(params: {
    page?: number;
    limit?: number;
  }): Promise<{ reviews: any[]; total: number }> {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const [reviews] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        pr.*,
        u.first_name,
        u.last_name,
        u.email,
        p.name as product_name
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE pr.is_approved = 0
      ORDER BY pr.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM product_reviews WHERE is_approved = 0'
    );

    return {
      reviews,
      total: countResult[0].total,
    };
  }

  // Kiểm tra user đã review sản phẩm chưa
  static async hasUserReviewed(userId: number, productId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    return rows.length > 0;
  }

  // Kiểm tra user đã mua sản phẩm chưa
  static async hasUserPurchased(userId: number, productId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT oi.id 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status_id = 4`,
      [userId, productId]
    );
    return rows.length > 0;
  }

  // Lấy thống kê rating
  static async getRatingStats(productId: number): Promise<any> {
    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1`,
      [productId]
    );
    return stats[0];
  }
}

