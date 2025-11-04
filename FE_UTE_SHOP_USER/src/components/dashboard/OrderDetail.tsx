"use client";

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import { orderService } from "@/services/order/order.service";
import { payosService } from "@/services/payment/payos.service";
import { QRCodeSVG } from "qrcode.react";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const formatVND = (v: number) =>
    (v || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) throw new Error('missing order id');
        const res = await orderService.getOrderDetail(id);
        setOrder(res);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không tải được chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePay = async () => {
    if (!order) return;
    setLoadingQR(true);
    setShowPayOSModal(true);
    try {
      toast.loading("Đang khởi tạo thanh toán...", { id: "pay" });
      const res = await payosService.createPayment({
        order_id: order.id,
        description: `Thanh toán đơn #${order.order_number}`,
      } as { order_id: string | number; description?: string });

      setQrPayload(res.qr_code_url || null);
      setPaymentUrl(res.payment_url || "");
      toast.dismiss("pay");
    } catch (e: any) {
      toast.dismiss("pay");
      toast.error(e?.response?.data?.message || "Không thể tạo thanh toán");
      setShowPayOSModal(false);
    } finally {
      setLoadingQR(false);
    }
  };

  if (loading) return <div className="p-5 text-center">Đang tải chi tiết đơn hàng...</div>;
  if (!order) return <div className="p-5 text-center">Không tìm thấy đơn hàng</div>;

  return (
    <div className="flat-spacing-13">
      <div className="container-7">
        <div className="btn-sidebar-mb d-lg-none mb-3">
          <button data-bs-toggle="offcanvas" data-bs-target="#mbAccount">
            <i className="icon icon-sidebar" />
          </button>
        </div>

        <div className="main-content-account">
          {/* Sidebar bên trái */}
          <div className="sidebar-account-wrap sidebar-content-wrap sticky-top d-lg-block d-none me-4">
            <ul className="my-account-nav">
              <Sidebar />
            </ul>
          </div>

          {/* Nội dung chính */}
<div className="flex-grow-1 my-acount-content account-orders">
  <div className="account-orders-wrap">
    <h5 className="title mb-3 fw-semibold">
      Chi tiết đơn hàng #{order.order_number}
    </h5>

    <div className="border rounded p-4 shadow-sm bg-white">
      <div className="mb-3">
        <strong>Trạng thái:</strong>{" "}
        <span className="text-capitalize">{order.status_name || "—"}</span>
      </div>

      <div className="mb-3">
        <strong>Thanh toán:</strong>{" "}
        {order.payment_status === "paid" ? (
          <span className="badge bg-success-subtle text-success px-3 py-2">
            Đã thanh toán
          </span>
        ) : (
          <span className="badge bg-secondary-subtle text-secondary px-3 py-2">
            {order.payment_status || "Chưa thanh toán"}
          </span>
        )}
      </div>

      {/* Bảng sản phẩm */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="bg-light">
            <tr>
              <th>Sản phẩm</th>
              <th>Giá</th>
              <th>Số lượng</th>
              <th>Tổng</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.length ? (
              order.items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.product_name ?? "—"}</td>
                  <td>
                    {item.unit_price != null
                      ? formatVND(Number(item.unit_price))
                      : "—"}
                  </td>
                  <td>{item.quantity ?? "—"}</td>
                  <td>
                    {item.total_price != null
                      ? formatVND(Number(item.total_price))
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  Không có sản phẩm trong đơn hàng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tổng tiền */}
      <div className="text-end mt-3">
        <div><strong>Tạm tính:</strong> {formatVND(Number(order.subtotal))}</div>
        <div><strong>Thuế:</strong> {formatVND(Number(order.tax_amount))}</div>
        <div><strong>Giảm giá:</strong> {formatVND(Number(order.discount_amount))}</div>
        <h6 className="mt-2">
          <strong>Tổng đơn:</strong>{" "}
          {order.total_amount != null ? formatVND(Number(order.total_amount)) : "—"}
        </h6>
      </div>

      {/* Nút thanh toán */}
      {order.payment_status !== "paid" && (
        <div className="mt-3 text-end">
          <button className="btn btn-dark px-4" onClick={handlePay}>
            Thanh toán PayOS
          </button>
        </div>
      )}
    </div>

    <div className="mt-3">
      <Link to="/account-orders" className="btn btn-outline-dark">
        ← Quay lại danh sách đơn hàng
      </Link>
    </div>
  </div>
</div>

        </div>
      </div>

      {/* Modal PayOS */}
      {showPayOSModal && (
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
          onClick={() => setShowPayOSModal(false)}
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
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <h4 className="mb-3">Quét mã PayOS để thanh toán</h4>

            {loadingQR ? (
              <div>Đang tạo mã QR...</div>
            ) : qrPayload ? (
              /^https?:\/\//i.test(qrPayload) ? (
                <img src={qrPayload} alt="PayOS QR" width={256} height={256} />
              ) : (
                <QRCodeSVG value={qrPayload} size={256} />
              )
            ) : (
              <div className="text-sm">Không có dữ liệu QR</div>
            )}

            {paymentUrl && (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="tf-btn btn-dark2 w-100 mt-3"
              >
                Mở trang thanh toán PayOS
              </a>
            )}

            <button
              className="tf-btn btn-outline mt-2 w-100"
              onClick={() => setShowPayOSModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
