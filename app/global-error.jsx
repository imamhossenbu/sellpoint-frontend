"use client";

export default function GlobalError({ error, reset }) {
    // This file must wrap with <html> and <body>
    return (
        <html>
            <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 flex items-center justify-center p-6">
                <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl w-full max-w-2xl p-8">
                    <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />

                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <svg className="h-8 w-8 text-white/90" viewBox="0 0 24 24" fill="none">
                            <path d="M12 9v4m0 4h.01M3 12a9 9 0 1018 0A9 9 0 003 12z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
                    </div>

                    <p className="mt-2 text-white/70">
                        We hit an unexpected error. You can try again, or go back home.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => reset()}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-slate-900 hover:bg-white transition"
                        >
                            Try again
                        </button>
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10 transition"
                        >
                            Go home
                        </a>
                        <a
                            href="mailto:support@sellpoint.app"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10 transition"
                        >
                            Contact support
                        </a>
                    </div>

                    {/* Collapsible details (avoid showing stack in prod to users) */}
                    {process.env.NODE_ENV !== "production" && (
                        <details className="mt-6 rounded-xl bg-black/30 p-4 text-sm text-white/70">
                            <summary className="cursor-pointer select-none text-white/90">Error details (dev)</summary>
                            <pre className="mt-3 overflow-auto whitespace-pre-wrap">{String(error?.stack || error?.message || error)}</pre>
                        </details>
                    )}
                </div>
            </body>
        </html>
    );
}
