import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { userService } from "@/services";

export default function AccountChangePassword() {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const navigate = useNavigate();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!form.old_password || !form.new_password) {
      setError("Vui lòng nhập đầy đủ mật khẩu cũ và mới.");
      return;
    }
    if (form.new_password.length < 6) {
      setError("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setSaving(true);
    try {
      const res = await userService.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      });
      if (res?.updated) {
        setOk("Đổi mật khẩu thành công.");
        setForm({ old_password: "", new_password: "", confirm_password: "" });
        setTimeout(() => navigate(-1), 1200); // ✅ tự quay lại
      } else {
        setOk("Yêu cầu đã được xử lý.");
      }
    } catch (e: any) {
      setError(e?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flat-spacing-13">
      <div className="container-7">
        {/* Sidebar trigger (mobile) */}
        <div className="btn-sidebar-mb d-lg-none">
          <button data-bs-toggle="offcanvas" data-bs-target="#mbAccount" aria-controls="mbAccount">
            <i className="icon icon-sidebar" />
          </button>
        </div>

        {/* Layout: sidebar trái, content phải */}
        <div className="main-content-account d-lg-flex gap-4">
          {/* Sidebar desktop */}
          <div
            className="sidebar-account-wrap sidebar-content-wrap sticky-top d-lg-block d-none"
            style={{ top: 24, minWidth: 260 }}
          >
            <ul className="my-account-nav">
              <Sidebar />
            </ul>
          </div>

          {/* Content */}
          <div className="account-content flex-grow-1">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="mb-0">Đổi mật khẩu</h3>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate(-1)}
              >
                ← Quay lại
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {ok && <div className="alert alert-success">{ok}</div>}

            <form onSubmit={onSubmit} className="card p-3" style={{ maxWidth: 560 }}>
              <div className="mb-3">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  className="form-control"
                  name="old_password"
                  value={form.old_password}
                  onChange={onChange}
                  autoComplete="current-password"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mật khẩu mới</label>
                <input
                  type="password"
                  className="form-control"
                  name="new_password"
                  value={form.new_password}
                  onChange={onChange}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="form-control"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={onChange}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </form>
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
            <h5 className="offcanvas-title" id="mbAccountLabel">Tài khoản</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
          </div>
          <div className="offcanvas-body">
            <ul className="my-account-nav">
              <Sidebar />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
