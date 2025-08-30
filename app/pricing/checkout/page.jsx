// app/pricing/checkout/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Check,
    ArrowLeft,
    ShieldCheck,
    Loader2,
    Sparkles,
    CreditCard,
} from "lucide-react";
import { useAuthCtx } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function PricingCheckoutPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const { user } = useAuthCtx() || {};
    const planParam = sp.get("plan"); // id or slug

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [initiating, setInitiating] = useState(false);
    const [sent, setSent] = useState(false);

    // fetch plan by id or slug
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError("");
            try {
                let found = null;

                // Try direct GET /plans/:id first
                if (planParam) {
                    try {
                        const byId = await api.get(`/plans/${planParam}`, {
                            withCredentials: true,
                        });
                        found = byId?.data?.plan || byId?.data || null;
                    } catch {
                        // ignore; fall back to listing & find by slug/id
                    }
                }

                if (!found) {
                    const { data } = await api.get("/plans", { withCredentials: true });
                    const list = Array.isArray(data?.items) ? data.items : [];
                    found =
                        list.find((p) => String(p._id) === String(planParam)) ||
                        list.find((p) => String(p.slug) === String(planParam)) ||
                        null;
                }

                if (!cancelled) {
                    setPlan(found);
                    if (!found) setError("We couldn’t find that plan. Please pick a plan again.");
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e?.response?.data?.message || "Failed to load plan.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [planParam]);

    const isPrivileged = useMemo(
        () => user?.role === "seller" || user?.role === "admin",
        [user]
    );

    const price = useMemo(
        () => Number(plan?.priceBDT ?? plan?.price ?? 0),
        [plan]
    );

    const period = useMemo(() => {
        if (!plan?.period) return "";
        if (plan.period === "year") return "/year";
        if (plan.period === "one_time") return "/one-time";
        return "/month";
    }, [plan]);

    const sendRequest = async () => {
        if (!user) {
            router.push(
                `/login?next=${encodeURIComponent(`/pricing/checkout?plan=${planParam}`)}`
            );
            return;
        }
        if (!plan) return;

        setSubmitting(true);
        setError("");
        try {
            await api.post(
                "/seller-requests",
                { planId: plan?._id || plan?.slug, note },
                { withCredentials: true }
            );
            // inline success (no redirect)
            setSent(true);
        } catch (e) {
            const msg = e?.response?.data?.message || "Failed to send request.";
            // Friendlier duplicate message
            if (msg.toLowerCase().includes("pending request")) {
                setSent(true);
            } else {
                setError(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Only available for seller/admin per your backend route guard
    const payWithSSL = async () => {
        if (!isPrivileged || !plan) return;
        setInitiating(true);
        setError("");
        try {
            const payload = {
                // listingId optional in your controller; omit for plan purchase
                amount: price,
                email: user?.email || "",
            };
            const { data } = await api.post("/payments/ssl/initiate", payload, {
                withCredentials: true,
            });
            const url = data?.redirectURL;
            if (url) {
                window.location.href = url;
            } else {
                setError("Gateway did not return a redirect URL.");
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to start payment.");
        } finally {
            setInitiating(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8FAFF]">
            <Header />

            <div className="mx-auto max-w-6xl px-4 py-8 md:py-10 grid gap-6 md:grid-cols-[1.2fr_minmax(0,1fr)]">
                {/* Left: Plan details & features */}
                <section className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 md:p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-[var(--sp-primary)]">
                                Checkout
                            </p>
                            <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900">
                                Confirm your plan
                            </h1>
                        </div>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                    </div>

                    <div className="mt-4">
                        {loading ? (
                            <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
                        ) : error ? (
                            <ErrorBox message={error} />
                        ) : !plan ? (
                            <EmptyBox text="No plan found." />
                        ) : (
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
                                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                                    {plan.description ? (
                                        <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
                                    ) : null}

                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold text-slate-900">
                                            ৳{price.toLocaleString("en-BD")}
                                        </span>
                                        <span className="text-slate-500">{period}</span>
                                    </div>

                                    <ul className="mt-4 space-y-2">
                                        {(plan.features || []).map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
                                    <h4 className="font-semibold text-slate-900">Tell us anything we should know</h4>
                                    <p className="mt-1 text-sm text-slate-600">
                                        This note goes to the admin with your request (optional).
                                    </p>
                                    <textarea
                                        rows={6}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 resize-y text-sm"
                                        placeholder="Example: I’m upgrading to list 20 properties and need onboarding help…"
                                    />
                                    {sent ? (
                                        <SuccessHint className="mt-3" />
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right: Actions / Summary */}
                <aside className="space-y-6">
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-900">Summary</h3>
                        {loading ? (
                            <div className="mt-3 h-24 rounded-xl bg-slate-100 animate-pulse" />
                        ) : error || !plan ? (
                            <p className="mt-3 text-sm text-slate-600">
                                Select a plan on the{" "}
                                <Link href="/pricing" className="text-[var(--sp-primary)] underline">
                                    pricing page
                                </Link>
                                .
                            </p>
                        ) : (
                            <>
                                <div className="mt-3 text-sm text-slate-700">
                                    <div className="flex items-center justify-between py-1">
                                        <span>Plan</span>
                                        <span className="font-medium">{plan.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span>Price</span>
                                        <span className="font-semibold">
                                            ৳{price.toLocaleString("en-BD")}
                                            <span className="text-slate-500">{period}</span>
                                        </span>
                                    </div>
                                </div>

                                {sent ? (
                                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                        Your upgrade request has been sent. We’ll notify you when it’s approved.
                                    </div>
                                ) : null}

                                <div className="mt-4 grid gap-2">
                                    {/* Primary action: send request to admin (buyers) */}
                                    <button
                                        onClick={sendRequest}
                                        disabled={submitting || loading || !plan || sent}
                                        className="inline-flex items-center justify-center rounded-xl bg-[var(--sp-primary)] px-4 py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-60"
                                    >
                                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {sent ? "Request Sent" : "Send Upgrade Request"}
                                    </button>

                                    {/* Payment: only visible/enabled if role is seller/admin */}
                                    <button
                                        onClick={payWithSSL}
                                        disabled={!isPrivileged || initiating || loading || !plan}
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 font-medium hover:bg-slate-50 disabled:opacity-60"
                                        title={isPrivileged ? "Pay with SSLCommerz" : "Payment available after approval"}
                                    >
                                        {initiating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="mr-2 h-4 w-4" />
                                        )}
                                        Pay with SSLCommerz
                                    </button>

                                    <p className="text-xs text-slate-500">
                                        After your request is approved by an admin, your account will be upgraded to access the seller dashboard.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <TrustPanel />
                </aside>
            </div>
        </main>
    );
}

/* ---------- Bits ---------- */

function Header() {
    return (
        <section className="relative overflow-hidden">
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(900px 400px at 50% -10%, rgba(99,102,241,0.18), transparent 60%)",
                }}
            />
            <div className="border-b border-slate-200 bg-white/70 backdrop-blur">
                <div className="mx-auto max-w-6xl px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 border border-indigo-100">
                                <Sparkles className="mr-1 h-3.5 w-3.5" /> Upgrade
                            </div>
                            <h2 className="mt-2 text-xl md:text-2xl font-bold text-slate-900">
                                Complete your plan selection
                            </h2>
                            <p className="text-slate-600">
                                Send a request to admins and (if applicable) proceed with payment.
                            </p>
                        </div>
                        <div className="hidden sm:block text-right">
                            <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-800 underline">
                                Change plan
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function TrustPanel() {
    return (
        <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                    <div className="font-semibold text-slate-900">Secure & Reviewed</div>
                    <p className="mt-1 text-sm text-slate-600">
                        Admins review every upgrade request. Payments are processed securely via SSLCommerz.
                    </p>
                </div>
            </div>
        </div>
    );
}

function ErrorBox({ message }) {
    return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
            {message}
        </div>
    );
}

function EmptyBox({ text = "Nothing to show." }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
            {text}
        </div>
    );
}

function SuccessHint({ className = "" }) {
    return (
        <div
            className={`rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ${className}`}
        >
            ✅ Request sent! We’ll notify you when it’s approved.
        </div>
    );
}
