import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 flex items-center justify-center p-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl w-full max-w-xl p-10 text-center">
                <div className="pointer-events-none absolute -top-24 right-1/2 h-64 w-64 rounded-full bg-rose-500/30 blur-3xl" />
                <h1 className="text-7xl font-black leading-none">404</h1>
                <p className="mt-3 text-white/80">
                    The page you’re looking for doesn’t exist or has been moved.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="rounded-xl bg-white/90 px-4 py-2 text-slate-900 hover:bg-white transition"
                    >
                        Go home
                    </Link>
                    <Link
                        href="/listings"
                        className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10 transition"
                    >
                        Search listings
                    </Link>
                </div>
            </div>
        </div>
    );
}
