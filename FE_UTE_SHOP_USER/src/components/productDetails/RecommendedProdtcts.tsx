// src/components/productDetails/RecommendedProducts.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import { products37 } from "@/data/products";
import ProductCard10 from "../productCards/ProductCard10";
import { productAPI } from "@/services/product/product.service";
import type { RelatedProduct } from "@/types/products/product.types";

type RecommendedProductsProps = {
  productId?: number; // id của sản phẩm đang xem
  limit?: number;     // số lượng muốn lấy từ API (mặc định 4)
};

export default function RecommendedProducts({
  productId,
  limit = 4,
}: RecommendedProductsProps) {
  const [items, setItems] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fallback = useMemo(
    () => (Array.isArray(products37) ? products37 : []),
    []
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!productId) {
        setItems(fallback as any);
        return;
      }
      try {
        setLoading(true);
        const list = await productAPI.getRelated(productId, limit);
        if (!mounted) return;
        // Nếu API trả rỗng thì dùng fallback
        setItems(list && list.length ? list : (fallback as any));
      } catch {
        if (!mounted) return;
        setItems(fallback as any);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [productId, limit, fallback]);
  return (
    <section>
      <div className="container">
        <div className="flat-title wow fadeInUp">
          <h4 className="title">People Also Bought</h4>
        </div>

        <div className="hover-sw-nav hover-sw-2 wow fadeInUp">
          <Swiper
            dir="ltr"
            className="swiper tf-swiper wrap-sw-over"
            slidesPerView={2}
            spaceBetween={12}
            speed={800}
            observer
            observeParents
            slidesPerGroup={2}
            navigation={{
              nextEl: ".nav-next-bought",
              prevEl: ".nav-prev-bought",
            }}
            pagination={{
              el: ".sw-pagination-bought",
              clickable: true,
            }}
            breakpoints={{
              768: { slidesPerView: 3, spaceBetween: 12, slidesPerGroup: 3 },
              1200: { slidesPerView: 4, spaceBetween: 24, slidesPerGroup: 4 },
            }}
            modules={[Pagination, Navigation]}
          >
            {(loading ? Array.from({ length: 4 }) : items).map((product: any, idx: number) => (
              <SwiperSlide key={String(product?.id ?? `skeleton-${idx}`)}>
                {loading ? (
                  <div className="card skeleton" style={{ height: 300 }} />
                ) : (
                  <ProductCard10 product={product} />
                )}
              </SwiperSlide>
            ))}

            <div className="d-flex d-xl-none sw-dot-default sw-pagination-bought justify-content-center" />
          </Swiper>

          <div className="d-none d-xl-flex swiper-button-next nav-swiper nav-next-bought" />
          <div className="d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-bought" />
        </div>
      </div>
    </section>
  );
}
