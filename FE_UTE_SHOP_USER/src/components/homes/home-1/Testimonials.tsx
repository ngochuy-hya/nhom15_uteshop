"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

import { testimonials } from "@/data/testimonials";

// đảm bảo global bạn đã import css Swiper:
// import "swiper/css";
// import "swiper/css/pagination";

type TestimonialItem = {
  name: string;
  review: string;
  image: string;
  product: string;
  delay?: string; // ví dụ "0.1s", "0.2s"
};

export default function Testimonials() {
  return (
    <section>
      <div className="container">
        <div className="flat-title wow fadeInUp">
          <h4 className="title">Happy Customers</h4>
        </div>

        <Swiper
          dir="ltr"
          className="swiper tf-swiper"
          modules={[Pagination]}
          slidesPerView={1}
          spaceBetween={12}
          speed={800}
          observer={true}
          observeParents={true}
          slidesPerGroup={1}
          pagination={{
            el: ".sw-pagination-tes",
            clickable: true,
          }}
          breakpoints={{
            768: { slidesPerView: 2, spaceBetween: 24, slidesPerGroup: 2 },
            1200: { slidesPerView: 3, spaceBetween: 24, slidesPerGroup: 3 },
          }}
        >
          {(testimonials as TestimonialItem[]).map((item, index) => (
            <SwiperSlide className="swiper-slide" key={index}>
              <div
                className="wg-testimonial wow fadeInLeft"
                {...(item.delay ? { "data-wow-delay": item.delay } : {})}
              >
                <div className="content">
                  <div className="content-top">
                    <div className="box-author">
                      <p className="name-author text-sm fw-medium">
                        {item.name}
                      </p>
                      <div className="box-verified text-main">
                        <i className="icon-verifi" />
                        <p className="text-xs fst-italic">Verified Buyer</p>
                      </div>
                    </div>

                    <div className="list-star-default">
                      {Array(5)
                        .fill(null)
                        .map((_, i) => (
                          <i key={i} className="icon-star" />
                        ))}
                    </div>

                    <p className="text-review text-sm text-main">
                      {item.review}
                    </p>
                  </div>

                  <span className="br-line d-block" />

                  <div className="box-avt">
                    <div className="avatar">
                      <img
                        alt="author"
                        src={item.image}
                        width="128"
                        height="128"
                      />
                    </div>

                    <div className="box-price">
                      <p className="name-item text-xs">
                        Item purchased:
                        <a
                          href="#"
                          className="fw-medium text-sm link text-line-clamp-1"
                        >
                          {item.product}
                        </a>
                      </p>
                      <p className="price text-md fw-medium">$150.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}

          {/* pagination target */}
          <span className="sw-dot-default sw-pagination-tes justify-content-center" />
        </Swiper>
      </div>
    </section>
  );
}
