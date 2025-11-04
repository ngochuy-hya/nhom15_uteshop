import crypto from 'crypto';
import axios from 'axios';

// PayOS Configuration
export const PAYOS_CONFIG = {
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  partnerCode: process.env.PAYOS_PARTNER_CODE || '',
  environment: process.env.PAYOS_ENVIRONMENT || 'sandbox',
  returnUrl: process.env.PAYOS_RETURN_URL || 'http://localhost:5173/payment/payos/return',
  cancelUrl: process.env.PAYOS_CANCEL_URL || 'http://localhost:5173/payment/payos/cancel',
  ipnUrl: process.env.PAYOS_IPN_URL || 'http://localhost:5000/api/payment/payos/webhook',
};

// PayOS API URLs
const PAYOS_API_URL = 'https://api-merchant.payos.vn';

// PayOS API endpoints
export const PAYOS_ENDPOINTS = {
  CREATE_PAYMENT: `${PAYOS_API_URL}/v2/payment-requests`,
  GET_PAYMENT: (code: string) => `${PAYOS_API_URL}/v2/payment-requests/${code}`,
  CANCEL_PAYMENT: (code: string) => `${PAYOS_API_URL}/v2/payment-requests/${code}/cancel`,
  REFUND_PAYMENT: (code: string) => `${PAYOS_API_URL}/v2/payment-requests/${code}/refund`,
};

/**
 * Tạo chữ ký (signature) cho request
 */
export function createSignature(data: Record<string, any>): string {
  // Sắp xếp keys theo alphabet
  const sortedKeys = Object.keys(data).sort();
  
  // Tạo chuỗi để sign - PayOS yêu cầu format: key1=value1&key2=value2...
  // Không encode URL, dùng giá trị raw (chuyển số thành string)
  const signString = sortedKeys
    .map(key => {
      const value = data[key];
      // PayOS yêu cầu giá trị là string, không phải số
      return `${key}=${String(value)}`;
    })
    .join('&');
  
  console.log('=== SIGNATURE DEBUG ===');
  console.log('Signature data:', JSON.stringify(data, null, 2));
  console.log('Signature string:', signString);
  console.log('Checksum key length:', PAYOS_CONFIG.checksumKey.length);
  
  // Tạo HMAC SHA256
  const signature = crypto
    .createHmac('sha256', PAYOS_CONFIG.checksumKey)
    .update(signString)
    .digest('hex');
  
  console.log('Generated signature:', signature);
  return signature;
}

/**
 * Verify signature từ webhook
 */
export function verifySignature(data: Record<string, any>, receivedSignature: string): boolean {
  const calculatedSignature = createSignature(data);
  return calculatedSignature === receivedSignature;
}

/**
 * Interface cho PayOS Payment Request
 */
export interface PayOSPaymentRequest {
  orderCode: number;
  amount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  cancelUrl?: string;
  returnUrl?: string;
  expiredAt?: number; // Unix timestamp
}

/**
 * Interface cho PayOS Payment Response
 */
export interface PayOSPaymentResponse {
  code: string;
  desc: string;
  data: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
  signature: string;
}

/**
 * Tạo payment link với PayOS
 */
export async function createPayOSPayment(
  paymentData: PayOSPaymentRequest
): Promise<PayOSPaymentResponse> {
  try {
    // Thêm returnUrl và cancelUrl nếu chưa có
    const requestData = {
      ...paymentData,
      returnUrl: paymentData.returnUrl || PAYOS_CONFIG.returnUrl,
      cancelUrl: paymentData.cancelUrl || PAYOS_CONFIG.cancelUrl,
    };

    // PayOS v2 yêu cầu signature trong body
    // Signature được tính từ các field: amount, cancelUrl, description, orderCode, returnUrl
    const signatureData = {
      amount: requestData.amount,
      cancelUrl: requestData.cancelUrl,
      description: requestData.description,
      orderCode: requestData.orderCode,
      returnUrl: requestData.returnUrl,
    };
    
    const signature = createSignature(signatureData);

    // PayOS v2 yêu cầu thêm signature vào body request
    const requestBody = {
      ...requestData,
      signature: signature,
    };

    console.log('=== PAYOS REQUEST DEBUG ===');
    console.log('Request URL:', PAYOS_ENDPOINTS.CREATE_PAYMENT);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Client ID:', PAYOS_CONFIG.clientId);
    console.log('API Key (first 10 chars):', PAYOS_CONFIG.apiKey.substring(0, 10) + '...');
    console.log('Signature:', signature);

    // Gọi API PayOS
    const response = await axios.post(
      PAYOS_ENDPOINTS.CREATE_PAYMENT,
      requestBody,
      {
        headers: {
          'x-client-id': PAYOS_CONFIG.clientId,
          'x-api-key': PAYOS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('=== PAYOS ERROR ===');
    console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error message:', error.message);
    console.error('Error status:', error.response?.status);
    throw new Error(error.response?.data?.desc || 'Không thể tạo link thanh toán');
  }
}

/**
 * Kiểm tra trạng thái thanh toán
 */
export async function getPayOSPaymentStatus(orderCode: string): Promise<any> {
  try {
    const response = await axios.get(
      PAYOS_ENDPOINTS.GET_PAYMENT(orderCode),
      {
        headers: {
          'x-client-id': PAYOS_CONFIG.clientId,
          'x-api-key': PAYOS_CONFIG.apiKey,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('PayOS get payment status error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.desc || 'Không thể kiểm tra trạng thái thanh toán');
  }
}

/**
 * Hủy payment
 */
export async function cancelPayOSPayment(orderCode: string, reason?: string): Promise<any> {
  try {
    const response = await axios.put(
      PAYOS_ENDPOINTS.CANCEL_PAYMENT(orderCode),
      { cancellationReason: reason || 'Hủy thanh toán' },
      {
        headers: {
          'x-client-id': PAYOS_CONFIG.clientId,
          'x-api-key': PAYOS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('PayOS cancel payment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.desc || 'Không thể hủy thanh toán');
  }
}

/**
 * Interface cho PayOS Refund Request
 */
export interface PayOSRefundRequest {
  amount?: number; // Nếu không có thì refund toàn bộ
  description?: string;
  reason?: string;
}

/**
 * Hoàn tiền (refund) payment đã thanh toán
 * Lưu ý: Với chế độ spending mode của PayOS, khi hủy đơn hàng đã thanh toán,
 * PayOS sẽ tự động hoàn tiền về tài khoản khách hàng
 */
export async function refundPayOSPayment(
  orderCode: string, 
  refundData?: PayOSRefundRequest
): Promise<any> {
  try {
    // PayOS refund endpoint - có thể là POST với body chứa amount, description, reason
    const requestBody: any = {};
    
    if (refundData?.amount) {
      requestBody.amount = formatAmount(refundData.amount);
    }
    
    if (refundData?.description) {
      requestBody.description = refundData.description;
    }
    
    if (refundData?.reason) {
      requestBody.reason = refundData.reason;
    }

    // Nếu không có amount thì refund toàn bộ (để trống body hoặc không gửi amount)
    const response = await axios.post(
      PAYOS_ENDPOINTS.REFUND_PAYMENT(orderCode),
      Object.keys(requestBody).length > 0 ? requestBody : {},
      {
        headers: {
          'x-client-id': PAYOS_CONFIG.clientId,
          'x-api-key': PAYOS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('PayOS refund payment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.desc || 'Không thể hoàn tiền');
  }
}

/**
 * Format số tiền
 */
export function formatAmount(amount: number): number {
  // PayOS yêu cầu amount là số nguyên (VND)
  return Math.round(amount);
}

/**
 * Generate order code (unique)
 * PayOS yêu cầu orderCode là số nguyên và có thể có giới hạn độ dài
 */
export function generateOrderCode(): number {
  // Tạo order code từ timestamp, nhưng chỉ lấy 10 chữ số cuối để tránh quá dài
  // Hoặc có thể dùng timestamp ngắn hơn
  const timestamp = Date.now();
  // Lấy 10 chữ số cuối (PayOS thường chấp nhận orderCode có độ dài hợp lý)
  return parseInt(timestamp.toString().slice(-10));
}

/**
 * Parse webhook data từ PayOS
 */
export function parseWebhookData(body: any): {
  orderCode: string;
  amount: number;
  description: string;
  transactionDateTime: string;
  reference: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
} {
  return {
    orderCode: body.data?.orderCode || body.orderCode,
    amount: body.data?.amount || body.amount,
    description: body.data?.description || body.description,
    transactionDateTime: body.data?.transactionDateTime || body.transactionDateTime,
    reference: body.data?.reference || body.reference,
    code: body.code,
    desc: body.desc,
    counterAccountBankId: body.data?.counterAccountBankId,
    counterAccountBankName: body.data?.counterAccountBankName,
    counterAccountName: body.data?.counterAccountName,
    counterAccountNumber: body.data?.counterAccountNumber,
    virtualAccountName: body.data?.virtualAccountName,
    virtualAccountNumber: body.data?.virtualAccountNumber,
  };
}

/**
 * Validate PayOS config
 */
export function validatePayOSConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!PAYOS_CONFIG.clientId) errors.push('PAYOS_CLIENT_ID is required');
  if (!PAYOS_CONFIG.apiKey) errors.push('PAYOS_API_KEY is required');
  if (!PAYOS_CONFIG.checksumKey) errors.push('PAYOS_CHECKSUM_KEY is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}

