// app/admin/dashboard/seller-requests/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCcw,
    Search,
    ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

/**
 * Expected backend endpoints (adjust if your paths differ):
 * GET    /admin/seller-requests          -> { items: [{ _id, user:{name,email}, plan:{name,priceBDT,period}, status, note, createdAt, reviewedAt }] }
 * POST   /admin/seller-requests/:id/approve -> { ok: true, request }
 * POST   /admin/seller-requests/:id/reject  -> { ok: true, request }   body: { note? }
 */

const STATUSES = ["all", "pending", "approved", "rejected"];

export default function AdminSellerRequestsPage() {
    const [loading, setLoading] = useState(true);
    const [list, setList] = useState([]);
    const [status, setStatus] = useState("pending"); // default to Pending tab
    const [q, setQ] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [rejecting, setRejecting] = useState(null); // {id, name} to open modal
    const [note, setNote] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get("/seller-requests", { withCredentials: true });
            setList(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to load seller requests.");
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        let items = list;
        if (status !== "all") {
            items = items.filter((r) => r.status === status);
        }
        if (q.trim()) {
            const s = q.trim().toLowerCase();
            items = items.filter((r) => {
                const u = `${r?.user?.name || ""} ${r?.user?.email || ""}`.toLowerCase();
                const p = `${r?.plan?.name || ""}`.toLowerCase();
                return u.includes(s) || p.includes(s);
            });
        }
        // most recent first (your API already sorts, but keep it stable)
        return [...items].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [list, status, q]);

    const approve = async (id) => {
        if (!confirm("Approve this seller request?")) return;
        setBusyId(id);
        setError("");
        try {
            await api.post(`/seller-requests/${id}/approve`, {}, { withCredentials: true });
            await load();
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to approve.");
        } finally {
            setBusyId(null);
        }
    };

    const openReject = (row) => {
        setRejecting({ id: row._id, who: row?.user?.name || row?.user?.email || "User" });
        setNote("");
    };

    const submitReject = async () => {
        if (!rejecting?.id) return;
        setBusyId(rejecting.id);
        setError("");
        try {
            await api.post(
                `/seller-requests/${rejecting.id}/reject`,
                { note },
                { withCredentials: true }
            );
            setRejecting(null);
            setNote("");
            await load();
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to reject.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="grid gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-brand">Seller Requests</h1>
                    <p className="text-sm text-slate-600">
                        Review, approve, or reject upgrade requests.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={load}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
                    {STATUSES.map((s) => {
                        const active = status === s;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatus(s)}
                                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${active
                                    ? "bg-[var(--sp-primary)] text-white"
                                    : "text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                {s}
                            </button>
                        );
                    })}
                </div>

                <div className="sm:ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by user or plan…"
                        className="w-56 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Error */}
            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                    {error}
                </div>
            ) : null}

            {/* Table */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[920px] w-full">
                        <thead>
                            <tr className="text-left text-xs text-slate-500">
                                <th className="px-3 py-2">User</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Plan</th>
                                <th className="px-3 py-2">Price</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Requested</th>
                                <th className="px-3 py-2">Reviewed</th>
                                <th className="px-3 py-2 w-48">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-3" colSpan={8}>
                                            <div className="h-8 rounded bg-slate-100 animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-8 text-center text-sm text-slate-500" colSpan={8}>
                                        No requests found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r._id} className="border-t border-slate-100 align-top">
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-slate-800">
                                                {r?.user?.name || "—"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-700">{r?.user?.email || "—"}</td>
                                        <td className="px-3 py-3">
                                            <div className="font-medium text-slate-800">{r?.plan?.name || "—"}</div>
                                            {r?.note ? (
                                                <div className="mt-0.5 text-xs text-slate-500">Note: {r.note}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-3 text-slate-700">
                                            {typeof r?.plan?.priceBDT === "number"
                                                ? `৳${Number(r.plan.priceBDT).toLocaleString("en-BD")} ${r?.plan?.period === "one_time"
                                                    ? "(one-time)"
                                                    : r?.plan?.period
                                                        ? `/${r.plan.period}`
                                                        : ""
                                                }`
                                                : "—"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusPill status={r.status} />
                                        </td>
                                        <td className="px-3 py-3 text-xs text-slate-600">
                                            {r?.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-slate-600">
                                            {r?.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : "—"}
                                        </td>
                                        <td className="px-3 py-3">
                                            {r.status === "pending" ? (
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => approve(r._id)}
                                                        disabled={busyId === r._id}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                                    >
                                                        {busyId === r._id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                        )}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openReject(r)}
                                                        disabled={busyId === r._id}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : r.status === "approved" ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                                                    Rejected
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reject modal */}
            {rejecting && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setRejecting(null)} />
                    <div className="absolute inset-0 grid place-items-center p-4">
                        <div className="w-full max-w-lg rounded-2xl border border-[var(--sp-light)] bg-white shadow-xl p-5">
                            <div className="font-semibold text-slate-900">Reject request</div>
                            <p className="mt-1 text-sm text-slate-600">
                                You are rejecting the request from <span className="font-medium">{rejecting.who}</span>.
                                You can leave an optional note (the user may see this).
                            </p>
                            <textarea
                                rows={5}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200 text-sm"
                                placeholder="Optional note for the user…"
                            />
                            <div className="mt-4 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setRejecting(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReject}
                                    disabled={busyId === rejecting.id}
                                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
                                >
                                    {busyId === rejecting.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- Small bits ---- */

function StatusPill({ status }) {
    if (status === "approved") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                <CheckCircle className="w-3.5 h-3.5" /> Approved
            </span>
        );
    }
    if (status === "rejected") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
            Pending
        </span>
    );
}
