// src/components/shop/ProductGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import type { Product } from "../../types/shop";
import type { AxiosError } from "axios";
import ProductCard from "./ProductCard";
import clsx from "clsx";

type TabKey = "new" | "best" | "deals";

type Query = {
    mostViewed?: boolean;
    tag?: "featured";
    tab?: TabKey;
};

type Props = {
    /** Tiêu đề block */
    title?: string;
    /** Tham số query gọi API mock */
    query?: Query;
    /**
     * Layout grid nhanh:
     * - "6" -> mobile:2, sm:3, lg:6 (hợp với Most Viewed)
     * - "4" -> mobile:2, md:3, lg:4 (phổ biến)
     * - "3" -> mobile:1, sm:2, md:3
     */
    grid?: "6" | "4" | "3";
    /** Thêm class cho wrapper section */
    className?: string;
};

export default function ProductGrid({
                                        title,
                                        query,
                                        grid = "4",
                                        className,
                                    }: Props) {
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // grid classes preset
    const gridClass = useMemo(() => {
        switch (grid) {
            case "6":
                return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4";
            case "3":
                return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4";
            case "4":
            default:
                return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";
        }
    }, [grid]);

    // số skeleton theo grid
    const skeletonCount = useMemo(() => {
        switch (grid) {
            case "6":
                return 12;
            case "3":
                return 6;
            case "4":
            default:
                return 8;
        }
    }, [grid]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const params: Record<string, string | boolean> = {};
                if (query?.mostViewed) params.mostViewed = true;
                if (query?.tag) params.tag = query.tag;
                if (query?.tab) params.tab = query.tab;

                const res = await api.get<Product[]>("/api/products", {
                    params: Object.keys(params).length ? params : undefined,
                });
                if (mounted) setData(res.data);
            } catch (e: unknown) {
                if (mounted) {
                    const axErr = e as AxiosError<{ message?: string }>;
                    setErr(axErr.response?.data?.message || axErr.message || "Error");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [query?.mostViewed, query?.tag, query?.tab]);

    // items render (skeleton khi loading)
    const items: (Product | null)[] = useMemo(
        () => (loading ? Array.from({ length: skeletonCount }, () => null) : data),
        [loading, data, skeletonCount]
    );

    return (
        <section className={clsx("px-6 py-12", className)}>
            {title && (
                <h3 className="text-3xl md:text-4xl font-bold mb-8 text-center md:text-left">
                    {title}
                </h3>
            )}

            {err && (
                <div className="mx-auto max-w-xl mb-6 rounded-lg bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                    {err}
                </div>
            )}

            <div className={gridClass}>
                {items.map((p, i) =>
                    p ? (
                        <div
                            key={p.id}
                            className="opacity-0 translate-y-3 animate-[fadein_.5s_ease_forwards]"
                            style={{ animationDelay: `${(i % 8) * 60}ms` }}
                        >
                            <ProductCard p={p} imageSize={grid === "6" ? "large" : "normal"} />
                        </div>
                    ) : (
                        // THÊM tall={grid === "6"}
                        <SkeletonCard key={`s-${i}`} delayMs={(i % 8) * 60} tall={grid === "6"} />
                    )
                )}

            </div>

            {/* keyframes nhỏ cho hiệu ứng reveal */}
            <style>
                {`
          @keyframes fadein {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}
            </style>
        </section>
    );
}

function SkeletonCard({ delayMs = 0, tall = false }: { delayMs?: number; tall?: boolean }) {
    const imgBoxCls = tall
        ? "mx-auto w-[95%] h-[22rem] md:h-[24rem] lg:h-[26rem] rounded-md bg-neutral-200 animate-pulse"
        : "w-full h-80 rounded-md bg-neutral-200 animate-pulse";

    return (
        <div
            className="relative bg-white rounded-xl shadow p-3 opacity-0 translate-y-3 animate-[fadein_.5s_ease_forwards]"
            style={{ animationDelay: `${delayMs}ms` }}
        >
            <div className="relative">
                <div className="absolute left-2 top-2 h-6 w-16 rounded bg-neutral-200 animate-pulse" />
                <div className={imgBoxCls} />
            </div>
            <div className="pt-3 text-center">
                <div className="mx-auto h-5 w-40 rounded bg-neutral-200 animate-pulse" />
                <div className="mt-2 flex items-center justify-center gap-3">
                    <div className="h-5 w-20 rounded bg-neutral-200 animate-pulse" />
                    <div className="h-5 w-20 rounded bg-neutral-100 animate-pulse" />
                </div>
                <div className="mt-3 h-11 rounded-full bg-neutral-200 animate-pulse" />
            </div>
        </div>
    );
}
