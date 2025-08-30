// app/seller/dashboard/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, CheckCircle, Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import PlanStatusCard from "./PlanStatusCard";

// Assumes you expose an API like: GET /api/seller/stats
// Response shape (example):
// { activeCount: 12, pendingCount: 3, totalViews: 4210, monthSales: 125000 }

export default function SellerPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        activeCount: 0,
        pendingCount: 0,
        totalViews: 0,
        monthSales: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let done = false;
        (async () => {
            try {
                const { data } = await api.get("/seller/stats");
                if (!done && data) {
                    setStats({
                        activeCount: data.activeCount ?? 0,
                        pendingCount: data.pendingCount ?? 0,
                        totalViews: data.totalViews ?? 0,
                        monthSales: data.monthSales ?? 0,
                    });
                }
            } catch {
                // keep zeros on error
            } finally {
                if (!done) setLoading(false);
            }
        })();
        return () => {
            done = true;
        };
    }, []);

    const fmt = new Intl.NumberFormat();

    return (
        <div className="grid gap-6">
            <PlanStatusCard />
            <h1 className="text-2xl font-semibold text-brand">Overview</h1>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Active Listings"
                    value={loading ? "…" : fmt.format(stats.activeCount)}
                    icon={<CheckCircle className="w-6 h-6 text-green-600" />}
                    gradient="from-green-50 to-white"
                    href="/seller/dashboard/listings?status=approved"
                />
                <Card
                    title="Pending Approval"
                    value={loading ? "…" : fmt.format(stats.pendingCount)}
                    icon={<Clock className="w-6 h-6 text-amber-600" />}
                    gradient="from-amber-50 to-white"
                    href="/seller/dashboard/listings?status=pending"
                />
                <Card
                    title="Total Views"
                    value={loading ? "…" : fmt.format(stats.totalViews)}
                    icon={<Eye className="w-6 h-6 text-indigo-600" />}
                    gradient="from-indigo-50 to-white"
                    href="/seller/dashboard/analytics"
                />
                <Card
                    title="This Month’s Sales"
                    value={loading ? "…" : `BDT ${fmt.format(stats.monthSales)}`}
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    gradient="from-emerald-50 to-white"
                    href="/seller/dashboard/transactions?period=month"
                />
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                <div className="font-medium mb-2 text-slate-800">Recent Activity</div>
                <p className="text-sm text-slate-600">
                    Your latest listings, approvals, and payments will appear here.
                </p>
            </div>
        </div>
    );
}

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

    // Make card clickable (keyboard accessible)
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
