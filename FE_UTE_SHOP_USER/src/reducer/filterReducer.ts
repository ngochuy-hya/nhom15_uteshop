import { products } from "@/data/products";

// Product chuẩn hóa nếu sau này bạn muốn dùng cho filter nâng cao
export interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  color?: string;
  size?: string;
  brand?: string;
  availability?: string;
  onSale?: boolean;
  [key: string]: any;
}

// Kiểu thực tế của object trong "@/data/products"
// Tất cả field đặc thù đều để optional để TS không phàn nàn
export interface RawProduct {
  id: number | string;
  imgSrc?: string;
  imgHover?: string;
  width?: number;
  height?: number;
  isTrending?: boolean;
  isOutofSale?: boolean;
  title?: string;
  price: number;
  oldPrice?: number | string;
  sizes?: any[];
  colors?: any[];
  filterSizes?: string[];
  filterColors?: string[];
  filterBrands?: string[];
  availability?: string;
  brand?: string;
  countdownTimer?: string;
  saleLabel?: string;
  [key: string]: any;
}

// State sẽ lưu mảng RawProduct vì đó là data thực tế bạn render
export interface FilterState {
  price: [number, number];
  availability: string;
  color: string;
  size: string;
  brands: string;
  filtered: RawProduct[];
  sortingOption: string;
  sorted: RawProduct[];
  currentPage: number;
  itemPerPage: number;
  activeFilterOnSale?: boolean;
}

export const initialState: FilterState = {
  price: [20, 300],
  availability: "All",
  color: "All",
  size: "All",
  brands: "All",
  filtered: products as RawProduct[], // giờ hợp lệ vì các field optional
  sortingOption: "Sort by (Default)",
  sorted: products as RawProduct[],
  currentPage: 1,
  itemPerPage: 6,
};

export type FilterAction =
  | { type: "SET_PRICE"; payload: [number, number] }
  | { type: "SET_COLOR"; payload: string }
  | { type: "SET_SIZE"; payload: string }
  | { type: "SET_AVAILABILITY"; payload: string }
  | { type: "SET_BRANDS"; payload: string }
  | { type: "SET_FILTERED"; payload: RawProduct[] }
  | { type: "SET_SORTING_OPTION"; payload: string }
  | { type: "SET_SORTED"; payload: RawProduct[] }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "TOGGLE_FILTER_ON_SALE" }
  | { type: "SET_ITEM_PER_PAGE"; payload: number }
  | { type: "CLEAR_FILTER" };

export function reducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_PRICE":
      return { ...state, price: action.payload };

    case "SET_COLOR":
      return { ...state, color: action.payload };

    case "SET_SIZE":
      return { ...state, size: action.payload };

    case "SET_AVAILABILITY":
      return { ...state, availability: action.payload };

    case "SET_BRANDS":
      return { ...state, brands: action.payload };

    case "SET_FILTERED":
      return { ...state, filtered: [...action.payload] };

    case "SET_SORTING_OPTION":
      return { ...state, sortingOption: action.payload };

    case "SET_SORTED":
      return { ...state, sorted: [...action.payload] };

    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };

    case "TOGGLE_FILTER_ON_SALE":
      return { ...state, activeFilterOnSale: !state.activeFilterOnSale };

    case "SET_ITEM_PER_PAGE":
      return { ...state, itemPerPage: action.payload };

    case "CLEAR_FILTER":
      return {
        ...state,
        price: [20, 300],
        availability: "All",
        color: "All",
        size: "All",
        brands: "All",
        activeFilterOnSale: false,
      };

    default:
      return state;
  }
}
