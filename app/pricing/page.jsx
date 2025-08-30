// app/pricing/page.jsx
import Image from "next/image";
import Link from "next/link";
import PlansGrid from "@/components/pricing/PlansGrid";
import heroImage from "@/public/blog-hero.jpg"; // reuse an image in /public

export const dynamic = "force-dynamic";

async function fetchPlans() {
    const base = process.env.NEXT_PUBLIC_API_BASE || "";
    try {
        const res = await fetch(`${base}/plans`, { next: { revalidate: 0 } });
        if (!res.ok) throw new Error("Failed to load plans");
        const data = await res.json();
        return Array.isArray(data?.items) ? data.items : [];
    } catch {
        return []; // graceful fallback
    }
}

export default async function PricingPage() {
    const plans = await fetchPlans();

    return (
        <main className="min-h-screen bg-white text-slate-800">
            <Hero />

            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
                <Header
                    eyebrow="Simple, transparent"
                    title="Choose a plan that grows with you"
                    subtitle="Start free. Request an upgrade when you’re ready to sell. We’ll review and approve quickly."
                />
                <div className="mt-8">
                    <PlansGrid initialPlans={plans} />
                </div>
            </section>

            <FAQ />

            <BigCTA />
        </main>
    );
}

/* ---------------- Hero ---------------- */
function Hero() {
    return (
        <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src={heroImage}
                    alt="Pricing Hero"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/35" />
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(900px 420px at 50% -10%, rgba(99,102,241,0.25), transparent 60%)",
                    }}
                />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                <div className="h-[40vh] sm:h-[52vh] md:h-[60vh] flex items-end sm:items-center">
                    <div className="pb-8 sm:pb-0 text-white">
                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 ring-1 ring-white/25 backdrop-blur">
                            No hidden fees
                        </span>
                        <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold drop-shadow">
                            Pricing made simple
                        </h1>
                        <p className="mt-2 max-w-2xl text-white/90">
                            Pick your plan. Send a request. Once approved, your Seller
                            Dashboard unlocks instantly.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------------- Page Bits ---------------- */
function Header({ eyebrow, title, subtitle }) {
    return (
        <header className="text-center">
            {eyebrow ? (
                <p className="text-xs font-semibold tracking-wider uppercase text-[var(--sp-primary)]">
                    {eyebrow}
                </p>
            ) : null}
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                {title}
            </h2>
            {subtitle ? (
                <p className="mt-2 text-slate-600 max-w-3xl mx-auto">{subtitle}</p>
            ) : null}
        </header>
    );
}

function FAQ() {
    return (
        <section className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pb-12 sm:pb-16">
            <Header eyebrow="FAQ" title="Common questions" subtitle="No guesswork." />
            <div className="mt-6 divide-y divide-slate-200 border border-slate-200 rounded-2xl">
                <details className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between">
                        <span className="font-medium text-slate-900">Who approves my upgrade?</span>
                        <span className="ml-4 rounded-full border border-slate-300 px-2 text-xs text-slate-600 group-open:rotate-180 transition">
                            ▼
                        </span>
                    </summary>
                    <p className="mt-3 text-slate-600">
                        Our admin team reviews each request to keep the marketplace trusted. You’ll be notified once approved.
                    </p>
                </details>
                <details className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between">
                        <span className="font-medium text-slate-900">Do I pay before approval?</span>
                        <span className="ml-4 rounded-full border border-slate-300 px-2 text-xs text-slate-600 group-open:rotate-180 transition">
                            ▼
                        </span>
                    </summary>
                    <p className="mt-3 text-slate-600">
                        You submit a request first. If your plan requires payment, we’ll share the gateway link after admin approval or as part of the approval workflow—your setup can handle either.
                    </p>
                </details>
                <details className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between">
                        <span className="font-medium text-slate-900">When do I see the Seller Dashboard?</span>
                        <span className="ml-4 rounded-full border border-slate-300 px-2 text-xs text-slate-600 group-open:rotate-180 transition">
                            ▼
                        </span>
                    </summary>
                    <p className="mt-3 text-slate-600">
                        Immediately after admin approval. We flip your role to <b>seller</b> and your dashboard becomes available.
                    </p>
                </details>
            </div>
        </section>
    );
}

function BigCTA() {
    return (
        <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src="/about-cta.jpg"
                    alt="Happy customers"
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
                <div className="min-h-[48vh] md:min-h-[56vh] flex items-center justify-center text-center text-white">
                    <div>
                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 ring-1 ring-white/25 backdrop-blur">
                            Join thousands moving smarter
                        </span>
                        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold drop-shadow">
                            Ready to sell with confidence?
                        </h2>
                        <p className="mt-3 max-w-2xl mx-auto text-white/90">
                            Request an upgrade now—our team approves fast so you can start selling.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-[var(--sp-primary)] font-medium hover:bg-white/90"
                            >
                                View plans
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
