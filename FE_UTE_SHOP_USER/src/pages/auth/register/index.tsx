// Register Page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/services/auth';

const RegisterPage: React.FC = () => {
  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Validate password
  useEffect(() => {
    const errors: string[] = [];
    
    if (formData.password) {
      if (formData.password.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự');
      }
      if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
      }
      if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
      }
      if (!/(?=.*\d)/.test(formData.password)) {
        errors.push('Mật khẩu phải có ít nhất 1 số');
      }
    }
    
    setPasswordErrors(errors);
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error khi user nhập
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Vui lòng nhập họ tên');
    }
    
    if (!formData.email.trim()) {
      errors.push('Vui lòng nhập email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Email không hợp lệ');
    }
    
    if (!formData.password) {
      errors.push('Vui lòng nhập mật khẩu');
    } else if (passwordErrors.length > 0) {
      errors.push(...passwordErrors);
    }
    
    if (!formData.confirmPassword) {
      errors.push('Vui lòng xác nhận mật khẩu');
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Mật khẩu xác nhận không khớp');
    }
    
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      return;
    }

    try {
      await register(formData);
      // Redirect sẽ được xử lý trong useEffect
    } catch (error) {
      console.error('Register failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // TODO: Implement Google OAuth
      console.log('Google register clicked');
    } catch (error) {
      console.error('Google register failed:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      // TODO: Implement Facebook OAuth
      console.log('Facebook register clicked');
    } catch (error) {
      console.error('Facebook register failed:', error);
    }
  };

  return (
    <div className="tf-register-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="tf-register-form">
              <div className="tf-register-form-header">
                <h2 className="title">Đăng ký tài khoản</h2>
                <p className="subtitle">Tạo tài khoản để trải nghiệm tốt nhất</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="icon icon-warning"></i>
                  {error}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={clearError}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="tf-register-form-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        Họ và tên <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        placeholder="Nhập họ và tên"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        placeholder="Nhập email của bạn"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="form-control"
                        placeholder="Nhập số điện thoại"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="dateOfBirth" className="form-label">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        className="form-control"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="form-label">
                    Giới tính
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="form-control"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        Mật khẩu <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          className="form-control"
                          placeholder="Nhập mật khẩu"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          <i className={`icon ${showPassword ? 'icon-eye-off' : 'icon-eye'}`}></i>
                        </button>
                      </div>
                      {passwordErrors.length > 0 && (
                        <div className="password-errors">
                          {passwordErrors.map((error, index) => (
                            <small key={index} className="text-danger d-block">
                              • {error}
                            </small>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">
                        Xác nhận mật khẩu <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          className="form-control"
                          placeholder="Nhập lại mật khẩu"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          <i className={`icon ${showConfirmPassword ? 'icon-eye-off' : 'icon-eye'}`}></i>
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <small className="text-danger">Mật khẩu xác nhận không khớp</small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="agreeTerms"
                      required
                    />
                    <label className="form-check-label" htmlFor="agreeTerms">
                      Tôi đồng ý với{' '}
                      <Link to="/privacy-policy" className="terms-link">
                        Điều khoản sử dụng
                      </Link>{' '}
                      và{' '}
                      <Link to="/privacy-policy" className="privacy-link">
                        Chính sách bảo mật
                      </Link>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 tf-register-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang đăng ký...
                    </>
                  ) : (
                    'Đăng ký tài khoản'
                  )}
                </button>
              </form>

              <div className="tf-register-form-divider">
                <span>Hoặc đăng ký với</span>
              </div>

              <div className="tf-social-register">
                <button
                  type="button"
                  className="btn btn-outline-danger tf-google-btn"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <i className="icon icon-google"></i>
                  Google
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary tf-facebook-btn"
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                >
                  <i className="icon icon-facebook"></i>
                  Facebook
                </button>
              </div>

              <div className="tf-register-form-footer">
                <p>
                  Đã có tài khoản?{' '}
                  <Link to="/auth/login" className="login-link">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
