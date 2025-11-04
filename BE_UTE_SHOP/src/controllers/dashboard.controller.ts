import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

// Tổng quan dashboard
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let dateCondition = '1=1';
    let queryParams: any[] = [];

    if (start_date) {
      dateCondition += ' AND DATE(created_at) >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      dateCondition += ' AND DATE(created_at) <= ?';
      queryParams.push(end_date);
    }

    // Thống kê tổng quan
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE ${dateCondition}) as total_orders,
        (SELECT SUM(total_amount) FROM orders WHERE ${dateCondition} AND payment_status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM users WHERE ${dateCondition}) as total_users,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) as total_products,
        (SELECT COUNT(*) FROM orders WHERE status_id = 1) as pending_orders,
        (SELECT COUNT(*) FROM product_reviews WHERE is_approved = 0) as pending_reviews
    `, queryParams);

    // So sánh với kỳ trước
    const [previousStats] = await pool.execute<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) < ?) as previous_orders,
        (SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) < ? AND payment_status = 'paid') as previous_revenue
    `, [start_date || '1970-01-01', start_date || '1970-01-01']);

    const overview = stats[0];
    const previous = previousStats[0];

    // Tính phần trăm thay đổi
    const orderGrowth = previous.previous_orders > 0
      ? ((overview.total_orders - previous.previous_orders) / previous.previous_orders * 100).toFixed(2)
      : 0;

    const revenueGrowth = previous.previous_revenue > 0
      ? ((overview.total_revenue - previous.previous_revenue) / previous.previous_revenue * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      message: 'Lấy tổng quan thành công',
      data: {
        ...overview,
        order_growth: orderGrowth,
        revenue_growth: revenueGrowth,
      },
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tổng quan',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Doanh thu theo thời gian
export const getRevenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'day', start_date, end_date } = req.query;

    let groupBy = 'DATE(created_at)';
    let dateFormat = '%Y-%m-%d';

    if (period === 'week') {
      groupBy = 'YEARWEEK(created_at)';
      dateFormat = '%Y-W%v';
    } else if (period === 'month') {
      groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
      dateFormat = '%Y-%m';
    } else if (period === 'year') {
      groupBy = 'YEAR(created_at)';
      dateFormat = '%Y';
    }

    let whereCondition = 'payment_status = "paid"';
    let queryParams: any[] = [];

    if (start_date) {
      whereCondition += ' AND DATE(created_at) >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      whereCondition += ' AND DATE(created_at) <= ?';
      queryParams.push(end_date);
    }

    const [revenue] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value
      FROM orders
      WHERE ${whereCondition}
      GROUP BY ${groupBy}
      ORDER BY created_at ASC`,
      [dateFormat, ...queryParams]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy doanh thu thành công',
      data: revenue,
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy doanh thu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Sản phẩm bán chạy
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10, start_date, end_date } = req.query;

    let whereCondition = 'o.status_id IN (3, 4)'; // shipped, delivered
    let queryParams: any[] = [];

    if (start_date) {
      whereCondition += ' AND DATE(o.created_at) >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      whereCondition += ' AND DATE(o.created_at) <= ?';
      queryParams.push(end_date);
    }

    const [topProducts] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        COUNT(oi.id) as total_sold,
        SUM(oi.total_price) as total_revenue,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE ${whereCondition}
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?`,
      [...queryParams, Number(limit)]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy sản phẩm bán chạy thành công',
      data: topProducts,
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm bán chạy',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đơn hàng gần đây
export const getRecentOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const [recentOrders] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.payment_status,
        o.created_at,
        os.status_name,
        os.color as status_color,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      JOIN order_statuses os ON o.status_id = os.id
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ?`,
      [Number(limit)]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy đơn hàng gần đây thành công',
      data: recentOrders,
    });
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đơn hàng gần đây',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thống kê khách hàng
export const getCustomerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    let whereCondition = '1=1';
    let queryParams: any[] = [];

    if (start_date) {
      whereCondition += ' AND DATE(created_at) >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      whereCondition += ' AND DATE(created_at) <= ?';
      queryParams.push(end_date);
    }

    // Thống kê khách hàng
    const [customerStats] = await pool.execute<RowDataPacket[]>(`
      SELECT
        COUNT(*) as total_customers,
        SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_customers,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_customers,
        SUM(CASE WHEN auth_provider = 'local' THEN 1 ELSE 0 END) as local_customers,
        SUM(CASE WHEN auth_provider != 'local' THEN 1 ELSE 0 END) as oauth_customers
      FROM users
      WHERE ${whereCondition}
    `, queryParams);

    // Top khách hàng
    const [topCustomers] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE o.payment_status = 'paid'
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê khách hàng thành công',
      data: {
        stats: customerStats[0],
        top_customers: topCustomers,
      },
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê khách hàng',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

