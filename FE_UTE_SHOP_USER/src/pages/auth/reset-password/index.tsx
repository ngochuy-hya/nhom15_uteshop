// Reset Password Page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/services/auth';

const ResetPasswordPage: React.FC = () => {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isValidToken, setIsValidToken] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/auth/forgot-password', { replace: true });
      return;
    }
    setIsValidToken(true);
  }, [token, navigate]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    if (!formData.password) {
      errors.push('Vui lòng nhập mật khẩu mới');
    } else if (passwordErrors.length > 0) {
      errors.push(...passwordErrors);
    }
    
    if (!formData.confirmPassword) {
      errors.push('Vui lòng xác nhận mật khẩu');
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Mật khẩu xác nhận không khớp');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      return;
    }

    try {
      await resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      
      // Redirect to login page with success message
      navigate('/auth/login', { 
        state: { 
          message: 'Mật khẩu đã được reset thành công! Vui lòng đăng nhập với mật khẩu mới.' 
        } 
      });
    } catch (error) {
      console.error('Reset password failed:', error);
    }
  };

  if (!isValidToken) {
    return (
      <div className="tf-reset-password-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="tf-reset-password-form">
                <div className="alert alert-danger" role="alert">
                  <i className="icon icon-warning"></i>
                  Token không hợp lệ hoặc đã hết hạn
                </div>
                <div className="text-center">
                  <Link to="/auth/forgot-password" className="btn btn-primary">
                    Quay lại trang quên mật khẩu
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-reset-password-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="tf-reset-password-form">
              <div className="tf-reset-password-form-header">
                <h2 className="title">Reset mật khẩu</h2>
                <p className="subtitle">
                  Nhập mật khẩu mới cho tài khoản của bạn
                </p>
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

              <form onSubmit={handleSubmit} className="tf-reset-password-form-body">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Mật khẩu mới <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className="form-control"
                      placeholder="Nhập mật khẩu mới"
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

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Xác nhận mật khẩu mới <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Nhập lại mật khẩu mới"
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

                <div className="password-requirements">
                  <h6>Yêu cầu mật khẩu:</h6>
                  <ul className="list-unstyled">
                    <li className={formData.password.length >= 6 ? 'text-success' : 'text-muted'}>
                      <i className={`icon ${formData.password.length >= 6 ? 'icon-check' : 'icon-times'}`}></i>
                      Ít nhất 6 ký tự
                    </li>
                    <li className={/(?=.*[a-z])/.test(formData.password) ? 'text-success' : 'text-muted'}>
                      <i className={`icon ${/(?=.*[a-z])/.test(formData.password) ? 'icon-check' : 'icon-times'}`}></i>
                      Có ít nhất 1 chữ thường
                    </li>
                    <li className={/(?=.*[A-Z])/.test(formData.password) ? 'text-success' : 'text-muted'}>
                      <i className={`icon ${/(?=.*[A-Z])/.test(formData.password) ? 'icon-check' : 'icon-times'}`}></i>
                      Có ít nhất 1 chữ hoa
                    </li>
                    <li className={/(?=.*\d)/.test(formData.password) ? 'text-success' : 'text-muted'}>
                      <i className={`icon ${/(?=.*\d)/.test(formData.password) ? 'icon-check' : 'icon-times'}`}></i>
                      Có ít nhất 1 số
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 tf-reset-password-btn"
                  disabled={isLoading || !formData.password || !formData.confirmPassword || passwordErrors.length > 0 || formData.password !== formData.confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang reset...
                    </>
                  ) : (
                    'Reset mật khẩu'
                  )}
                </button>
              </form>

              <div className="tf-reset-password-form-footer">
                <p>
                  Nhớ mật khẩu rồi?{' '}
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

export default ResetPasswordPage;
