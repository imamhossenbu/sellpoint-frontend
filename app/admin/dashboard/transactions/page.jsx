"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const PAGE_SIZE = 12;

export default function AdminTransactionsPage() {
    const search = useSearchParams();
    const router = useRouter();

    const period = search.get("period") || "month"; // today|week|month|all|custom
    const status = search.get("status") || "all";
    const page = Number(search.get("page") || 1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, sum: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);
    const fmtBDT = useMemo(
        () => new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }),
        []
    );

    const setParam = (key, value) => {
        const params = new URLSearchParams(search.toString());
        if (!value || value === "all" || value === "") params.delete(key);
        else params.set(key, value);
        if (key !== "page") params.delete("page");
        router.push(`/admin/dashboard/transactions?${params.toString()}`);
    };

    async function fetchData() {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/transactions", {
                params: {
                    period,
                    status: status === "all" ? undefined : status,
                    page,
                    limit: PAGE_SIZE,
                    sort: "-createdAt",
                },
            });
            setRows(data.items || []);
            setMeta({ total: data.total || 0, page: data.page || 1, pages: data.pages || 1, sum: data.sum || 0 });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [period, status, page]);

    const refresh = async () => {
        setRefreshing(true);
        try { await fetchData(); } finally { setRefreshing(false); }
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-brand">Transactions</h1>
                <button
                    onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                >
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </button>
            </div>

            {/* Filters + totals */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-500">Period</label>
                        <select
                            value={period}
                            onChange={(e) => setParam("period", e.target.value)}
                            className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time (last 30d window)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-500">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setParam("status", e.target.value)}
                            className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="success">Success</option>
                            <option value="initiated">Initiated</option>
                            <option value="failed">Failed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <Th>Seller</Th>
                                <Th>Amount</Th>
                                <Th>Status</Th>
                                <Th>Gateway</Th>
                                <Th>Tran ID</Th>
                                <Th>Created</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="py-10 text-center text-slate-500">
                                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading…
                                </td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={7} className="py-10 text-center text-slate-500">No transactions.</td></tr>
                            ) : rows.map((t) => (
                                <tr key={t._id} className="border-t">
                                    <Td>
                                        <div className="text-slate-800">{t?.seller?.name || t?.seller?.email || "—"}</div>
                                        <div className="text-xs text-slate-500">{t?.seller?.email}</div>
                                    </Td>
                                    <Td className="font-medium">৳ {fmt.format(t.amount || 0)}</Td>
                                    <Td><StatusPill status={t.status} /></Td>
                                    <Td className="text-slate-600">{t.gateway || "sslcommerz"}</Td>
                                    <Td className="text-slate-600">{t.tranId || "—"}</Td>
                                    <Td className="text-slate-500">{new Date(t.createdAt).toLocaleString()}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-slate-600">
                            Page <strong>{meta.page}</strong> of <strong>{meta.pages}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={meta.page <= 1}
                                onClick={() => setParam("page", String(meta.page - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                disabled={meta.page >= meta.pages}
                                onClick={() => setParam("page", String(meta.page + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Th({ children, className = "" }) {
    return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
    return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
function StatusPill({ status }) {
    const map = {
        success: "bg-emerald-50 text-emerald-700 border-emerald-100",
        initiated: "bg-sky-50 text-sky-700 border-sky-100",
        failed: "bg-rose-50 text-rose-700 border-rose-100",
        canceled: "bg-slate-50 text-slate-700 border-slate-100",
    };
    const cls = map[status] || "bg-slate-50 text-slate-700 border-slate-100";
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}
