// app/(components)/home/BuyerStats.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import { ShieldCheck, Home, ShoppingBag, Sparkles, FileText } from "lucide-react"; // ⬅️ FileText added
import { api } from "@/lib/api";

export default function BuyerStats() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/stats");
                setData(data || {});
            } catch {
                setErr("Failed to load marketplace stats.");
                setData({});
            }
        })();
    }, []);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);

    const cards = useMemo(() => {
        const d = data || {};
        return [
            { label: "Live Listings", value: fmt.format(d.liveListings ?? 0), icon: Home },
            { label: "Verified Sellers", value: fmt.format(d.verifiedSellers ?? 0), icon: ShieldCheck },
            { label: "Secure Purchases (This Month)", value: fmt.format(d.monthSuccessCount ?? 0), icon: ShoppingBag },

            // ⬇️ New card
            { label: "Helpful Articles", value: fmt.format(d.blogCount ?? 0), icon: FileText },
        ];
    }, [data, fmt]);

    return (
        <section className="max-w-6xl mx-auto px-4">
            <SectionHeader
                title="Shop with confidence"
                subtitle="Real-time marketplace signals buyers care about."
                align="center"
            />

            {err ? <p className="mb-4 text-center text-sm text-amber-600">{err}</p> : null}

            {/* changed grid to fit 5 cards nicely */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(data ? cards : Array.from({ length: 5 })).map((c, i) => {
                    const Icon = c?.icon || Home;
                    return (
                        <div
                            key={c?.label || i}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md"
                        >
                            <div className="inline-flex items-center justify-center rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
                                <Icon className="h-5 w-5 text-slate-800" />
                            </div>

                            <div className="mt-3 text-2xl font-bold text-slate-900">
                                {data ? c.value : <span className="inline-block h-6 w-20 rounded bg-slate-200/70 animate-pulse" />}
                            </div>
                            <div className="text-sm text-slate-600">
                                {data ? c.label : <span className="inline-block h-4 w-28 rounded bg-slate-200/70 animate-pulse" />}
                            </div>

                            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
