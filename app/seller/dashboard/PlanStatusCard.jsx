"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { api } from "@/lib/api";

export default function PlanStatusCard({ className = "" }) {
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/account/me/plan", { withCredentials: true });
                setInfo(data || null);
            } catch (e) {
                setErr(e?.response?.data?.message || "Failed to load plan.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const started = useMemo(
        () => (info?.startedAt ? new Date(info.startedAt) : null),
        [info]
    );
    const ends = useMemo(
        () => (info?.endsAt ? new Date(info.endsAt) : null),
        [info]
    );

    const daysLeft = info?.daysLeft ?? null;
    const planName = info?.plan?.name || "—";
    const period = info?.plan?.period || "—";
    const progress = typeof info?.progress === "number" ? info.progress : null;

    return (
        <div className={`rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm ${className}`}>
            <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-50 p-2">
                    <CalendarDays className="h-5 w-5 text-indigo-700" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-500">Current Plan</div>
                            <div className="text-lg font-semibold text-slate-900">
                                {loading ? "…" : planName}{" "}
                                <span className="text-slate-500 text-sm">({loading ? "…" : period})</span>
                            </div>
                        </div>
                        {typeof daysLeft === "number" ? (
                            <div
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${daysLeft <= 7
                                        ? "bg-amber-50 text-amber-700 border-amber-100"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    }`}
                                title="Days remaining"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Started">
                            {loading ? "…" : started ? started.toLocaleString() : "—"}
                        </Field>
                        <Field label="Ends">
                            {loading ? "…" : ends ? ends.toLocaleString() : "—"}
                        </Field>
                    </div>

                    {typeof progress === "number" ? (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                <span>Cycle progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-2 bg-indigo-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : null}

                    {err ? (
                        <p className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                            {err}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-sm font-medium text-slate-900">{children}</div>
        </div>
    );
}
