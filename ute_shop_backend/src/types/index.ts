import { Request } from 'express';

export interface UserAttributes {
  id?: number;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OTPAttributes {
  id?: number;
  email: string;
  otp: string;
  type: 'register' | 'forgot-password';
  expiresAt: Date;
  createdAt?: Date;
}

export interface AuthRequest<T = any, U = any, V = any> extends Request<T, U, V> {
  user?: UserAttributes;
}

export interface JWTPayload {
  id: number;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
}