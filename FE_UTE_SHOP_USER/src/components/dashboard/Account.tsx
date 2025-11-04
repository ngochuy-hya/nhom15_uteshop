import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import CountdownTimer from "../common/Countdown";
import { userService } from "@/services/user/user.service";
import type { User } from "@/types/user/user.types";

export default function Account() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await userService.getProfile(); // trả về User (đã unwrap)
      setProfile(data);
    } catch (e: any) {
      console.error(e);
      // Nếu 401 -> điều hướng tới login (offcanvas hay trang)
      if (e?.response?.status === 401) {
        setError("Bạn chưa đăng nhập.");
        // Nếu bạn dùng offcanvas login: mở #login
        // document.querySelector<HTMLButtonElement>('[data-bs-target="#login"]')?.click();
        // Hoặc điều hướng trang:
        // navigate("/login");
      } else {
        setError(e?.response?.data?.message || "Không thể tải thông tin tài khoản.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fullName = profile
    ? (profile.first_name || "") + (profile.last_name ? ` ${profile.last_name}` : "")
    : "";

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      // Hiển thị DD/MM/YYYY
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="flat-spacing-13">
      <div className="container-7">
        {/* sidebar-account (mobile trigger) */}
        <div className="btn-sidebar-mb d-lg-none">
          <button data-bs-toggle="offcanvas" data-bs-target="#mbAccount" aria-controls="mbAccount">
            <i className="icon icon-sidebar" />
          </button>
        </div>

        {/* Main layout */}
        <div className="main-content-account d-lg-flex gap-4">
          {/* Sidebar (desktop) */}
          <div className="sidebar-account-wrap sidebar-content-wrap sticky-top d-lg-block d-none" style={{ top: 24, minWidth: 260 }}>
            <ul className="my-account-nav">
              <Sidebar />
            </ul>
          </div>

          {/* Content */}
          <div className="account-content flex-grow-1">
            {/* Header */}
            <div className="account-head d-flex align-items-center justify-content-between mb-3">
              <div>
                <h3 className="mb-1">Tài khoản của tôi</h3>
                {!loading && profile && (
                  <p className="text-muted mb-0">
                    Xin chào, <strong>{fullName || profile.email.split("@")[0]}</strong>!
                  </p>
                )}
              </div>
              {/* Ví dụ: countdown cho một event (có thể bỏ nếu không dùng) */}
              <div className="d-none d-md-block">
                <CountdownTimer targetDate={new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()} />
              </div>
            </div>

            {/* Loading / Error */}
            {loading && (
              <div className="card p-3">
                <div className="placeholder-glow">
                  <span className="placeholder col-4"></span>
                  <span className="placeholder col-6"></span>
                  <span className="placeholder col-8"></span>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
                <span>{error}</span>
                <button className="btn btn-sm btn-outline-light" onClick={fetchProfile}>
                  Thử lại
                </button>
              </div>
            )}

            {/* Summary */}
            {!loading && !error && profile && (
              <>
                <div className="card p-3 mb-3">
                  <h5 className="mb-3">Thông tin cá nhân</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="small text-muted">Họ và tên</div>
                      <div className="fw-medium">
                        {fullName || "(Chưa cập nhật)"}{" "}
                        <Link to="/account/profile" className="ms-2 small">
                          Chỉnh sửa
                        </Link>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Email</div>
                      <div className="fw-medium">{profile.email}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Số điện thoại</div>
                      <div className="fw-medium">{profile.phone || "(Chưa cập nhật)"}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Ngày sinh</div>
                      <div className="fw-medium">{fmtDate(profile.date_of_birth) || "(Chưa cập nhật)"}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Giới tính</div>
                      <div className="fw-medium">
                        {profile.gender === "male"
                          ? "Nam"
                          : profile.gender === "female"
                          ? "Nữ"
                          : profile.gender === "other"
                          ? "Khác"
                          : "(Chưa cập nhật)"}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="small text-muted">Trạng thái email</div>
                      <div className="fw-medium">{profile.email_verified ? "Đã xác minh" : "Chưa xác minh"}</div>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="card p-3 h-100">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="small text-muted">Đơn hàng</div>
                          <div className="fw-semibold">Quản lý đơn hàng</div>
                        </div>
                        <i className="icon icon-bag" />
                      </div>
                      <div className="mt-3">
                        <Link to="/account-orders" className="btn btn-sm btn-primary">
                          Xem đơn hàng
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="card p-3 h-100">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="small text-muted">Hồ sơ</div>
                          <div className="fw-semibold">Cập nhật thông tin</div>
                        </div>
                        <i className="icon icon-user" />
                      </div>
                      <div className="mt-3">
                        <Link to="/account/profile" className="btn btn-sm btn-outline-primary">
                          Chỉnh sửa hồ sơ
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="card p-3 h-100">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="small text-muted">Mật khẩu</div>
                          <div className="fw-semibold">Đổi mật khẩu</div>
                        </div>
                        <i className="icon icon-lock" />
                      </div>
                      <div className="mt-3">
                        <Link to="/account/settings" className="btn btn-sm btn-outline-secondary">
                          Đi tới cài đặt
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Offcanvas sidebar (mobile) */}
        <div
          className="offcanvas offcanvas-start"
          tabIndex={-1}
          id="mbAccount"
          aria-labelledby="mbAccountLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="mbAccountLabel">
              Tài khoản
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
          </div>
          <div className="offcanvas-body">
            <ul className="my-account-nav">
              <Sidebar />
            </ul>
          </div>
        </div>
      </div>

      {/* small styles helper (tuỳ CSS framework hiện có) */}
      <style>{`
        .account-content .card { border-radius: 10px; }
        .placeholder { display:inline-block; background:#e9ecef; height: 1rem; border-radius: 4px; }
        .placeholder-glow .placeholder { animation: glow 1.2s ease-in-out infinite; }
        @keyframes glow { 0% { opacity: .4 } 50% { opacity: 1 } 100% { opacity: .4 } }
      `}</style>
    </div>
  );
}
