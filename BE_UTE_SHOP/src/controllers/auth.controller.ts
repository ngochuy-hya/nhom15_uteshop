import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { generateToken, generateEmailVerificationToken, verifyToken } from '../utils/jwt';
import { generateOTP, hashOTP, getOTPExpiryTime } from '../utils/otp';
import { sendEmail, generateOTPEmailTemplate, generateWelcomeEmailTemplate } from '../utils/email';
import { ApiResponse, RegisterData, LoginData, User } from '../types';
import { AuthService } from '../services/auth.service';

// Helper function để split name thành first_name và last_name
// Ví dụ: "Nguyễn Ngọc Huy" -> last_name: "Nguyễn", first_name: "Ngọc Huy"
function splitName(fullName: string): { first_name: string; last_name: string } {
  const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    return { first_name: '', last_name: '' };
  }
  
  if (nameParts.length === 1) {
    // Chỉ có 1 từ, coi như first_name
    return { first_name: nameParts[0], last_name: '' };
  }
  
  // Lấy từ đầu tiên làm last_name (họ)
  // Phần còn lại làm first_name (tên đệm + tên)
  const last_name = nameParts[0];
  const first_name = nameParts.slice(1).join(' ');
  
  return { first_name, last_name };
}

// Validation rules
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  // Chấp nhận cả 'name' hoặc 'first_name' và 'last_name'
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Họ và tên không được để trống'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Tên không được để trống'),
  body('last_name')
    .optional()
    .trim(),
  // Custom validation: yêu cầu có 'name' HOẶC ('first_name' và 'last_name')
  body().custom((value) => {
    const hasName = value.name && value.name.trim().length > 0;
    const hasFirstName = value.first_name && value.first_name.trim().length > 0;
    const hasLastName = value.last_name && value.last_name.trim().length > 0;
    
    if (!hasName && (!hasFirstName || !hasLastName)) {
      throw new Error('Vui lòng cung cấp họ và tên (name) hoặc tên và họ (first_name, last_name)');
    }
    return true;
  }),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') {
        return true; // Optional field, empty is OK
      }
      // Chấp nhận số điện thoại Việt Nam:
      // - Bắt đầu bằng 0 và có 10 số: 0xxxxxxxxx (0 + 9 số = 10 tổng)
      // - Bắt đầu bằng +84 hoặc 84 và có 9-10 số sau: +84xxxxxxxxx hoặc 84xxxxxxxxx
      const cleanPhone = value.replace(/\s/g, ''); // Loại bỏ khoảng trắng
      
      // Pattern: 0 + 9 số (tổng 10 số) hoặc (+84|84) + 9-10 số
      const phoneRegex = /^(0[0-9]{9}|(\+84|84)[0-9]{9,10})$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số bắt đầu bằng 0)');
      }
      return true;
    })
    .withMessage('Số điện thoại không hợp lệ'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
];

// Đăng ký tài khoản
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log request để debug
    console.log('=== REGISTER REQUEST DEBUG ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body (raw):', req.body);
    console.log('Request body (stringified):', JSON.stringify(req.body, null, 2));
    console.log('Body type:', typeof req.body);
    console.log('Is body an object?', typeof req.body === 'object' && req.body !== null);
    console.log('================================');

    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
      return;
    }

    let { email, password, first_name, last_name, name, phone, date_of_birth, gender }: RegisterData & { name?: string } = req.body;
    
    console.log('=== AFTER DESTRUCTURING ===');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('First name:', first_name);
    console.log('Last name:', last_name);
    console.log('Phone:', phone);
    console.log('Date of birth:', date_of_birth);
    console.log('Gender:', gender);
    console.log('============================');
    
    // Nếu có 'name' nhưng không có 'first_name' và 'last_name', tự động split
    if (name && !first_name && !last_name) {
      console.log('=== SPLITTING NAME ===');
      console.log('Original name:', name);
      const split = splitName(name);
      first_name = split.first_name;
      last_name = split.last_name;
      console.log('After split - first_name:', first_name);
      console.log('After split - last_name:', last_name);
      console.log('======================');
    }
    
    // Đảm bảo first_name và last_name không rỗng
    if (!first_name || first_name.trim().length === 0) {
      console.log('ERROR: first_name is empty');
      res.status(400).json({
        success: false,
        message: 'Tên không được để trống',
      });
      return;
    }
    
    if (!last_name || last_name.trim().length === 0) {
      console.log('ERROR: last_name is empty');
      res.status(400).json({
        success: false,
        message: 'Họ không được để trống',
      });
      return;
    }

    console.log('=== FINAL VALUES BEFORE INSERT ===');
    console.log('Email:', email);
    console.log('First name:', first_name);
    console.log('Last name:', last_name);
    console.log('Phone:', phone);
    console.log('Date of birth:', date_of_birth);
    console.log('Gender:', gender);
    console.log('===================================');

    // Kiểm tra email đã tồn tại chưa
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng',
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiryTime(15); // 15 phút
    
    console.log('=== DEBUG OTP ===');
    console.log('OTP gốc:', otp);
    console.log('OTP đã hash:', hashedOTP);
    console.log('Email:', email);

    // Tạo user mới (chưa verify email) - Convert undefined to null
    const [result] = await pool.execute(
      `INSERT INTO users (email, password, first_name, last_name, phone, date_of_birth, gender, role_id, is_active, email_verified, auth_provider) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0, 'local')`,
      [
        email, 
        hashedPassword, 
        first_name, 
        last_name, 
        phone || null, 
        date_of_birth || null, 
        gender || null
      ]
    );

    const userId = (result as any).insertId;
    
    console.log('=== USER CREATED SUCCESSFULLY ===');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('================================');

    // Lưu OTP vào bảng verification_codes
    console.log('=== SAVING OTP ===');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Hashed OTP:', hashedOTP);
    console.log('OTP Length:', hashedOTP.length);
    console.log('OTP Expiry:', otpExpiry);
    console.log('==================');
    
    await pool.execute(
      'INSERT INTO verification_codes (user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedOTP, 'email_verification', otpExpiry]
    );
    
    console.log('OTP saved to database successfully');

    // Gửi email OTP
    console.log('=== SENDING EMAIL ===');
    console.log('To:', email);
    console.log('OTP:', otp);
    console.log('First name:', first_name);
    console.log('====================');
    
    const emailSent = await sendEmail({
      to: email,
      subject: 'Xác thực tài khoản UTESHOP - Mã OTP',
      html: generateOTPEmailTemplate(otp, first_name),
    });

    console.log('Email sent result:', emailSent);
    console.log('=== REGISTER PROCESS COMPLETE ===');

    if (!emailSent) {
      // Nếu gửi email thất bại, xóa user đã tạo
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      data: {
        user_id: userId,
        email: email,
        email_sent: true,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Xác thực OTP
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email và mã OTP là bắt buộc',
      });
      return;
    }

    // Tìm verification code
    const [codes] = await pool.execute(
      'SELECT * FROM verification_codes WHERE email = ? AND type = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
      [email, 'email_verification']
    );

    const verificationCode = (codes as any[])[0];
    if (!verificationCode) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã được sử dụng',
      });
      return;
    }

    // Kiểm tra OTP hết hạn
    if (new Date() > new Date(verificationCode.expires_at)) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn',
      });
      return;
    }

    // So sánh OTP
    console.log('OTP nhập vào:', otp);
    console.log('OTP đã hash trong DB:', verificationCode.code);
    console.log('OTP nhập vào sau khi hash:', hashOTP(otp));
    
    const isOTPValid = hashOTP(otp) === verificationCode.code;

    if (!isOTPValid) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác',
      });
      return;
    }

    // Cập nhật user đã verify email
    await pool.execute(
      'UPDATE users SET email_verified = 1 WHERE id = ?',
      [verificationCode.user_id]
    );

    // Đánh dấu OTP đã sử dụng
    await pool.execute(
      'UPDATE verification_codes SET is_used = 1 WHERE id = ?',
      [verificationCode.id]
    );

    // Lấy thông tin user
    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, role_id, is_active, email_verified FROM users WHERE id = ?',
      [verificationCode.user_id]
    );

    const user = (users as any[])[0];

    // Tạo JWT token
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

    res.status(200).json({
      success: true,
      message: 'Xác thực email thành công!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role_id: user.role_id,
          email_verified: user.email_verified,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực OTP',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Gửi lại OTP
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email là bắt buộc',
      });
      return;
    }

    // Kiểm tra user có tồn tại và chưa verify
    const [users] = await pool.execute(
      'SELECT id, first_name, email_verified FROM users WHERE email = ?',
      [email]
    );

    const user = (users as any[])[0];
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này',
      });
      return;
    }

    if (user.email_verified) {
      res.status(400).json({
        success: false,
        message: 'Tài khoản đã được xác thực',
      });
      return;
    }

    // Tạo OTP mới
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiryTime(15);

    // Lưu OTP mới
    await pool.execute(
      'INSERT INTO verification_codes (user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, email, hashedOTP, 'email_verification', otpExpiry]
    );

    // Gửi email OTP
    const emailSent = await sendEmail({
      to: email,
      subject: 'Mã OTP mới - UTESHOP',
      html: generateOTPEmailTemplate(otp, user.first_name),
    });

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi lại OTP',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đăng nhập
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array(),
      });
      return;
    }

    const { email, password }: LoginData = req.body;

    // Tìm user
    const [users] = await pool.execute(
      'SELECT id, email, password, first_name, last_name, role_id, is_active, email_verified FROM users WHERE email = ?',
      [email]
    );

    const user = (users as any[])[0];
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
      return;
    }

    // Kiểm tra user có active không
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa',
      });
      return;
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
      return;
    }

    // Kiểm tra email đã verify chưa
    if (!user.email_verified) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng xác thực email trước khi đăng nhập',
      });
      return;
    }

    // Cập nhật last login
    await pool.execute(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [req.ip, user.id]
    );

    // Tạo JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
    });

    // Ghi log đăng nhập
    await pool.execute(
      'INSERT INTO login_history (user_id, login_method, status, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [user.id, 'local', 'success', req.ip, req.headers['user-agent']]
    );

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role_id: user.role_id,
          email_verified: user.email_verified,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Lấy thông tin user hiện tại
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const [users] = await pool.execute(
      'SELECT id, email, first_name, last_name, phone, date_of_birth, gender, avatar, role_id, is_active, email_verified, created_at FROM users WHERE id = ?',
      [userId]
    );

    const user = (users as any[])[0];
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy user',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin user thành công',
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đăng xuất
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Tui cho client xóa token ở frontend á nha, Khôi làm chỗ này sao thì tùy á thể implement blacklist token nếu cần
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất',
    });
  }
};

// Quên mật khẩu - Gửi OTP qua email
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email là bắt buộc',
      });
      return;
    }

    // Kiểm tra user tồn tại
    const [users] = await pool.execute(
      'SELECT id, email, first_name FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if ((users as any[]).length === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này',
      });
      return;
    }

    const user = (users as any[])[0];

    // Tạo OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiryTime(15); // 15 phút

    // Lưu OTP
    await pool.execute(
      'INSERT INTO verification_codes (user_id, email, code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, email, hashedOTP, 'password_reset', otpExpiry]
    );

    // Gửi email
    const emailSent = await sendEmail({
      to: email,
      subject: 'Đặt lại mật khẩu - UTESHOP',
      html: `
        <h2>Xin chào ${user.first_name},</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
        <h1 style="color: #667eea; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>Mã này có hiệu lực trong 15 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      `,
    });

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
      data: { email },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý quên mật khẩu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đặt lại mật khẩu với OTP
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP và mật khẩu mới là bắt buộc',
      });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
      return;
    }

    // Tìm OTP
    const [codes] = await pool.execute(
      'SELECT * FROM verification_codes WHERE email = ? AND type = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
      [email, 'password_reset']
    );

    const verificationCode = (codes as any[])[0];
    if (!verificationCode) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã được sử dụng',
      });
      return;
    }

    // Kiểm tra OTP hết hạn
    if (new Date() > new Date(verificationCode.expires_at)) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn',
      });
      return;
    }

    // Xác thực OTP
    const isOTPValid = hashOTP(otp) === verificationCode.code;
    if (!isOTPValid) {
      res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác',
      });
      return;
    }

    // Hash mật khẩu mới
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Cập nhật mật khẩu
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, verificationCode.user_id]
    );

    // Đánh dấu OTP đã sử dụng
    await pool.execute(
      'UPDATE verification_codes SET is_used = 1 WHERE id = ?',
      [verificationCode.id]
    );

    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt lại mật khẩu',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        success: false,
        message: 'Refresh token là bắt buộc',
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyToken(refresh_token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    // Kiểm tra user
    const [users] = await pool.execute(
      'SELECT id, email, role_id FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if ((users as any[]).length === 0) {
      res.status(401).json({
        success: false,
        message: 'User không tồn tại hoặc đã bị vô hiệu hóa',
      });
      return;
    }

    const user = (users as any[])[0];

    // Tạo access token mới
    const newAccessToken = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
    });

    res.status(200).json({
      success: true,
      message: 'Refresh token thành công',
      data: {
        access_token: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi refresh token',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đăng nhập Google (với ID Token từ frontend)
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'Google ID token là bắt buộc',
      });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await AuthService.googleLogin(idToken, ip);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập Google thành công',
      data: result,
    });
  } catch (error: any) {
    console.error('Google login controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đăng nhập Google thất bại',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đăng nhập Google - Redirect flow (Đơn giản hơn, không cần frontend xử lý)
export const googleLoginRedirect = async (req: Request, res: Response): Promise<void> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  res.redirect(googleAuthUrl);
};

// Google OAuth Callback
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`http://localhost:5173?error=${encodeURIComponent('Không nhận được code từ Google')}`);
    }
    
    // Exchange code for tokens
    const axios = require('axios');
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      grant_type: 'authorization_code',
    });
    
    const { id_token } = tokenResponse.data;
    
    // Login with ID token
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await AuthService.googleLogin(id_token, ip);
    
    // Redirect về frontend với token
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message || 'Đăng nhập Google thất bại')}`);
  }
};

// Đăng nhập Facebook
export const facebookLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      res.status(400).json({
        success: false,
        message: 'Facebook access token là bắt buộc',
      });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await AuthService.facebookLogin(accessToken, ip);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập Facebook thành công',
      data: result,
    });
  } catch (error: any) {
    console.error('Facebook login controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Đăng nhập Facebook thất bại',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// Đăng nhập Facebook
export const facebookLoginRedirect = async (req: Request, res: Response): Promise<void> => {
  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback';
  
  const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=email,public_profile&` +
    `response_type=code`;
  
  res.redirect(facebookAuthUrl);
};

// Facebook OAuth Callback
export const facebookCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`http://localhost:5173?error=${encodeURIComponent('Không nhận được code từ Facebook')}`);
    }
    
    // Exchange code for access token
    const axios = require('axios');
    const redirectUri = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback';
    
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code: code,
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // Login with access token
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await AuthService.facebookLogin(accessToken, ip);
    
    // Redirect về frontend với token
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Facebook callback error:', error);
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message || 'Đăng nhập Facebook thất bại')}`);
  }
};
