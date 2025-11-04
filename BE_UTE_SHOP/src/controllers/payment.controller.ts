import { Request, Response } from 'express';
import pool from '../config/database';
import {
  createPayOSPayment,
  getPayOSPaymentStatus,
  cancelPayOSPayment,
  refundPayOSPayment,
  verifySignature,
  parseWebhookData,
  generateOrderCode,
  formatAmount,
  PAYOS_CONFIG,
} from '../utils/payos.util';

// ============================================
// PUBLIC APIs
// ============================================

/**
 * Tạo payment link với PayOS
 */
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  console.log('🚀 CREATE PAYMENT FUNCTION CALLED - NEW CODE VERSION');
  console.log('🚀 CREATE PAYMENT FUNCTION CALLED - NEW CODE VERSION');
  console.log('🚀 CREATE PAYMENT FUNCTION CALLED - NEW CODE VERSION');
  try {
    console.log('=== CREATE PAYMENT DEBUG ===');
    console.log('Request body:', req.body);
    
    const { order_id } = req.body;
    const userId = (req as any).user?.id;

    console.log('Order ID:', order_id);
    console.log('User ID:', userId);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
      });
      return;
    }

    // Lấy thông tin order - KHÔNG JOIN với addresses
    console.log('=== EXECUTING QUERY ===');
    const query = `SELECT 
        o.*,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email,
        u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.user_id = ?`;
    
    console.log('SQL Query:', query);
    console.log('Query params:', [order_id, userId]);
    
    const [orders] = await pool.execute(
      query,
      [order_id, userId]
    );
    
    console.log('Query executed successfully');
    console.log('Orders found:', (orders as any[]).length);

    if ((orders as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    const order = (orders as any[])[0];
    
    console.log('Order data:', {
      id: order.id,
      order_number: order.order_number,
      shipping_address_type: typeof order.shipping_address,
      shipping_address_length: order.shipping_address?.length
    });

    // Parse shipping_address từ JSON
    let shippingAddress: any = {};
    try {
      console.log('=== PARSING SHIPPING ADDRESS ===');
      console.log('Raw shipping_address:', order.shipping_address);
      
      shippingAddress = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address;
        
      console.log('Parsed shippingAddress:', JSON.stringify(shippingAddress, null, 2));
    } catch (e) {
      console.error('Error parsing shipping_address:', e);
    }

    console.log('=== CHECKING PAYMENT STATUS ===');
    console.log('Payment status:', order.payment_status);
    
    // Kiểm tra order đã thanh toán chưa
    if (order.payment_status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán',
      });
      return;
    }

    // Kiểm tra đã có transaction chưa
    const [existingTransactions] = await pool.execute(
      'SELECT * FROM payment_transactions WHERE order_id = ? AND status IN ("pending", "processing")',
      [order_id]
    );

    if ((existingTransactions as any[]).length > 0) {
      const transaction = (existingTransactions as any[])[0];
      
      // Nếu đã có payment link, trả về luôn
      if (transaction.payment_url) {
        res.status(200).json({
          success: true,
          message: 'Payment link đã tồn tại',
          data: {
            transaction_id: transaction.id,
            payment_url: transaction.payment_url,
            qr_code_url: transaction.qr_code_url,
            order_code: transaction.payos_order_code,
          },
        });
        return;
      }
    }

    // Lấy chi tiết sản phẩm trong order
    console.log('=== GETTING ORDER ITEMS ===');
    const [orderItems] = await pool.execute(
      'SELECT product_name, quantity, unit_price, total_price FROM order_items WHERE order_id = ?',
      [order_id]
    );
    console.log('Order items found:', (orderItems as any[]).length);
    console.log('Order items:', JSON.stringify(orderItems, null, 2));

    // Tạo order code
    const orderCode = generateOrderCode();
    console.log('Generated order code:', orderCode);

    // Xây dựng địa chỉ từ JSON
    // Hỗ trợ cả format mới (address_line1, city, state) và format cũ (address, ward, district, city/province)
    const addressParts = [];
    if (shippingAddress.address_line1) {
      addressParts.push(shippingAddress.address_line1);
      if (shippingAddress.address_line2) addressParts.push(shippingAddress.address_line2);
    } else if (shippingAddress.address) {
      addressParts.push(shippingAddress.address);
    }
    
    if (shippingAddress.ward) addressParts.push(shippingAddress.ward);
    if (shippingAddress.district) addressParts.push(shippingAddress.district);
    
    if (shippingAddress.city) addressParts.push(shippingAddress.city);
    else if (shippingAddress.province) addressParts.push(shippingAddress.province);
    else if (shippingAddress.state) addressParts.push(shippingAddress.state);
    
    const buyerAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;
    // Tính lại tổng tiền an toàn theo công thức để đảm bảo đã trừ discount
    const subtotalNum = Number(order.subtotal) || 0;
    const taxNum = Number(order.tax_amount) || 0;
    const shippingNum = Number(order.shipping_amount) || 0;
    let discountNum = Number(order.discount_amount) || 0;
    // Nếu discount trên order = 0, thử lấy từ coupon_usage (phòng trường hợp ghi thiếu ở đơn)
    if (!discountNum) {
      try {
        const [cuRows] = await pool.execute(
          'SELECT discount_amount FROM coupon_usage WHERE order_id = ? LIMIT 1',
          [order.id]
        );
        const cu = (cuRows as any[])[0];
        if (cu && Number(cu.discount_amount)) {
          discountNum = Number(cu.discount_amount) || 0;
        }
      } catch (e) {
        console.warn('Lookup coupon_usage failed:', e);
      }
    }
    const effectiveTotal = Math.max(0, Math.round(subtotalNum + taxNum + shippingNum - discountNum));

    console.log('=== BUILDING PAYMENT REQUEST ===');
    console.log('Buyer address:', buyerAddress);
    console.log('Order total (effective with discount):', effectiveTotal);
    console.log('Customer email:', order.customer_email);
    console.log('Customer phone:', order.customer_phone);

    // Validate required fields
    if (!effectiveTotal || effectiveTotal <= 0) {
      res.status(400).json({
        success: false,
        message: 'Tổng tiền đơn hàng không hợp lệ',
      });
      return;
    }

    if ((orderItems as any[]).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Đơn hàng không có sản phẩm',
      });
      return;
    }

    // Tạo payment request với PayOS
    const buyerName = order.customer_name || shippingAddress.full_name || shippingAddress.name || 'Khách hàng';
    const buyerEmail = order.customer_email || '';
    const buyerPhone = order.customer_phone || shippingAddress.phone || '';

    // Validate email format
    if (buyerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      res.status(400).json({
        success: false,
        message: 'Email không hợp lệ',
      });
      return;
    }

    // PayOS có thể yêu cầu phone number format cụ thể (loại bỏ dấu cách, dấu +)
    const cleanPhone = buyerPhone.replace(/[\s\+\-\(\)]/g, '');

    // PayOS yêu cầu description không có dấu tiếng Việt và TỐI ĐA 25 KÝ TỰ
    // Format ngắn gọn: "Don hang UTE-2025-000005" (tối đa 25 ký tự)
    const fullDescription = `Don hang ${order.order_number}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const description = fullDescription.length > 25 ? fullDescription.substring(0, 25) : fullDescription;

    const paymentRequest: any = {
      orderCode: orderCode,
      amount: formatAmount(effectiveTotal),
      description: description,
      buyerName: buyerName,
      buyerEmail: buyerEmail || undefined, // PayOS có thể không chấp nhận empty string
      buyerPhone: cleanPhone || undefined,
      buyerAddress: buyerAddress,
      items: (orderItems as any[]).map(item => ({
        name: (item.product_name || 'San pham').normalize('NFD').replace(/[\u0300-\u036f]/g, ''), // Loại bỏ dấu
        quantity: item.quantity || 1,
        price: formatAmount(item.unit_price || 0),
      })),
      returnUrl: PAYOS_CONFIG.returnUrl,
      cancelUrl: PAYOS_CONFIG.cancelUrl,
      expiredAt: Math.floor(Date.now() / 1000) + (30 * 60), // 30 phút
    };

    // Loại bỏ các field undefined để PayOS không báo lỗi
    Object.keys(paymentRequest).forEach(key => {
      if (paymentRequest[key] === undefined || paymentRequest[key] === '') {
        delete paymentRequest[key];
      }
    });

    console.log('=== PAYMENT REQUEST DATA ===');
    console.log('Payment request:', JSON.stringify(paymentRequest, null, 2));

    // Gọi API PayOS
    console.log('=== CALLING PAYOS API ===');
    const payosResponse = await createPayOSPayment(paymentRequest);
    console.log('PayOS response:', JSON.stringify(payosResponse, null, 2));

    if (payosResponse.code !== '00') {
      res.status(400).json({
        success: false,
        message: payosResponse.desc || 'Không thể tạo payment link',
      });
      return;
    }

    // Lưu transaction vào database
    const [result] = await pool.execute(
      `INSERT INTO payment_transactions (
        order_id, user_id, payos_transaction_id, payos_order_code,
        amount, currency, payment_method, status,
        payment_url, qr_code_url, description,
        expired_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        userId,
        payosResponse.data.paymentLinkId,
        orderCode,
        order.total_amount,
        payosResponse.data.currency || 'VND',
        'payos',
        'pending',
        payosResponse.data.checkoutUrl,
        payosResponse.data.qrCode,
        paymentRequest.description,
        new Date(paymentRequest.expiredAt * 1000),
      ]
    );

    const transactionId = (result as any).insertId;

    // Cập nhật payment_method cho order
    await pool.execute(
      'UPDATE orders SET payment_method = ? WHERE id = ?',
      ['payos', order_id]
    );

    res.status(200).json({
      success: true,
      message: 'Tạo payment link thành công',
      data: {
        transaction_id: transactionId,
        payment_url: payosResponse.data.checkoutUrl,
        qr_code_url: payosResponse.data.qrCode,
        order_code: orderCode,
        amount: order.total_amount,
        expired_at: paymentRequest.expiredAt,
      },
    });
  } catch (error: any) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo payment link',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Kiểm tra trạng thái thanh toán
 */
export const checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderCode } = req.params;

    // Lấy transaction từ database
    const [transactions] = await pool.execute(
      'SELECT * FROM payment_transactions WHERE payos_order_code = ?',
      [orderCode]
    );

    if ((transactions as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch',
      });
      return;
    }

    const transaction = (transactions as any[])[0];

    // Kiểm tra với PayOS
    const payosStatus = await getPayOSPaymentStatus(orderCode);

    // Cập nhật trạng thái nếu khác
    if (payosStatus.data.status && payosStatus.data.status !== transaction.status) {
      const newStatus = mapPayOSStatus(payosStatus.data.status);
      
      await pool.execute(
        `UPDATE payment_transactions 
         SET status = ?, paid_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          newStatus,
          newStatus === 'completed' ? new Date() : null,
          transaction.id,
        ]
      );

      // Cập nhật order status
      if (newStatus === 'completed') {
        await pool.execute(
          `UPDATE orders 
           SET payment_status = 'paid', status_id = 2, updated_at = NOW()
           WHERE id = ?`,
          [transaction.order_id]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Lấy trạng thái thanh toán thành công',
      data: {
        transaction_id: transaction.id,
        order_code: orderCode,
        status: transaction.status,
        amount: transaction.amount,
        paid_at: transaction.paid_at,
        payos_data: payosStatus.data,
      },
    });
  } catch (error: any) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi kiểm tra trạng thái thanh toán',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Webhook từ PayOS
 */
export const handlePayOSWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookData = req.body;
    const signature = req.headers['x-signature'] as string;

    console.log('PayOS Webhook received:', JSON.stringify(webhookData));

    // Parse webhook data
    const data = parseWebhookData(webhookData);

    // Log webhook
    await pool.execute(
      `INSERT INTO payment_webhooks (
        event_type, payos_transaction_id, order_code,
        payload, signature, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'payment_update',
        data.reference || '',
        data.orderCode,
        JSON.stringify(webhookData),
        signature || '',
        req.ip,
        req.headers['user-agent'],
      ]
    );

    // Verify signature (nếu cần)
    // const isValid = verifySignature(data, signature);
    // if (!isValid) {
    //   res.status(400).json({ success: false, message: 'Invalid signature' });
    //   return;
    // }

    // Lấy transaction
    const [transactions] = await pool.execute(
      'SELECT * FROM payment_transactions WHERE payos_order_code = ?',
      [data.orderCode]
    );

    if ((transactions as any[]).length === 0) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    const transaction = (transactions as any[])[0];
    const newStatus = data.code === '00' ? 'completed' : 'failed';

    // Cập nhật transaction
    await pool.execute(
      `UPDATE payment_transactions 
       SET status = ?, paid_at = ?, updated_at = NOW()
       WHERE id = ?`,
      [newStatus, newStatus === 'completed' ? new Date() : null, transaction.id]
    );

    // Cập nhật order
    if (newStatus === 'completed') {
      await pool.execute(
        `UPDATE orders 
         SET payment_status = 'paid', status_id = 2, updated_at = NOW()
         WHERE id = ?`,
        [transaction.order_id]
      );
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// ============================================
// USER APIs
// ============================================

/**
 * Lấy lịch sử thanh toán của user
 */
export const getMyPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereCondition = 'user_id = ?';
    const queryParams: any[] = [userId];

    if (status) {
      whereCondition += ' AND status = ?';
      queryParams.push(status);
    }

    const [transactions] = await pool.execute(
      `SELECT * FROM payment_details_view 
       WHERE ${whereCondition}
       ORDER BY transaction_created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), offset]
    );

    // Count total
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM payment_transactions WHERE ${whereCondition}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    res.status(200).json({
      success: true,
      message: 'Lấy lịch sử thanh toán thành công',
      data: {
        transactions,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total: total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử thanh toán',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Xử lý return URL sau khi thanh toán (redirect từ PayOS)
 */
export const handlePaymentReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderCode } = req.query;

    if (!orderCode) {
      res.status(400).json({
        success: false,
        message: 'Thiếu order code',
      });
      return;
    }

    // Lấy transaction
    const [transactions] = await pool.execute(
      'SELECT pt.*, o.id as order_id, o.order_number, o.user_id FROM payment_transactions pt JOIN orders o ON pt.order_id = o.id WHERE pt.payos_order_code = ?',
      [orderCode]
    );

    if ((transactions as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch',
      });
      return;
    }

    const transaction = (transactions as any[])[0];

    // Kiểm tra trạng thái với PayOS
    const payosStatus = await getPayOSPaymentStatus(orderCode as string);
    const newStatus = mapPayOSStatus(payosStatus.data.status || 'PENDING');

    // Cập nhật transaction nếu cần
    if (newStatus !== transaction.status) {
      await pool.execute(
        `UPDATE payment_transactions 
         SET status = ?, paid_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          newStatus,
          newStatus === 'completed' ? new Date() : null,
          transaction.id,
        ]
      );

      // Cập nhật order nếu thanh toán thành công
      if (newStatus === 'completed') {
        await pool.execute(
          `UPDATE orders 
           SET payment_status = 'paid', status_id = 2, updated_at = NOW()
           WHERE id = ?`,
          [transaction.order_id]
        );
      }
    }

    // Redirect về frontend với order_id
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/order/${transaction.order_id}?payment_status=${newStatus}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Handle payment return error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/payment/error?message=${encodeURIComponent(error.message || 'Lỗi xử lý thanh toán')}`);
  }
};

/**
 * Hủy payment transaction
 */
export const cancelPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { transaction_id } = req.body;

    if (!transaction_id) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID là bắt buộc',
      });
      return;
    }

    // Lấy transaction
    const [transactions] = await pool.execute(
      'SELECT * FROM payment_transactions WHERE id = ? AND user_id = ?',
      [transaction_id, userId]
    );

    if ((transactions as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch',
      });
      return;
    }

    const transaction = (transactions as any[])[0];

    // Chỉ cho phép hủy nếu đang pending hoặc processing
    if (!['pending', 'processing'].includes(transaction.status)) {
      res.status(400).json({
        success: false,
        message: `Không thể hủy giao dịch với trạng thái ${transaction.status}`,
      });
      return;
    }

    // Hủy payment với PayOS (nếu có)
    try {
      await cancelPayOSPayment(transaction.payos_order_code);
    } catch (error) {
      console.error('Cancel PayOS payment error:', error);
      // Tiếp tục cập nhật database dù PayOS có lỗi
    }

    // Cập nhật transaction
    await pool.execute(
      `UPDATE payment_transactions 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = ?`,
      [transaction_id]
    );

    // Cập nhật order
    await pool.execute(
      `UPDATE orders 
       SET payment_status = 'cancelled', updated_at = NOW()
       WHERE id = ?`,
      [transaction.order_id]
    );

    res.status(200).json({
      success: true,
      message: 'Hủy thanh toán thành công',
      data: {
        transaction_id,
        status: 'cancelled',
      },
    });
  } catch (error: any) {
    console.error('Cancel payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi hủy thanh toán',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Retry payment - tạo lại payment link cho order
 */
export const retryPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { order_id } = req.body;

    if (!order_id) {
      res.status(400).json({
        success: false,
        message: 'Order ID là bắt buộc',
      });
      return;
    }

    // Lấy order
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, userId]
    );

    if ((orders as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    const order = (orders as any[])[0];

    // Chỉ cho phép retry nếu payment status là pending, failed, hoặc cancelled
    if (!['pending', 'failed', 'cancelled'].includes(order.payment_status)) {
      res.status(400).json({
        success: false,
        message: `Không thể tạo lại payment link cho đơn hàng với trạng thái ${order.payment_status}`,
      });
      return;
    }

    // Hủy các transaction cũ nếu có
    await pool.execute(
      `UPDATE payment_transactions 
       SET status = 'cancelled', updated_at = NOW()
       WHERE order_id = ? AND status IN ('pending', 'processing', 'failed')`,
      [order_id]
    );

    // Tạo payment link mới (tái sử dụng logic từ createPayment)
    req.body.order_id = order_id;
    await createPayment(req, res);
  } catch (error: any) {
    console.error('Retry payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo lại payment link',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Hoàn tiền (refund) cho đơn hàng đã thanh toán
 */
export const refundPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { order_id, amount, reason } = req.body;

    if (!order_id) {
      res.status(400).json({
        success: false,
        message: 'Order ID là bắt buộc',
      });
      return;
    }

    // Lấy order
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, userId]
    );

    if ((orders as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    const order = (orders as any[])[0];

    // Kiểm tra đơn hàng đã thanh toán chưa
    if (order.payment_status !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán',
      });
      return;
    }

    // Lấy transaction
    const [transactions] = await pool.execute(
      `SELECT * FROM payment_transactions 
       WHERE order_id = ? AND user_id = ? AND status = 'completed' 
       ORDER BY created_at DESC LIMIT 1`,
      [order_id, userId]
    );

    if ((transactions as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch thanh toán',
      });
      return;
    }

    const transaction = (transactions as any[])[0];

    // Kiểm tra đã refund chưa
    if (transaction.status === 'refunded') {
      res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được hoàn tiền',
      });
      return;
    }

    // Số tiền refund (nếu không có thì refund toàn bộ)
    const refundAmount = amount ? Number(amount) : transaction.amount;

    if (refundAmount > transaction.amount) {
      res.status(400).json({
        success: false,
        message: 'Số tiền hoàn trả không được lớn hơn số tiền đã thanh toán',
      });
      return;
    }

    // Tạo refund record trong database trước
    const [refundResult] = await pool.execute(
      `INSERT INTO payment_refunds (
        transaction_id, refund_amount, reason, status, processed_by
      ) VALUES (?, ?, ?, 'pending', ?)`,
      [transaction.id, refundAmount, reason || 'Hủy đơn hàng', userId]
    );

    const refundId = (refundResult as any).insertId;

    // Gọi PayOS refund API
    let payosRefundResponse = null;
    let payosRefundId = null;

    try {
      payosRefundResponse = await refundPayOSPayment(
        transaction.payos_order_code.toString(),
        {
          amount: refundAmount,
          reason: reason || `Hoàn tiền đơn hàng ${order.order_number}`,
          description: `Hoàn tiền cho đơn hàng ${order.order_number}`,
        }
      );

      // Lưu PayOS refund ID nếu có
      if (payosRefundResponse?.data?.refundId) {
        payosRefundId = payosRefundResponse.data.refundId;
      } else if (payosRefundResponse?.data?.id) {
        payosRefundId = payosRefundResponse.data.id;
      }

      // Cập nhật refund record
      await pool.execute(
        `UPDATE payment_refunds 
         SET payos_refund_id = ?, status = 'processing', updated_at = NOW()
         WHERE id = ?`,
        [payosRefundId || '', refundId]
      );
    } catch (error: any) {
      console.error('PayOS refund error:', error);
      
      // Cập nhật refund status thành failed
      await pool.execute(
        `UPDATE payment_refunds 
         SET status = 'failed', updated_at = NOW()
         WHERE id = ?`,
        [refundId]
      );

      // Nếu PayOS lỗi nhưng có thể là do spending mode tự động refund, vẫn tiếp tục
      // Với chế độ spending mode, việc hủy đơn có thể tự động trigger refund
      if (error.message?.includes('Không thể hoàn tiền')) {
        res.status(500).json({
          success: false,
          message: 'Không thể hoàn tiền qua PayOS. Vui lòng liên hệ hỗ trợ.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
        return;
      }
    }

    // Cập nhật transaction status
    const newTransactionStatus = refundAmount >= transaction.amount ? 'refunded' : 'completed';
    await pool.execute(
      `UPDATE payment_transactions 
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [newTransactionStatus, transaction.id]
    );

    // Cập nhật order payment status
    await pool.execute(
      `UPDATE orders 
       SET payment_status = 'refunded', updated_at = NOW()
       WHERE id = ?`,
      [order_id]
    );

    res.status(200).json({
      success: true,
      message: 'Yêu cầu hoàn tiền đã được gửi thành công',
      data: {
        refund_id: refundId,
        refund_amount: refundAmount,
        transaction_id: transaction.id,
        payos_refund_id: payosRefundId,
        status: 'processing',
      },
    });
  } catch (error: any) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi hoàn tiền',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapPayOSStatus(payosStatus: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'PAID': 'completed',
    'CANCELLED': 'cancelled',
    'EXPIRED': 'failed',
  };

  return statusMap[payosStatus] || 'pending';
}

