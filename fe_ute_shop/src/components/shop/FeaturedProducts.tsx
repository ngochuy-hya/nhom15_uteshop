import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import type { Product } from "../../types/shop";
import type { AxiosError } from "axios";
import ProductCard from "./ProductCard";

type TabKey = "new" | "best" | "deals";

const TABS: { key: TabKey; label: string }[] = [
    { key: "new", label: "New Arrivals" },
    { key: "best", label: "Best Sellers" },
    { key: "deals", label: "Deals" },
];

export default function FeaturedProducts() {
    const [tab, setTab] = useState<TabKey>("new");
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const res = await api.get<Product[]>("/api/products", {
                    params: { tag: "featured", tab },
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
    }, [tab]);

    // dữ liệu hiển thị (khi loading -> 8 skeleton)
    const items: (Product | null)[] = useMemo(
        () => (loading ? Array.from({ length: 8 }, () => null) : data),
        [loading, data]
    );

    return (
        <section className="px-6 py-16">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl md:text-4xl font-bold">Featured Products</h3>

                <div className="flex gap-4 md:gap-6">
                    {TABS.map((t) => {
                        const active = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`relative text-base md:text-xl font-medium transition-colors ${
                                    active ? "text-rose-700" : "text-neutral-800 hover:text-rose-700"
                                }`}
                            >
                                {t.label}
                                <span
                                    className={`absolute left-0 -bottom-1 h-0.5 w-full rounded ${
                                        active ? "bg-rose-700" : "bg-transparent"
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            {err && (
                <div className="mx-auto max-w-xl mb-6 rounded-lg bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                    {err}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {items.map((p, i) =>
                    p ? (
                        <div key={p.id} className="opacity-0 translate-y-3 animate-[fadein_.6s_ease_forwards]">
                            <ProductCard p={p} />
                        </div>
                    ) : (
                        <div
                            key={`s-${i}`}
                            className="relative bg-white rounded-xl shadow p-3 opacity-0 translate-y-3 animate-[fadein_.6s_ease_forwards]"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className="relative">
                                <div className="absolute left-2 top-2 h-6 w-16 rounded bg-neutral-200 animate-pulse" />
                                <div className="w-full aspect-[4/3] rounded-md bg-neutral-200 animate-pulse" />
                            </div>
                            <div className="pt-3 text-center">
                                <div className="mx-auto h-5 w-32 rounded bg-neutral-200 animate-pulse" />
                                <div className="mt-2 flex items-center justify-center gap-3">
                                    <div className="h-5 w-16 rounded bg-neutral-200 animate-pulse" />
                                    <div className="h-5 w-16 rounded bg-neutral-100 animate-pulse" />
                                </div>
                                <div className="mt-3 h-10 rounded-full bg-neutral-200 animate-pulse" />
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* tiny keyframes (tailwind arbitrary) */}
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
