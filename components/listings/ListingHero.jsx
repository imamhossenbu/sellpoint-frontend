"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Search,
    X,
    SlidersHorizontal,
    ArrowRightLeft,
} from "lucide-react";

const readFilters = (sp) => ({
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "all",
    type: sp.get("type") ?? "all",
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
    sort: sp.get("sort") ?? "-createdAt",
});

const writeParam = (sp, key, value) => {
    const params = new URLSearchParams(sp.toString());
    if (!value || value === "all" || value === "") params.delete(key);
    else params.set(key, String(value));
    if (key !== "page") params.delete("page");
    return params;
};

export default function ListingHero({
    bgImage = "/listing-bg.jpg",
    title = "Browse Listings",
    total = 0,
    onApply,
}) {
    const router = useRouter();
    const sp = useSearchParams();
    const initial = useMemo(() => readFilters(sp), [sp]);
    const [local, setLocal] = useState(initial);

    const setParam = (key, value) => {
        const params = writeParam(sp, key, value);
        router.push(`/listings?${params.toString()}`);
        onApply?.();
    };

    const applyAll = (e) => {
        e?.preventDefault?.();
        // Push all local into URL
        let params = new URLSearchParams(sp.toString());
        const kv = {
            q: local.q,
            category: local.category,
            type: local.type,
            minPrice: local.minPrice,
            maxPrice: local.maxPrice,
            sort: local.sort,
        };
        Object.entries(kv).forEach(([k, v]) => {
            params = writeParam(params, k, v);
        });
        router.push(`/listings?${params.toString()}`);
        onApply?.();
    };

    const resetFilters = () => {
        router.push(`/listings`);
        onApply?.();
    };

    const activeChips = [
        local.q && { key: "q", label: `Query: “${local.q}”` },
        local.category !== "all" && { key: "category", label: `Category: ${local.category}` },
        local.type !== "all" && { key: "type", label: `Type: ${local.type}` },
        local.minPrice && { key: "minPrice", label: `Min ৳${Number(local.minPrice).toLocaleString("en-BD")}` },
        local.maxPrice && { key: "maxPrice", label: `Max ৳${Number(local.maxPrice).toLocaleString("en-BD")}` },
    ].filter(Boolean);

    return (
        <section className="relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={bgImage}
                    alt="Listings"
                    className="w-full h-[64vh] md:h-[80vh] bg-center object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/35" />
            </div>

            {/* Content */}
            <div className="px-4 max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="pt-10 md:pt-14 text-white"
                >
                    <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
                    <p className="mt-2 text-white/85">
                        {total ? `${total.toLocaleString("en-BD")} result${total > 1 ? "s" : ""}` : "Find your next home"}
                    </p>
                </motion.div>

                {/* Glass filter card */}
                <motion.form
                    onSubmit={applyAll}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="
            mt-5 md:mt-7
            rounded-2xl border border-white/25 bg-white/12 backdrop-blur-xl
            shadow-[0_20px_60px_rgba(0,0,0,0.25)]
            p-3 md:p-4 text-white
          "
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                        {/* Search */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-2 py-1.5 md:px-3 md:py-2 md:min-w-[220px]">
                            <Search className="w-4 h-4 opacity-80" />
                            <input
                                value={local.q}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                placeholder="Search by title, area, address…"
                                className="w-full bg-transparent outline-none placeholder-white/70 text-sm"
                            />
                        </div>

                        {/* Category */}
                        <select
                            value={local.category}
                            onChange={(e) => setLocal((s) => ({ ...s, category: e.target.value }))}
                            className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm outline-none"
                            aria-label="Category"
                        >
                            <option className="text-black" value="all">All categories</option>
                            <option className="text-black" value="house">House</option>
                            <option className="text-black" value="flat">Flat</option>
                            <option className="text-black" value="land">Land</option>
                        </select>

                        {/* Type */}
                        <select
                            value={local.type}
                            onChange={(e) => setLocal((s) => ({ ...s, type: e.target.value }))}
                            className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm outline-none"
                            aria-label="Type"
                        >
                            <option className="text-black" value="all">Any type</option>
                            <option className="text-black" value="sale">For sale</option>
                            <option className="text-black" value="rent">For rent</option>
                        </select>

                        {/* Price */}
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={local.minPrice}
                                onChange={(e) => setLocal((s) => ({ ...s, minPrice: e.target.value }))}
                                placeholder="Min ৳"
                                className="w-24 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/70"
                            />
                            <span className="opacity-70">–</span>
                            <input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={local.maxPrice}
                                onChange={(e) => setLocal((s) => ({ ...s, maxPrice: e.target.value }))}
                                placeholder="Max ৳"
                                className="w-24 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/70"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2 md:ml-auto">
                            <SlidersHorizontal className="h-4 w-4 opacity-80" />
                            <label className="text-sm">Sort</label>
                            <select
                                value={local.sort}
                                onChange={(e) => setLocal((s) => ({ ...s, sort: e.target.value }))}
                                className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm outline-none"
                            >
                                <option className="text-black" value="-createdAt">Newest</option>
                                <option className="text-black" value="price">Price: Low to High</option>
                                <option className="text-black" value="-price">Price: High to Low</option>
                                <option className="text-black" value="title">Title A–Z</option>
                                <option className="text-black" value="-title">Title Z–A</option>
                            </select>
                        </div>

                        {/* Apply */}
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm bg-white text-[var(--sp-primary)] hover:bg-white/90"
                            title="Apply"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Apply
                        </button>
                    </div>

                    {/* Active filter chips */}
                    {activeChips.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {activeChips.map((chip) => (
                                <button
                                    key={chip.key}
                                    onClick={() => {
                                        setLocal((s) => ({ ...s, [chip.key]: chip.key.includes("Price") ? "" : "" }));
                                        const params = writeParam(sp, chip.key, "");
                                        router.push(`/listings?${params.toString()}`);
                                        onApply?.();
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs"
                                    title="Remove filter"
                                >
                                    {chip.label}
                                    <X className="w-3.5 h-3.5 opacity-80" />
                                </button>
                            ))}
                            <button
                                onClick={resetFilters}
                                className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs"
                            >
                                Reset all
                            </button>
                        </div>
                    )}
                </motion.form>
            </div>

            <div className="h-6 md:h-10" />
        </section>
    );
}
