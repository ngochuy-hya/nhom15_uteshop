// PayOSPage.tsx (tối giản)
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { payosService } from "@/services/payment/payos.service";
import { toast } from "sonner";

export default function PayOSPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pay = await payosService.createPayment({
          order_id: Number(orderId),
          description: `Thanh toán đơn hàng #${orderId}`,
        });
        if (!mounted) return;
        setQr(pay.qr_code_url || null);
        setUrl(pay.payment_url || null);
        // (Tuỳ chọn) tự mở trang PayOS:
        // if (pay.payment_url) window.open(pay.payment_url, "_blank", "noopener");
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Không tạo được link thanh toán");
        navigate(`/orders/${orderId}`);
      }
    })();
    return () => { mounted = false; };
  }, [orderId, navigate]);

  return (
    <div className="container py-4">
      <h3>Thanh toán PayOS cho đơn #{orderId}</h3>
      {qr ? (
        /^https?:\/\//i.test(qr)
          ? <img src={qr} alt="PayOS QR" width={256} height={256} />
          : <div style={{ background: "#fff", padding: 12, display: "inline-block" }}>
              <QRCode value={qr} size={256} />
            </div>
      ) : <div>Đang tạo mã QR…</div>}

      {url && (
        <a className="tf-btn btn-dark2 mt-3" href={url} target="_blank" rel="noreferrer">
          Mở trang thanh toán PayOS
        </a>
      )}
    </div>
  );
}
