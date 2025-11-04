"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Coupon } from "@/types/coupon/coupon.types";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useContextElement } from "@/context/Context";
import { couponService } from "@/services/coupon/coupon.service";
import { orderService } from "@/services/order/order.service";
import type { CreateOrderRequest } from "@/types/order/order.type";
import QRCode from "react-qr-code";
import { payosService } from "@/services/payment/payos.service";

/* ===== Utils ===== */
const formatVND = (v: number) =>
  (v || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function Checkout() {
  const navigate = useNavigate();
  const { cartProducts } = useContextElement();

  /* ====== Form states (đơn giản: ghép thành 1 chuỗi address) ====== */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [country, setCountry]     = useState("");
  const [address, setAddress]     = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity]           = useState("");
  const [state, setState]         = useState("");
  const [zipcode, setZipcode]     = useState("");
  const [phone, setPhone]         = useState("");
  const [contact, setContact]     = useState(""); // email/phone trong block Contact
  const [notes, setNotes]         = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrPayload, setQrPayload] = useState<string | null>(null); // có thể là chuỗi EMVCo hoặc URL ảnh
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  /* ====== Coupon ====== */
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0); // số tiền giảm (VND)
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [errorCoupons, setErrorCoupons] = useState<string | null>(null);

  /* ====== Loading submit ====== */
  const [placing, setPlacing] = useState(false);

  /* ====== Tính tiền ====== */
  const subtotal = useMemo(() => {
    if (!Array.isArray(cartProducts)) return 0;
    return cartProducts.reduce((acc: number, p: any) => {
      const price = Number(p.price) || 0;
      const qty = Number(p.quantity) || 0;
      return acc + price * qty;
    }, 0);
  }, [cartProducts]);

  const shipping = useMemo(() => (subtotal >= 1_000_000 ? 0 : 50_000), [subtotal]);
  const tax = useMemo(() => Math.round(subtotal * 0.1), [subtotal]); // 10%
  const total = useMemo(
    () => Math.max(0, subtotal + shipping + tax - couponDiscount),
    [subtotal, shipping, tax, couponDiscount]
  );

  /* ====== Helpers ====== */
  const buildAddress = () => {
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const line1 = [address, apartment].filter(Boolean).join(", ");
    const line2 = [city, state, zipcode].filter(Boolean).join(", ");
    const line3 = [country].filter(Boolean).join(", ");
    const contactLine = [phone, contact].filter(Boolean).join(" / ");
    return [fullName, line1, line2, line3, contactLine].filter(Boolean).join(" | ");
  };
  useEffect(() => {
  let mounted = true;
  const loadCoupons = async () => {
    try {
      setLoadingCoupons(true);
      setErrorCoupons(null);
      const list = await couponService.getAvailableCoupons();
      if (!mounted) return;
      setCoupons(Array.isArray(list) ? list : []);
    } catch (e: any) {
      if (!mounted) return;
      setErrorCoupons(e?.response?.data?.message || "Không tải được danh sách coupon");
    } finally {
      if (mounted) setLoadingCoupons(false);
    }
  };
  if (subtotal > 0) loadCoupons(); // có thể bỏ điều kiện nếu muốn luôn hiển thị
  return () => {
    mounted = false;
  };
}, [subtotal]);
/* ====== Re-validate coupon khi subtotal thay đổi ====== */
useEffect(() => {
  const revalidate = async () => {
    if (!couponApplied) return;
    try {
      const res = await couponService.validateCoupon({ code: couponApplied, subtotal });
      setCouponDiscount(Number(res.discount_amount) || 0);
    } catch {
      // Không còn hợp lệ => bỏ coupon
      setCouponDiscount(0);
      setCouponApplied(null);
      setCouponCode("");
    }
  };
  revalidate();
}, [subtotal, couponApplied]);


  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.warning("Vui lòng nhập mã coupon");
      return;
    }
    if (subtotal <= 0) {
      toast.warning("Giỏ hàng đang trống");
      return;
    }
    try {
      setApplying(true);
      const res = await couponService.validateCoupon({
        code: couponCode.trim(),
        subtotal,
      });
      setCouponDiscount(Number(res.discount_amount) || 0);
      setCouponApplied(res.coupon.code);
      toast.success(`Áp dụng mã ${res.coupon.code} thành công!`);
    } catch (err: any) {
      setCouponDiscount(0);
      setCouponApplied(null);
      toast.error(err?.response?.data?.message || "Mã giảm giá không hợp lệ");
    } finally {
      setApplying(false);
    }
  };
  /* ====== Apply coupon từ danh sách ====== */
const applyFromList = async (code: string) => {
  try {
    setApplying(true);
    const res = await couponService.validateCoupon({ code, subtotal });
    setCouponDiscount(Number(res.discount_amount) || 0);
    setCouponApplied(res.coupon.code);
    setCouponCode(res.coupon.code);
    toast.success(`Áp dụng mã ${res.coupon.code} thành công!`);
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Mã giảm giá không hợp lệ");
  } finally {
    setApplying(false);
  }
};

/* ====== Bỏ coupon ====== */
const removeCoupon = () => {
  setCouponApplied(null);
  setCouponCode("");
  setCouponDiscount(0);
};


  const handlePlaceOrder: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
      toast.warning("Giỏ hàng trống");
      return;
    }
    if (!firstName || !lastName || !address || !city || !country) {
      toast.warning("Vui lòng nhập đầy đủ thông tin địa chỉ bắt buộc");
      return;
    }

    const shippingAddress = buildAddress();
    const billingAddress = shippingAddress; // dùng chung cho nhanh

    const items: CreateOrderRequest["items"] = cartProducts.map((p: any) => ({
      product_id: Number(p.productId ?? p.product_id ?? p.id),
      quantity: Number(p.quantity) || 1,
      selected_color: p.color ?? p.selected_color ?? null,
      selected_size: p.size ?? p.selected_size ?? null,
    }));

    const payload: CreateOrderRequest = {
      items,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      payment_method: "payos",
      notes,
      coupon_code: couponApplied || couponCode || undefined,
    };

    try {
      setPlacing(true);
      const result = await orderService.createOrder(payload);
      toast.success(`Đặt hàng thành công! Mã đơn: ${result.order_number}`);
      const pay = await payosService.createPayment({
      order_id: result.id,
      description: `Thanh toán đơn hàng #${result.order_number}`,
    });

    // BE trả qr_code_url là chuỗi EMVCo → generate QR, nếu sau này BE trả link ảnh http(s) thì vẫn hiển thị được
    setPaymentUrl(pay.payment_url);
    setQrPayload(pay.qr_code_url);
    setShowQR(true);
    // if (pay?.payment_url) {
    //   setTimeout(() => {
    //     window.open(pay.payment_url, "_blank", "noopener");
    //   }, 200);
    // }
    //   navigate(`/orders/${result.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="flat-spacing-25">
      <div className="container">
        <div className="row">
          {/* LEFT SIDE: FORM */}
          <div className="col-xl-8">
            <form className="tf-checkout-cart-main" onSubmit={handlePlaceOrder}>
              <div className="box-ip-checkout">
                <div className="title text-xl fw-medium">Checkout</div>

                <div className="grid-2 mb_16">
                  <div className="tf-field style-2 style-3">
                    <input
                      className="tf-field-input tf-input"
                      id="firstname"
                      placeholder=" "
                      type="text"
                      name="firstname"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <label className="tf-field-label" htmlFor="firstname">
                      First name
                    </label>
                  </div>

                  <div className="tf-field style-2 style-3">
                    <input
                      className="tf-field-input tf-input"
                      id="lastname"
                      placeholder=" "
                      type="text"
                      name="lastname"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    <label className="tf-field-label" htmlFor="lastname">
                      Last name
                    </label>
                  </div>
                </div>

                <fieldset className="tf-field style-2 style-3 mb_16">
                  <input
                    className="tf-field-input tf-input"
                    id="country"
                    type="text"
                    name="country"
                    placeholder=""
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                  <label className="tf-field-label" htmlFor="country">
                    Country
                  </label>
                </fieldset>

                <fieldset className="tf-field style-2 style-3 mb_16">
                  <input
                    className="tf-field-input tf-input"
                    id="address"
                    type="text"
                    name="address"
                    placeholder=""
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <label className="tf-field-label" htmlFor="address">
                    Address
                  </label>
                </fieldset>

                <fieldset className="mb_16">
                  <input
                    type="text"
                    className="style-2"
                    name="apartment"
                    placeholder="Apartment, suite, etc (optional)"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                  />
                </fieldset>

                <div className="grid-3 mb_16">
                  <fieldset className="tf-field style-2 style-3">
                    <input
                      className="tf-field-input tf-input"
                      id="city"
                      type="text"
                      name="city"
                      placeholder=""
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                    <label className="tf-field-label" htmlFor="city">
                      City
                    </label>
                  </fieldset>

                  <div className="tf-select select-square">
                    <select
                      name="State"
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="">State</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP.HCM">TP.HCM</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <fieldset className="tf-field style-2 style-3">
                    <input
                      className="tf-field-input tf-input"
                      id="code"
                      type="text"
                      name="zipcode"
                      placeholder=""
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                    />
                    <label className="tf-field-label" htmlFor="code">
                      Zipcode/Postal
                    </label>
                  </fieldset>
                </div>

                <fieldset className="tf-field style-2 style-3 mb_16">
                  <input
                    className="tf-field-input tf-input"
                    id="phone"
                    type="text"
                    name="phone"
                    placeholder=""
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <label className="tf-field-label" htmlFor="phone">
                    Phone
                  </label>
                </fieldset>
              </div>

              <div className="box-ip-contact">
                <div className="title">
                  <div className="text-xl fw-medium">Contact Information</div>
                  {/* Ẩn nút login để đơn giản flow */}
                </div>
                <input
                  className="style-2"
                  id="email_or_phone"
                  placeholder="Email or phone number"
                  type="text"
                  name="email_or_phone"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              {/* Shipping Method (hiển thị cho biết, logic tính ship nằm ở phía FE/BE) */}
              <div className="box-ip-shipping">
                <div className="title text-xl fw-medium">Shipping Method</div>

                <fieldset className="mb_16">
                  <label className="check-ship">
                    <input
                      type="radio"
                      className="tf-check-rounded"
                      name="checkshipping"
                      checked={shipping === 0}
                      readOnly
                    />
                    <span className="text text-sm">
                      <span>Free Shipping (≥ 1.000.000₫)</span>
                      <span className="price">{formatVND(0)}</span>
                    </span>
                  </label>
                </fieldset>

                <fieldset>
                  <label className="check-ship">
                    <input
                      type="radio"
                      className="tf-check-rounded"
                      name="checkshipping"
                      checked={shipping > 0}
                      readOnly
                    />
                    <span className="text text-sm">
                      <span>Standard Shipping (&lt; 1.000.000₫)</span>
                      <span className="price">{formatVND(50_000)}</span>
                    </span>
                  </label>
                </fieldset>
              </div>

              {/* Payment: chỉ PayOS */}
              <div className="box-ip-payment">
                <div className="title">
                  <div className="text-lg fw-medium mb_4">Payment</div>
                  <p className="text-sm text-main">
                    All transactions are secure and encrypted.
                  </p>
                </div>

                <div className="payment-method-box" id="payment-method-box">
                  <div className="payment-item mb_16">
                    <label className="payment-header">
                      <input
                        type="radio"
                        name="payment-method"
                        className="tf-check-rounded"
                        checked
                        readOnly
                      />
                      <span className="pay-title text-sm">
                        PayOS (Online Payment)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <label className="text-sm fw-medium mb_8 d-block">
                    Order notes (optional)
                  </label>
                  <textarea
                    className="style-2"
                    placeholder="Ghi chú cho đơn hàng của bạn..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <p className="text-dark-6 text-sm mt-2">
                  Your personal data will be used to process your order, support
                  your experience throughout this website, and for other
                  purposes described in our{" "}
                  <Link
                    to={`/privacy-policy`}
                    className="fw-medium text-decoration-underline link text-sm"
                  >
                    privacy policy.
                  </Link>
                </p>
              </div>

              {/* Coupon box */}
<div className="box-ip-payment mt-3">
                <div className="title d-flex align-items-center justify-content-between">
                  <div className="text-lg fw-medium mb_8">Coupon</div>
                  {couponApplied && (
                    <button
                      type="button"
                      className="tf-btn btn-outline"
                      onClick={removeCoupon}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Nhập mã bằng tay */}
                <div className="d-flex gap-8 mb_12">
                  <input
                    className="style-2"
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="tf-btn btn-dark2"
                    onClick={handleApplyCoupon}
                    disabled={applying || subtotal <= 0}
                  >
                    {applying ? "Applying..." : "Apply"}
                  </button>
                </div>

                {couponApplied && (
                  <div className="text-sm mt-2">
                    Đã áp dụng: <b>{couponApplied}</b> (giảm {formatVND(couponDiscount)})
                  </div>
                )}

                {/* NEW: Danh sách coupon khả dụng */}
                <div className="mt-3">
                  <div className="text-sm fw-medium mb_6">Ưu đãi hiện có</div>

                  {loadingCoupons && <div className="text-sm">Đang tải coupon…</div>}
                  {errorCoupons && <div className="text-sm text-danger">{errorCoupons}</div>}

                  {!loadingCoupons && !errorCoupons && (!coupons || coupons.length === 0) && (
                    <div className="text-sm">Chưa có coupon khả dụng.</div>
                  )}

                  {!loadingCoupons && coupons?.length > 0 && (
                    <ul className="list-unstyled d-flex flex-column gap-8">
                      {coupons.map((c) => {
                        const min = Number(c.minimum_amount ?? 0) || 0;
                        const valueNum = Number(c.value ?? 0) || 0;
                        const maxDisc = c.maximum_discount ? Number(c.maximum_discount) : null;
                        const isPercent = String(c.type) === "percentage";

                        return (
                          <li
                            key={c.id}
                            className="p-12 border rounded d-flex align-items-center justify-content-between"
                          >
                            <div>
                              <div className="fw-medium">
                                {c.code} — {c.name ?? ""}
                              </div>
                              <div className="text-sm text-main">
                                {isPercent ? `Giảm ${valueNum}%` : `Giảm ${formatVND(valueNum)}`}
                                {isPercent && maxDisc ? ` (tối đa ${formatVND(maxDisc)})` : ""}
                                {min ? ` · ĐH tối thiểu ${formatVND(min)}` : ""}
                              </div>
                              {c.expires_at && (
                                <div className="text-xs">
                                  HSD: {new Date(c.expires_at).toLocaleDateString("vi-VN")}
                                </div>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-8">
                              <button
                                type="button"
                                className="tf-btn btn-dark2"
                                onClick={() => applyFromList(c.code)}
                                disabled={applying || subtotal <= 0}
                                title={subtotal <= 0 ? "Giỏ hàng trống" : "Áp dụng mã này"}
                              >
                                Apply
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  className="tf-btn btn-dark2 animate-btn w-100"
                  disabled={placing || subtotal <= 0}
                >
                  {placing ? "Placing..." : "Place order (PayOS)"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT SIDE: ORDER SUMMARY */}
          <div className="col-xl-4">
            <div className="tf-page-cart-sidebar">
              <div className="cart-box order-box">
                <div className="title text-lg fw-medium">In your cart</div>

                {Array.isArray(cartProducts) && cartProducts.length ? (
                  <ul className="list-order-product">
                    {cartProducts.map((product: any, i: number) => (
                      <li key={i} className="order-item">
                        <figure className="img-product">
                          <img
                            alt="product"
                            src={product.imgSrc}
                            width="144"
                            height="188"
                          />
                          <span className="quantity">{product.quantity}</span>
                        </figure>

                        <div className="content">
                          <div className="info">
                            <p className="name text-sm fw-medium">{product.title}</p>
                            {(product.color || product.size) && (
                              <span className="variant">
                                {product.color ?? ""} {product.size ? ` / ${product.size}` : ""}
                              </span>
                            )}
                          </div>

                          <span className="price text-sm fw-medium">
                            {formatVND((Number(product.price) || 0) * (Number(product.quantity) || 0))}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4">
                    Giỏ hàng trống.{" "}
                    <Link className="tf-btn btn-dark2 animate-btn mt-3" to="/shop-default">
                      Khám phá sản phẩm
                    </Link>
                  </div>
                )}

                <ul className="list-total">
                  <li className="total-item text-sm d-flex justify-content-between">
                    <span>Subtotal:</span>
                    <span className="price-sub fw-medium">{formatVND(subtotal)}</span>
                  </li>

                  <li className="total-item text-sm d-flex justify-content-between">
                    <span>Discount:</span>
                    <span className="price-discount fw-medium">
                      {couponDiscount ? `- ${formatVND(couponDiscount)}` : formatVND(0)}
                    </span>
                  </li>

                  <li className="total-item text-sm d-flex justify-content-between">
                    <span>Shipping:</span>
                    <span className="price-ship fw-medium">{formatVND(shipping)}</span>
                  </li>

                  <li className="total-item text-sm d-flex justify-content-between">
                    <span>Tax (10%):</span>
                    <span className="price-tax fw-medium">{formatVND(tax)}</span>
                  </li>
                </ul>

                <div className="subtotal text-lg fw-medium d-flex justify-content-between">
                  <span>Total:</span>
                  <span className="total-price-order">{formatVND(total)}</span>
                </div>
              </div>
            </div>
          </div>
          {/* END RIGHT SIDE */}
          {showQR && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={() => {
  setShowQR(false);
  navigate("/account-orders"); // chuyển sang trang đơn hàng
}}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        width: 360,
        maxWidth: "90vw",
        borderRadius: 12,
        padding: 16,
        textAlign: "center",
      }}
    >
      <h4 className="mb_12">Quét mã để thanh toán PayOS</h4>

      {qrPayload ? (
        /^https?:\/\//i.test(qrPayload) ? (
          <img src={qrPayload} alt="PayOS QR" width={256} height={256} />
        ) : (
          <div style={{ background: "white", padding: 12, display: "inline-block" }}>
            <QRCode value={qrPayload} size={256} />
          </div>
        )
      ) : (
        <div className="text-sm">Không có dữ liệu QR</div>
      )}

      {paymentUrl && (
        <a
          className="tf-btn btn-dark2 w-100 mt-3"
          href={paymentUrl}
          target="_blank"
          rel="noreferrer"
        >
          Mở trang thanh toán PayOS
        </a>
      )}

<button
  className="tf-btn btn-outline mt-2 w-100"
  onClick={() => {
    setShowQR(false);
    navigate("/account-orders");
  }}
>
  Đóng
</button>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}
