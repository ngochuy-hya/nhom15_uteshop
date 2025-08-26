import Joi from 'joi';

// Schema validation cho đăng ký
export const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là bắt buộc'
    }),
  
  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu không được quá 50 ký tự',
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là bắt buộc'
    }),
  
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được quá 100 ký tự',
      'string.empty': 'Họ tên không được để trống',
      'any.required': 'Họ tên là bắt buộc'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
    })
});

// Schema validation cho đăng nhập
export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là bắt buộc'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là bắt buộc'
    })
});

// Schema validation cho xác thực OTP
export const verifyOTPSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là bắt buộc'
    }),
  
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP phải có 6 số',
      'string.pattern.base': 'OTP chỉ được chứa số',
      'string.empty': 'OTP không được để trống',
      'any.required': 'OTP là bắt buộc'
    })
});

// Schema validation cho quên mật khẩu
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là bắt buộc'
    })
});

// Schema validation cho đặt lại mật khẩu
export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email là bắt buộc'
    }),
  
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP phải có 6 số',
      'string.pattern.base': 'OTP chỉ được chứa số',
      'string.empty': 'OTP không được để trống',
      'any.required': 'OTP là bắt buộc'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu mới không được quá 50 ký tự',
      'string.empty': 'Mật khẩu mới không được để trống',
      'any.required': 'Mật khẩu mới là bắt buộc'
    })
});

// Schema validation cho cập nhật profile
export const updateProfileSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được quá 100 ký tự'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
    }),
  
  address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Địa chỉ không được quá 500 ký tự'
    })
});

// Hàm helper để validate và format lỗi
export const validateInput = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const formattedErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: formattedErrors,
      data: null
    };
  }
  
  return {
    isValid: true,
    errors: null,
    data: value
  };
};