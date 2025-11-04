"use client";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userManager, authService } from "@/utlis/auth";
import { formatImageUrl } from "@/utlis/image.utils";

export default function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* --------- load user + lắng nghe cập nhật --------- */
  useEffect(() => {
    const syncUser = () => setUser(userManager.getUser());
    syncUser();
    window.addEventListener("storage", syncUser);          // cross-tab
    window.addEventListener("userLoggedIn", syncUser);     // custom event của bạn
    window.addEventListener("userLoggedOut", syncUser);    // nếu có bắn event này
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("userLoggedIn", syncUser);
      window.removeEventListener("userLoggedOut", syncUser);
    };
  }, []);

  /* --------- đóng dropdown khi click ngoài / nhấn Esc --------- */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Force logout nếu API fail
    } finally {
      userManager.removeUser?.();
      setUser(null);
      setIsOpen(false);
      navigate("/");
      // Không bắt buộc reload; UI đã re-render bởi state + storage event
      // window.location.reload();
      window.dispatchEvent(new Event("userLoggedOut"));
    }
  };

  /* =================== UI =================== */

  // ⛳️ CHƯA ĐĂNG NHẬP: luôn hiện icon mở offcanvas #login (logo/biểu tượng sẽ LUÔN thấy)
  if (!user) {
    return (
      <a
        href="#login"
        data-bs-toggle="offcanvas"
        aria-controls="login"
        className="nav-icon-item"
        aria-label="Open login panel"
      >
        <i className="icon icon-user" />
      </a>
    );
  }

  // ĐÃ ĐĂNG NHẬP
  const userName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.email?.split("@")[0] || "User";

  const userAvatar = formatImageUrl(user.avatar);
  const userInitials =
    (user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user.email?.[0] || "U"
    ).toUpperCase();

  return (
    <div className="account-dropdown position-relative" ref={dropdownRef}>
      <button
        className="nav-icon-item account-trigger"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Giữ icon-user để “logo” vẫn luôn thấy, kèm avatar nếu có */}
        <i className="icon icon-user me-1 text-dark" />
      </button>

      {isOpen && (
        <div className="account-dropdown-menu" role="menu">
          <div className="account-dropdown-header">
            <div className="account-info">
              {user.avatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="account-avatar-large"
                  width={48}
                  height={48}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="account-avatar-initials-large"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  {userInitials}
                </div>
              )}
              <div className="account-details">
                <div className="account-name-text fw-medium">{userName}</div>
                <div className="account-email text-sm text-main-4">{user.email}</div>
              </div>
            </div>
          </div>

          <div className="account-dropdown-body">
            <Link to="/account-page" className="account-menu-item" onClick={() => setIsOpen(false)}>
              <i className="icon icon-user" />
              <span>My Account</span>
            </Link>
            <Link to="/wish-list" className="account-menu-item" onClick={() => setIsOpen(false)}>
              <i className="icon icon-heart" />
              <span>Wishlist</span>
            </Link>
            <div className="account-menu-divider" />
            <button className="account-menu-item logout-btn" onClick={handleLogout}>
              <i className="icon icon-logout" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .account-dropdown { position: relative; }
        .account-trigger {
          display:flex; align-items:center; background:none; border:none; cursor:pointer;
          padding:8px 12px; border-radius:4px; transition:background-color .2s;
        }
        .account-trigger:hover { background-color: rgba(0,0,0,.05); }
        .account-name { font-size:14px; color:#333; }
        .account-dropdown-menu {
          position:absolute; top:100%; right:0; margin-top:8px; min-width:280px; background:#fff;
          border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,.1); z-index:1000; overflow:hidden;
          animation:slideDown .3s ease;
        }
        @keyframes slideDown { from{opacity:0; transform:translateY(-10px)} to{opacity:1; transform:translateY(0)} }
        .account-dropdown-header { padding:16px; background:#FFCC99; color:#fff; }
        .account-info { display:flex; align-items:center; gap:12px; }
        .account-details { flex:1; }
        .account-name-text { color:#fff; font-size:16px; margin-bottom:4px; }
        .account-email { color:rgba(255,255,255,.8); font-size:13px; }
        .account-dropdown-body { padding:8px 0; }
        .account-menu-item {
          display:flex; align-items:center; gap:12px; padding:12px 16px; color:#333; text-decoration:none;
          transition:background-color .2s; border:none; background:none; width:100%; text-align:left; cursor:pointer; font-size:14px;
        }
        .account-menu-item:hover { background-color:#f8f9fa; }
        .account-menu-item i { width:20px; text-align:center; color:#666; }
        .account-menu-item.logout-btn { color:#dc3545; }
        .account-menu-item.logout-btn:hover { background-color:#fee; }
        .account-menu-item.logout-btn i { color:#dc3545; }
        .account-menu-divider { height:1px; background-color:#e9ecef; margin:8px 0; }
      `}</style>
    </div>
  );
}
