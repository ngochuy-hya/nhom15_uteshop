import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/utlis/auth";
// @ts-ignore
import * as bootstrap from 'bootstrap';

interface OTPVerificationProps {
  email: string;
  onVerified?: () => void;
  onCancel?: () => void;
}

export default function OTPVerification({ email, onVerified, onCancel }: OTPVerificationProps) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!otp || otp.length < 6) {
      setError("Vui lòng nhập mã OTP hợp lệ");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // Gọi API verify OTP từ auth service (tự động lưu token và user vào localStorage)
      const response = await authService.verifyOTP(email, otp);

      if (response.success && response.data) {
        setSuccess(true);
        
        // Dispatch event để Header và các components khác biết đã login
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
        
        // Đóng modal OTP sau 1.5 giây và tự động chuyển về trang chủ
        setTimeout(() => {
          const otpModal = document.getElementById('otpVerification');
          if (otpModal) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(otpModal);
            if (bsOffcanvas) {
              bsOffcanvas.hide();
            }
          }
          
          // Trigger storage event để refresh auth state
          window.dispatchEvent(new Event('storage'));
          
          // Chuyển về trang chủ - không dùng reload để tránh conflict với React
          navigate('/', { replace: true });
        }, 1500);
        
        if (onVerified) {
          onVerified();
        }
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Xác thực OTP thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      // Gọi API resend OTP
      const response = await authService.resendOTP(email);
      if (response.success) {
        setError(""); // Clear any existing errors
        // Có thể hiển thị thông báo thành công
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      setError(err.message || "Gửi lại OTP thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="offcanvas offcanvas-end popup-style-1 popup-otp"
      id="otpVerification"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header popup-header">
          <span className="title">Xác thực OTP</span>
          <button
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            onClick={onCancel}
          />
        </div>
        <div className="canvas-body popup-inner">
          {success ? (
            <div>
              <div className="alert alert-success" role="alert">
                <i className="icon icon-check-circle me-2"></i>
                Xác thực OTP thành công!
              </div>
              
              <p className="text text-sm text-main-2 mt-3">
                Tài khoản của bạn đã được xác thực thành công. Đang chuyển về trang chủ...
              </p>
              
              <div className="text-center mt-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang chuyển hướng...</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-login">
              <div className="">
                <p className="text text-sm text-main-2">
                  Chúng tôi đã gửi mã OTP đến email <strong>{email}</strong>. 
                  Vui lòng kiểm tra hộp thư đến và nhập mã OTP để xác thực tài khoản.
                </p>
                
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                  </div>
                )}
                
                <fieldset className="text mb_12">
                  <input 
                    type="text" 
                    value={otp}
                    onChange={handleChange}
                    placeholder="Nhập mã OTP" 
                    required
                    disabled={loading}
                    maxLength={6}
                  />
                </fieldset>
              </div>
              <div className="bot">
                <div className="button-wrap">
                  <button
                    className="subscribe-button tf-btn animate-btn bg-dark-2 w-100"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Đang xác thực..." : "Xác thực OTP"}
                  </button>
                  <button
                    type="button"
                    className="tf-btn btn-out-line-dark2 w-100"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    Gửi lại OTP
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
