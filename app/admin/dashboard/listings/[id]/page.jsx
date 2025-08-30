// app/admin/dashboard/listings/[id]/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    Eye,
    MapPin,
    Tag,
    User2,
    CalendarClock,
    Ruler,
    DollarSign,
    Copy,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminListingDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [listing, setListing] = useState(null);
    const [toast, setToast] = useState(null);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);
    const fmtBDT = useMemo(
        () =>
            new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
                maximumFractionDigits: 0,
            }),
        []
    );

    const fire = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/listings/${id}`);
            setListing(data);
        } catch (e) {
            fire("error", e?.response?.data?.message || "Failed to load listing.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const approve = async () => {
        if (!confirm("Approve this listing?")) return;
        setBusy(true);
        try {
            await api.patch(`/admin/listings/${id}/approve`);
            await load();
            fire("success", "Listing approved.");
        } catch (e) {
            fire("error", e?.response?.data?.message || "Failed to approve.");
        } finally {
            setBusy(false);
        }
    };

    const reject = async () => {
        if (!confirm("Reject this listing?")) return;
        setBusy(true);
        try {
            await api.patch(`/admin/listings/${id}/reject`);
            await load();
            fire("success", "Listing rejected.");
        } catch (e) {
            fire("error", e?.response?.data?.message || "Failed to reject.");
        } finally {
            setBusy(false);
        }
    };

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(String(id));
            fire("success", "Listing ID copied to clipboard.");
        } catch {
            fire("error", "Failed to copy.");
        }
    };

    return (
        <div className="grid gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/dashboard/listings"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <h1 className="text-2xl font-semibold text-brand">Listing Details</h1>
                </div>

                <div className="flex items-center gap-2">
                    {listing && (
                        <>
                            {listing.status !== "approved" && (
                                <ActionBtn onClick={approve} disabled={busy} icon={<CheckCircle2 className="h-4 w-4" />}>
                                    Approve
                                </ActionBtn>
                            )}
                            {listing.status !== "rejected" && (
                                <ActionBtn onClick={reject} disabled={busy} danger icon={<XCircle className="h-4 w-4" />}>
                                    Reject
                                </ActionBtn>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: main info */}
                <div className="lg:col-span-2 grid gap-6">
                    {/* Title & meta */}
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                        {loading ? (
                            <SkeletonLines lines={3} />
                        ) : !listing ? (
                            <div className="text-slate-500 text-sm">Listing not found.</div>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-xl font-semibold text-slate-800">{listing.title || "Untitled"}</h2>
                                    <StatusPill status={listing.status} />
                                    <button
                                        onClick={copyId}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                        title="Copy ID"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        {String(id).slice(0, 8)}…
                                    </button>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                    <Meta icon={<DollarSign className="h-4 w-4" />} label="Price" value={fmtBDT.format(listing.price || 0)} />
                                    <Meta icon={<Tag className="h-4 w-4" />} label="Type" value={listing.type || "—"} />
                                    <Meta icon={<Tag className="h-4 w-4" />} label="Category" value={listing.category || "—"} />
                                    <Meta icon={<Ruler className="h-4 w-4" />} label="Area" value={listing.area || "—"} />
                                    <Meta icon={<MapPin className="h-4 w-4" />} label="Address" value={listing.address || "—"} />
                                    <Meta
                                        icon={<CalendarClock className="h-4 w-4" />}
                                        label="Created"
                                        value={new Date(listing.createdAt).toLocaleString()}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Gallery */}
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                        <div className="mb-3 font-medium text-slate-800">Photos</div>
                        {loading ? (
                            <SkeletonGrid />
                        ) : listing?.images?.length ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {listing.images.map((src, i) => (
                                    <div key={i} className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                        {/* If you use next/image, swap to <Image fill ... /> */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500">No images uploaded.</div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                        <div className="mb-3 font-medium text-slate-800">Description</div>
                        {loading ? (
                            <SkeletonLines lines={6} />
                        ) : (
                            <p className="text-sm text-slate-700 whitespace-pre-line">
                                {listing?.description || "—"}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: seller + metrics */}
                <div className="grid gap-6">
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                        <div className="mb-3 font-medium text-slate-800">Seller</div>
                        {loading ? (
                            <SkeletonLines lines={3} />
                        ) : (
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-slate-100 p-2">
                                    <User2 className="h-5 w-5 text-slate-600" />
                                </div>
                                <div className="grid">
                                    <div className="font-medium text-slate-800">
                                        {listing?.seller?.name || listing?.seller?.email || "—"}
                                    </div>
                                    <div className="text-xs text-slate-500">{listing?.seller?.email || "—"}</div>
                                    {listing?.seller?._id && (
                                        <Link
                                            href={`/admin/dashboard/users?q=${encodeURIComponent(listing.seller.email || "")}`}
                                            className="mt-2 inline-flex w-max items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                        >
                                            View user
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                        <div className="mb-3 font-medium text-slate-800">Performance</div>
                        {loading ? (
                            <SkeletonLines lines={2} />
                        ) : (
                            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <div className="inline-flex items-center gap-2 text-slate-700">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-sm">Views</span>
                                </div>
                                <div className="text-slate-800 font-semibold">{fmt.format(listing?.views || 0)}</div>
                            </div>
                        )}
                    </div>

                    {/* Actions duplicate (for convenience on mobile) */}
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                        <div className="mb-3 font-medium text-slate-800">Moderation</div>
                        {listing ? (
                            <div className="flex flex-wrap gap-2">
                                {listing.status !== "approved" && (
                                    <ActionBtn onClick={approve} disabled={busy} icon={<CheckCircle2 className="h-4 w-4" />}>
                                        Approve
                                    </ActionBtn>
                                )}
                                {listing.status !== "rejected" && (
                                    <ActionBtn onClick={reject} disabled={busy} danger icon={<XCircle className="h-4 w-4" />}>
                                        Reject
                                    </ActionBtn>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500">—</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow ${toast.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}
                    {toast.message}
                </div>
            )}
        </div>
    );
}

/* ---------- UI bits ---------- */

function Meta({ icon, label, value }) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-slate-600">{icon}</div>
            <div className="grid">
                <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
                <span className="text-slate-800">{value}</span>
            </div>
        </div>
    );
}

function StatusPill({ status = "pending" }) {
    const map = {
        approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
        pending: "bg-amber-50 text-amber-700 border-amber-100",
        rejected: "bg-rose-50 text-rose-700 border-rose-100",
        expired: "bg-slate-50 text-slate-600 border-slate-100",
    };
    const cls = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${cls}`}>
            {status}
        </span>
    );
}

function ActionBtn({ children, onClick, icon, danger = false, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${danger
                    ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                } disabled:opacity-50`}
        >
            {icon}
            {children}
        </button>
    );
}

function SkeletonLines({ lines = 3 }) {
    return (
        <div className="grid gap-2">
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-slate-100 animate-pulse" />
            ))}
        </div>
    );
}
function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-slate-100 animate-pulse" />
            ))}
        </div>
    );
}
