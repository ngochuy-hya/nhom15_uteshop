import { OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export class OrderService {
  // Tạo đơn hàng
  static async createOrder(
    userId: number,
    orderData: {
      items: Array<{
        product_id: number;
        quantity: number;
        selected_color?: string;
        selected_size?: string;
      }>;
      shipping_address: any;
      billing_address: any;
      payment_method: string;
      notes?: string;
      coupon_code?: string;
    }
  ) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validate items
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Đơn hàng phải có ít nhất 1 sản phẩm');
      }

      // Calculate order totals
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of orderData.items) {
        const product = await ProductModel.findById(item.product_id);

        if (!product || !product.is_active) {
          throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại hoặc không khả dụng`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Sản phẩm "${product.name}" không đủ số lượng trong kho`);
        }

        const price = product.sale_price || product.price;
        const totalPrice = price * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity,
          unit_price: price,
          total_price: totalPrice,
          selected_color: item.selected_color,
          selected_size: item.selected_size,
        });
      }

      // Calculate tax and shipping
      const taxRate = 0.1; // 10%
      const taxAmount = subtotal * taxRate;
      const shippingAmount = subtotal >= 1000000 ? 0 : 50000; // Free ship for orders >= 1M VND

      // Apply coupon if provided
      let discountAmount = 0;
      if (orderData.coupon_code) {
        // TODO: Implement coupon validation and discount calculation
        const [coupons] = await pool.execute<RowDataPacket[]>(
          'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND start_date <= NOW() AND end_date >= NOW()',
          [orderData.coupon_code]
        );

        if (coupons.length > 0) {
          const coupon = coupons[0];
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
              discountAmount = coupon.max_discount_amount;
            }
          } else if (coupon.discount_type === 'fixed') {
            discountAmount = coupon.discount_value;
          }
        }
      }

      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

      // Generate order number
      const orderNumber = await OrderModel.generateOrderNumber();

      // Create order
      const orderId = await OrderModel.create({
        order_number: orderNumber,
        user_id: userId,
        status_id: 1, // pending
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_method === 'cod' ? 'pending' : 'pending',
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
        notes: orderData.notes,
      });

      // Add order items and update stock
      for (const item of orderItems) {
        await OrderModel.addItem({
          order_id: orderId,
          ...item,
        });

        // Decrease stock quantity
        await ProductModel.updateStock(item.product_id, -item.quantity);
      }

      // Record coupon usage if applied
      if (orderData.coupon_code && discountAmount > 0) {
        const [coupons] = await pool.execute<RowDataPacket[]>(
          'SELECT id FROM coupons WHERE code = ?',
          [orderData.coupon_code]
        );

        if (coupons.length > 0) {
          await pool.execute(
            'INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
            [coupons[0].id, userId, orderId, discountAmount]
          );

          // Increment usage count
          await pool.execute(
            'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
            [coupons[0].id]
          );
        }
      }

      // Clear user's cart
      await pool.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

      await connection.commit();

      // Get order details
      const order = await OrderModel.findById(orderId);
      const items = await OrderModel.getItems(orderId);

      return {
        ...order,
        items,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Hủy đơn hàng
  static async cancelOrder(orderId: number, userId: number, reason?: string) {
    const order = await OrderModel.findById(orderId);

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (order.user_id !== userId) {
      throw new Error('Bạn không có quyền hủy đơn hàng này');
    }

    // Only allow cancellation for pending or processing orders
    if (order.status_id > 2) {
      throw new Error('Không thể hủy đơn hàng đã được xử lý');
    }

    // Update order status
    await OrderModel.updateStatus(orderId, 5, reason); // 5 = cancelled

    // Restore stock quantity
    const items = await OrderModel.getItems(orderId);
    for (const item of items) {
      await ProductModel.updateStock(item.product_id, item.quantity);
    }

    // Refund coupon usage if applicable
    if (order.discount_amount > 0) {
      const [couponUsage] = await pool.execute<RowDataPacket[]>(
        'SELECT coupon_id FROM coupon_usage WHERE order_id = ?',
        [orderId]
      );

      if (couponUsage.length > 0) {
        await pool.execute(
          'UPDATE coupons SET usage_count = usage_count - 1 WHERE id = ?',
          [couponUsage[0].coupon_id]
        );

        await pool.execute(
          'DELETE FROM coupon_usage WHERE order_id = ?',
          [orderId]
        );
      }
    }

    return true;
  }

  // Lấy đơn hàng với full details
  static async getOrderWithDetails(orderId: number, userId?: number, isAdmin: boolean = false) {
    const order = await OrderModel.findById(orderId);

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // Check permission
    if (!isAdmin && userId && order.user_id !== userId) {
      throw new Error('Bạn không có quyền xem đơn hàng này');
    }

    // Get items and status history
    const items = await OrderModel.getItems(orderId);
    const statusHistory = await OrderModel.getStatusHistory(orderId);

    return {
      ...order,
      items,
      status_history: statusHistory,
    };
  }

  // Validate coupon
  static async validateCoupon(code: string, userId: number, subtotal: number) {
    const [coupons] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM coupons 
       WHERE code = ? 
       AND is_active = 1 
       AND start_date <= NOW() 
       AND end_date >= NOW()`,
      [code]
    );

    if (coupons.length === 0) {
      throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }

    const coupon = coupons[0];

    // Check minimum order amount
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      throw new Error(`Đơn hàng tối thiểu ${coupon.min_order_amount.toLocaleString('vi-VN')} VNĐ để sử dụng mã này`);
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    // Check user usage limit
    if (coupon.usage_limit_per_user) {
      const [userUsage] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
        [coupon.id, userId]
      );

      if (userUsage[0].count >= coupon.usage_limit_per_user) {
        throw new Error('Bạn đã sử dụng hết lượt cho mã giảm giá này');
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value;
    }

    return {
      valid: true,
      coupon,
      discount_amount: discountAmount,
    };
  }
}

