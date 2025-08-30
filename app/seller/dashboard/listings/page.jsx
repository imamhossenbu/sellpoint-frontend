// app/seller/dashboard/listings/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import Swal from "sweetalert2"; // <-- NEW

const PAGE_SIZE = 10;
const TABS = [
    { key: "all", label: "All" },
    { key: "approved", label: "Approved" },
    { key: "pending", label: "Pending" },
    { key: "rejected", label: "Rejected" },
];

export default function SellerListingsPage() {
    const router = useRouter();
    const sp = useSearchParams();

    const initial = useMemo(
        () => ({
            status: sp.get("status") || "all",
            q: sp.get("q") || "",
            page: Number(sp.get("page") || 1),
        }),
        [sp]
    );

    const [status, setStatus] = useState(initial.status);
    const [q, setQ] = useState(initial.q);
    const [page, setPage] = useState(initial.page);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);

    function syncUrl(next) {
        const params = new URLSearchParams();
        if (next.status && next.status !== "all") params.set("status", next.status);
        if (next.q) params.set("q", next.q);
        if (next.page && next.page > 1) params.set("page", String(next.page));
        router.push(
            params.toString()
                ? `/seller/dashboard/listings?${params}`
                : `/seller/dashboard/listings`
        );
    }

    async function fetchData({ status, q, page }) {
        setLoading(true);
        try {
            const { data } = await api.get("/seller/listings", {
                params: {
                    status: status === "all" ? undefined : status,
                    q: q || undefined,
                    page: page || 1,
                    limit: PAGE_SIZE,
                },
            });
            setItems(data.items || []);
            setTotal(data.total || 0);
        } catch {
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setStatus(initial.status);
        setQ(initial.q);
        setPage(initial.page);
        fetchData(initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sp]);

    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const onTab = (key) => {
        const next = { status: key, q: "", page: 1 };
        setStatus(next.status);
        setQ(next.q);
        setPage(next.page);
        syncUrl(next);
        fetchData(next);
    };

    const onSearchSubmit = (e) => {
        e.preventDefault();
        const next = { status, q, page: 1 };
        setPage(1);
        syncUrl(next);
        fetchData(next);
    };

    const onPage = (p) => {
        const next = { status, q, page: p };
        setPage(p);
        syncUrl(next);
        fetchData(next);
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold text-brand">My Listings</h1>
                <Link
                    href="/seller/dashboard/create"
                    className="inline-flex items-center gap-2 rounded-xl btn-brand px-4 py-2 text-white"
                >
                    <Plus className="w-4 h-4" /> New Listing
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {TABS.map((t) => {
                    const active = status === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => onTab(t.key)}
                            className={`brand-chip ${active ? "bg-white shadow-sm border-brand-light" : ""
                                }`}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Search bar */}
            <form
                onSubmit={onSearchSubmit}
                className="flex items-center gap-2 rounded-2xl border border-[var(--sp-light)] bg-white p-2 shadow-sm"
            >
                <div className="flex items-center gap-2 flex-1 rounded-xl border border-[var(--sp-light)] px-3 py-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by title, address, area…"
                        className="w-full outline-none"
                    />
                </div>
                <button className="btn-outline-brand rounded-xl px-4 py-2">
                    Search
                </button>
            </form>

            {/* Table / Cards */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 text-sm text-slate-600">
                    <div className="col-span-5">Title</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="p-6 text-slate-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-6 text-slate-600">No listings found.</div>
                ) : (
                    <ul className="divide-y">
                        {items.map((it) => (
                            <li key={it._id} className="px-4 py-4">
                                {/* Desktop row */}
                                <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-5 flex items-center gap-3">
                                        <Thumb src={it.images?.[0]} />
                                        <div>
                                            <div className="font-medium text-slate-800 line-clamp-1">
                                                {it.title}
                                            </div>
                                            <div className="text-sm text-slate-500 line-clamp-1">
                                                {it.address}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 capitalize">{it.type}</div>
                                    <div className="col-span-2">BDT {formatNum(it.price)}</div>
                                    <div className="col-span-2">
                                        <StatusBadge status={it.status} />
                                    </div>
                                    <div className="col-span-1">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/listings/${it._id}`}
                                                className="p-2 rounded-lg border hover:bg-slate-50"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/seller/dashboard/listings/${it._id}/edit`}
                                                className="p-2 rounded-lg border hover:bg-slate-50"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    onDelete(it._id, {
                                                        after: () => fetchData({ status, q, page }),
                                                    })
                                                }
                                                className="p-2 rounded-lg border hover:bg-slate-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile card */}
                                <div className="md:hidden flex items-center gap-3">
                                    <Thumb src={it.images?.[0]} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-800 line-clamp-1">
                                            {it.title}
                                        </div>
                                        <div className="text-sm text-slate-500 line-clamp-1">
                                            {it.address}
                                        </div>
                                        <div className="mt-1 text-sm flex items-center gap-2">
                                            <span className="capitalize">{it.type}</span>
                                            <span className="opacity-40">•</span>
                                            <span>BDT {formatNum(it.price)}</span>
                                        </div>
                                        <div className="mt-1">
                                            <StatusBadge status={it.status} />
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Link
                                                href={`/listings/${it._id}`}
                                                className="px-2 py-1 rounded border text-sm"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={`/seller/dashboard/listings/${it._id}/edit`}
                                                className="px-2 py-1 rounded border text-sm"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    onDelete(it._id, {
                                                        after: () => fetchData({ status, q, page }),
                                                    })
                                                }
                                                className="px-2 py-1 rounded border text-sm text-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Pagination */}
                {!loading && pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                        <button
                            onClick={() => onPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <div className="text-sm text-slate-600">
                            Page <span className="font-medium">{page}</span> / {pages}
                        </div>
                        <button
                            onClick={() => onPage(Math.min(pages, page + 1))}
                            disabled={page >= pages}
                            className="px-3 py-1.5 rounded-lg border disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Thumb({ src }) {
    return (
        <div className="h-16 w-24 rounded-lg overflow-hidden bg-slate-100 border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src || "/placeholder.jpg"}
                alt=""
                className="h-full w-full object-cover"
            />
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pending: "bg-amber-50 text-amber-700 border-amber-200",
        rejected: "bg-rose-50 text-rose-700 border-rose-200",
        expired: "bg-slate-50 text-slate-600 border-slate-200",
    };
    const cls = map[status] || "bg-slate-50 text-slate-600 border-slate-200";
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 text-xs border rounded-full capitalize ${cls}`}
        >
            {status || "unknown"}
        </span>
    );
}

function formatNum(n) {
    try {
        return new Intl.NumberFormat().format(n ?? 0);
    } catch {
        return String(n ?? 0);
    }
}

// ---- SweetAlert-powered delete ----
async function onDelete(id, { after } = {}) {
    const result = await Swal.fire({
        title: "Delete this listing?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
        focusCancel: true,
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async () => {
            try {
                await api.delete(`/seller/listings/${id}`);
                return true;
            } catch (err) {
                const msg =
                    err?.response?.data?.message || "Failed to delete. Please try again.";
                Swal.showValidationMessage(msg);
                return false;
            }
        },
    });

    if (result.isConfirmed) {
        await Swal.fire({
            title: "Deleted",
            text: "The listing has been removed.",
            icon: "success",
            timer: 1300,
            showConfirmButton: false,
        });
        after?.();
    }
}
