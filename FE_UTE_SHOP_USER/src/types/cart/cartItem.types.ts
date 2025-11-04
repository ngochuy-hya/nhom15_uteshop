// src/types/cart/cartItem.types.ts

/** Item raw từ BE (theo response mẫu bạn cung cấp) */
export type ApiCartItem = {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;

  selected_color?: string | null;
  selected_size?: string | null;

  /** Một số BE trả "price" là giá đang áp dụng cho item, kèm current_price & sale_price của sản phẩm */
  price?: string | number | null;

  /** Thông tin sản phẩm đi kèm */
  product_name: string;
  product_slug: string;
  current_price?: string | number | null; // giá gốc hiện tại của sản phẩm
  sale_price?: string | number | null;    // giá sale đang chạy
  stock_quantity: number;
  is_active: 0 | 1 | boolean;
  product_image?: string | null;

  created_at?: string;
  updated_at?: string;
};

/** Payload data của GET /cart (bên trong "data") */
export type CartListApiResponse = {
  items: ApiCartItem[];
  subtotal: number;     // tổng tạm tính do BE trả
  total_items: number;  // số item (khác với tổng quantity)
};

/** Model dùng cho FE */
export type CartItem = {
  id: number;                  // cart_item_id
  productId: number;
  title: string;
  slug: string;

  quantity: number;
  unitPrice: number;           // đơn giá áp dụng cho item
  oldPrice?: number | null;    // giá gốc (nếu đang sale)
  discount: number;            // oldPrice - unitPrice (>= 0)
  saleLabel?: string | null;   // ví dụ: "-20%"

  stock: number;
  isActive: boolean;

  color?: string | null;
  size?: string | null;
  imgSrc?: string | null;

  lineTotal: number;           // unitPrice * quantity
};

/** Kết quả đã map cho FE */
export type CartListResult = {
  items: CartItem[];
  subtotal: number;   // tổng tạm tính (ưu tiên dùng từ BE, nếu thiếu sẽ tự tính)
  totalItems: number; // số dòng item
};
