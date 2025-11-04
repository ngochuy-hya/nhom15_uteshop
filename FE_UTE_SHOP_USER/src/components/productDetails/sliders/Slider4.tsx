"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import Drift from "drift-zoom";
import type { Swiper as SwiperType } from "swiper";

const slides = [
  { id: 1, color: "Black", size: "small", imgSrc: "/images/products/fashion/women-black-1.jpg" },
  { id: 2, color: "Black", size: "medium", imgSrc: "/images/products/fashion/women-black-2.jpg" },
  { id: 3, color: "Black", size: "large", imgSrc: "/images/products/fashion/women-black-3.jpg" },
  { id: 4, color: "Black", size: "extra large", imgSrc: "/images/products/fashion/women-black-4.jpg" },
  { id: 5, color: "Yellow", size: "small", imgSrc: "/images/products/fashion/women-yellow-1.jpg" },
  { id: 6, color: "Yellow", size: "medium", imgSrc: "/images/products/fashion/women-yellow-2.jpg" },
  { id: 7, color: "Grey", size: "large", imgSrc: "/images/products/fashion/women-grey-1.jpg" },
  { id: 8, color: "Grey", size: "extra large", imgSrc: "/images/products/fashion/women-grey-2.jpg" },
];

interface Slider4Props {
  activeColor?: string;
  setActiveColor?: (color: string) => void;
  firstItem?: string;
  slideItems?: typeof slides;
}

export default function Slider4({
  activeColor = "Black",
  setActiveColor = () => {},
  firstItem,
  slideItems = slides,
}: Slider4Props) {
  const items = [...slideItems];
  items[0].imgSrc = firstItem ?? items[0].imgSrc;

  // ✅ Swiper instance types
  const [thumbSwiper, setThumbSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // === Zoom (Drift) setup ===
  useEffect(() => {
    if (window.innerWidth < 1200) return;

    const driftElements = document.querySelectorAll(".tf-image-zoom-inner");
    const pane = document.querySelector(".tf-product-zoom-inner");

    const driftInstances: Drift[] = [];

    driftElements.forEach((el) => {
      driftInstances.push(
        new Drift(el as HTMLElement, {
          paneContainer: pane as HTMLElement,
          zoomFactor: 2,
          inlinePane: false,
          containInline: false,
        })
      );
    });

    return () => {
      // Cleanup all Drift instances if needed
      driftInstances.forEach((instance) => instance.destroy());
    };
  }, []);

  // === PhotoSwipe Lightbox setup ===
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);
  useEffect(() => {
    const lightbox = new PhotoSwipeLightbox({
      gallery: "#gallery-swiper-started",
      children: ".item",
      pswpModule: () => import("photoswipe"),
    });

    lightbox.init();
    lightboxRef.current = lightbox;

    return () => lightbox.destroy();
  }, []);

  // === Sync active color ===
  useEffect(() => {
    if (swiperRef.current && items[activeIndex].color !== activeColor) {
      const slideIndex = items.findIndex((elm) => elm.color === activeColor);
      if (slideIndex >= 0) swiperRef.current.slideTo(slideIndex);
    }
  }, [activeColor]);

  // === Initial sync on mount ===
  useEffect(() => {
    setTimeout(() => {
      if (swiperRef.current) {
        const targetIndex = items.findIndex((elm) => elm.color === activeColor);
        if (targetIndex >= 0) swiperRef.current.slideTo(targetIndex);
      }
    }, 0);
  }, []);

  return (
    <>
      {/* === Thumbnail Swiper === */}
      <Swiper
        dir="ltr"
        className="swiper tf-product-media-thumbs other-image-zoom"
        slidesPerView={4}
        direction="vertical"
        onSwiper={(swiper) => setThumbSwiper(swiper)}
        modules={[Thumbs]}
        spaceBetween={8}
      >
        {items.map(({ color, size, imgSrc }, index) => (
          <SwiperSlide
            key={index}
            className="swiper-slide stagger-item"
            data-color={color}
            data-size={size}
          >
            <div className="item">
              <img
                className="lazyload"
                data-src={imgSrc}
                alt="img-product"
                src={imgSrc}
                width={828}
                height={1241}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* === Main Swiper === */}
      <div className="flat-wrap-media-product">
        <Swiper
          modules={[Thumbs, Navigation]}
          dir="ltr"
          className="swiper tf-product-zoom-inner"
          id="gallery-swiper-started"
          // ✅ Thumbs must be Swiper | null
          thumbs={{ swiper: thumbSwiper }}
          navigation={{
            prevEl: ".snbp1",
            nextEl: ".snbn1",
          }}
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => {
            if (items[swiper.activeIndex]) {
              setActiveIndex(swiper.activeIndex);
              setActiveColor(items[swiper.activeIndex]?.color);
            }
          }}
        >
          {items.map((elm, i) => (
            <SwiperSlide
              key={i}
              className="swiper-slide"
              data-color={elm.color}
              data-size={elm.size}
            >
              <a
                href={elm.imgSrc}
                target="_blank"
                className="item"
                data-pswp-width="552px"
                data-pswp-height="827px"
              >
                <img
                  className="tf-image-zoom-inner lazyload"
                  data-zoom={elm.imgSrc}
                  data-src={elm.imgSrc}
                  alt="img-product"
                  src={elm.imgSrc}
                  width={828}
                  height={1241}
                />
              </a>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="swiper-button-next nav-swiper thumbs-next snbn1" />
        <div className="swiper-button-prev nav-swiper thumbs-prev snbp1" />
      </div>
    </>
  );
}
