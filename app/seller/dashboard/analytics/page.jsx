// app/seller/dashboard/analytics/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    BarChart2,
    Activity,
    RefreshCw,
    CalendarClock,
    TrendingUp,
    Users2,
    Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import Link from "next/link";

/**
 * API expected response:
 * {
 *   series:   [{ date, views, leads }],
 *   byListing:[{ listingId, title, views, leads }],
 *   totals:   { views, leads }
 * }
 */

export default function AnalyticsPage() {
    const search = useSearchParams();
    const router = useRouter();

    const period = search.get("period") || "month"; // today | week | month | all
    const [loading, setLoading] = useState(true);
    const [series, setSeries] = useState([]); // [{date, views, leads}]
    const [byListing, setByListing] = useState([]); // [{listingId, title, views, leads}]
    const [totals, setTotals] = useState({ views: 0, leads: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);

    const setParam = (key, value) => {
        const params = new URLSearchParams(search.toString());
        if (!value) params.delete(key);
        else params.set(key, value);
        router.push(`/seller/dashboard/analytics?${params.toString()}`);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/seller/analytics", { params: { period } });
            setSeries(data.series || []);
            setByListing((data.byListing || []).slice(0, 10)); // top 10
            setTotals(data.totals || { views: 0, leads: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="grid gap-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {periodLabel(period)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <PeriodTabs value={period} onChange={(v) => setParam("period", v)} />
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    label="Total Views"
                    value={fmt.format(totals.views || 0)}
                    icon={<Activity className="h-5 w-5" />}
                    gradient="from-indigo-50 to-white"
                    hint={periodLabel(period)}
                />
                <KpiCard
                    label="Total Leads"
                    value={fmt.format(totals.leads || 0)}
                    icon={<BarChart2 className="h-5 w-5" />}
                    gradient="from-emerald-50 to-white"
                    hint={periodLabel(period)}
                />
                <InfoCard />
            </div>

            {/* Time Series */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Traffic Over Time</h2>
                        <p className="text-xs text-slate-500">Daily breakdown of views and leads</p>
                    </div>
                    {loading ? null : series.length > 0 ? (
                        <div className="text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" /> Views
                            </span>
                            <span className="mx-2">·</span>
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Leads
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="h-80">
                    {loading ? (
                        <ChartSkeleton />
                    ) : series.length === 0 ? (
                        <EmptyState
                            title="No analytics yet"
                            description="Traffic will appear here once your listings get views and messages."
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={series} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    name="Views"
                                    stroke="#6366F1"
                                    strokeWidth={2}
                                    fill="url(#gViews)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    name="Leads"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fill="url(#gLeads)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Per-listing Performance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Top Listings</h2>
                        <p className="text-xs text-slate-500">Compare views & leads across your listings</p>
                    </div>
                    {!loading && byListing.length > 0 ? (
                        <Link
                            href="/seller/dashboard/listings"
                            className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Manage Listings →
                        </Link>
                    ) : null}
                </div>

                <div className="h-[360px]">
                    {loading ? (
                        <ChartSkeleton />
                    ) : byListing.length === 0 ? (
                        <EmptyState
                            title="No listings found"
                            description="Create a listing to start seeing performance here."
                            cta={{ href: "/seller/dashboard/create", label: "Create Listing" }}
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byListing} margin={{ top: 10, right: 24, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="title"
                                    angle={-15}
                                    textAnchor="end"
                                    height={48}
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="views" name="Views" radius={[6, 6, 0, 0]} fill="#6366F1" />
                                <Bar dataKey="leads" name="Leads" radius={[6, 6, 0, 0]} fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Components ---------- */

function PeriodTabs({ value, onChange }) {
    const items = [
        { v: "today", label: "Today" },
        { v: "week", label: "This Week" },
        { v: "month", label: "This Month" },
        { v: "all", label: "All Time" },
    ];
    return (
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
            {items.map((it) => {
                const active = value === it.v;
                return (
                    <button
                        key={it.v}
                        onClick={() => onChange?.(it.v)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition ${active
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}

function KpiCard({ label, value, icon, gradient = "from-slate-50 to-white", hint }) {
    return (
        <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${gradient} p-5 shadow-sm`}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
                    {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm text-slate-700">{icon}</div>
            </div>
        </div>
    );
}

function InfoCard() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm text-slate-500">Tip</div>
                    <div className="mt-1 text-slate-900 font-medium">
                        Boost engagement by improving your listing titles & cover images.
                    </div>
                    <ul className="mt-2 text-xs text-slate-600 list-disc pl-4 space-y-1">
                        <li>Use clear, concise titles with key features.</li>
                        <li>Upload bright, high-resolution photos.</li>
                        <li>Respond quickly to buyer inquiries.</li>
                    </ul>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm text-amber-700">
                    <TrendingUp className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, description, cta }) {
    return (
        <div className="h-full grid place-items-center">
            <div className="text-center">
                <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50">
                    <Users2 className="h-5 w-5 text-slate-500" />
                </div>
                <div className="font-medium text-slate-800">{title}</div>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
                {cta ? (
                    <Link
                        href={cta.href}
                        className="mt-3 inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                        {cta.label}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="h-full grid grid-rows-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-full w-full animate-pulse rounded-lg bg-slate-50" />
            ))}
        </div>
    );
}

function periodLabel(p) {
    return p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time";
}
