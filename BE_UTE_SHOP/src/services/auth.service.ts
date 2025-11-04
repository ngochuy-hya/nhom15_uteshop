import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt';
import { generateOTP, hashOTP, getOTPExpiryTime } from '../utils/otp';
import { sendEmail, generateOTPEmailTemplate, generateWelcomeEmailTemplate } from '../utils/email';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  // Đăng ký user mới
  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
  }) {
    // Kiểm tra email đã tồn tại
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Tạo user
    const userId = await UserModel.create({
      ...userData,
      password: hashedPassword,
    });

    // Tạo và gửi OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiryTime(15);

    await pool.execute(
      'INSERT INTO verification_codes (user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, userData.email, hashedOTP, 'email_verification', otpExpiry]
    );

    // Gửi email OTP
    const emailSent = await sendEmail({
      to: userData.email,
      subject: 'Xác thực tài khoản UTESHOP - Mã OTP',
      html: generateOTPEmailTemplate(otp, userData.first_name),
    });

    if (!emailSent) {
      // Xóa user nếu gửi email thất bại
      await UserModel.softDelete(userId);
      throw new Error('Không thể gửi email xác thực');
    }

    return {
      user_id: userId,
      email: userData.email,
      email_sent: true,
    };
  }

  // Xác thực OTP
  static async verifyOTP(email: string, otp: string) {
    // Tìm verification code
    const [codes] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM verification_codes WHERE email = ? AND type = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
      [email, 'email_verification']
    );

    const verificationCode = codes[0];
    if (!verificationCode) {
      throw new Error('Mã OTP không hợp lệ hoặc đã được sử dụng');
    }

    // Kiểm tra hết hạn
    if (new Date() > new Date(verificationCode.expires_at)) {
      throw new Error('Mã OTP đã hết hạn');
    }

    // Kiểm tra OTP
    if (hashOTP(otp) !== verificationCode.code) {
      throw new Error('Mã OTP không chính xác');
    }

    // Cập nhật user verified
    await UserModel.verifyEmail(verificationCode.user_id);

    // Đánh dấu OTP đã sử dụng
    await pool.execute(
      'UPDATE verification_codes SET is_used = 1 WHERE id = ?',
      [verificationCode.id]
    );

    // Lấy thông tin user
    const user = await UserModel.findById(verificationCode.user_id);
    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    // Tạo token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
    });

    // Gửi email chào mừng
    await sendEmail({
      to: user.email,
      subject: 'Chào mừng đến với UTESHOP!',
      html: generateWelcomeEmailTemplate(user.first_name),
    });

    // Remove password from response
    delete user.password;

    return { user, token };
  }

  // Gửi lại OTP
  static async resendOTP(email: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Không tìm thấy tài khoản với email này');
    }

    if (user.email_verified) {
      throw new Error('Tài khoản đã được xác thực');
    }

    // Tạo OTP mới
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiryTime(15);

    await pool.execute(
      'INSERT INTO verification_codes (user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, email, hashedOTP, 'email_verification', otpExpiry]
    );

    // Gửi email
    const emailSent = await sendEmail({
      to: email,
      subject: 'Mã OTP mới - UTESHOP',
      html: generateOTPEmailTemplate(otp, user.first_name),
    });

    if (!emailSent) {
      throw new Error('Không thể gửi email');
    }

    return true;
  }

  // Đăng nhập
  static async login(email: string, password: string, ip: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    if (!user.is_active) {
      throw new Error('Tài khoản đã bị khóa');
    }

    if (!user.password) {
      throw new Error('Tài khoản này đăng nhập bằng OAuth');
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    if (!user.email_verified) {
      throw new Error('Vui lòng xác thực email trước khi đăng nhập');
    }

    // Cập nhật last login
    await UserModel.updateLastLogin(user.id, ip);

    // Tạo token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
    });

    // Ghi log đăng nhập
    await pool.execute(
      'INSERT INTO login_history (user_id, login_method, status, ip_address) VALUES (?, ?, ?, ?)',
      [user.id, 'local', 'success', ip]
    );

    // Remove password from response
    delete user.password;

    return { user, token };
  }

  // Lấy profile
  static async getProfile(userId: number) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy user');
    }

    delete user.password;
    return user;
  }

  // Đăng nhập Google OAuth
  static async googleLogin(idToken: string, ip: string) {
    try {
      // Verify Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token');
      }

      const { email, given_name, family_name, picture, email_verified } = payload;

      // Tìm hoặc tạo user
      let user = await UserModel.findByEmail(email);

      if (!user) {
        // Tạo user mới từ Google
        const userId = await UserModel.create({
          email,
          first_name: given_name || 'User',
          last_name: family_name || '',
          password: '', // Không có password cho OAuth
          avatar: picture,
          email_verified: email_verified ? 1 : 0,
        });

        // Lưu OAuth provider (skip vì bảng này dùng để config, không lưu user data)
        // await pool.execute(
        //   'INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token) VALUES (?, ?, ?, ?)',
        //   [userId, 'google', payload.sub, idToken]
        // );

        user = await UserModel.findById(userId);
      } else {
        // Update OAuth info nếu đã tồn tại (skip vì bảng này dùng để config)
        // await pool.execute(
        //   `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token) 
        //    VALUES (?, ?, ?, ?)
        //    ON DUPLICATE KEY UPDATE access_token = ?, updated_at = NOW()`,
        //   ['google', payload.sub, idToken, idToken]
        // );

        // Update email_verified nếu chưa verify
        if (!user.email_verified && email_verified) {
          await UserModel.verifyEmail(user.id);
        }
      }

      if (!user) {
        throw new Error('Không thể tạo hoặc tìm user');
      }

      if (!user.is_active) {
        throw new Error('Tài khoản đã bị khóa');
      }

      // Cập nhật last login
      await UserModel.updateLastLogin(user.id, ip);

      // Tạo token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        roleId: user.role_id,
      });

      // Ghi log đăng nhập
      await pool.execute(
        'INSERT INTO login_history (user_id, login_method, status, ip_address) VALUES (?, ?, ?, ?)',
        [user.id, 'google', 'success', ip]
      );

      // Remove password from response
      delete user.password;

      return { user, token };
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Đăng nhập Google thất bại');
    }
  }

  // Đăng nhập Facebook OAuth
  static async facebookLogin(accessToken: string, ip: string) {
    try {
      // Verify Facebook access token
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
      );

      const { id, name, email, picture } = response.data;

      if (!email) {
        throw new Error('Facebook account không có email');
      }

      // Tách tên
      const nameParts = name.split(' ');
      const first_name = nameParts[0] || 'User';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Tìm hoặc tạo user
      let user = await UserModel.findByEmail(email);

      if (!user) {
        // Tạo user mới từ Facebook
        const userId = await UserModel.create({
          email,
          first_name,
          last_name,
          password: '', // Không có password cho OAuth
          avatar: picture?.data?.url,
          email_verified: 1, // Facebook đã verify email
        });

        // Lưu OAuth provider (skip vì bảng này dùng để config)
        // await pool.execute(
        //   'INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token) VALUES (?, ?, ?, ?)',
        //   [userId, 'facebook', id, accessToken]
        // );

        user = await UserModel.findById(userId);
      } else {
        // Update OAuth info nếu đã tồn tại (skip vì bảng này dùng để config)
        // await pool.execute(
        //   `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token) 
        //    VALUES (?, ?, ?, ?)
        //    ON DUPLICATE KEY UPDATE access_token = ?, updated_at = NOW()`,
        //   [user.id, 'facebook', id, accessToken, accessToken]
        // );

        // Update email_verified nếu chưa verify
        if (!user.email_verified) {
          await UserModel.verifyEmail(user.id);
        }
      }

      if (!user) {
        throw new Error('Không thể tạo hoặc tìm user');
      }

      if (!user.is_active) {
        throw new Error('Tài khoản đã bị khóa');
      }

      // Cập nhật last login
      await UserModel.updateLastLogin(user.id, ip);

      // Tạo token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        roleId: user.role_id,
      });

      // Ghi log đăng nhập
      await pool.execute(
        'INSERT INTO login_history (user_id, login_method, status, ip_address) VALUES (?, ?, ?, ?)',
        [user.id, 'facebook', 'success', ip]
      );

      // Remove password from response
      delete user.password;

      return { user, token };
    } catch (error: any) {
      console.error('Facebook login error:', error);
      throw new Error(error.message || 'Đăng nhập Facebook thất bại');
    }
  }
}

