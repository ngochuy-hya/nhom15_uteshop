import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Lấy giỏ hàng của user
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [cartItems] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ci.*,
        p.name as product_name,
        p.slug as product_slug,
        p.price as current_price,
        p.sale_price,
        p.stock_quantity,
        p.is_active,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC`,
      [userId]
    );

    // Tính tổng giá trị giỏ hàng
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const price = item.sale_price || item.current_price;
      return sum + (price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Lấy giỏ hàng thành công',
      data: {
        items: cartItems,
        subtotal,
        total_items: cartItems.length,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy giỏ hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { product_id, quantity, selected_color, selected_size } = req.body;

    if (!product_id || !quantity) {
      res.status(400).json({
        success: false,
        message: 'Product ID và số lượng là bắt buộc',
      });
      return;
    }

    // Kiểm tra sản phẩm tồn tại
    const [products] = await pool.execute<RowDataPacket[]>(
      'SELECT id, price, sale_price, stock_quantity, is_active FROM products WHERE id = ?',
      [product_id]
    );

    const product = products[0];
    if (!product || !product.is_active) {
      res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc không khả dụng',
      });
      return;
    }

    if (product.stock_quantity < quantity) {
      res.status(400).json({
        success: false,
        message: 'Số lượng sản phẩm trong kho không đủ',
      });
      return;
    }

    const price = product.sale_price || product.price;

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const [existingItems] = await pool.execute<RowDataPacket[]>(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND selected_color <=> ? AND selected_size <=> ?',
      [userId, product_id, selected_color ?? null, selected_size ?? null]
    );

    if (existingItems.length > 0) {
      // Cập nhật số lượng
      const newQuantity = existingItems[0].quantity + quantity;
      
      if (product.stock_quantity < newQuantity) {
        res.status(400).json({
          success: false,
          message: 'Số lượng sản phẩm trong kho không đủ',
        });
        return;
      }

      await pool.execute(
        'UPDATE cart_items SET quantity = ?, price = ? WHERE id = ?',
        [newQuantity, price, existingItems[0].id]
      );
    } else {
      // Thêm mới
      await pool.execute(
        'INSERT INTO cart_items (user_id, product_id, quantity, selected_color, selected_size, price) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, product_id, quantity, selected_color || null, selected_size || null, price]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Thêm vào giỏ hàng thành công',
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm vào giỏ hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0',
      });
      return;
    }

    // Kiểm tra cart item có thuộc về user không
    const [cartItems] = await pool.execute<RowDataPacket[]>(
      'SELECT ci.*, p.stock_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?',
      [id, userId]
    );

    if (cartItems.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng',
      });
      return;
    }

    const cartItem = cartItems[0];
    if (cartItem.stock_quantity < quantity) {
      res.status(400).json({
        success: false,
        message: 'Số lượng sản phẩm trong kho không đủ',
      });
      return;
    }

    await pool.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật giỏ hàng thành công',
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật giỏ hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sản phẩm khỏi giỏ hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await pool.execute(
      'DELETE FROM cart_items WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Xóa toàn bộ giỏ hàng thành công',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa giỏ hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Tính toán giá trị giỏ hàng với coupon và shipping
export const calculateCartTotal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { coupon_code, shipping_method } = req.body;

    // Lấy cart items
    const [cartItems] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ci.*,
        p.price as current_price,
        p.sale_price,
        p.stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      res.status(200).json({
        success: true,
        message: 'Giỏ hàng trống',
        data: {
          subtotal: 0,
          tax_amount: 0,
          shipping_amount: 0,
          discount_amount: 0,
          total_amount: 0,
          coupon: null,
        },
      });
      return;
    }

    // Tính subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      const price = item.sale_price || item.current_price;
      subtotal += price * item.quantity;
    }

    // Tính thuế (10%)
    const taxRate = 0.1;
    const taxAmount = subtotal * taxRate;

    // Tính phí vận chuyển
    let shippingAmount = 50000; // Mặc định 50k
    if (subtotal >= 1000000) {
      shippingAmount = 0; // Free ship cho đơn >= 1tr
    }

    // Validate và tính discount từ coupon
    let discountAmount = 0;
    let couponInfo = null;

    if (coupon_code) {
      const [coupons] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM coupons 
         WHERE code = ? 
         AND is_active = 1 
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (usage_limit IS NULL OR usage_count < usage_limit)`,
        [coupon_code]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();

        // Kiểm tra coupon còn hạn
        if (coupon.start_date && new Date(coupon.start_date) > now) {
          res.status(400).json({
            success: false,
            message: 'Mã giảm giá chưa có hiệu lực',
          });
          return;
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < now) {
          res.status(400).json({
            success: false,
            message: 'Mã giảm giá đã hết hạn',
          });
          return;
        }

        // Kiểm tra minimum amount
        if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
          res.status(400).json({
            success: false,
            message: `Đơn hàng tối thiểu ${coupon.minimum_amount.toLocaleString('vi-VN')}đ để sử dụng mã này`,
          });
          return;
        }

        // Tính discount
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
          }
        } else if (coupon.discount_type === 'fixed') {
          discountAmount = coupon.discount_value;
        }

        couponInfo = {
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: discountAmount,
        };
      } else {
        res.status(400).json({
          success: false,
          message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
        });
        return;
      }
    }

    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    res.status(200).json({
      success: true,
      message: 'Tính toán giỏ hàng thành công',
      data: {
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        coupon: couponInfo,
        item_count: cartItems.length,
      },
    });
  } catch (error) {
    console.error('Calculate cart total error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tính toán giỏ hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Tạo đơn hàng từ giỏ hàng
export const checkoutCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      shipping_address,
      billing_address,
      payment_method,
      notes,
      coupon_code,
    } = req.body;

    if (!shipping_address || !billing_address) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ giao hàng và thanh toán là bắt buộc',
      });
      return;
    }

    // Lấy cart items
    const [cartItems] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        ci.*,
        p.price as current_price,
        p.sale_price,
        p.stock_quantity,
        p.is_active,
        p.name as product_name,
        p.sku as product_sku
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống',
      });
      return;
    }

    // Validate và tính toán
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of cartItems) {
      if (!item.is_active) {
        res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.product_name}" không còn khả dụng`,
        });
        return;
      }

      if (item.stock_quantity < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.product_name}" không đủ số lượng trong kho`,
        });
        return;
      }

      const price = item.sale_price || item.current_price;
      const totalPrice = price * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: price,
        total_price: totalPrice,
        selected_color: item.selected_color,
        selected_size: item.selected_size,
      });
    }

    // Tính thuế và shipping
    const taxRate = 0.1;
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal >= 1000000 ? 0 : 50000;

    // Tính discount từ coupon
    let discountAmount = 0;
    let couponId = null;

    if (coupon_code) {
      const [coupons] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM coupons 
         WHERE code = ? 
         AND is_active = 1 
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (usage_limit IS NULL OR usage_count < usage_limit)`,
        [coupon_code]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        
        if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
          res.status(400).json({
            success: false,
            message: `Đơn hàng tối thiểu ${coupon.minimum_amount.toLocaleString('vi-VN')}đ để sử dụng mã này`,
          });
          return;
        }

        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
          }
        } else if (coupon.discount_type === 'fixed') {
          discountAmount = coupon.discount_value;
        }

        couponId = coupon.id;
      }
    }

    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Tạo order (sử dụng order service)
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Generate order number
      const [orderNumberResult] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()'
      );
      const count = orderNumberResult[0].count + 1;
      const orderNumber = `UTE-${new Date().getFullYear()}-${String(count).padStart(6, '0')}`;

      // Tạo order
      const [orderResult] = await pool.execute(
        `INSERT INTO orders (
          order_number, user_id, status_id,
          subtotal, tax_amount, shipping_amount, discount_amount, total_amount,
          payment_method, payment_status,
          shipping_address, billing_address, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          userId,
          1, // pending
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
          payment_method || 'cod',
          'pending',
          JSON.stringify(shipping_address),
          JSON.stringify(billing_address),
          notes || null,
        ]
      );

      const orderId = (orderResult as any).insertId;

      // Thêm order items và giảm stock
      for (const item of orderItems) {
        await pool.execute(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_sku,
            quantity, unit_price, total_price,
            selected_color, selected_size
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.product_name,
            item.product_sku,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.selected_color || null,
            item.selected_size || null,
          ]
        );

        // Giảm stock
        await pool.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Record coupon usage
      if (couponId) {
        await pool.execute(
          'INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
          [couponId, userId, orderId, discountAmount]
        );

        await pool.execute(
          'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
          [couponId]
        );
      }

      // Xóa giỏ hàng
      await pool.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

      await connection.commit();

      // Lấy thông tin order vừa tạo
      const [orders] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      const [items] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM order_items WHERE order_id = ?',
        [orderId]
      );

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: {
          ...orders[0],
          items,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Checkout cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};