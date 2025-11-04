"use client";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard12 from "../productCards/ProductCard12";
import { useContextElement } from "@/context/Context";
import wishlistService from "@/services/wishlist/wishlistItem.service";
import type { WishlistItem } from "@/types/wishlist/wishlistItem.types";

export default function Wishlist() {
  const { wishList } = useContextElement(); // nếu bạn dùng context để sync trạng thái cục bộ
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const { items } = await wishlistService.getWishlist();
        setItems(items);
      } catch (err: any) {
        console.error("Lỗi lấy wishlist:", err);
        setError("Không thể tải danh sách yêu thích.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [wishList]); // nếu bạn muốn reload khi context thay đổi

  if (loading) {
    return (
      <section className="s-account flat-spacing-4 pt_0">
        <div className="container text-center py-5">
          <p>Đang tải danh sách yêu thích...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="s-account flat-spacing-4 pt_0">
        <div className="container text-center py-5">
          <p className="text-danger">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="s-account flat-spacing-4 pt_0">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            {items.length > 0 ? (
              <div
                className="wrapper-shop tf-grid-layout tf-col-2 lg-col-3 xl-col-4 style-1"
                id="gridLayout"
              >
                {items.map((product) => (
                  <ProductCard12 key={product.id} product={product} />
                ))}

                <ul className="wg-pagination">
                  <li className="active">
                    <div className="pagination-item">1</div>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="text-center py-5">
                <p>Danh sách yêu thích của bạn đang trống.</p>
                <Link
                  className="tf-btn btn-dark2 animate-btn mt-3 inline-flex"
                  to="/shop-default"
                >
                  Khám phá sản phẩm
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
