"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import { products36 } from "@/data/products";
import ProductCard1 from "../productCards/ProductCard1";

// Đảm bảo bạn đã import CSS Swiper ở cấp global/layout:
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

export default function RelatedProducts() {
  return (
    <section className="flat-spacing pt-0">
      <div className="container">
        <div className="flat-title wow fadeInUp">
          <h4 className="title">You May Also Like</h4>
        </div>

        <div className="fl-control-sw pos2">
          <Swiper
            dir="ltr"
            className="swiper tf-swiper wrap-sw-over"
            modules={[Pagination, Navigation]}
            slidesPerView={2}
            spaceBetween={12}
            speed={800}
            observer={true}
            observeParents={true}
            slidesPerGroup={2}
            navigation={{
              // clickable: true, // ❌ không hợp lệ trong NavigationOptions
              nextEl: ".nav-next-also",
              prevEl: ".nav-prev-also",
            }}
            pagination={{
              el: ".sw-pagination-also",
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
            {products36.map((elm, i) => (
              <SwiperSlide className="swiper-slide" key={i}>
                <ProductCard1
                  product={elm}
                  styleClass="style-2"
                  tooltipDirection="top"
                />
              </SwiperSlide>
            ))}

            {/* pagination bullets for mobile */}
            <div className="d-flex d-xl-none sw-dot-default sw-pagination-also justify-content-center" />
          </Swiper>

          {/* desktop nav arrows */}
          <div className="d-none d-xl-flex swiper-button-next nav-swiper nav-next-also" />
          <div className="d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-also" />
        </div>
      </div>
    </section>
  );
}
