// app/wishlist/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Heart, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import WishlistHero from "@/components/WishlistHero";

/* ---------- config + small utils ---------- */
const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://localhost:5000";

const strip = (s = "") => String(s).trim();
const isHttp = (u) => /^https?:\/\//i.test(u);
const toAbsolute = (u) => {
    const p = strip(u);
    if (!p) return "";
    if (isHttp(p) || p.startsWith("/")) return p; // absolute or same-origin path
    if (!API_BASE) return `/${p.replace(/^\/+/, "")}`;
    return `${API_BASE.replace(/\/+$/, "")}/${p.replace(/^\/+/, "")}`;
};

/** Pick a good cover image and resolve to absolute URL */
const resolveCover = (l = {}) => {
    if (strip(l.coverUrl)) return toAbsolute(l.coverUrl);
    const imgs = Array.isArray(l.images) ? l.images : [];
    for (const it of imgs) {
        if (!it) continue;
        if (typeof it === "string" && strip(it)) return toAbsolute(it);
        if (typeof it === "object" && (strip(it.url) || strip(it.src))) {
            return toAbsolute(it.url || it.src);
        }
    }
    if (strip(l.photo)) return toAbsolute(l.photo);
    if (strip(l.thumbnail)) return toAbsolute(l.thumbnail);
    return "https://via.placeholder.com/800x600?text=No+Image";
};

function formatNum(n) {
    try {
        return new Intl.NumberFormat().format(n || 0);
    } catch {
        return String(n || 0);
    }
}

function dispatchWishlistChanged(idsOrCount) {
    const detail = Array.isArray(idsOrCount)
        ? { ids: idsOrCount, count: idsOrCount.length }
        : { count: Number(idsOrCount) || 0 };
    try {
        window.dispatchEvent(new CustomEvent("wishlist:changed", { detail }));
    } catch { }
}

/* ---------- page ---------- */
export default function WishlistPage() {
    const { user, ready } = useAuth();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]); // full listing docs

    useEffect(() => {
        if (!ready) return;
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        (async () => {
            setLoading(true);
            try {
                // 1) Get user's wishlist
                const { data } = await api.get("/wishlist/me", { withCredentials: true });
                const raw = Array.isArray(data?.wishlist) ? data.wishlist : [];

                // 2) Normalize to {_id, ...} (some backends return ids)
                const normalized = raw.map((x) =>
                    typeof x === "object" && x !== null ? x : { _id: String(x) }
                );

                // 3) Hydrate any ID-only entries using your GET /listings/:id
                const toHydrate = normalized.filter((l) => !l.title || !l.images);
                if (toHydrate.length) {
                    const results = await Promise.allSettled(
                        toHydrate.map((l) => api.get(`/listings/${l._id}`))
                    );
                    const byId = new Map(
                        results
                            .filter((r) => r.status === "fulfilled" && r.value?.data?._id)
                            .map((r) => [String(r.value.data._id), r.value.data])
                    );
                    for (let i = 0; i < normalized.length; i++) {
                        const id = String(normalized[i]._id);
                        if ((!normalized[i].title || !normalized[i].images) && byId.has(id)) {
                            normalized[i] = byId.get(id);
                        }
                    }
                }

                setItems(normalized);
                dispatchWishlistChanged(normalized.map((x) => x._id));
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [user, ready]);

    const removeOne = async (listingId) => {
        // optimistic update
        const prev = items;
        const next = prev.filter((l) => String(l._id) !== String(listingId));
        setItems(next);
        dispatchWishlistChanged(next.map((x) => x._id));
        try {
            await api.post(`/wishlist/${listingId}/toggle`, null, { withCredentials: true });
            toast.success("Removed from wishlist");
        } catch (e) {
            setItems(prev); // rollback
            dispatchWishlistChanged(prev.map((x) => x._id));
            toast.error(e?.response?.data?.message || "Failed to remove");
        }
    };

    if (!ready || loading) {
        return (
            <div className="mx-auto max-w-6xl p-6 space-y-4">
                <SkeletonGrid />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-3xl p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <Heart className="mx-auto h-10 w-10 text-rose-500" />
                    <h1 className="mt-2 text-xl font-semibold text-slate-900">Your wishlist</h1>
                    <p className="mt-1 text-slate-600">Please sign in to view your wishlist.</p>
                    <div className="mt-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <WishlistHero count={items.length} authed={!!user} />

            <div className="mx-auto max-w-6xl p-6">

                {items.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((l) => (
                            <Card key={l._id} listing={l} onRemove={() => removeOne(l._id)} />
                        ))}
                    </div>
                )}
            </div>

        </>
    );
}



function Card({ listing, onRemove }) {
    const cover = resolveCover(listing);

    return (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <Link href={`/listings/${listing._id}`} className="block relative h-44 w-full">
                <Image
                    src={cover}
                    alt={listing.title || "Listing"}
                    fill
                    className="object-cover"
                    unoptimized
                />
            </Link>
            <div className="p-4 space-y-2">
                <Link
                    href={`/listings/${listing._id}`}
                    className="line-clamp-1 font-semibold text-slate-900 hover:underline"
                    title={listing.title}
                >
                    {listing.title || "Untitled"}
                </Link>

                <div className="text-slate-700">
                    <span className="font-semibold">৳ {formatNum(listing.price)}</span>{" "}
                    <span className="text-slate-500">
                        • {listing.category || "—"} • {listing.type || "—"}
                    </span>
                </div>

                {listing.address ? (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{listing.address}</span>
                    </div>
                ) : null}

                <div className="pt-2 flex items-center justify-between">
                    <Link
                        href={`/listings/${listing._id}`}
                        className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        View
                    </Link>
                    <button
                        onClick={onRemove}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
                        title="Remove"
                    >
                        <Trash2 className="h-4 w-4" /> Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <Heart className="mx-auto h-10 w-10 text-rose-500" />
            <h2 className="mt-2 text-xl font-semibold text-slate-900">No items yet</h2>
            <p className="mt-1 text-slate-600">Save listings to compare and come back later.</p>
            <div className="mt-4">
                <Link
                    href="/listings"
                    className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                >
                    Start browsing
                </Link>
            </div>
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="h-44 w-full bg-slate-200 animate-pulse" />
                    <div className="p-4 space-y-2">
                        <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                        <div className="h-8 w-full bg-slate-200 rounded animate-pulse mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
