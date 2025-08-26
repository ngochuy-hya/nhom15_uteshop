import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';

// Interface cho custom error
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  errors?: any[];
}

// Middleware xử lý lỗi chung
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Đã xảy ra lỗi server';

  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Xử lý lỗi Sequelize Validation
  if (error instanceof ValidationError) {
    statusCode = 400;
    const validationErrors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    
    res.status(statusCode).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: validationErrors
    });
    return;
  }

  // Xử lý lỗi unique constraint (email đã tồn tại)
  if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Email đã được sử dụng';
  }

  // Xử lý lỗi foreign key constraint
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Dữ liệu tham chiếu không hợp lệ';
  }

  // Xử lý lỗi connection database
  if (error.name === 'SequelizeConnectionError') {
    statusCode = 500;
    message = 'Lỗi kết nối cơ sở dữ liệu';
  }

  // Xử lý lỗi JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn';
  }

  // Response lỗi
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error
    })
  });
};

// Middleware xử lý route không tồn tại
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const message = `Route ${req.originalUrl} không tồn tại`;
  res.status(404).json({
    success: false,
    message: message
  });
};

// Middleware bắt lỗi async
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};