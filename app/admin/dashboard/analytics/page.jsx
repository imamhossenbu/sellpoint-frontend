"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Loader2, Activity, BarChart2, Eye, DollarSign, LifeBuoy } from "lucide-react";
import { api } from "@/lib/api";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month"); // today|week|month|all
    const [stats, setStats] = useState({
        totalSellers: 0,
        approvedListings: 0,
        pendingListings: 0,
        totalViews: 0,
        monthRevenue: 0,
        openTickets: 0,
    });
    const [series, setSeries] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);
    const fmtBDT = useMemo(
        () => new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }),
        []
    );

    const load = async () => {
        setLoading(true);
        try {
            const [{ data: s }, { data: tx }] = await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/transactions", { params: { period, status: "success", limit: 500 } }),
            ]);
            setStats({
                totalSellers: s?.totalSellers ?? 0,
                approvedListings: s?.approvedListings ?? 0,
                pendingListings: s?.pendingListings ?? 0,
                totalViews: s?.totalViews ?? 0,
                monthRevenue: s?.monthRevenue ?? 0,
                openTickets: s?.openTickets ?? 0,
            });

            const buckets = new Map();
            (tx?.items || []).forEach((t) => {
                const d = new Date(t.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                buckets.set(key, (buckets.get(key) || 0) + (t.amount || 0));
            });
            const keys = Array.from(buckets.keys()).sort();
            setSeries(keys.map((k) => ({ date: k, revenue: buckets.get(k) })));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [period]);

    const refresh = async () => {
        setRefreshing(true);
        try { await load(); } finally { setRefreshing(false); }
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-brand">Analytics</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm"
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time (last 30d)</option>
                    </select>
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Total Sellers" value={loading ? "…" : fmt.format(stats.totalSellers)} icon={<Activity className="w-6 h-6 text-indigo-600" />} />
                <Card title="Approved Listings" value={loading ? "…" : fmt.format(stats.approvedListings)} icon={<BarChart2 className="w-6 h-6 text-emerald-600" />} />
                <Card title="Pending Listings" value={loading ? "…" : fmt.format(stats.pendingListings)} icon={<BarChart2 className="w-6 h-6 text-amber-600" />} />
                <Card title="Total Views" value={loading ? "…" : fmt.format(stats.totalViews)} icon={<Eye className="w-6 h-6 text-sky-600" />} />
                <Card title="This Month’s Revenue" value={loading ? "…" : fmtBDT.format(stats.monthRevenue)} icon={<DollarSign className="w-6 h-6 text-emerald-600" />} />
                <Card title="Open Tickets" value={loading ? "…" : fmt.format(stats.openTickets)} icon={<LifeBuoy className="w-6 h-6 text-fuchsia-600" />} />
            </div>

            {/* Revenue series */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                <div className="mb-3 font-semibold text-slate-800">Revenue Over Time (Success)</div>
                <div className="h-72">
                    {loading ? (
                        <div className="h-full grid place-items-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : series.length === 0 ? (
                        <div className="h-full grid place-items-center text-slate-500 text-sm">No data.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopOpacity={0.35} />
                                        <stop offset="95%" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Revenue (BDT)" stroke="currentColor" fill="url(#gRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon }) {
    return (
        <div className="rounded-2xl border border-[var(--sp-light)] bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
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
