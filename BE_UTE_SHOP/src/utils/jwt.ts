import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: number;
  email: string;
  roleId: number;
  iat?: number;
  exp?: number;
}

// Tạo JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
};

// Tạo refresh token
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d', // Refresh token có thời hạn 30 ngày
  });
};

// Xác thực JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Tạo token cho email verification
export const generateEmailVerificationToken = (email: string): string => {
  return jwt.sign({ email, type: 'email_verification' }, JWT_SECRET, {
    expiresIn: '1h', // Token xác thực email có thời hạn 1 giờ
  });
};

// Xác thực token email verification
export const verifyEmailToken = (token: string): { email: string; type: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type === 'email_verification') {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error('Email verification token error:', error);
    return null;
  }
};

// Tạo token cho reset password
export const generatePasswordResetToken = (userId: number): string => {
  return jwt.sign({ userId, type: 'password_reset' }, JWT_SECRET, {
    expiresIn: '1h', // Token reset password có thời hạn 1 giờ
  });
};

// Xác thực token reset password
export const verifyPasswordResetToken = (token: string): { userId: number; type: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type === 'password_reset') {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error('Password reset token error:', error);
    return null;
  }
};
