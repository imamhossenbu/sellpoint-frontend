// app/admin/dashboard/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Users2,
    CheckCircle,
    Clock,
    Eye,
    DollarSign,
    LifeBuoy,
    AlertTriangle,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminOverviewPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSellers: 0,
        approvedListings: 0,
        pendingListings: 0,
        totalViews: 0,
        monthRevenue: 0,
        openTickets: 0,
    });

    const [recentPending, setRecentPending] = useState([]); // last pending listings
    const [recentTickets, setRecentTickets] = useState([]); // newest support tickets

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

    useEffect(() => {
        let done = false;
        (async () => {
            try {
                // You can adjust these endpoints to your backend naming.
                const [{ data: s }, { data: p }, { data: t }] = await Promise.all([
                    api.get("/admin/stats"), // { totalSellers, approvedListings, pendingListings, totalViews, monthRevenue, openTickets }
                    api.get("/admin/review/pending", { params: { limit: 5 } }), // { items: [{_id, title, seller:{name}, createdAt}], total }
                    api.get("/admin/support/tickets", { params: { limit: 5 } }), // { items: [{_id, subject, sellerName, status, createdAt}], total }
                ]);
                if (done) return;
                setStats({
                    totalSellers: s?.totalSellers ?? 0,
                    approvedListings: s?.approvedListings ?? 0,
                    pendingListings: s?.pendingListings ?? 0,
                    totalViews: s?.totalViews ?? 0,
                    monthRevenue: s?.monthRevenue ?? 0,
                    openTickets: s?.openTickets ?? 0,
                });
                setRecentPending(p?.items || []);
                setRecentTickets(t?.items || []);
            } catch {
                // keep zeros
            } finally {
                if (!done) setLoading(false);
            }
        })();
        return () => {
            done = true;
        };
    }, []);

    return (
        <div className="grid gap-6">
            <h1 className="text-2xl font-semibold text-brand">Overview</h1>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card
                    title="Total Sellers"
                    value={loading ? "…" : fmt.format(stats.totalSellers)}
                    icon={<Users2 className="w-6 h-6 text-indigo-600" />}
                    gradient="from-indigo-50 to-white"
                    href="/admin/dashboard/sellers"
                />
                <Card
                    title="Approved Listings"
                    value={loading ? "…" : fmt.format(stats.approvedListings)}
                    icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                    gradient="from-emerald-50 to-white"
                    href="/admin/dashboard/listings?status=approved"
                />
                <Card
                    title="Pending Listings"
                    value={loading ? "…" : fmt.format(stats.pendingListings)}
                    icon={<Clock className="w-6 h-6 text-amber-600" />}
                    gradient="from-amber-50 to-white"
                    href="/admin/dashboard/listings?status=pending"
                />
                <Card
                    title="Total Views"
                    value={loading ? "…" : fmt.format(stats.totalViews)}
                    icon={<Eye className="w-6 h-6 text-sky-600" />}
                    gradient="from-sky-50 to-white"
                    href="/admin/dashboard/analytics"
                />
                <Card
                    title="This Month’s Revenue"
                    value={loading ? "…" : fmtBDT.format(stats.monthRevenue)}
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    gradient="from-emerald-50 to-white"
                    href="/admin/dashboard/transactions?period=month"
                />
                <Card
                    title="Open Tickets"
                    value={loading ? "…" : fmt.format(stats.openTickets)}
                    icon={<LifeBuoy className="w-6 h-6 text-fuchsia-600" />}
                    gradient="from-fuchsia-50 to-white"
                    href="/admin/dashboard/support?status=open"
                />
            </div>

            {/* Two columns: Pending approvals & Recent tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending approvals */}
                <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-slate-800">Pending Approvals</div>
                        <Link
                            href="/admin/dashboard/listings?status=pending"
                            className="text-sm text-indigo-600 inline-flex items-center gap-1 hover:underline"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <LoadingList />
                    ) : recentPending.length === 0 ? (
                        <div className="text-sm text-slate-500">No pending listings 🎉</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {recentPending.map((it) => (
                                <li key={it._id} className="py-3 flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="truncate font-medium text-slate-800">{it.title || "Untitled"}</div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(it.createdAt).toLocaleString()}
                                            {it.seller?.name ? <> • {it.seller.name}</> : null}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/admin/dashboard/listings/${it._id}`}
                                        className="text-xs inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                    >
                                        Review
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent tickets */}
                <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-slate-800">Recent Tickets</div>
                        <Link
                            href="/admin/dashboard/support"
                            className="text-sm text-indigo-600 inline-flex items-center gap-1 hover:underline"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <LoadingList />
                    ) : recentTickets.length === 0 ? (
                        <div className="text-sm text-slate-500">No tickets yet.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {recentTickets.map((t) => (
                                <li key={t._id} className="py-3 flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="truncate font-medium text-slate-800">{t.subject}</div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(t.createdAt).toLocaleString()}
                                            {t.sellerName ? <> • {t.sellerName}</> : null}
                                        </div>
                                    </div>
                                    <StatusPill status={t.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="mt-3 text-xs text-amber-700 inline-flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Respond quickly to reduce seller churn.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ---------- UI bits ---------- */

function Card({ title, value, icon, gradient, href }) {
    const content = (
        <div
            className={`rounded-2xl border border-[var(--sp-light)] bg-gradient-to-br ${gradient}
        p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 focus-visible:-translate-y-0.5`}
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm text-slate-500">{title}</span>
                    <span className="mt-1 text-2xl font-semibold text-slate-800">
                        {value}
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-white shadow-sm">{icon}</div>
            </div>
        </div>
    );

    return href ? (
        <Link
            href={href}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 rounded-2xl"
        >
            {content}
        </Link>
    ) : (
        content
    );
}

function StatusPill({ status = "open" }) {
    const map = {
        open: { cls: "bg-amber-50 text-amber-700 border-amber-100", text: "Open" },
        pending: { cls: "bg-indigo-50 text-indigo-700 border-indigo-100", text: "Pending" },
        resolved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "Resolved" },
        closed: { cls: "bg-slate-50 text-slate-600 border-slate-100", text: "Closed" },
    };
    const m = map[status] || map.open;
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${m.cls}`}>{m.text}</span>;
}

function LoadingList() {
    return (
        <div className="grid gap-2">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            ))}
        </div>
    );
}
