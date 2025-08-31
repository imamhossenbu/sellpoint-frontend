"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log to your monitoring here if needed
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[70vh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 flex items-center justify-center p-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl w-full max-w-2xl p-8">
                <div className="pointer-events-none absolute -top-20 -right-28 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-24 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />

                <div className="flex items-center gap-3">
                    <svg className="h-7 w-7 text-white/90" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8v5m0 4h.01M4.93 4.93l14.14 14.14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h1 className="text-2xl font-semibold">Oops! Something broke.</h1>
                </div>

                <p className="mt-2 text-white/70">
                    Please try again. If the problem persists, let us know.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-slate-900 hover:bg-white transition"
                    >
                        Retry
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10 transition"
                    >
                        Home
                    </Link>
                </div>

                {process.env.NODE_ENV !== "production" && (
                    <details className="mt-6 rounded-xl bg-black/30 p-4 text-sm text-white/70">
                        <summary className="cursor-pointer select-none text-white/90">Error details (dev)</summary>
                        <pre className="mt-3 overflow-auto whitespace-pre-wrap">{String(error?.stack || error?.message || error)}</pre>
                    </details>
                )}
            </div>
        </div>
    );
}
