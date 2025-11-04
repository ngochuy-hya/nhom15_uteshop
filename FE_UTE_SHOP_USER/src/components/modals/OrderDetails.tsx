"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { orderService } from "@/services/order/order.service";
import { toast } from "sonner";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('missing order id');
        const orderData = await orderService.getOrderDetail(id);
        setOrder(orderData); // ✅ đặt trực tiếp
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không tải được chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  if (loading) return <div className="container my-4">Đang tải chi tiết đơn hàng...</div>;
  if (!order) return <div className="container my-4">Không tìm thấy đơn hàng</div>;

  return (
    <div className="container my-4">
      <h4>Chi tiết đơn hàng #{order.order_number}</h4>

      <div className="my-3">
        <strong>Trạng thái:</strong> {order.status_name || "—"}
      </div>
      <div className="my-3">
        <strong>Thanh toán:</strong> {order.payment_status}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Tổng</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item: any) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td>{item.price.toLocaleString("vi-VN")}₫</td>
              <td>{item.quantity}</td>
              <td>{(item.price * item.quantity).toLocaleString("vi-VN")}₫</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3">
        <strong>Tổng đơn:</strong> {order.total_amount.toLocaleString("vi-VN")}₫
      </div>
    </div>
  );
}
