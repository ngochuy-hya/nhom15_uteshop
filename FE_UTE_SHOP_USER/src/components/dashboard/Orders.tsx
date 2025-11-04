"use client";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Sidebar from "./Sidebar";
import { orderService } from "@/services/order/order.service";
import { payosService } from "@/services/payment/payos.service";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import type { Order as ApiOrder } from "@/types/order/order.type";

type ExtendedOrder = ApiOrder & { status_name?: string };

type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

type MyOrdersResponse = {
  orders: ExtendedOrder[];
  pagination: PaginationMeta;
};

export default function Orders() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });
  const [page, setPage] = useState(1);
  const limit = 10;

  // PayOS modal state
  const [showPayOSModal, setShowPayOSModal] = useState(false);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<ExtendedOrder | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const formatVND = (v: number) =>
    (v || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const canCancel = (o: ExtendedOrder) =>
    o.payment_status !== "paid" || ["pending", "processing"].includes(o.status_name || "");

  const showPay = (o: ExtendedOrder) => o.payment_status !== "paid";

  const loadOrders = async (p = 1) => {
    try {
      setLoading(true);
      const res = (await orderService.getMyOrders({ page: p, limit })) as MyOrdersResponse;
      setOrders(res.orders || []);
      setPagination(res.pagination);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không tải được danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(page);
  }, [page]);

  // Thanh toán
  const handlePay = async (order: ExtendedOrder) => {
    setPayingOrder(order);
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

  const handleCancel = async (order: ExtendedOrder) => {
    if (!canCancel(order)) return;
    if (order?.id === undefined || order?.id === null || Number.isNaN(Number(order?.id))) {
      console.error('handleCancel: invalid order id', order?.id, order);
      toast.error('Không xác định được mã đơn để hủy');
      return;
    }
    if (!window.confirm(`Xác nhận hủy đơn #${order.order_number}?`)) return;

    try {
      await orderService.cancelOrder(order.id);
      toast.success(`Đã hủy đơn #${order.order_number}`);
      loadOrders(page);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Hủy đơn thất bại");
    }
  };

  const empty = !loading && orders.length === 0;

  return (
    <div className="flat-spacing-13">
      <div className="container-7">
        <div className="btn-sidebar-mb d-lg-none mb-3">
          <button data-bs-toggle="offcanvas" data-bs-target="#mbAccount">
            <i className="icon icon-sidebar" />
          </button>
        </div>

        <div className="main-content-account">
          <div className="sidebar-account-wrap sidebar-content-wrap sticky-top d-lg-block d-none me-4">
            <ul className="my-account-nav">
              <Sidebar />
            </ul>
          </div>

          <div className="flex-grow-1 my-acount-content account-orders">
            {empty ? (
              <div className="account-no-orders-wrap text-center p-5">
                <img
                  src="/images/section/account-no-order.png"
                  alt="No orders"
                  width={169}
                  height={168}
                  className="mx-auto mb-3"
                />
                <div className="display-sm fw-medium mb-1">Bạn chưa có đơn hàng nào</div>
                <div className="text text-sm mb-4">Bắt đầu mua sắm ngay nhé!</div>
                <Link to="/shop-fullwidth" className="tf-btn bg-dark-2 text-white rounded px-4 py-2">
                  Shop Now
                </Link>
              </div>
            ) : (
              <div className="account-orders-wrap">
                <h5 className="title mb-3 fw-semibold">Lịch sử đơn hàng</h5>
                <div className="wrap-account-order border rounded overflow-hidden shadow-sm">
                  <table className="table table-hover align-middle text-center mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày đặt</th>
                        <th>Thanh toán</th>
                        <th>Trạng thái</th>
                        <th>Tổng tiền</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-muted">
                            Đang tải...
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.id}>
                            <td>
                            <Link to={`/orders/${o.id}`} className="fw-medium text-decoration-none">
                              #{o.order_number}
                            </Link>
                            </td>
                            <td>{new Date(o.created_at).toLocaleString("vi-VN")}</td>
                            <td>
                              {o.payment_status === "paid" ? (
                                <span className="badge bg-success-subtle text-success px-3 py-2">
                                  Đã thanh toán
                                </span>
                              ) : o.payment_status === "pending" ? (
                                <span className="badge bg-warning-subtle text-warning px-3 py-2">
                                  Đang xử lý
                                </span>
                              ) : o.payment_status === "failed" ? (
                                <span className="badge bg-danger-subtle text-danger px-3 py-2">
                                  Thất bại
                                </span>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary px-3 py-2">
                                  Chưa thanh toán
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="text-capitalize">{o.status_name || "—"}</span>
                            </td>
                            <td className="fw-semibold">{formatVND(o.total_amount)}</td>
                            <td>
                              <div className="d-flex justify-content-center gap-2">
                                <Link to={`/orders/${o.id}`} className="btn btn-sm btn-outline-primary px-3">
                                  Chi tiết
                                </Link>
                                {showPay(o) && (
                                  <button className="btn btn-sm btn-dark px-3" onClick={() => handlePay(o)}>
                                    Thanh toán
                                  </button>
                                )}
                                {canCancel(o) && (
                                  <button className="btn btn-sm btn-outline-danger px-3" onClick={() => handleCancel(o)}>
                                    Hủy
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-sm text-muted">
                    Trang {pagination.current_page}/{pagination.total_pages} · {pagination.total} đơn
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary btn-sm px-3"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </button>
                    <button
                      className="btn btn-dark btn-sm px-3"
                      disabled={page >= pagination.total_pages || loading}
                      onClick={() => setPage((p) => Math.min(pagination.total_pages || p, p + 1))}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            )}
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
            <h4 className="mb-3">Quét mã để thanh toán PayOS</h4>

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
              <a className="tf-btn btn-dark2 w-100 mt-3" href={paymentUrl} target="_blank" rel="noreferrer">
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
