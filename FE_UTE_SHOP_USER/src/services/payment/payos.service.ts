// src/services/payment/payos.service.ts
import { apiClient } from "@/services/client";
import { API_ENDPOINTS } from "@/config/api";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CreatePayOSPaymentResponse = {
  transaction_id: number;
  payment_url: string;
  qr_code_url: string;
  order_code: string;

};

export const payosService = {
  async createPayment(params: { order_id: number | string; description?: string }) {
    // ⬇️ res chính là body (ApiEnvelope<CreatePayOSPaymentResponse>)
    const res = await apiClient.post<ApiEnvelope<CreatePayOSPaymentResponse>>(
      API_ENDPOINTS.PAYMENT.PAYOS_CREATE,
      params
    );
    return res.data; // ⬅️ lấy inner data
  },
};
