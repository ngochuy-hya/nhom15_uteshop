// Thông tin danh mục sản phẩm
export interface Category {
    id: string;
    name: string;
    image: string;
    itemsCount: number;
}

// Thông tin sản phẩm
export interface Product {
    id: string;
    name: string;
    price: number;
    priceOld?: number;
    image: string;
    discountPercent?: number;
    tags?: string[]; // ví dụ: ["featured", "new", "best", "deals"]
}
