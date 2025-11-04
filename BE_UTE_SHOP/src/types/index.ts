import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  role_id: number;
  is_active: boolean;
  email_verified: boolean;
  auth_provider: 'local' | 'google' | 'facebook' | 'apple' | 'twitter';
  provider_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  stock_quantity: number;
  category_id: number;
  gender?: 'male' | 'female' | 'unisex';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  brand_id?: number;
  is_active: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_sale: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  mobile_image_url?: string;
  link_url?: string;
  button_text?: string;
  position: 'hero' | 'middle' | 'sidebar' | 'footer';
  display_order: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}