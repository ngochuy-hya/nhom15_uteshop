"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import ProductCard1 from "@/components/productCards/ProductCard1";
import { products2 } from "@/data/products";

// đảm bảo ở nơi global (layout/app) bạn đã import css Swiper:
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

export default function Products2() {
  return (
    <section className="flat-spacing-3 pt-0 overflow-hidden">
      <div className="container">
        <div className="flat-title wow fadeInUp">
          <h4 className="title">Today’s Picks</h4>
        </div>

        <div className="fl-control-sw2 pos2 wow fadeInUp">
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
              // clickable: true, // ❌ không hợp lệ cho NavigationOptions
              nextEl: ".nav-next-top-pick",
              prevEl: ".nav-prev-top-pick",
            }}
            pagination={{
              el: ".sw-pagination-top-pick",
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
            {products2.map((product, i) => (
              <SwiperSlide className="swiper-slide" key={i}>
                <ProductCard1 product={product} />
              </SwiperSlide>
            ))}

            {/* pagination bullets target (mobile) */}
            <div className="d-flex d-xl-none sw-dot-default sw-pagination-top-pick justify-content-center" />
          </Swiper>

          {/* external nav buttons for desktop */}
          <div className="d-none d-xl-flex swiper-button-next nav-swiper nav-next-top-pick" />
          <div className="d-none d-xl-flex swiper-button-prev nav-swiper nav-prev-top-pick" />
        </div>
      </div>
    </section>
  );
}
