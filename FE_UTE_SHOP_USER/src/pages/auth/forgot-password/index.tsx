// Forgot Password Page
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/services/auth';

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear error khi user nhập
    if (error) {
      clearError();
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    try {
      const response = await forgotPassword({ email });
      setIsSubmitted(true);
      setSuccessMessage(response.message || 'Email reset mật khẩu đã được gửi!');
    } catch (error) {
      console.error('Forgot password failed:', error);
    }
  };

  const handleResendEmail = async () => {
    try {
      const response = await forgotPassword({ email });
      setSuccessMessage(response.message || 'Email đã được gửi lại!');
    } catch (error) {
      console.error('Resend email failed:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="tf-forgot-password-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="tf-forgot-password-form">
                <div className="tf-forgot-password-form-header">
                  <div className="success-icon">
                    <i className="icon icon-check-circle text-success"></i>
                  </div>
                  <h2 className="title">Email đã được gửi!</h2>
                  <p className="subtitle">
                    Chúng tôi đã gửi link reset mật khẩu đến email của bạn
                  </p>
                </div>

                <div className="tf-forgot-password-form-body">
                  <div className="alert alert-success" role="alert">
                    <i className="icon icon-info-circle"></i>
                    {successMessage}
                  </div>

                  <div className="email-info">
                    <p><strong>Email:</strong> {email}</p>
                    <p className="text-muted">
                      Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn trong email.
                      Nếu không thấy email, hãy kiểm tra thư mục spam.
                    </p>
                  </div>

                  <div className="tf-forgot-password-form-actions">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleResendEmail}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Đang gửi...
                        </>
                      ) : (
                        'Gửi lại email'
                      )}
                    </button>
                    
                    <Link to="/auth/login" className="btn btn-primary">
                      Quay lại đăng nhập
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-forgot-password-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="tf-forgot-password-form">
              <div className="tf-forgot-password-form-header">
                <h2 className="title">Quên mật khẩu?</h2>
                <p className="subtitle">
                  Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi link reset mật khẩu.
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

              <form onSubmit={handleSubmit} className="tf-forgot-password-form-body">
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
                    value={email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                  <small className="form-text text-muted">
                    Chúng tôi sẽ gửi link reset mật khẩu đến email này
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 tf-forgot-password-btn"
                  disabled={isLoading || !email.trim() || !validateEmail(email)}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi link reset mật khẩu'
                  )}
                </button>
              </form>

              <div className="tf-forgot-password-form-footer">
                <p>
                  Nhớ mật khẩu rồi?{' '}
                  <Link to="/auth/login" className="login-link">
                    Đăng nhập ngay
                  </Link>
                </p>
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

export default ForgotPasswordPage;
