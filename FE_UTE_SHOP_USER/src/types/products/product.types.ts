// src/types/product/product.types.ts

/* ==== API types (theo JSON bạn đưa) ==== */
export type ApiProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  alt_text?: string | null;
  sort_order?: number | null;
  is_primary?: 0 | 1 | boolean;
  created_at?: string;
};

export type ApiProductAttribute = {
  id: number;
  product_id: number;
  attribute_type: "color" | "size" | string;
  attribute_name: string; // "Color"/"Size"
  attribute_value: string; // "Black", "M", ...
  price_adjustment?: string | number | null;
  stock_quantity?: number | null;
  is_active?: 0 | 1 | boolean;
  created_at?: string;
};

export type ApiProductDetail = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  sku?: string | null;

  price?: string | number | null;
  sale_price?: string | number | null;
  cost_price?: string | number | null;

  stock_quantity?: number | null;
  min_stock_level?: number | null;

  weight?: string | number | null;
  dimensions?: string | null;

  category_id?: number | null;
  category_name?: string | null;
  category_slug?: string | null;

  gender?: string | null;
  season?: string | null;

  brand_id?: number | null;
  brand_name?: string | null;
  brand_slug?: string | null;

  is_active?: 0 | 1 | boolean;
  is_featured?: 0 | 1 | boolean;
  is_trending?: 0 | 1 | boolean;
  is_bestseller?: 0 | 1 | boolean;
  is_new?: 0 | 1 | boolean;
  is_sale?: 0 | 1 | boolean;

  meta_title?: string | null;
  meta_description?: string | null;

  view_count?: number | null;
  created_at?: string;
  updated_at?: string;

  images?: ApiProductImage[];
  attributes?: ApiProductAttribute[];
  reviews?: any[];
};

export type ApiRelatedProduct = {
  id: number;
  name: string;
  slug: string;
  price?: string | number | null;
  sale_price?: string | number | null;
  is_featured?: 0 | 1 | boolean;
  is_trending?: 0 | 1 | boolean;
  is_bestseller?: 0 | 1 | boolean;
  is_new?: 0 | 1 | boolean;
  is_sale?: 0 | 1 | boolean;
  primary_image?: string | null;
  average_rating?: number | null;
};

/* ==== FE types (phù hợp với các component hiện có) ==== */
export type ProductColorOption = {
  label: string;  // "Black"
  value: string;  // "Black"
};

export type ProductDetail = {
  id: number;
  name: string;
  title: string;                // để Breadcumb/Heading fallback
  slug: string;
  description?: string | null;
  short_description?: string | null;
  sku?: string | null;

  price: number;                // giá áp dụng hiển thị
  oldPrice?: number | null;     // nếu đang sale thì là giá gốc
  discount: number;             // oldPrice - price
  salePercent?: number | null;  // ví dụ 20

  stock: number;
  isActive: boolean;
  isOutofSale: boolean;         // để Details1 -> ProductHeading hiển thị

  category_name?: string | null;
  category_slug?: string | null;
  brand_name?: string | null;

  imgSrc: string;               // ảnh chính (primary)
  slideItems: string[];         // list ảnh cho Slider1

  colors: ProductColorOption[]; // cho ColorSelect1
  sizes: string[];              // cho SizePicker

  reviews?: any[];
};

export type RelatedProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  imgSrc?: string | null;
  isSale?: boolean;
  rating?: number | null;
};
