import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/utlis/auth";
import OTPVerification from "./OTPVerification";
// @ts-ignore
import * as bootstrap from 'bootstrap';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Kiểm tra đã đăng nhập chưa
  useEffect(() => {
    if (authService.isAuthenticated()) {
      // Đã đăng nhập rồi, đóng modal
      const closeButton = document.querySelector('#register [data-bs-dismiss="offcanvas"]');
      if (closeButton) (closeButton as HTMLButtonElement).click();
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name) return "Vui lòng nhập họ tên";
    if (!formData.email) return "Vui lòng nhập email";
    if (!formData.password) return "Vui lòng nhập mật khẩu";
    if (formData.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    if (formData.password !== formData.confirmPassword) return "Mật khẩu xác nhận không khớp";
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    const errorMsg = validateForm();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // Tách họ và tên
      const nameParts = formData.name.split(' ');
      const lastName = nameParts.pop() || ''; // Phần tên
      const firstName = nameParts.join(' ') || ''; // Phần họ

      console.log("Submitting register form with data:", {
        ...formData,
        first_name: firstName,
        last_name: lastName
      });

      // Gọi API đăng ký từ auth service với định dạng phù hợp
      const response = await authService.register({
        ...formData,
        first_name: firstName,
        last_name: lastName
      });

      console.log("Register response:", response);

      if (response.success) {
        // Hiển thị form OTP để xác thực
        setRegisteredEmail(formData.email);
        setShowOTP(true);
        
        // Đóng modal register
        const closeButton = document.querySelector('#register [data-bs-dismiss="offcanvas"]');
        if (closeButton) (closeButton as HTMLButtonElement).click();
        
        // Mở modal OTP
        setTimeout(() => {
          const otpModal = document.getElementById('otpVerification');
          if (otpModal) {
            const bsOffcanvas = new bootstrap.Offcanvas(otpModal);
            bsOffcanvas.show();
          }
        }, 500);
      }
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi xác thực OTP thành công
  const handleOTPVerified = () => {
    // Đóng modal OTP và chuyển về trang chủ
    setTimeout(() => {
      navigate('/');
      window.location.reload();
    }, 1000);
  };

  // Xử lý khi hủy xác thực OTP
  const handleOTPCancel = () => {
    setShowOTP(false);
  };

  return (
    <>
    <div
      className="offcanvas offcanvas-end popup-style-1 popup-register"
      id="register"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header popup-header">
          <span className="title">Tạo tài khoản</span>
          <button
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body popup-inner">
          <form onSubmit={handleSubmit} className="form-login">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError("")}></button>
              </div>
            )}
            
            <div className="">
              <fieldset className="text mb_12">
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Họ và tên*" 
                  required
                  disabled={loading}
                />
              </fieldset>
              <fieldset className="email mb_12">
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email*" 
                  required
                  disabled={loading}
                />
              </fieldset>
              <fieldset className="text mb_12">
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Số điện thoại" 
                  disabled={loading}
                />
              </fieldset>
              <fieldset className="password mb_12">
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mật khẩu*" 
                  required
                  disabled={loading}
                />
              </fieldset>
              <fieldset className="password">
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu*" 
                  required
                  disabled={loading}
                />
              </fieldset>
            </div>
            <div className="bot">
              <p className="text text-sm text-main-2">
                Đăng ký để nhận thông tin khuyến mãi, sản phẩm mới và các ưu đãi đặc biệt.
              </p>
              <div className="button-wrap">
                <button
                  className="subscribe-button tf-btn animate-btn bg-dark-2 w-100"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
                <button
                  type="button"
                  data-bs-target="#login"
                  data-bs-toggle="offcanvas"
                  className="tf-btn btn-out-line-dark2 w-100"
                  disabled={loading}
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    {/* OTP Verification Modal */}
    {showOTP && (
      <OTPVerification 
        email={registeredEmail} 
        onVerified={handleOTPVerified}
        onCancel={handleOTPCancel}
      />
    )}
    </>
  );
}