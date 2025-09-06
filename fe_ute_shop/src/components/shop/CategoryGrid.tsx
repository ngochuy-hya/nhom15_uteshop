import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Category } from "../../types/shop";
import type { AxiosError } from "axios";

export default function CategoryGrid() {
    const [data, setData] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get<Category[]>("/api/categories");
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
    }, []);

    // Tạo danh sách hiển thị: khi loading -> 5 null; khi xong -> data thật
    const items: (Category | null)[] = loading
        ? Array.from({ length: 5 }, () => null)
        : data;

    return (
        <section className="px-6 pt-16 text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-10">Categories</h3>

            {err && (
                <div className="mx-auto max-w-xl mb-6 rounded-lg bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                    {err}
                </div>
            )}

            <div
                className="
          grid gap-6 sm:gap-8
          grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
          w-full
        "
            >
                {items.map((c, i) => (
                    <div
                        key={c?.id ?? i}
                        className="
              aspect-square rounded-full bg-neutral-100
              flex flex-col items-center justify-center
              shadow-sm hover:shadow-md transition
              p-4 group
            "
                    >
                        <div className="w-3/5">
                            {c === null ? (
                                <div className="w-full aspect-square rounded-full bg-neutral-200 animate-pulse" />
                            ) : (
                                <img
                                    src={c.image}
                                    alt={c.name}
                                    className="w-full h-auto object-contain"
                                />
                            )}
                        </div>

                        <div className="mt-3">
                            <div
                                className="
                  text-lg md:text-xl font-extrabold tracking-tight
                  text-neutral-800 group-hover:text-rose-700 transition
                "
                            >
                                {c === null ? (
                                    <span className="inline-block h-5 w-24 bg-neutral-200 rounded animate-pulse" />
                                ) : (
                                    c.name
                                )}
                            </div>
                            <div className="text-sm text-neutral-500">
                                {c === null ? (
                                    <span className="inline-block h-4 w-16 bg-neutral-200 rounded animate-pulse" />
                                ) : (
                                    `${c.itemsCount} items`
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
