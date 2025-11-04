"use client";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import React from "react";
import { authService } from "@/utlis/auth";
const accountLinks = [
  { href: "/account-page", label: "Dashboard" },
  { href: "/account-orders", label: "My Orders" },
  { href: "/wish-list", label: "My Wishlist" },
  { href: "/account-addresses", label: "Addresses" },
];
export default function DbSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("userLoggedOut"));
    }
  };
  return (
    <div
      className="offcanvas offcanvas-start canvas-filter canvas-sidebar canvas-sidebar-account"
      id="mbAccount"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header">
          <span className="title">SIDEBAR ACCOUNT</span>
          <button
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body">
          <div className="sidebar-account-wrap sidebar-mobile-append">
            <ul className="my-account-nav">
              {accountLinks.map((elm, i) => (
                <li key={i}>
                  <Link
                    to={elm.href}
                    className={`text-sm link fw-medium my-account-nav-item  ${
                      pathname == elm.href ? "active" : ""
                    }`}
                  >
                    {elm.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm link fw-medium my-account-nav-item btn btn-link p-0"
                  data-bs-dismiss="offcanvas"
                >
                  Log Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

