import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class OrderModel {
  // Tạo đơn hàng mới
  static async create(orderData: {
    order_number: string;
    user_id: number;
    status_id: number;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    shipping_address: any;
    billing_address: any;
    notes?: string;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO orders (order_number, user_id, status_id, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, payment_method, payment_status, shipping_address, billing_address, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.order_number,
        orderData.user_id,
        orderData.status_id,
        orderData.subtotal,
        orderData.tax_amount,
        orderData.shipping_amount,
        orderData.discount_amount,
        orderData.total_amount,
        orderData.payment_method,
        orderData.payment_status,
        JSON.stringify(orderData.shipping_address),
        JSON.stringify(orderData.billing_address),
        orderData.notes || null,
      ]
    );
    return result.insertId;
  }

  // Thêm order item
  static async addItem(itemData: {
    order_id: number;
    product_id: number;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    selected_color?: string;
    selected_size?: string;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, selected_color, selected_size) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemData.order_id,
        itemData.product_id,
        itemData.product_name,
        itemData.product_sku || null,
        itemData.quantity,
        itemData.unit_price,
        itemData.total_price,
        itemData.selected_color || null,
        itemData.selected_size || null,
      ]
    );
    return result.insertId;
  }

  // Tìm đơn hàng theo ID
  static async findById(id: number): Promise<any | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        o.*,
        os.status_name,
        u.email,
        u.first_name,
        u.last_name
      FROM orders o
      JOIN order_statuses os ON o.status_id = os.id
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Tìm đơn hàng theo order number
  static async findByOrderNumber(orderNumber: string): Promise<any | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        o.*,
        os.status_name,
        u.email,
        u.first_name,
        u.last_name
      FROM orders o
      JOIN order_statuses os ON o.status_id = os.id
      JOIN users u ON o.user_id = u.id
      WHERE o.order_number = ?`,
      [orderNumber]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Lấy order items
  static async getItems(orderId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    return rows;
  }

  // Lấy đơn hàng của user
  static async getByUserId(userId: number, params: {
    page?: number;
    limit?: number;
    status_id?: number;
  }): Promise<{ orders: any[]; total: number }> {
    const { page = 1, limit = 10, status_id } = params;
    const offset = (page - 1) * limit;

    let whereConditions = ['o.user_id = ?'];
    let queryParams: any[] = [userId];

    if (status_id) {
      whereConditions.push('o.status_id = ?');
      queryParams.push(status_id);
    }

    // Get orders
    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        o.*,
        os.status_name,
        os.color as status_color
      FROM orders o
      JOIN order_statuses os ON o.status_id = os.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM orders o WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    return {
      orders,
      total: countResult[0].total,
    };
  }

  // Cập nhật trạng thái đơn hàng
  static async updateStatus(orderId: number, statusId: number, notes?: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update order status
      await connection.execute(
        'UPDATE orders SET status_id = ? WHERE id = ?',
        [statusId, orderId]
      );

      // Add status history
      await connection.execute(
        'INSERT INTO order_status_history (order_id, status_id, notes) VALUES (?, ?, ?)',
        [orderId, statusId, notes || null]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Cập nhật payment status
  static async updatePaymentStatus(orderId: number, paymentStatus: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [paymentStatus, orderId]
    );
    return result.affectedRows > 0;
  }

  // Lấy lịch sử trạng thái
  static async getStatusHistory(orderId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        osh.*,
        os.status_name,
        os.color
      FROM order_status_history osh
      JOIN order_statuses os ON osh.status_id = os.id
      WHERE osh.order_id = ?
      ORDER BY osh.created_at DESC`,
      [orderId]
    );
    return rows;
  }

  // Lấy tất cả đơn hàng (admin)
  static async getAll(params: {
    page?: number;
    limit?: number;
    status_id?: number;
    payment_status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ orders: any[]; total: number }> {
    const { page = 1, limit = 20, status_id, payment_status, search, start_date, end_date } = params;
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let queryParams: any[] = [];

    if (status_id) {
      whereConditions.push('o.status_id = ?');
      queryParams.push(status_id);
    }

    if (payment_status) {
      whereConditions.push('o.payment_status = ?');
      queryParams.push(payment_status);
    }

    if (search) {
      whereConditions.push('(o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (start_date) {
      whereConditions.push('DATE(o.created_at) >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(o.created_at) <= ?');
      queryParams.push(end_date);
    }

    // Get orders
    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        o.*,
        os.status_name,
        os.color as status_color,
        u.email,
        u.first_name,
        u.last_name
      FROM orders o
      JOIN order_statuses os ON o.status_id = os.id
      JOIN users u ON o.user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM orders o 
       JOIN users u ON o.user_id = u.id
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    return {
      orders,
      total: countResult[0].total,
    };
  }

  // Lấy thống kê đơn hàng
  static async getStatistics(startDate?: string, endDate?: string): Promise<any> {
    let whereCondition = '1=1';
    let queryParams: any[] = [];

    if (startDate) {
      whereCondition += ' AND DATE(created_at) >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereCondition += ' AND DATE(created_at) <= ?';
      queryParams.push(endDate);
    }

    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status_id = 4 THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status_id = 5 THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders
      WHERE ${whereCondition}`,
      queryParams
    );

    return stats[0];
  }

  // Generate order number
  static async generateOrderNumber(): Promise<string> {
    const prefix = 'UTE';
    const year = new Date().getFullYear();
    
    const [result] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE YEAR(created_at) = ?',
      [year]
    );
    
    const count = result[0].count + 1;
    const orderNumber = `${prefix}-${year}-${count.toString().padStart(6, '0')}`;
    
    return orderNumber;
  }
}

