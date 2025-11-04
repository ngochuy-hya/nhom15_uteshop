import { Request, Response } from 'express';
import pool from '../config/database';

// Thống kê tổng quan (Admin)
export const getOverviewStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;

    // Tổng doanh thu
    const [revenueResult] = await pool.execute(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_orders
       FROM orders 
       WHERE status_id = 4 
       ${start_date && end_date ? 'AND created_at BETWEEN ? AND ?' : ''}`,
      start_date && end_date ? [start_date, end_date] : []
    );

    // Tổng số khách hàng
    const [userResult] = await pool.execute(
      `SELECT COUNT(*) as total_users FROM users WHERE role_id = 1`
    );

    // Tổng số sản phẩm
    const [productResult] = await pool.execute(
      `SELECT COUNT(*) as total_products FROM products WHERE is_active = 1`
    );

    // Tổng số đánh giá
    const [reviewResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating
       FROM reviews`
    );

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê tổng quan thành công',
      data: {
        revenue: (revenueResult as any[])[0],
        users: (userResult as any[])[0],
        products: (productResult as any[])[0],
        reviews: (reviewResult as any[])[0],
      },
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tổng quan',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thống kê doanh thu theo thời gian (Admin)
export const getRevenueStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    let dateFormat = '%Y-%m-%d';
    if (group_by === 'month') {
      dateFormat = '%Y-%m';
    } else if (group_by === 'year') {
      dateFormat = '%Y';
    }

    const [stats] = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value
       FROM orders 
       WHERE status_id = 4
       ${start_date && end_date ? 'AND created_at BETWEEN ? AND ?' : ''}
       GROUP BY period
       ORDER BY period`,
      start_date && end_date ? [dateFormat, start_date, end_date] : [dateFormat]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê doanh thu thành công',
      data: stats,
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê doanh thu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thống kê sản phẩm bán chạy (Admin)
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10, start_date, end_date } = req.query;

    const [products] = await pool.execute(
      `SELECT 
        p.id, p.name, p.sku, p.image,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status_id = 4
       ${start_date && end_date ? 'AND o.created_at BETWEEN ? AND ?' : ''}
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT ?`,
      start_date && end_date
        ? [start_date, end_date, Number(limit)]
        : [Number(limit)]
    );

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê sản phẩm bán chạy thành công',
      data: products,
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê sản phẩm bán chạy',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Thống kê khách hàng (Admin)
export const getCustomerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    // Top khách hàng theo tổng chi tiêu
    const [topCustomers] = await pool.execute(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent
       FROM users u
       JOIN orders o ON u.id = o.user_id
       WHERE o.status_id = 4
       GROUP BY u.id
       ORDER BY total_spent DESC
       LIMIT ?`,
      [Number(limit)]
    );

    // Thống kê khách hàng mới theo tháng
    const [newCustomers] = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_customers
       FROM users
       WHERE role_id = 1
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`
    );

    res.status(200).json({
      success: true,
      message: 'Lấy thống kê khách hàng thành công',
      data: {
        top_customers: topCustomers,
        new_customers_by_month: newCustomers,
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

