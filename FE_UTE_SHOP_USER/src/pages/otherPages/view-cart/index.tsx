import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import RelatedProducts from "@/components/otherPages/RelatedProducts";
import ShopCart from "@/components/otherPages/ShopCart";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import MetaComponent from "@/components/common/MetaComponent";
import Breadcumb from "@/components/common/Breadcumb";
import { Link } from "react-router-dom";

import { cartService } from "@/services/cart/cartitem.service";
import type { CartListResult } from "@/types/cart/cartItem.types";

const metadata = {
  title: "View Cart || Vineta - Multipurpose Reactjs eCommerce Template",
  description: "Vineta - Multipurpose Reactjs eCommerce Template",
};

export default function ViewCartPage() {
  const [cart, setCart] = useState<CartListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalc, setRecalc] = useState(false); // << chạy total trong lúc update
  const [err, setErr] = useState<string>("");

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCart(data);
      setErr("");
    } catch (e: any) {
      setErr(e?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Cho ShopCart gọi khi có hành động làm thay đổi giỏ
  const reloadCart = useCallback(async () => {
    setRecalc(true);        // bắt đầu “đang chạy”
    await fetchCart();      // refetch lại dữ liệu giỏ
    setRecalc(false);       // tắt “đang chạy”
  }, [fetchCart]);

  const currency = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // Tính toán subtotal/total an toàn (BE trả kiểu gì cũng chịu được)
  const { itemCount, subtotal, total } = useMemo(() => {
    const items: any[] =
      (cart as any)?.items ??
      (cart as any)?.data?.items ??
      (cart as any)?.data ??
      [];
    const cnt = Array.isArray(items)
      ? items.reduce((n, it) => n + (Number(it.quantity) || 0), 0)
      : 0;

    // Nếu BE có total/subtotal thì ưu tiên dùng:
    const beSubtotal =
      Number((cart as any)?.subtotal ?? (cart as any)?.data?.subtotal);
    const beTotal =
      Number((cart as any)?.total ?? (cart as any)?.data?.total);

    const computedSubtotal = Array.isArray(items)
      ? items.reduce((s, it) => {
          const price =
            Number(it.sale_price ?? it.price ?? it.unit_price ?? 0) || 0;
          const qty = Number(it.quantity) || 0;
          return s + price * qty;
        }, 0)
      : 0;

    return {
      itemCount: cnt,
      subtotal: Number.isFinite(beSubtotal) ? beSubtotal : computedSubtotal,
      total: Number.isFinite(beTotal) ? beTotal : (Number.isFinite(beSubtotal) ? beSubtotal : computedSubtotal),
    };
  }, [cart]);

  const canCheckout = !loading && !err && itemCount > 0 && !recalc;

  return (
    <>
      <MetaComponent meta={metadata} />
      <Header1 />

      <Breadcumb pageName="Cart" pageTitle="Shopping Cart" />

      <div className="flat-spacing-24">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-7 col-md-9">
              <div className="tf-cart-head text-center">
                <p className="text-xl-3 title text-dark-4">
                  Spend <span className="fw-medium">$100</span> more to get
                  <span className="fw-medium"> Free Shipping</span>
                </p>
                <div className="progress-sold tf-progress-ship">
                  <div className="value" style={{ width: "60%" }} data-progress={60}>
                    <i className="icon icon-car" />
                  </div>
                </div>
                {err && <p className="mt-2 text-danger">{err}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flat-spacing-20">
        <div className="container">
          <div className="row">
            {/* LEFT: cart detail */}
            <div className="col-lg-8 mb-4 mb-lg-0">
              {/* ✅ Truyền callback để ShopCart gọi khi thay đổi số lượng/xoá/clear */}
              <ShopCart onChanged={reloadCart} loading={loading} cartData={cart} />
              {/* <RelatedProducts /> */}
            </div>

            {/* RIGHT: Summary */}
            <div className="col-lg-4">
              <aside className="position-sticky" style={{ top: 96 }}>
                <div className="card shadow-sm border-0">
                  <div className="card-body p-4">
                    <h5 className="mb-3">Order Summary</h5>

                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Items</span>
                      <span className="fw-medium">
                        {loading ? "…" : itemCount}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Subtotal</span>
                      <span className="fw-medium">
                        {loading ? "…" : currency(subtotal)}
                      </span>
                    </div>

                    <hr className="my-3" />

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fs-6">Total</span>

                      {/* 👇 Hiệu ứng “đang chạy” khi đang recalc hoặc loading */}
                      {loading || recalc ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <div className="spinner-border spinner-border-sm" role="status" />
                          <span className="text-muted">Đang tính…</span>
                        </span>
                      ) : (
                        <span className="fs-5 fw-semibold">{currency(total)}</span>
                      )}
                    </div>

                    <Link
                      to={canCheckout ? "/checkout" : "#"}
                      className={`btn btn-dark w-100 ${!canCheckout ? "disabled" : ""}`}
                      aria-disabled={!canCheckout}
                      onClick={(e) => {
                        if (!canCheckout) e.preventDefault();
                      }}
                    >
                      {loading
                        ? "Loading..."
                        : recalc
                        ? "Updating..."
                        : itemCount > 0
                        ? "Proceed to Checkout"
                        : "Cart is empty"}
                    </Link>

                    <p className="text-muted small mb-0 mt-2">
                      Taxes and shipping calculated at checkout.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <Footer1 />
    </>
  );
}
