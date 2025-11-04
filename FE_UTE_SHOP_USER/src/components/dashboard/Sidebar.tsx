"use client";

import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { authService } from "@/utlis/auth";
const accountLinks = [
  { href: "/account-page", label: "Dashboard" },
  { href: "/account-orders", label: "My Orders" },
  { href: "/wish-list", label: "My Wishlist" },
  { href: "/account-addresses", label: "Addresses" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      navigate("/");
      if (typeof window !== "undefined") window.dispatchEvent(new Event("userLoggedOut"));
    }
  };
  return (
    <>
      {accountLinks.map(({ href, label }) => (
        <li key={href}>
          <Link
            to={href}
            className={`text-sm link fw-medium my-account-nav-item ${
              pathname == href ? "active" : ""
            }`}
          >
            {label}
          </Link>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm link fw-medium my-account-nav-item btn btn-link p-0"
          style={{ textAlign: "left" }}
        >
          Log Out
        </button>
      </li>
    </>
  );
}

