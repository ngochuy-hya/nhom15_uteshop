// Login Page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/services/auth';

const LoginPage: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData);
      // Redirect sẽ được xử lý trong useEffect
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // TODO: Implement Google OAuth
      console.log('Google login clicked');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      // TODO: Implement Facebook OAuth
      console.log('Facebook login clicked');
    } catch (error) {
      console.error('Facebook login failed:', error);
    }
  };

  return (
    <div className="tf-login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="tf-login-form">
              <div className="tf-login-form-header">
                <h2 className="title">Đăng nhập</h2>
                <p className="subtitle">Chào mừng bạn quay trở lại!</p>
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

              <form onSubmit={handleSubmit} className="tf-login-form-body">
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
                </div>

                <div className="form-group d-flex justify-content-between align-items-center">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="rememberMe"
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <Link to="/auth/forgot-password" className="forgot-password-link">
                    Quên mật khẩu?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 tf-login-btn"
                  disabled={isLoading || !formData.email || !formData.password}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang đăng nhập...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>

              <div className="tf-login-form-divider">
                <span>Hoặc đăng nhập với</span>
              </div>

              <div className="tf-social-login">
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

              <div className="tf-login-form-footer">
                <p>
                  Chưa có tài khoản?{' '}
                  <Link to="/auth/register" className="register-link">
                    Đăng ký ngay
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

export default LoginPage;
