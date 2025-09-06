import { useEffect, useMemo, useRef, useState } from "react";

interface Slide {
    id: string;
    title: string;
    desc: string;
    image: string;
    cta?: string;
}

const SLIDES: Slide[] = [
    {
        id: "s1",
        title: "Turn the page to\nsomething new",
        desc: "Discover bestselling novels, timeless classics, and hidden gems —",
        image: "/image/img_1.png",
        cta: "Shop Collection",
    },
    {
        id: "s2",
        title: "Find your next favorite",
        desc: "Fresh picks every week — curated for curious readers",
        image: "/image/img_1.png",
        cta: "Explore Now",
    },
];

const INTERVAL = 5000;

export default function HeroSlider() {
    const [idx, setIdx] = useState(0);
    const timer = useRef<number | null>(null);
    const total = SLIDES.length;

    const goTo = (i: number) => setIdx((i + total) % total);

    // autoplay
    useEffect(() => {
        timer.current = window.setInterval(() => goTo(idx + 1), INTERVAL);
        return () => {
            if (timer.current) window.clearInterval(timer.current);
        };
    }, [idx, total]);

    // when clicking dot, restart autoplay
    const onDotClick = (i: number) => {
        if (timer.current) window.clearInterval(timer.current);
        goTo(i);
    };

    const translateX = useMemo(() => `translateX(-${idx * 100}%)`, [idx]);

    return (
        <section className="px-6 pt-10">
            <div className="relative overflow-hidden rounded-2xl">
                {/* Slides */}
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: translateX }}
                >
                    {SLIDES.map((s) => (
                        <div key={s.id} className="relative min-w-full">
                            <img src={s.image} alt="" className="w-full h-auto object-contain" />

                            {/* Overlay content */}
                            <div className="absolute left-[10%] top-1/2 -translate-y-1/2 text-white max-w-[800px]">
                                <h2 className="text-3xl md:text-6xl font-extrabold leading-tight whitespace-pre-line drop-shadow">
                                    {s.title}
                                </h2>
                                <p className="mt-3 text-lg md:text-2xl drop-shadow">{s.desc}</p>

                                {s.cta && (
                                    <button className="mt-6 rounded-full bg-white text-black px-7 py-3 text-base md:text-lg font-semibold hover:bg-black hover:text-white transition">
                                        {s.cta}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dots */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-3">
                    {SLIDES.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => onDotClick(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`w-6 h-6 rounded-full grid place-items-center transition ${
                                i === idx ? "bg-white/20 border border-white scale-105" : "bg-white/10"
                            }`}
                        >
                            <i className="fa-solid fa-circle text-[10px] text-white" />
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
