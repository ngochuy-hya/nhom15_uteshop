import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Lấy wishlist của user
export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [wishlistItems] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        wi.id,
        wi.product_id,
        wi.created_at,
        p.name as product_name,
        p.slug as product_slug,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.is_active,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      WHERE wi.user_id = ?
      ORDER BY wi.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy wishlist thành công',
      data: {
        items: wishlistItems,
        total_items: wishlistItems.length,
      },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy wishlist',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thêm sản phẩm vào wishlist
export const addToWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { product_id } = req.body;

    if (!product_id) {
      res.status(400).json({
        success: false,
        message: 'Product ID là bắt buộc',
      });
      return;
    }

    // Kiểm tra sản phẩm tồn tại
    const [products] = await pool.execute<RowDataPacket[]>(
      'SELECT id, is_active FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0 || !products[0].is_active) {
      res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc không khả dụng',
      });
      return;
    }

    // Kiểm tra đã có trong wishlist chưa
    const [existingItems] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existingItems.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Sản phẩm đã có trong wishlist',
      });
      return;
    }

    // Thêm vào wishlist
    await pool.execute(
      'INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)',
      [userId, product_id]
    );

    res.status(200).json({
      success: true,
      message: 'Thêm vào wishlist thành công',
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm vào wishlist',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa sản phẩm khỏi wishlist
export const removeFromWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM wishlist_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong wishlist',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm khỏi wishlist thành công',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sản phẩm khỏi wishlist',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa toàn bộ wishlist
export const clearWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await pool.execute(
      'DELETE FROM wishlist_items WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Xóa toàn bộ wishlist thành công',
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa wishlist',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Kiểm tra sản phẩm có trong wishlist không
export const checkWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { product_id } = req.params;

    const [items] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    res.status(200).json({
      success: true,
      data: {
        in_wishlist: items.length > 0,
      },
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra wishlist',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
