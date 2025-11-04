import { Request, Response } from 'express';
import { OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
import { AuthRequest } from '../types';
import pool from '../config/database';

// Tạo đơn hàng mới
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.user!.id;
    const {
      items, // [{product_id, quantity, selected_color, selected_size}]
      shipping_address,
      billing_address,
      payment_method,
      notes,
      coupon_code,
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Đơn hàng phải có ít nhất 1 sản phẩm',
      });
      return;
    }

    if (!shipping_address || !billing_address) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ giao hàng và thanh toán là bắt buộc',
      });
      return;
    }

    await connection.beginTransaction();

    // Tính toán giá trị đơn hàng
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await ProductModel.findById(item.product_id);
      
      if (!product || !product.is_active) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `Sản phẩm ID ${item.product_id} không tồn tại hoặc không khả dụng`,
        });
        return;
      }

      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" không đủ số lượng trong kho`,
        });
        return;
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

    // Tính thuế và phí vận chuyển
    const taxRate = 0.1; // 10%
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal >= 1000000 ? 0 : 50000; // Free ship cho đơn >= 1tr

    // Áp dụng coupon nếu có
    let discountAmount = 0;
    if (coupon_code) {
      // TODO: Implement coupon logic
      // const coupon = await CouponModel.findByCode(coupon_code);
      // if (coupon && coupon.is_valid) {
      //   discountAmount = calculateDiscount(coupon, subtotal);
      // }
    }

    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Generate order number
    const orderNumber = await OrderModel.generateOrderNumber();

    // Tạo đơn hàng
    const orderId = await OrderModel.create({
      order_number: orderNumber,
      user_id: userId,
      status_id: 1, // pending
      subtotal,
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_method,
      payment_status: payment_method === 'cod' ? 'pending' : 'pending',
      shipping_address,
      billing_address,
      notes,
    });

    // Thêm order items
    for (const item of orderItems) {
      await OrderModel.addItem({
        order_id: orderId,
        ...item,
      });

      // Giảm số lượng tồn kho
      await ProductModel.updateStock(item.product_id, -item.quantity);
    }

    await connection.commit();

    // Lấy thông tin đơn hàng vừa tạo
    const order = await OrderModel.findById(orderId);
    const items_detail = await OrderModel.getItems(orderId);

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: {
        ...order,
        items: items_detail,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  } finally {
    connection.release();
  }
};

// Lấy danh sách đơn hàng của user
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page, limit, status_id } = req.query;

    const result = await OrderModel.getByUserId(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status_id: status_id ? Number(status_id) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: result.orders,
        pagination: {
          current_page: Number(page) || 1,
          per_page: Number(limit) || 10,
          total: result.total,
          total_pages: Math.ceil(result.total / (Number(limit) || 10)),
        },
      },
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy chi tiết đơn hàng
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role_id;

    const order = await OrderModel.findById(Number(id));

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    // Kiểm tra quyền xem đơn hàng
    if (userRole !== 2 && order.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này',
      });
      return;
    }

    // Lấy items và status history
    const items = await OrderModel.getItems(Number(id));
    const statusHistory = await OrderModel.getStatusHistory(Number(id));

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: {
        ...order,
        items,
        status_history: statusHistory,
      },
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Hủy đơn hàng
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = (req.body || {});

    const order = await OrderModel.findById(Number(id));

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    // Kiểm tra quyền hủy đơn
    if (order.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này',
      });
      return;
    }

    // Chỉ cho phép hủy đơn ở trạng thái pending hoặc processing (status_id <= 2)
    // Hoặc nếu đã thanh toán nhưng chưa gửi đi (status_id <= 2) thì cũng có thể hủy và refund
    if (order.status_id > 2 && order.payment_status !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng đã được xử lý',
      });
      return;
    }

    // Nếu đơn đã tạo link PayOS mà CHƯA thanh toán → hủy link/QR để không thể chuyển tiền
    if (order.payment_method === 'payos' && order.payment_status !== 'paid') {
      try {
        const [pendingTx] = await pool.execute(
          `SELECT * FROM payment_transactions 
           WHERE order_id = ? AND status IN ('pending','processing')
           ORDER BY created_at DESC LIMIT 1`,
          [Number(id)]
        );
        if ((pendingTx as any[]).length > 0) {
          const tx = (pendingTx as any[])[0];
          const { cancelPayOSPayment } = await import('../utils/payos.util');
          try {
            await cancelPayOSPayment(tx.payos_order_code.toString(), reason || 'Hủy đơn hàng');
          } catch (e) {
            console.warn('Cancel PayOS payment link failed, still proceed to cancel order:', e);
          }
          await pool.execute(
            `UPDATE payment_transactions 
             SET status = 'cancelled', updated_at = NOW()
             WHERE id = ?`,
            [tx.id]
          );
        }
      } catch (err) {
        console.warn('Lookup/cancel pending PayOS transaction failed:', err);
      }
    }

    // Nếu đơn đã thanh toán qua PayOS, cố gắng hoàn tiền (không để fail hủy đơn)
    let refundResult = null;
    if (order.payment_status === 'paid' && order.payment_method === 'payos') {
      try {
        const [transactions] = await pool.execute(
          `SELECT * FROM payment_transactions 
           WHERE order_id = ? AND user_id = ? AND status = 'completed' 
           ORDER BY created_at DESC LIMIT 1`,
          [Number(id), userId]
        );

        if ((transactions as any[]).length > 0) {
          const transaction = (transactions as any[])[0];
          const { refundPayOSPayment } = await import('../utils/payos.util');

          // Tạo bản ghi refund nếu có bảng
          let refundId: number | null = null;
          try {
            const [refundResultInsert] = await pool.execute(
              `INSERT INTO payment_refunds (
                transaction_id, refund_amount, reason, status, processed_by
              ) VALUES (?, ?, ?, 'pending', ?)`,
              [transaction.id, transaction.amount, reason || 'Hủy đơn hàng', userId]
            );
            refundId = (refundResultInsert as any).insertId;
          } catch (e) {
            console.error('payment_refunds insert failed (will continue cancel flow):', e);
          }

          try {
            const payosRefundResponse = await refundPayOSPayment(
              transaction.payos_order_code.toString(),
              { amount: transaction.amount, reason: reason || `Hủy đơn hàng ${order.order_number}`, description: `Hoàn tiền cho đơn hàng ${order.order_number} - Hủy đơn hàng` }
            );

            let payosRefundId = null;
            if (payosRefundResponse?.data?.refundId) payosRefundId = payosRefundResponse.data.refundId;
            else if (payosRefundResponse?.data?.id) payosRefundId = payosRefundResponse.data.id;

            if (refundId) {
              await pool.execute(
                `UPDATE payment_refunds 
                 SET payos_refund_id = ?, status = 'processing', updated_at = NOW()
                 WHERE id = ?`,
                [payosRefundId || '', refundId]
              );
            }

            await pool.execute(
              `UPDATE payment_transactions SET status = 'refunded', updated_at = NOW() WHERE id = ?`,
              [transaction.id]
            );
            await pool.execute(
              `UPDATE orders SET payment_status = 'refunded', updated_at = NOW() WHERE id = ?`,
              [Number(id)]
            );

            refundResult = { refund_id: refundId || undefined, payos_refund_id: payosRefundId, amount: transaction.amount, status: 'processing' };
          } catch (err) {
            console.error('PayOS refund error in cancel order:', err);
            if (refundId) {
              await pool.execute(`UPDATE payment_refunds SET status = 'failed', updated_at = NOW() WHERE id = ?`, [refundId]);
            }
            refundResult = { refund_id: refundId || undefined, status: 'failed', message: 'Yêu cầu hoàn tiền đã được ghi nhận.' };
          }
        }
      } catch (err) {
        console.error('Refund flow failed (will continue cancel):', err);
      }
    }

    // Cập nhật trạng thái đơn hàng
    await OrderModel.updateStatus(Number(id), 5, reason); // 5 = cancelled

    // Cập nhật payment_status tương ứng
    // - Nếu đơn CHƯA thanh toán -> đặt 'cancelled'
    // - Nếu đơn ĐÃ thanh toán qua PayOS -> phần trên đã set 'refunded'; nếu vì lý do nào đó chưa set, fallback về 'cancelled'
    if (order.payment_status !== 'paid') {
      await pool.execute(
        `UPDATE orders SET payment_status = 'cancelled', updated_at = NOW() WHERE id = ?`,
        [Number(id)]
      );
    } else {
      // paid: nếu chưa được set 'refunded' ở trên (do không có transaction, v.v.) thì set 'cancelled' để đồng bộ với trạng thái đơn
      const [cur] = await pool.execute(
        `SELECT payment_status FROM orders WHERE id = ?`,
        [Number(id)]
      );
      const currentStatus = (cur as any[])[0]?.payment_status;
      if (currentStatus !== 'refunded') {
        await pool.execute(
          `UPDATE orders SET payment_status = 'cancelled', updated_at = NOW() WHERE id = ?`,
          [Number(id)]
        );
      }
    }

    // Hoàn lại số lượng tồn kho
    const items = await OrderModel.getItems(Number(id));
    for (const item of items) {
      await ProductModel.updateStock(item.product_id, item.quantity);
    }

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công' + (refundResult ? '. Yêu cầu hoàn tiền đã được gửi.' : ''),
      data: refundResult ? { refund: refundResult } : undefined,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy đơn hàng',
      // Tạm thời trả thêm chi tiết để debug nhanh
      error: { message: (error as any)?.message, code: (error as any)?.code },
    });
  }
};

// Lấy tất cả đơn hàng (Admin only)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, status_id, payment_status, search, start_date, end_date } = req.query;

    const result = await OrderModel.getAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status_id: status_id ? Number(status_id) : undefined,
      payment_status: payment_status as string,
      search: search as string,
      start_date: start_date as string,
      end_date: end_date as string,
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: result.orders,
        pagination: {
          current_page: Number(page) || 1,
          per_page: Number(limit) || 20,
          total: result.total,
          total_pages: Math.ceil(result.total / (Number(limit) || 20)),
        },
      },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Cập nhật trạng thái đơn hàng (Admin only)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status_id, notes } = req.body;

    if (!status_id) {
      res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng là bắt buộc',
      });
      return;
    }

    const updated = await OrderModel.updateStatus(Number(id), status_id, notes);

    if (!updated) {
      res.status(400).json({
        success: false,
        message: 'Không thể cập nhật trạng thái đơn hàng',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy thống kê đơn hàng (Admin only)
export const getOrderStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await OrderModel.getStatistics(
      start_date as string,
      end_date as string
    );

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê đơn hàng thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Tải hóa đơn (Invoice)
export const getOrderInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Lấy thông tin đơn hàng
    const [orders] = await pool.execute(
      `SELECT 
        o.*, os.status_name,
        u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      LEFT JOIN order_statuses os ON o.status_id = os.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`,
      [id]
    );

    const order = (orders as any[])[0];
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    // Kiểm tra quyền xem hóa đơn
    if (req.user!.role_id !== 2 && order.user_id !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem hóa đơn này',
      });
      return;
    }

    // Lấy chi tiết sản phẩm
    const [items] = await pool.execute(
      `SELECT 
        oi.*, p.name as product_name, p.sku
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy hóa đơn thành công',
      data: {
        order,
        items,
      },
    });
  } catch (error) {
    console.error('Get order invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy hóa đơn',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Yêu cầu trả hàng
export const requestOrderReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, items } = req.body;

    if (!reason || !items || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Lý do và danh sách sản phẩm trả hàng là bắt buộc',
      });
      return;
    }

    // Kiểm tra đơn hàng
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );

    const order = (orders as any[])[0];
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    // Kiểm tra trạng thái đơn hàng (chỉ cho phép trả hàng khi đã giao)
    if (order.status_id !== 4) {
      res.status(400).json({
        success: false,
        message: 'Chỉ có thể trả hàng khi đơn hàng đã được giao',
      });
      return;
    }

    // Kiểm tra thời gian trả hàng (ví dụ: trong vòng 7 ngày)
    const deliveredDate = new Date(order.updated_at);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - deliveredDate.getTime()) / (1000 * 3600 * 24));

    if (daysDiff > 7) {
      res.status(400).json({
        success: false,
        message: 'Đã quá thời hạn trả hàng (7 ngày)',
      });
      return;
    }

    // Tạo yêu cầu trả hàng
    const [result] = await pool.execute(
      `INSERT INTO order_returns (order_id, user_id, reason, status, items)
       VALUES (?, ?, ?, 'pending', ?)`,
      [id, req.user!.id, reason, JSON.stringify(items)]
    );

    const returnId = (result as any).insertId;

    // Cập nhật trạng thái đơn hàng
    await pool.execute(
      'UPDATE orders SET status_id = 6, updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.status(201).json({
      success: true,
      message: 'Yêu cầu trả hàng đã được gửi',
      data: {
        return_id: returnId,
      },
    });
  } catch (error) {
    console.error('Request order return error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi yêu cầu trả hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
