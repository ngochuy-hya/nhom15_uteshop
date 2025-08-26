import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/user';
import OTP from '../models/otp';
import { generateToken } from '../utils/jwt';
import { sendOTPEmail, generateOTP } from '../utils/email';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateInput
} from '../utils/validation';
import { 
  RegisterRequest,
  LoginRequest,
  VerifyOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '../types';

// Đăng ký tài khoản
export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = validateInput(registerSchema, req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
      return;
    }

    const { email, password, fullName, phone } = validation.data;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo user mới (chưa verify)
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      phone: phone || null,
      isVerified: false,
    });

    // Tạo và gửi OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '300000')); // 5 phút

    // Xóa OTP cũ nếu có
    await OTP.destroy({ where: { email, type: 'register' } });

    await OTP.create({
      email,
      otp,
      type: 'register',
      expiresAt: otpExpires,
    });

    // Gửi email OTP
    await sendOTPEmail(email, otp, 'register');

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Xác thực OTP
export const verifyOTP = async (req: Request<{}, {}, VerifyOTPRequest>, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = validateInput(verifyOTPSchema, req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
      return;
    }

    const { email, otp } = validation.data;

    // Tìm OTP hợp lệ
    const otpRecord = await OTP.findOne({
      where: {
        email,
        otp,
        type: 'register',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'OTP không hợp lệ hoặc đã hết hạn'
      });
      return;
    }

    // Cập nhật user verified
    const [updatedCount] = await User.update(
      { isVerified: true },
      { where: { email } }
    );

    if (updatedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
      return;
    }

    // Xóa OTP đã sử dụng
    await OTP.destroy({ where: { email, type: 'register' } });

    res.json({
      success: true,
      message: 'Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.'
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Đăng nhập
export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = validateInput(loginSchema, req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
      return;
    }

    const { email, password } = validation.data;

    // Tìm user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
      return;
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
      return;
    }

    // Kiểm tra account đã được verify chưa
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản.'
      });
      return;
    }

    // Tạo JWT token
    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          avatar: user.avatar,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Quên mật khẩu
export const forgotPassword = async (req: Request<{}, {}, ForgotPasswordRequest>, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = validateInput(forgotPasswordSchema, req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
      return;
    }

    const { email } = validation.data;

    // Kiểm tra user tồn tại
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
      return;
    }

    // Kiểm tra tài khoản đã được xác thực chưa
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng xác thực tài khoản trước khi đặt lại mật khẩu.'
      });
      return;
    }

    // Tạo và gửi OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '300000'));

    // Xóa OTP cũ nếu có
    await OTP.destroy({ where: { email, type: 'forgot-password' } });

    await OTP.create({
      email,
      otp,
      type: 'forgot-password',
      expiresAt: otpExpires,
    });

    await sendOTPEmail(email, otp, 'forgot-password');

    res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Đặt lại mật khẩu
export const resetPassword = async (req: Request<{}, {}, ResetPasswordRequest>, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = validateInput(resetPasswordSchema, req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: validation.errors
      });
      return;
    }

    const { email, otp, newPassword } = validation.data;

    // Tìm OTP hợp lệ
    const otpRecord = await OTP.findOne({
      where: {
        email,
        otp,
        type: 'forgot-password',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'OTP không hợp lệ hoặc đã hết hạn'
      });
      return;
    }

    // Hash password mới
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật password
    const [updatedCount] = await User.update(
      { password: hashedPassword },
      { where: { email } }
    );

    if (updatedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
      return;
    }

    // Xóa OTP đã sử dụng
    await OTP.destroy({ where: { email, type: 'forgot-password' } });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};

// Gửi lại OTP
export const resendOTP = async (req: Request<{}, {}, { email: string; type: 'register' | 'forgot-password' }>, res: Response): Promise<void> => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      res.status(400).json({
        success: false,
        message: 'Email và loại OTP là bắt buộc'
      });
      return;
    }

    // Kiểm tra user tồn tại
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
      return;
    }

    // Kiểm tra điều kiện cho từng loại OTP
    if (type === 'register' && user.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Tài khoản đã được xác thực'
      });
      return;
    }

    if (type === 'forgot-password' && !user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác thực'
      });
      return;
    }

    // Tạo OTP mới
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '300000'));

    // Xóa OTP cũ và tạo mới
    await OTP.destroy({ where: { email, type } });
    await OTP.create({
      email,
      otp,
      type,
      expiresAt: otpExpires,
    });

    await sendOTPEmail(email, otp, type);

    res.json({
      success: true,
      message: 'Mã OTP mới đã được gửi đến email của bạn.'
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
};