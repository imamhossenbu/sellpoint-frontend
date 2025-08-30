// components/pricing/PlansGrid.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useAuthCtx } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function PlansGrid({ initialPlans = [] }) {
    const router = useRouter();
    const { user } = useAuthCtx() || {};

    const [plans, setPlans] = useState(initialPlans);
    const [loading, setLoading] = useState(!initialPlans?.length);
    const [loadingId, setLoadingId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setError("");
            setLoading(true);
            try {
                const { data } = await api.get("/plans");
                if (!cancelled && Array.isArray(data?.items)) setPlans(data.items);
            } catch (e) {
                if (!cancelled) setError("Failed to load plans.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const visiblePlans = useMemo(
        () => (Array.isArray(plans) ? plans.filter((p) => p?.isActive === true) : []),
        [plans]
    );

    const requestUpgrade = (planId) => {
        setError("");
        if (!user) {
            // send them to login, then back to checkout with selected plan preserved
            const next = `/pricing/checkout?plan=${encodeURIComponent(planId)}`;
            router.push(`/login?next=${encodeURIComponent(next)}`);
            return;
        }
        setLoadingId(planId);
        router.push(`/pricing/checkout?plan=${encodeURIComponent(planId)}`);
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                <div className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading plans…
                </div>
            </div>
        );
    }

    return (
        <>
            {error ? (
                <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                    {error}
                </p>
            ) : null}

            {visiblePlans.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visiblePlans.map((p) => {
                        const key = p._id || p.slug;
                        const isCurrent = user?.activePlanId && user.activePlanId === key;
                        return (
                            <PlanCard
                                key={key}
                                plan={p}
                                onSelect={() => requestUpgrade(key)}
                                loading={loadingId === key}
                                isCurrent={!!isCurrent}
                            />
                        );
                    })}
                </div>
            )}
        </>
    );
}

function PlanCard({ plan, onSelect, loading, isCurrent }) {
    const price = Number(plan?.priceBDT || plan?.price || 0);
    const period =
        plan?.period === "year" ? "/year" : plan?.period === "one_time" ? "/one-time" : "/month";

    return (
        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {plan?.popular ? (
                <span className="absolute -top-2 right-4 inline-flex items-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white shadow">
                    Popular
                </span>
            ) : null}

            <h3 className="text-lg font-semibold text-slate-900">{plan?.name}</h3>
            {plan?.description ? (
                <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
            ) : null}

            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900">
                    ৳{price.toLocaleString("en-BD")}
                </span>
                <span className="text-slate-500">{period}</span>
            </div>

            <ul className="mt-4 space-y-2">
                {(plan?.features || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-5">
                <button
                    onClick={onSelect}
                    disabled={loading || isCurrent}
                    className={`w-full rounded-xl px-4 py-2.5 font-medium ${isCurrent
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                            : "bg-[var(--sp-primary)] text-white hover:opacity-90"
                        }`}
                    title={isCurrent ? "Current plan" : "Request upgrade"}
                >
                    {loading ? "Sending..." : isCurrent ? "Current Plan" : "Request Upgrade"}
                </button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            <p>No active plans yet. Please ask an admin to enable pricing plans.</p>
        </div>
    );
}
