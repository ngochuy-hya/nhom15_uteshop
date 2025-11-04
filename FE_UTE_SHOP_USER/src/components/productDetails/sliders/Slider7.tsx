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
  { id: 4, color: "Black", size: "extra large", imgSrc: "/images/products/fashion/women-black-4.jpg", video: "/images/video/video-product.mp4" },
  { id: 5, color: "Yellow", size: "small", imgSrc: "/images/products/fashion/women-yellow-1.jpg" },
  { id: 6, color: "Yellow", size: "medium", imgSrc: "/images/products/fashion/women-yellow-2.jpg" },
  { id: 7, color: "Grey", size: "large", imgSrc: "/images/products/fashion/women-grey-1.jpg" },
  { id: 8, color: "Grey", size: "extra large", imgSrc: "/images/products/fashion/women-grey-2.jpg" },
];

interface Slider7Props {
  activeColor?: string;
  setActiveColor?: (color: string) => void;
  firstItem?: string;
  slideItems?: typeof slides;
}

export default function Slider7({
  activeColor = "Black",
  setActiveColor = () => {},
  firstItem,
  slideItems = slides,
}: Slider7Props) {
  const items = [...slideItems];
  items[0].imgSrc = firstItem ?? items[0].imgSrc;

  // ✅ Sửa đúng kiểu Swiper
  const [thumbSwiper, setThumbSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // === Image Zoom (Drift) ===
  useEffect(() => {
    if (window.innerWidth < 1200) return;

    const driftAll = document.querySelectorAll(".tf-image-zoom");
    const pane = document.querySelector(".tf-zoom-main");
    const driftInstances: Drift[] = [];

    driftAll.forEach((el) => {
      driftInstances.push(
        new Drift(el as HTMLElement, {
          zoomFactor: 2,
          paneContainer: pane as HTMLElement,
          inlinePane: false,
          handleTouch: false,
          hoverBoundingBox: true,
          containInline: true,
        })
      );
    });

    const zoomElements = document.querySelectorAll(".tf-image-zoom");
    const handleMouseOver = (event: Event) => {
      const target = event.target as HTMLElement;
      const parent = target.closest(".section-image-zoom");
      if (parent) parent.classList.add("zoom-active");
    };
    const handleMouseLeave = (event: Event) => {
      const target = event.target as HTMLElement;
      const parent = target.closest(".section-image-zoom");
      if (parent) parent.classList.remove("zoom-active");
    };

    zoomElements.forEach((element) => {
      element.addEventListener("mouseover", handleMouseOver);
      element.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      zoomElements.forEach((element) => {
        element.removeEventListener("mouseover", handleMouseOver);
        element.removeEventListener("mouseleave", handleMouseLeave);
      });
      driftInstances.forEach((instance) => instance.destroy());
    };
  }, []);

  // === Lightbox ===
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

  // === Sync Active Color ===
  useEffect(() => {
    if (swiperRef.current && items[activeIndex].color !== activeColor) {
      const slideIndex = items.findIndex((elm) => elm.color === activeColor);
      if (slideIndex >= 0) swiperRef.current.slideTo(slideIndex);
    }
  }, [activeColor]);

  // === Initialize Slide ===
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
      {/* === Thumbnails === */}
      <Swiper
        dir="ltr"
        className="swiper tf-product-media-thumbs other-image-zoom"
        slidesPerView={4}
        direction="vertical"
        onSwiper={(swiper) => setThumbSwiper(swiper)} // ✅ type-correct
        modules={[Thumbs]}
        spaceBetween={8}
      >
        {items.map(({ color, size, imgSrc, video }, index) => (
          <SwiperSlide
            key={index}
            className="swiper-slide stagger-item"
            data-color={color}
            data-size={size}
          >
            <div className={`item ${video ? "position-relative" : ""}`}>
              {video && (
                <div className="wrap-btn-viewer style-video">
                  <i className="icon icon-video"></i>
                </div>
              )}
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

      {/* === Main Product Slider === */}
      <div className="flat-wrap-media-product">
        <Swiper
          modules={[Thumbs, Navigation]}
          dir="ltr"
          className="swiper tf-product-media-main"
          id="gallery-swiper-started"
          thumbs={{ swiper: thumbSwiper }} // ✅ no type error
          navigation={{
            prevEl: ".snbp1",
            nextEl: ".snbn1",
          }}
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => {
            if (items[swiper.activeIndex]) {
              setActiveIndex(swiper.activeIndex);
              setActiveColor(items[swiper.activeIndex].color);
            }
          }}
        >
          {items.map((elm, i) => (
            <SwiperSlide
              key={i}
              className="swiper-slide stagger-item"
              data-color={elm.color}
              data-size={elm.size}
            >
              {elm.video ? (
                <div className="item">
                  <video
                    playsInline
                    autoPlay
                    preload="metadata"
                    muted
                    controls
                    loop
                    src={elm.video}
                  />
                </div>
              ) : (
                <a
                  href={elm.imgSrc}
                  target="_blank"
                  className="item"
                  data-pswp-width="552px"
                  data-pswp-height="827px"
                >
                  <img
                    className="tf-image-zoom lazyload"
                    data-zoom={elm.imgSrc}
                    data-src={elm.imgSrc}
                    alt="img-product"
                    src={elm.imgSrc}
                    width={828}
                    height={1241}
                  />
                </a>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="swiper-button-next nav-swiper thumbs-next snbn1" />
        <div className="swiper-button-prev nav-swiper thumbs-prev snbp1" />
      </div>
    </>
  );
}
