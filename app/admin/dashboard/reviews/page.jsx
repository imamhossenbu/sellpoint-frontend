// app/admin/dashboard/reviews/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import {
    Search,
    RefreshCw,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Star,
} from "lucide-react";
import { api } from "@/lib/api";

const PAGE_SIZE = 12;

export default function AdminReviewsPage() {
    const search = useSearchParams();
    const router = useRouter();

    const status = search.get("status") || "all"; // all|pending|approved|rejected
    const qParam = search.get("q") || "";
    const page = Number(search.get("page") || 1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState(null);

    // modal
    const [openModal, setOpenModal] = useState(false);
    const [viewing, setViewing] = useState(null);

    // local search input
    const [q, setQ] = useState(qParam);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);

    const setParam = (key, value) => {
        const params = new URLSearchParams(search.toString());
        if (!value || value === "all" || value === "") params.delete(key);
        else params.set(key, value);
        if (key !== "page") params.delete("page");
        router.push(`/admin/dashboard/reviews?${params.toString()}`);
    };

    async function fetchData() {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/reviews", {
                params: { status: status === "all" ? undefined : status },
            });
            setRows(Array.isArray(data?.items) ? data.items : []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setQ(qParam);
    }, [qParam]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return rows;
        return rows.filter((r) => {
            const fields = [
                r?.listing?.title,
                r?.user?.name,
                r?.user?.email,
                r?.comment,
                String(r?.rating),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return fields.includes(needle);
        });
    }, [rows, q]);

    // counts for tabs (from current dataset)
    const counts = useMemo(() => {
        const all = rows.length;
        const p = rows.filter((r) => r.status === "pending").length;
        const a = rows.filter((r) => r.status === "approved").length;
        const rj = rows.filter((r) => r.status === "rejected").length;
        return { all, pending: p, approved: a, rejected: rj };
    }, [rows]);

    // client-side pagination
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const clampedPage = Math.min(Math.max(1, page || 1), pages);
    const pageStart = (clampedPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

    const openView = (row) => {
        setViewing(row);
        setOpenModal(true);
    };

    const setStatus = async (row, newStatus) => {
        setBusyId(row._id);
        try {
            await api.patch(`/admin/reviews/${row._id}/status`, { status: newStatus });
            await Swal.fire({ icon: "success", title: "Updated" });
            await refresh();
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Failed",
                text:
                    e?.response?.data?.message ||
                    "Could not update review status. Please try again.",
            });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="grid gap-6">
            {/* Page hero */}
            <div className="rounded-3xl p-6 md:p-8 brand-gradient text-white shadow-[0_20px_60px_rgba(26,42,128,0.25)]">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold">Reviews</h1>
                        <p className="text-white/85 mt-1">
                            Moderate listing reviews. Approve, reject, or set pending.
                        </p>
                    </div>
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm ring-1 ring-white/30 hover:bg-white/20"
                    >
                        {refreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                    </button>
                </div>

                {/* Tabs + search bar (glass) */}
                <div className="mt-5 grid gap-3 md:grid-cols-[auto,1fr] md:items-center">
                    <Tabs
                        active={status}
                        counts={counts}
                        onChange={(v) => setParam("status", v)}
                    />
                    <div className="glass-card flex items-center gap-2 px-3 py-2.5">
                        <Search className="h-4 w-4 text-white/90" />
                        <input
                            placeholder="Search by listing, user, rating, comment…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && setParam("q", q)}
                            className="w-full bg-transparent outline-none placeholder-white/80 text-sm text-white"
                        />
                        {!!q && (
                            <button
                                onClick={() => {
                                    setQ("");
                                    setParam("q", "");
                                }}
                                className="text-white/90 hover:text-white text-sm"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table card */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr className="text-slate-600">
                                <Th>Created</Th>
                                <Th>Listing</Th>
                                <Th>User</Th>
                                <Th>Rating</Th>
                                <Th>Comment</Th>
                                <Th>Status</Th>
                                <Th className="text-right pr-4">Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonRows />
                            ) : pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14">
                                        <EmptyState />
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map((r, idx) => (
                                    <tr
                                        key={r._id}
                                        className={`border-t ${idx % 2 ? "bg-white" : "bg-slate-50/40"}`}
                                    >
                                        <Td className="text-slate-500">{formatDateTime(r.createdAt)}</Td>
                                        <Td className="max-w-[280px]">
                                            <div className="truncate">
                                                <div className="font-medium text-slate-800 truncate">
                                                    {r?.listing?.title || "—"}
                                                </div>
                                                {r?.listing?._id ? (
                                                    <Link
                                                        href={`/listings/${r.listing._id}`}
                                                        className="text-xs text-indigo-600 hover:underline"
                                                    >
                                                        View listing
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </Td>
                                        <Td className="max-w-[220px]">
                                            <div className="truncate">
                                                <div className="font-medium text-slate-800 truncate">
                                                    {r?.user?.name || "—"}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {r?.user?.email || ""}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <StarRow value={Number(r.rating) || 0} />
                                        </Td>
                                        <Td className="max-w-[420px]">
                                            <div className="truncate">{r.comment || "—"}</div>
                                        </Td>
                                        <Td>
                                            <StatusPill status={r.status} />
                                        </Td>
                                        <Td className="text-right pr-3">
                                            <div className="inline-flex flex-wrap items-center gap-2 justify-end">
                                                <ActionBtn
                                                    title="View"
                                                    onClick={() => openView(r)}
                                                    icon={<Eye className="h-4 w-4" />}
                                                />
                                                <ActionBtn
                                                    title="Approve"
                                                    onClick={() => setStatus(r, "approved")}
                                                    disabled={busyId === r._id || r.status === "approved"}
                                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                                />
                                                <ActionBtn
                                                    title="Reject"
                                                    onClick={() => setStatus(r, "rejected")}
                                                    disabled={busyId === r._id || r.status === "rejected"}
                                                    icon={<XCircle className="h-4 w-4" />}
                                                    danger
                                                />
                                                <ActionBtn
                                                    title="Pending"
                                                    onClick={() => setStatus(r, "pending")}
                                                    disabled={busyId === r._id || r.status === "pending"}
                                                    icon={<Clock className="h-4 w-4" />}
                                                />
                                            </div>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: results + pagination */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 py-3 text-sm border-t bg-slate-50">
                    <span className="text-slate-600">
                        Showing{" "}
                        <strong className="text-slate-800">{fmt.format(pageItems.length)}</strong>{" "}
                        of <strong className="text-slate-800">{fmt.format(filtered.length)}</strong>{" "}
                        results
                    </span>
                    {pages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                disabled={clampedPage <= 1}
                                onClick={() => setParam("page", String(clampedPage - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <div className="px-2 text-slate-600">
                                Page <strong>{clampedPage}</strong> / <strong>{pages}</strong>
                            </div>
                            <button
                                disabled={clampedPage >= pages}
                                onClick={() => setParam("page", String(clampedPage + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: view full review */}
            {openModal && viewing && (
                <Modal title="Review details" onClose={() => setOpenModal(false)}>
                    <div className="grid gap-4 text-sm">
                        <div className="grid md:grid-cols-2 gap-3">
                            <Field label="Created" value={formatDateTime(viewing.createdAt)} />
                            <div>
                                <div className="text-slate-500">Rating</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <StarRow value={Number(viewing.rating) || 0} />
                                    <span className="text-slate-700">{viewing.rating}/5</span>
                                </div>
                            </div>
                        </div>

                        <Field label="Listing" value={viewing?.listing?.title || "—"} />
                        <Field
                            label="User"
                            value={
                                (viewing?.user?.name || "—") +
                                (viewing?.user?.email ? ` • ${viewing.user.email}` : "")
                            }
                        />

                        <div>
                            <div className="text-slate-500">Comment</div>
                            <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 whitespace-pre-wrap">
                                {viewing.comment || "—"}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <StatusPill status={viewing.status} />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setOpenModal(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={async () => {
                                        await setStatus(viewing, "approved");
                                        setOpenModal(false);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

/* ---------- Decorative / UI helpers ---------- */

function Tabs({ active = "all", counts, onChange }) {
    const tabs = [
        { key: "all", label: "All", count: counts.all },
        { key: "pending", label: "Pending", count: counts.pending },
        { key: "approved", label: "Approved", count: counts.approved },
        { key: "rejected", label: "Rejected", count: counts.rejected },
    ];
    return (
        <div className="inline-flex flex-wrap items-center gap-2">
            {tabs.map((t) => {
                const is = active === t.key;
                return (
                    <button
                        key={t.key}
                        onClick={() => onChange(t.key)}
                        className={`rounded-xl px-3 py-1.5 text-sm ring-1 ${is
                                ? "bg-white text-[var(--sp-primary)] ring-white/50"
                                : "bg-white/10 text-white/90 ring-white/20 hover:bg-white/15"
                            }`}
                    >
                        {t.label}{" "}
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${is ? "bg-[var(--sp-primary)] text-white" : "bg-white/20"
                            }`}>
                            {t.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t">
                    {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                            <div className="h-3 w-full max-w-[180px] rounded bg-slate-200/70 animate-pulse" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function EmptyState() {
    return (
        <div className="mx-auto max-w-md text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 grid place-items-center">
                <Star className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-800">No reviews found</h3>
            <p className="mt-1 text-sm text-slate-600">
                Try changing the status tab, clearing the search, or refreshing.
            </p>
        </div>
    );
}

function Th({ children, className = "" }) {
    return (
        <th className={`px-3 py-2 text-left font-medium ${className}`}>
            {children}
        </th>
    );
}
function Td({ children, className = "" }) {
    return <td className={`px-3 py-3 align-middle ${className}`}>{children}</td>;
}

function ActionBtn({ title, onClick, icon, danger = false, disabled = false }) {
    return (
        <button
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ring-1 ${danger
                    ? "ring-rose-200 text-rose-700 hover:bg-rose-50"
                    : "ring-slate-200 text-slate-700 hover:bg-slate-50"
                } disabled:opacity-50`}
        >
            {icon}
            {title}
        </button>
    );
}

function Modal({ children, title, onClose }) {
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-x-0 top-16 mx-auto w-[96%] max-w-3xl rounded-2xl border border-[var(--sp-light)] bg-white/95 backdrop-blur-lg p-5 shadow-xl">
                <div className="mb-3 text-lg font-semibold text-slate-800">{title}</div>
                {children}
            </div>
        </div>
    );
}

function StarRow({ value = 0 }) {
    const v = Math.round(value);
    return (
        <div className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`h-4 w-4 ${n <= v ? "text-yellow-500 fill-yellow-400" : "text-slate-300"
                        }`}
                />
            ))}
        </div>
    );
}

function StatusPill({ status }) {
    if (status === "approved") {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                Approved
            </span>
        );
    }
    if (status === "rejected") {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-rose-50 text-rose-700 ring-1 ring-rose-100">
                Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            Pending
        </span>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <div className="text-slate-500">{label}</div>
            <div className="mt-1 text-slate-800">{value}</div>
        </div>
    );
}

/* ---------- Utils ---------- */
function formatDateTime(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
