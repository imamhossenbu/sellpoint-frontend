"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Users,
    Filter,
    Search,
    RefreshCcw,
    Download,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminSellersPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]); // all seller requests
    const [plans, setPlans] = useState([]);
    const [q, setQ] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("approved"); // approved | pending | rejected | all
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [{ data: r }, { data: p }] = await Promise.all([
                api.get("/seller-requests", { withCredentials: true }), // { items: [...] }
                api.get("/plans", { withCredentials: true }),           // { items: [...] }
            ]);
            setRequests(Array.isArray(r?.items) ? r.items : []);
            setPlans(Array.isArray(p?.items) ? p.items : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Build a “seller -> latest approved request” map so each seller row is unique
    const sellers = useMemo(() => {
        const src =
            statusFilter === "all"
                ? requests
                : requests.filter((it) => it.status === statusFilter);

        const byUser = new Map();
        for (const it of src) {
            const uid = it?.user?._id || it?.user?.id || it?.user;
            if (!uid) continue;
            const prev = byUser.get(uid);
            if (!prev || new Date(it.createdAt) > new Date(prev.createdAt)) {
                byUser.set(uid, it);
            }
        }

        let rows = Array.from(byUser.values());
        if (planFilter !== "all") {
            rows = rows.filter((r) => String(r?.plan?._id || r?.plan) === planFilter);
        }
        const needle = q.trim().toLowerCase();
        if (needle) {
            rows = rows.filter((r) => {
                const name = (r?.user?.name || "").toLowerCase();
                const email = (r?.user?.email || "").toLowerCase();
                const plan = (r?.plan?.name || "").toLowerCase();
                return name.includes(needle) || email.includes(needle) || plan.includes(needle);
            });
        }
        rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return rows;
    }, [requests, q, planFilter, statusFilter]);

    const counts = useMemo(() => {
        const c = { approved: 0, pending: 0, rejected: 0 };
        for (const r of requests) c[r.status] = (c[r.status] || 0) + 1;
        const uniqueApproved = new Set(
            requests.filter((r) => r.status === "approved").map((r) => r?.user?._id || r?.user)
        ).size;
        return { ...c, uniqueApproved };
    }, [requests]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await load();
        } finally {
            setRefreshing(false);
        }
    };

    const exportCSV = () => {
        const header = [
            "Seller Name",
            "Email",
            "Plan",
            "PriceBDT",
            "Period",
            "Status",
            "RequestedAt",
            "ReviewedAt",
        ];
        const lines = sellers.map((r) => [
            safe(r?.user?.name),
            safe(r?.user?.email),
            safe(r?.plan?.name),
            n0(r?.plan?.priceBDT),
            safe(r?.plan?.period),
            safe(r?.status),
            safe(new Date(r?.createdAt).toLocaleString()),
            safe(r?.reviewedAt ? new Date(r?.reviewedAt).toLocaleString() : ""),
        ]);
        const csv = [header, ...lines].map((row) => row.map(csvCell).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sellers-with-plans-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-brand">Sellers</h1>
                    <p className="text-sm text-slate-600">
                        See which sellers are approved and which plan they selected.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-white"
                    >
                        <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button
                        onClick={exportCSV}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--sp-primary)] text-white px-3 py-2 hover:opacity-90"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <KPI
                    title="Approved Sellers"
                    value={loading ? "…" : counts.uniqueApproved}
                    icon={<Users className="w-5 h-5 text-emerald-600" />}
                    tone="emerald"
                />
                <KPI
                    title="Approved Requests"
                    value={loading ? "…" : counts.approved}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    tone="emerald"
                />
                <KPI
                    title="Pending Requests"
                    value={loading ? "…" : counts.pending}
                    icon={<Clock className="w-5 h-5 text-amber-600" />}
                    tone="amber"
                />
                <KPI
                    title="Rejected Requests"
                    value={loading ? "…" : counts.rejected}
                    icon={<XCircle className="w-5 h-5 text-rose-600" />}
                    tone="rose"
                />
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search seller name, email, plan…"
                            className="bg-transparent outline-none text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All plans</option>
                            {plans.map((p) => (
                                <option key={p._id} value={p._id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            title="Filter by request status"
                        >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                            <option value="all">All statuses</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full">
                        <thead>
                            <tr className="text-left text-xs text-slate-500">
                                <th className="px-3 py-2">Seller</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Plan</th>
                                <th className="px-3 py-2">Price</th>
                                <th className="px-3 py-2">Period</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Requested</th>
                                <th className="px-3 py-2">Reviewed</th>
                                <th className="px-3 py-2 w-28"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-3" colSpan={9}>
                                            <div className="h-8 rounded bg-slate-100 animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : sellers.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-6 text-sm text-slate-500" colSpan={9}>
                                        No matching sellers.
                                    </td>
                                </tr>
                            ) : (
                                sellers.map((r) => (
                                    <tr key={r._id} className="border-t border-slate-100">
                                        <td className="px-3 py-3 font-medium">{r?.user?.name || "—"}</td>
                                        <td className="px-3 py-3 text-slate-600">{r?.user?.email || "—"}</td>
                                        <td className="px-3 py-3">{r?.plan?.name || "—"}</td>
                                        <td className="px-3 py-3">
                                            {typeof r?.plan?.priceBDT === "number" ? `৳${n0(r.plan.priceBDT)}` : "—"}
                                        </td>
                                        <td className="px-3 py-3 capitalize">{r?.plan?.period || "—"}</td>
                                        <td className="px-3 py-3">
                                            <StatusPill status={r?.status} />
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            {r?.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            {r?.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : "—"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/dashboard/users?q=${encodeURIComponent(r?.user?.email || "")}`}
                                                    className="text-xs inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                                    title="View in Users"
                                                >
                                                    Open
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ---------------- Bits ---------------- */

function KPI({ title, value, icon, tone = "indigo" }) {
    const tones = {
        indigo: "from-indigo-50 to-white",
        emerald: "from-emerald-50 to-white",
        amber: "from-amber-50 to-white",
        rose: "from-rose-50 to-white",
    };
    return (
        <div
            className={`rounded-2xl border border-[var(--sp-light)] bg-gradient-to-br ${tones[tone]} p-5 shadow-sm`}
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm text-slate-500">{title}</span>
                    <span className="mt-1 text-2xl font-semibold text-slate-800">{value}</span>
                </div>
                <div className="p-3 rounded-xl bg-white shadow-sm">{icon}</div>
            </div>
        </div>
    );
}

function StatusPill({ status }) {
    const map = {
        approved: {
            cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
            text: "Approved",
        },
        pending: {
            cls: "bg-amber-50 text-amber-700 border-amber-100",
            text: "Pending",
        },
        rejected: { cls: "bg-rose-50 text-rose-700 border-rose-100", text: "Rejected" },
    };
    const m = map[status] || { cls: "bg-slate-50 text-slate-600 border-slate-100", text: "—" };
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${m.cls}`}>
            {m.text}
        </span>
    );
}

const safe = (v) => (v == null ? "" : String(v));
const n0 = (v) => (Number.isFinite(Number(v)) ? Number(v).toLocaleString("en-BD") : "");
const csvCell = (s) => {
    const v = String(s ?? "");
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
};
