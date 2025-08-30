// app/payment/cancel/page.jsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    XCircle,
    Clipboard,
    ClipboardCheck,
    ArrowLeft,
    RefreshCcw,
    LifeBuoy,
    Home,
} from "lucide-react";

export default function PaymentCancelPage() {
    const sp = useSearchParams();
    const tranId = sp.get("tran_id") || sp.get("tranId") || "";
    const amt = sp.get("amount");
    const amount = useMemo(() => {
        const n = Number(amt);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [amt]);

    const [copied, setCopied] = useState(false);

    const copyTran = async () => {
        if (!tranId) return;
        try {
            await navigator.clipboard.writeText(tranId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { }
    };

    return (
        <main className="min-h-screen bg-[#F8FAFF]">
            {/* Header */}
            <section className="relative overflow-hidden">
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(1000px 420px at 50% -10%, rgba(244,63,94,0.14), transparent 60%)",
                    }}
                />
                <div className="border-b border-slate-200 bg-white/70 backdrop-blur">
                    <div className="mx-auto max-w-5xl px-4 py-8 text-center">
                        <div className="mx-auto inline-flex items-center justify-center rounded-full bg-rose-50 border border-rose-100 p-2">
                            <XCircle className="h-6 w-6 text-rose-600" />
                        </div>
                        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
                            Payment Canceled
                        </h1>
                        <p className="mt-1 text-slate-600">
                            Your payment was not completed. You can try again or choose a different plan.
                        </p>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-5xl px-4 py-8 grid gap-6 md:grid-cols-[1.2fr_minmax(0,1fr)]">
                {/* Details card */}
                <section className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 md:p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Payment Details</h2>
                    <div className="mt-4 grid gap-3 text-sm text-slate-700">
                        <Row label="Status">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5">
                                <XCircle className="h-4 w-4" />
                                Canceled
                            </span>
                        </Row>

                        {amount ? (
                            <Row label="Amount">
                                <span>৳{amount.toLocaleString("en-BD")}</span>
                            </Row>
                        ) : null}

                        {tranId ? (
                            <Row label="Transaction ID">
                                <code className="rounded bg-slate-50 px-2 py-1 text-[13px] border border-slate-200">
                                    {tranId}
                                </code>
                                <button
                                    onClick={copyTran}
                                    className="ml-2 inline-flex items-center gap-1 text-xs rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                    title="Copy transaction ID"
                                >
                                    {copied ? (
                                        <>
                                            <ClipboardCheck className="h-3.5 w-3.5" /> Copied
                                        </>
                                    ) : (
                                        <>
                                            <Clipboard className="h-3.5 w-3.5" /> Copy
                                        </>
                                    )}
                                </button>
                            </Row>
                        ) : null}

                        <Row label="Notes">
                            <p className="text-slate-600">
                                If you canceled by mistake, you can safely retry the payment.
                                If the issue persists, contact support.
                            </p>
                        </Row>
                    </div>
                </section>

                {/* Actions */}
                <aside className="space-y-4">
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-900">Next steps</h3>
                        <div className="mt-4 grid gap-2">
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sp-primary)] px-4 py-2.5 text-white font-medium hover:opacity-90"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Try Again
                            </Link>
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Pricing
                            </Link>
                            <Link
                                href="/support"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 hover:bg-slate-50"
                            >
                                <LifeBuoy className="h-4 w-4" />
                                Contact Support
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 hover:bg-slate-50"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}

function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[140px_1fr] items-start gap-3">
            <div className="text-slate-500">{label}</div>
            <div>{children}</div>
        </div>
    );
}
