"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import ProductCard1 from "@/components/productCards/ProductCard1";
import { products1 } from "@/data/products";
import { productAPI } from "@/config/api";
import { formatImageUrl } from "@/utlis/image.utils";

// đảm bảo ở cấp global (layout/app) bạn đã import css Swiper:
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

export default function Products() {
  const [products, setProducts] = useState<typeof products1>(products1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Best Deals = sản phẩm đang sale (is_sale=true)
        const response = await productAPI.getProducts({ limit: 12, is_sale: 'true', sort_by: 'price', sort_order: 'ASC' });
        if ((response as any)?.success && (response as any)?.data) {
          const apiProducts = (response as any).data.products || [];
          
          // Map API response sang format ProductCard1 cần
          const mappedProducts = apiProducts.map((product: any) => ({
            id: product.id,
            title: product.name,
            slug: product.slug,
            imgSrc: formatImageUrl(product.primary_image),
            imgHover: formatImageUrl(product.primary_image),
            primary_image: formatImageUrl(product.primary_image),
            price: parseFloat(product.sale_price || product.price || 0),
            oldPrice: product.sale_price ? parseFloat(product.price || 0) : undefined,
            discount: product.discount_percentage || (product.sale_price ? 
              Math.round(((product.price - product.sale_price) / product.price) * 100) : 0),
            rating: product.average_rating || 0,
            reviewCount: product.review_count || 0,
            isNew: product.is_new || false,
            isFeatured: product.is_featured || false,
            isSale: product.is_sale || false,
            isOutofSale: !product.stock_quantity || product.stock_quantity === 0,
            colors: [],
            sizes: [],
          }));
          
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error("Error fetching best deals products:", error);
        // fallback giữ nguyên products1
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="flat-spacing-3 overflow-hidden">
        <div className="container">
          <div className="flat-title">
            <h4 className="title">Best Deals</h4>
          </div>
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flat-spacing-3 overflow-hidden">
      <div className="container">
        <div className="flat-title wow fadeInUp">
          <h4 className="title">Best Deals</h4>
        </div>

        <div className="fl-control-sw2 pos2 wow fadeInUp">
          <Swiper
            dir="ltr"
            className="swiper tf-swiper wrap-sw-over"
            modules={[Pagination, Navigation]}
            slidesPerView={2}
            spaceBetween={12}
            speed={800}
            slidesPerGroup={2}
            navigation={{
              // clickable: true, // ❌ không hợp lệ trong NavigationOptions
              nextEl: ".nav-next-seller",
              prevEl: ".nav-prev-seller",
            }}
            pagination={{
              el: ".sw-pagination-seller",
              clickable: true,
            }}
            breakpoints={{
              768: {
                slidesPerView: 3,
                spaceBetween: 12,
                slidesPerGroup: 3,
              },
              1200: {
                slidesPerView: 4,
                spaceBetween: 24,
                slidesPerGroup: 4,
              },
            }}
          >
            {products.map((product: any) => (
              <SwiperSlide className="swiper-slide" key={product.id}>
                <ProductCard1 product={product} />
              </SwiperSlide>
            ))}

            {/* Pagination bullets cho mobile */}
            <div className="d-flex d-xl-none sw-dot-default sw-pagination-seller justify-content-center mt_5" />
          </Swiper>

          {/* Nút điều hướng next/prev cho desktop */}
          <div className="d-none d-xl-flex swiper-button-next nav-swiper nav-next-seller" />
          <div className="d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-seller" />
        </div>
      </div>
    </section>
  );
}
