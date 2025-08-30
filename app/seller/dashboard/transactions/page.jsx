// app/seller/dashboard/transactions/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowUpRight,
    Loader2,
    RefreshCw,
    Download,
    CalendarClock,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    BadgeDollarSign,
} from "lucide-react";
import { api } from "@/lib/api";

const PAGE_SIZE = 10;

export default function SellerTransactionsPage() {
    const search = useSearchParams();
    const router = useRouter();

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, sum: 0 });
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const period = search.get("period") || "month"; // month | week | today | all | custom
    const status = search.get("status") || "all"; // initiated | success | failed | canceled | all
    const page = Number(search.get("page") || 1);

    const fmtCurrency = useMemo(
        () =>
            new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
                maximumFractionDigits: 0,
            }),
        []
    );
    const fmtNumber = useMemo(() => new Intl.NumberFormat(), []);

    // Helper to set query params
    const setParam = (key, value) => {
        const params = new URLSearchParams(search.toString());
        if (value === null || value === undefined || value === "" || value === "all") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        // Reset page if filters change
        if (key !== "page") params.delete("page");
        router.push(`/seller/dashboard/transactions?${params.toString()}`);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/seller/transactions", {
                params: {
                    period,
                    status: status === "all" ? undefined : status,
                    page,
                    limit: PAGE_SIZE,
                    sort: "-createdAt",
                },
            });
            // Expected response shape:
            // {
            //   items: [{ _id, listing, amount, status, gateway, tranId, createdAt }],
            //   total, page, pages,
            //   sum // total amount for the current query window
            // }
            setRows(data.items || []);
            setMeta({
                total: data.total || 0,
                page: data.page || 1,
                pages: data.pages || 1,
                sum: data.sum || 0,
            });
        } catch (e) {
            setRows([]);
            setMeta({ total: 0, page: 1, pages: 1, sum: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period, status, page]);

    const onExport = async () => {
        setDownloading(true);
        try {
            // Fetch all for current filter for CSV
            const { data } = await api.get("/seller/transactions", {
                params: {
                    period,
                    status: status === "all" ? undefined : status,
                    page: 1,
                    limit: 5000, // large cap for export
                    sort: "-createdAt",
                },
            });

            const header = [
                "Date",
                "Tran ID",
                "Listing ID",
                "Amount (BDT)",
                "Status",
                "Gateway",
            ];
            const lines = [header.join(",")];

            (data.items || []).forEach((t) => {
                const date = new Date(t.createdAt).toISOString();
                const line = [
                    date,
                    safeCSV(t.tranId),
                    safeCSV(t.listing?._id || t.listing || ""),
                    String(t.amount || 0),
                    safeCSV(t.status),
                    safeCSV(t.gateway || "sslcommerz"),
                ].join(",");
                lines.push(line);
            });

            const blob = new Blob([lines.join("\n")], {
                type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `transactions_${period}_${status}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } finally {
            setDownloading(false);
        }
    };

    const totalLabel =
        period === "today"
            ? "Today’s Sales"
            : period === "week"
                ? "This Week’s Sales"
                : period === "month"
                    ? "This Month’s Sales"
                    : "Total (filtered)";

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-brand">Transactions</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow transition"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                    <button
                        onClick={onExport}
                        disabled={downloading || loading || rows.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <Filter className="h-4 w-4" /> Filters
                    </span>

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
                            <option value="all">All Time</option>
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
            <div className="overflow-hidden rounded-2xl border border-[var(--sp-light)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <Th>Date</Th>
                                <Th>Tran ID</Th>
                                <Th>Listing</Th>
                                <Th className="text-right">Amount</Th>
                                <Th>Status</Th>
                                <Th>Gateway</Th>
                                <Th></Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonRows />
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        No transactions found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((t) => (
                                    <tr key={t._id} className="border-t border-slate-100">
                                        <Td>
                                            <div className="flex flex-col">
                                                <span className="text-slate-800">
                                                    {formatDate(t.createdAt)}
                                                </span>
                                                <span className="text-slate-500">
                                                    {formatTime(t.createdAt)}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td className="font-mono text-slate-800">{t.tranId}</Td>
                                        <Td>
                                            {t.listing ? (
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/seller/dashboard/listings?highlight=${t.listing._id || t.listing
                                                            }`}
                                                        className="text-indigo-600 hover:underline"
                                                        title="Open listing"
                                                    >
                                                        {t.listing.title || shortId(t.listing._id || t.listing)}
                                                    </Link>
                                                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </Td>
                                        <Td className="text-right font-medium text-slate-800">
                                            {fmtCurrency.format(t.amount || 0)}
                                        </Td>
                                        <Td>
                                            <StatusPill status={t.status} />
                                        </Td>
                                        <Td className="text-slate-700">{t.gateway || "sslcommerz"}</Td>
                                        <Td>
                                            {t.status === "initiated" ? (
                                                <span className="text-xs text-amber-600">Awaiting</span>
                                            ) : t.status === "failed" ? (
                                                <span className="text-xs text-rose-600">Retry</span>
                                            ) : t.status === "canceled" ? (
                                                <span className="text-xs text-slate-500">Canceled</span>
                                            ) : (
                                                <span className="text-xs text-emerald-600">Complete</span>
                                            )}
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 p-4">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <BadgeDollarSign className="h-4 w-4" />
                        <span>
                            {fmtNumber.format(meta.total)} transaction{meta.total === 1 ? "" : "s"}
                        </span>
                    </div>
                    <Pagination
                        page={meta.page}
                        pages={meta.pages}
                        onPage={(p) => setParam("page", String(p))}
                    />
                </div>
            </div>

            {/* Helpful note */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 text-xs text-slate-500">
                Payments are processed via SSLCommerz. Successful payments automatically
                approve the associated listing with an expiry (handled server-side).
            </div>
        </div>
    );
}

/* ---------- UI bits ---------- */

function Th({ className = "", children }) {
    return (
        <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>
    );
}
function Td({ className = "", children }) {
    return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>;
}

function SkeletonRows({ rows = 6 }) {
    return Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-slate-100">
            {Array.from({ length: 7 }).map((__, j) => (
                <Td key={j}>
                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-slate-100" />
                </Td>
            ))}
        </tr>
    ));
}

function StatusPill({ status }) {
    const map = {
        success: {
            icon: <CheckCircle2 className="h-4 w-4" />,
            cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
            label: "Success",
        },
        failed: {
            icon: <XCircle className="h-4 w-4" />,
            cls: "bg-rose-50 text-rose-700 border-rose-100",
            label: "Failed",
        },
        canceled: {
            icon: <XCircle className="h-4 w-4" />,
            cls: "bg-slate-50 text-slate-600 border-slate-100",
            label: "Canceled",
        },
        initiated: {
            icon: <Clock className="h-4 w-4" />,
            cls: "bg-amber-50 text-amber-700 border-amber-100",
            label: "Initiated",
        },
    };
    const m = map[status] || map.initiated;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${m.cls}`}
        >
            {m.icon}
            {m.label}
        </span>
    );
}

/* ---------- helpers ---------- */

function formatDate(date) {
    try {
        const d = new Date(date);
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "—";
    }
}
function formatTime(date) {
    try {
        const d = new Date(date);
        return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}
function shortId(id = "") {
    if (typeof id !== "string") return "";
    return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}
function safeCSV(value = "") {
    const s = String(value ?? "");
    // Escape double-quotes for CSV and wrap if needed
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function Pagination({ page, pages, onPage }) {
    if (pages <= 1) return null;
    const prev = Math.max(1, page - 1);
    const next = Math.min(pages, page + 1);
    const canPrev = page > 1;
    const canNext = page < pages;

    return (
        <div className="inline-flex items-center gap-2">
            <button
                onClick={() => canPrev && onPage(prev)}
                disabled={!canPrev}
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm disabled:opacity-50"
            >
                Prev
            </button>
            <span className="text-sm text-slate-600">
                Page <strong className="text-slate-800">{page}</strong> of{" "}
                <strong className="text-slate-800">{pages}</strong>
            </span>
            <button
                onClick={() => canNext && onPage(next)}
                disabled={!canNext}
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
}
