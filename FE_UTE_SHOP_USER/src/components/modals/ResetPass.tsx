import React, { useState, ChangeEvent, FormEvent } from "react";
import { authService } from "@/utlis/auth";

export default function ResetPass() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Gọi API quên mật khẩu từ auth service
      const response = await authService.forgotPassword(email);

      if (response.success) {
        setSuccess(true);
        setSuccessMessage(response.message || "Email reset mật khẩu đã được gửi!");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.message || "Gửi email reset mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="offcanvas offcanvas-end popup-style-1 popup-reset-pass"
      id="resetPass"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header popup-header">
          <span className="title">Quên mật khẩu</span>
          <button
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body popup-inner">
          {success ? (
            <div>
              <div className="alert alert-success" role="alert">
                <i className="icon icon-check-circle me-2"></i>
                {successMessage}
              </div>
              
              <p className="text text-sm text-main-2 mt-3">
                Chúng tôi đã gửi email reset mật khẩu đến <strong>{email}</strong>. 
                Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn trong email.
              </p>
              
              <div className="button-wrap mt-4">
                <button
                  type="button"
                  className="tf-btn animate-btn bg-dark-2 w-100"
                  onClick={async () => {
                    setLoading(true);
                    setError("");
                    try {
                      const response = await authService.forgotPassword(email);
                      if (response.success) {
                        setSuccessMessage(response.message || "Email đã được gửi lại!");
                      }
                    } catch (err: any) {
                      setError(err.message || "Gửi lại email thất bại");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? "Đang gửi..." : "Gửi lại email"}
                </button>
                <button
                  type="button"
                  data-bs-dismiss="offcanvas"
                  className="tf-btn btn-out-line-dark2 w-100"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-login">
              <div className="">
                <p className="text text-sm text-main-2">
                  Quên mật khẩu? Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi link reset mật khẩu.
                </p>
                
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                  </div>
                )}
                
                <fieldset className="email mb_12">
                  <input 
                    type="email" 
                    value={email}
                    onChange={handleChange}
                    placeholder="Nhập email của bạn*" 
                    required
                    disabled={loading}
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
                    {loading ? "Đang gửi..." : "Gửi link reset mật khẩu"}
                  </button>
                  <button
                    type="button"
                    data-bs-target="#login"
                    data-bs-toggle="offcanvas"
                    className="tf-btn btn-out-line-dark2 w-100"
                    disabled={loading}
                  >
                    Quay lại đăng nhập
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

