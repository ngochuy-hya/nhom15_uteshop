export type WishlistItem = {
  id: number;                // ID trong bảng wishlist_items
  productId: number;         // ID sản phẩm thật
  title: string;             // Tên sản phẩm
  slug: string;              // Đường dẫn (slug)
  price: number;             // Giá hiện tại
  oldPrice?: number | null;  // Giá gốc
  discount: number;          // Số tiền giảm (giá gốc - giá thật)
  stock: number;             // Tồn kho
  isActive: boolean;         // Còn bán hay không
  imgSrc?: string | null;    // Ảnh chính
  imgHover?: string | null;  // Ảnh hover
  saleLabel?: string | null; // Label khuyến mãi (-20%)
};
export type ApiWishlistItem = {
  id: number;
  product_id: number;
  created_at?: string;
  product_name: string;
  product_slug: string;
  price: string | number;       // giá gốc
  sale_price?: string | number; // giá sale (nếu có)
  stock_quantity: number;
  is_active: 0 | 1 | boolean;
  product_image?: string | null;
};

export type WishlistListApiResponse = {
  items: ApiWishlistItem[];
  total_items: number;
};

export type WishlistListResult = {
  items: WishlistItem[];
  total: number;
};