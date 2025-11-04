import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services";
import Sidebar from "./Sidebar";

export default function AccountProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const navigate = useNavigate(); // ✅ điều hướng

  // ---- Load profile ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const me = await userService.getProfile();
        setForm({
          first_name: me.first_name ?? "",
          last_name: me.last_name ?? "",
          phone: me.phone ?? "",
        });
      } catch (e: any) {
        setError(e?.message || "Không thể tải hồ sơ.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Sửa dữ liệu form ----
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  // ---- Submit cập nhật ----
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk("");
    try {
      await userService.updateProfile({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
      });
      setOk("Cập nhật thành công.");
      // ✅ tự quay lại sau 1.5s
      setTimeout(() => navigate(-1), 1500);
    } catch (e: any) {
      setError(e?.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Render ----
  return (
    <div className="flat-spacing-13">
      <div className="container-7">
        {/* Nút mở sidebar (mobile) */}
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

          {/* ----- CONTENT ----- */}
          <div className="account-content flex-grow-1">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="mb-0">Cập nhật thông tin</h3>
              {/* ✅ Nút quay lại */}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate(-1)}
              >
                ← Quay lại
              </button>
            </div>

            {loading && <div className="card p-3">Đang tải hồ sơ...</div>}

            {!loading && error && <div className="alert alert-danger">{error}</div>}

            {!loading && !error && (
              <>
                {ok && <div className="alert alert-success">{ok}</div>}
                <form onSubmit={onSubmit} className="card p-3" style={{ maxWidth: 560 }}>
                  <div className="mb-3">
                    <label className="form-label">Họ</label>
                    <input
                      className="form-control"
                      name="first_name"
                      value={form.first_name}
                      onChange={onChange}
                      placeholder="Nguyễn"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tên</label>
                    <input
                      className="form-control"
                      name="last_name"
                      value={form.last_name}
                      onChange={onChange}
                      placeholder="Văn A"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-control"
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      placeholder="0123456789"
                    />
                  </div>

                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Offcanvas sidebar (mobile) */}
        <div className="offcanvas offcanvas-start" tabIndex={-1} id="mbAccount" aria-labelledby="mbAccountLabel">
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
