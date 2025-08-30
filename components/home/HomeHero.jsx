"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";

/** Helpers: read & write filters via querystring */
const readFilters = (sp) => ({
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "all", // 'house' | 'flat' | 'land' | 'all'
    type: sp.get("type") ?? "all",         // 'sale' | 'rent' | 'all'
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
});
const toQuery = (f) => {
    const params = new URLSearchParams();
    if (f.q) params.set("q", f.q);
    if (f.category && f.category !== "all") params.set("category", f.category);
    if (f.type && f.type !== "all") params.set("type", f.type);
    if (f.minPrice) params.set("minPrice", String(f.minPrice));
    if (f.maxPrice) params.set("maxPrice", String(f.maxPrice));
    return params.toString();
};

export default function HomeHero({
    bgImage = "/hero-bg.jpg",
    title = "Find Your Perfect Place",
    subtitle = "Search approved listings for sale or rent — houses, flats & land.",
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // initial state from URL (keeps state if user navigates back here with params)
    const initial = useMemo(() => readFilters(searchParams), [searchParams]);
    const [local, setLocal] = useState(initial);

    // Route-based filtering: send the user to /listings with the filters in the URL
    const goToListings = (f) => {
        const qs = toQuery(f);
        router.push(qs ? `/listings?${qs}` : "/listings");
    };
    const onHeroSubmit = (e) => {
        e.preventDefault();
        goToListings(local);
    };

    return (
        <section className="relative h-[70vh] md:h-[72vh] overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={bgImage}
                    alt="Find your next home"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/40 to-black/35" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38 }}
                    className="w-full max-w-6xl"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{title}</h1>
                    <p className="mt-3 text-white/85 md:text-lg">{subtitle}</p>

                    {/* GLASS BAR — single row on desktop, stacked on mobile */}
                    <form
                        onSubmit={onHeroSubmit}
                        className="
              mt-6 md:mt-8
              rounded-2xl border border-white/25
              bg-white/12 backdrop-blur-xl
              shadow-[0_20px_60px_rgba(0,0,0,0.25)]
              px-3 py-3 md:px-4 md:py-4
              flex flex-col md:flex-row md:items-center max-w-5xl mx-auto md:flex-nowrap gap-3 md:gap-4
              text-white
            "
                    >
                        {/* Search */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-2 py-1.5 md:px-3 md:py-2 md:min-w-[220px]">
                            <Search className="w-4 h-4 opacity-80" />
                            <input
                                value={local.q}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                placeholder="Search..."
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
                                placeholder="Min"
                                className="w-24 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/70"
                            />
                            <span className="opacity-70">–</span>
                            <input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={local.maxPrice}
                                onChange={(e) => setLocal((s) => ({ ...s, maxPrice: e.target.value }))}
                                placeholder="Max"
                                className="w-24 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/70"
                            />
                        </div>

                        {/* Submit → navigates to /listings with filters in the URL */}
                        <button
                            type="submit"
                            className="ml-0 md:ml-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm
                         bg-white text-[var(--sp-primary)] hover:bg-white/90"
                            title="Search"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Apply
                        </button>
                    </form>

                    {/* Quick link */}
                    <div className="flex flex-wrap gap-3 justify-center mt-5">
                        <Link className="px-4 py-2 bg-white/95 rounded-xl hover:bg-white" href="/listings">
                            Browse Listings
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
