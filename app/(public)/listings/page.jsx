// app/listings/page.jsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin, Lock, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ListingsHero from "@/components/listings/ListingHero"; // ensure this path & props match
import SectionHeader from "@/components/common/SectionHeader";

const PAGE_SIZE = 12;

const readFilters = (sp) => ({
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "all",
    type: sp.get("type") ?? "all",
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
    page: Number(sp.get("page") || 1),
    sort: sp.get("sort") ?? "-createdAt", // newest by default
});

const writeParam = (searchParams, key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === null || value === "" || value === "all") params.delete(key);
    else params.set(key, String(value));
    if (key !== "page") params.delete("page"); // reset to page 1 on filter change
    return params;
};

const formatBDT = (n) => (n == null ? "" : `৳${Number(n).toLocaleString("en-BD")}`);

export default function ListingsPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const { user } = useAuth?.() || {};

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [refreshing, setRefreshing] = useState(false);

    const filters = useMemo(() => readFilters(sp), [sp]);
    const fmt = useMemo(() => new Intl.NumberFormat("en-BD"), []);

    const setParam = (key, value) => {
        const params = writeParam(sp, key, value);
        router.push(`/listings?${params.toString()}`);
    };

    const resetAll = () => {
        router.push("/listings"); // clears all query params
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { q, category, type, minPrice, maxPrice, page, sort } = filters;
            const { data } = await api.get("/listings", {
                params: {
                    q: q || undefined,
                    category: category === "all" ? undefined : category,
                    type: type === "all" ? undefined : type,
                    minPrice: minPrice || undefined,
                    maxPrice: maxPrice || undefined,
                    page,
                    limit: PAGE_SIZE,
                    sort: sort || "-createdAt",
                    status: "approved",
                },
            });
            setRows(data.items || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sp]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const openListing = useCallback(
        (id) => {
            const next = `/listings/${id}`;
            if (!user) {
                router.push(`/login?next=${encodeURIComponent(next)}`);
                return;
            }
            router.push(next);
        },
        [router, user]
    );

    const onKeyActivate = (e, id) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openListing(id);
        }
    };

    // Compact summary shown above results
    const subtitle = useMemo(() => {
        const parts = [];
        if (filters.q) parts.push(`“${filters.q}”`);
        if (filters.category !== "all") parts.push(`Category: ${filters.category}`);
        if (filters.type !== "all") parts.push(`Type: ${filters.type}`);
        if (filters.minPrice) parts.push(`Min: ${formatBDT(filters.minPrice)}`);
        if (filters.maxPrice) parts.push(`Max: ${formatBDT(filters.maxPrice)}`);
        const filtersText = parts.length ? ` • ${parts.join(" • ")}` : "";
        return `${fmt.format(total)} result${total === 1 ? "" : "s"}${filtersText}`;
    }, [filters, total, fmt]);

    return (
        <>
            {/* HERO — the ONLY filtering UI */}
            <ListingsHero
                total={total}
                initial={filters}
                onChange={(key, value) => setParam(key, value)}
                onApply={fetchData}
                onReset={resetAll}
            />

            <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6">
                {/* Top actions row (no duplicate filters here) */}
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                        title="Refresh"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>

                {/* RESULTS header */}
                <SectionHeader title="Results" subtitle={subtitle} align="left" className="!mb-0" />

                {/* Results grid */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    {loading ? (
                        <div className="flex justify-center py-12 text-slate-500">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-slate-500 py-12 text-center">No listings found.</div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {rows.map((it) => {
                                const locked = !user;
                                return (
                                    <div
                                        key={it._id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => openListing(it._id)}
                                        onKeyDown={(e) => onKeyActivate(e, it._id)}
                                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        title={locked ? "Login required to view details" : "View details"}
                                    >
                                        {/* Thumb */}
                                        <div className="relative h-48 w-full bg-slate-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={it.images?.[0] || "/placeholder.jpg"}
                                                alt={it.title || "Listing"}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className="absolute top-2 left-2 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
                                                {it.type === "rent" ? "For Rent" : "For Sale"}
                                            </span>
                                            {!user && (
                                                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/55 backdrop-blur px-2 py-1 text-xs font-medium text-white">
                                                    <Lock className="h-3.5 w-3.5" />
                                                    Login to view
                                                </span>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-semibold text-slate-800 truncate">{it.title || "Untitled"}</h3>
                                            <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span className="truncate">{it.address || "—"}</span>
                                            </div>
                                            <div className="mt-auto pt-4 text-indigo-600 font-semibold">
                                                {it.price ? formatBDT(it.price) : "Price on request"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex items-center justify-between px-1 py-3 text-sm mt-4">
                            <span className="text-slate-600">
                                Page <strong>{filters.page}</strong> of <strong>{pages}</strong>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={filters.page <= 1}
                                    onClick={() => setParam("page", String(filters.page - 1))}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={filters.page >= pages}
                                    onClick={() => setParam("page", String(filters.page + 1))}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
