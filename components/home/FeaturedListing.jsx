// components/home/FeaturedListings.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Lock } from "lucide-react";
import { api } from "@/lib/api";
import SectionHeader from "../common/SectionHeader";
import { useAuth } from "@/hooks/useAuth"; // make sure this path matches your project

export default function FeaturedListings() {
    const router = useRouter();
    const { user } = useAuth?.() || {}; // gracefully handle if hook path differs

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // latest approved listings
                const { data } = await api.get("/listings", {
                    params: { status: "approved", limit: 6, sort: "-createdAt" },
                });
                setItems(data.items || []);
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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

    // keyboard access (Enter/Space)
    const onKeyActivate = (e, id) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openListing(id);
        }
    };

    return (
        <section className="max-w-6xl mx-auto px-4">
            <SectionHeader
                title="Featured Listings"
                subtitle="Handpicked properties recently approved — explore the best houses, flats, and land."
                align="center"
            />

            {loading ? (
                <div className="flex justify-center py-12 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-slate-500 py-12 text-center">No listings found.</div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((it) => {
                        const isLocked = !user; // show a small lock hint when not logged in
                        return (
                            <div
                                key={it._id}
                                role="button"
                                tabIndex={0}
                                onClick={() => openListing(it._id)}
                                onKeyDown={(e) => onKeyActivate(e, it._id)}
                                className="cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                title={isLocked ? "Login required to view details" : "View details"}
                            >
                                {/* Thumbnail */}
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

                                    {isLocked && (
                                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/55 backdrop-blur px-2 py-1 text-xs font-medium text-white">
                                            <Lock className="h-3.5 w-3.5" />
                                            Login to view
                                        </span>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-slate-800 truncate">
                                        {it.title || "Untitled"}
                                    </h3>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="truncate">{it.address || "—"}</span>
                                    </div>
                                    <div className="mt-auto pt-4 text-indigo-600 font-semibold">
                                        {it.price
                                            ? `৳${Number(it.price).toLocaleString("en-BD")}`
                                            : "Price on request"}
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
