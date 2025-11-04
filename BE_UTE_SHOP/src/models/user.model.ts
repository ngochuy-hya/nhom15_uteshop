import pool from '../config/database';
import { User } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UserModel {
  // Tạo user mới
  static async create(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    role_id?: number;
    auth_provider?: string;
    avatar?: string;
    email_verified?: number;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (email, password, first_name, last_name, phone, date_of_birth, gender, role_id, auth_provider, avatar, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        userData.email,
        userData.password,
        userData.first_name,
        userData.last_name,
        userData.phone || null,
        userData.date_of_birth || null,
        userData.gender || null,
        userData.role_id || 1,
        userData.auth_provider || 'local',
        userData.avatar || null,
        userData.email_verified || 0,
      ]
    );
    return result.insertId;
  }

  // Tìm user theo email
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // Tìm user theo ID
  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // Cập nhật user
  static async update(id: number, data: Partial<User>): Promise<boolean> {
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
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Xác thực email
  static async verifyEmail(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET email_verified = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Cập nhật last login
  static async updateLastLogin(id: number, ip: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [ip, id]
    );
    return result.affectedRows > 0;
  }

  // Xóa user (soft delete)
  static async softDelete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE users SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Lấy danh sách users (admin)
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role_id?: number;
    is_active?: boolean;
  }): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20, search, role_id, is_active } = params;
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let queryParams: any[] = [];

    if (search) {
      whereConditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role_id) {
      whereConditions.push('role_id = ?');
      queryParams.push(role_id);
    }

    if (is_active !== undefined) {
      whereConditions.push('is_active = ?');
      queryParams.push(is_active ? 1 : 0);
    }

    // Get users
    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT id, email, first_name, last_name, phone, date_of_birth, gender, avatar, role_id, is_active, email_verified, auth_provider, created_at, updated_at
       FROM users 
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    return {
      users: users as User[],
      total: countResult[0].total,
    };
  }

  // Lấy thống kê users
  static async getStatistics(): Promise<any> {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_users,
        SUM(CASE WHEN auth_provider = 'local' THEN 1 ELSE 0 END) as local_users,
        SUM(CASE WHEN auth_provider != 'local' THEN 1 ELSE 0 END) as oauth_users,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today
      FROM users
    `);

    return stats[0];
  }
}

