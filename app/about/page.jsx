// app/about/page.jsx
import Link from "next/link";
import Image from "next/image";
import {
    ShieldCheck,
    Home,
    Users,
    Star,
    Rocket,
    TrendingUp,
    HeartHandshake,
    Globe2,
    Sparkles,
    PhoneCall,
    MapPin,
} from "lucide-react";

import heroImage from "@/public/about-hero.jpg"; // background for hero

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white text-slate-800">
            <Hero />

            {/* Quick stats */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-4">
                    <StatCard kpi="15k+" label="Active Listings" Icon={Home} />
                    <StatCard kpi="4.9/5" label="Avg. Seller Rating" Icon={Star} />
                    <StatCard kpi="120k+" label="Monthly Visitors" Icon={TrendingUp} />
                    <StatCard kpi="100%" label="Secure Payments" Icon={ShieldCheck} />
                </div>
            </section>

            {/* Mission / Vision */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16">
                <SectionHeader
                    eyebrow="Our Purpose"
                    title="Making real-estate simple, safe, and transparent"
                    subtitle="We connect buyers and sellers with confidence by combining careful verification, practical tools, and a warm human touch."
                />
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <Card>
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 rounded-xl bg-indigo-100 p-2">
                                <Rocket className="h-5 w-5 text-indigo-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Our Mission</h3>
                                <p className="mt-1 text-slate-600">
                                    Empower every person to find, compare, and secure property with clarity—no
                                    jargon, no hidden hoops, just a smooth path from discovery to deal.
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 rounded-xl bg-emerald-100 p-2">
                                <Globe2 className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Our Vision</h3>
                                <p className="mt-1 text-slate-600">
                                    Build the most trusted, people-first marketplace where local communities thrive
                                    and great homes find the right owners and tenants.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Why choose us */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16">
                <SectionHeader eyebrow="Why Choose SellPoint" title="Built for speed, trust, and clarity" />
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        Icon={ShieldCheck}
                        title="Verified Sellers"
                        text="Profiles, reviews, and checks reduce risk so you can focus on the property."
                    />
                    <FeatureCard
                        Icon={MapPin}
                        title="Local Insights"
                        text="Neighborhood notes, commute hints, and nearby amenities at a glance."
                    />
                    <FeatureCard
                        Icon={Sparkles}
                        title="Polished Experience"
                        text="Fast search, crisp photos, and thoughtful flows that respect your time."
                    />
                    <FeatureCard
                        Icon={Users}
                        title="Human Support"
                        text="Real people ready to help—whether you’re a first-timer or a pro."
                    />
                    <FeatureCard
                        Icon={TrendingUp}
                        title="Smart Matching"
                        text="Filters and recommendations that actually help narrow your choices."
                    />
                    <FeatureCard
                        Icon={HeartHandshake}
                        title="Fair & Transparent"
                        text="Clear pricing, fair policies, and optional escrow for peace of mind."
                    />
                </div>
            </section>

            {/* Process timeline */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16">
                <SectionHeader eyebrow="How It Works" title="From search to keys—clear steps, zero stress" />
                <ol className="relative mt-8 space-y-8 border-slate-200 pl-6 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
                    <TimelineStep
                        step={1}
                        title="Discover verified listings"
                        text="Browse up-to-date homes, flats, and land with accurate photos, pricing, and details."
                    />
                    <TimelineStep
                        step={2}
                        title="Chat in real time"
                        text="Use built-in secure chat to ask questions, share docs, and schedule viewings."
                    />
                    <TimelineStep
                        step={3}
                        title="Deal with confidence"
                        text="Transparent terms and optional escrow remove the usual friction from closing."
                    />
                </ol>
            </section>

            {/* Values */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16">
                <SectionHeader eyebrow="What We Value" title="Principles that guide every decision" />
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <ValueCard
                        Icon={ShieldCheck}
                        title="Trust by design"
                        text="We bake safety into every surface, not as an afterthought."
                    />
                    <ValueCard
                        Icon={HeartHandshake}
                        title="People first"
                        text="Clear language, kind support, and sensible defaults."
                    />
                    <ValueCard
                        Icon={Sparkles}
                        title="Delight in the details"
                        text="Small touches that add up to a better experience."
                    />
                </div>
            </section>

            {/* Team */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16">
                <SectionHeader eyebrow="Meet the Team" title="A small, mighty crew building big things" />
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <TeamCard name="Aisha Rahman" role="CEO & Co-founder" />
                    <TeamCard name="Tanvir Hasan" role="Head of Product" />
                    <TeamCard name="Maya Chowdhury" role="Engineering Lead" />
                </div>
            </section>

            {/* FULL-BLEED CTA (fills most of the viewport) */}
            <BigCTA />
        </main>
    );
}

/* ---------------- Hero ---------------- */
function Hero() {
    return (
        <section className="relative isolate overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={heroImage}           // imported StaticImageData
                    alt="Find your next home"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                {/* Gradient wash & subtle accents */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/40 to-black/35" />
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(900px 400px at 50% -10%, rgba(99,102,241,0.22), transparent 60%)",
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                <div className="h-[46vh] sm:h-[58vh] md:h-[64vh] flex items-end sm:items-center">
                    <div className="pb-8 sm:pb-0">
                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 ring-1 ring-white/25 backdrop-blur">
                            Est. 2024 · Built in BD
                        </span>
                        <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow">
                            About SellPoint
                        </h1>
                        <p className="mt-2 max-w-2xl text-white/90">
                            A modern marketplace for homes, flats, and land—crafted for trust, speed, and
                            simplicity.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href="/listings"
                                className="inline-flex items-center justify-center rounded-xl bg-white/90 px-4 py-2.5 text-[var(--sp-primary)] font-medium hover:bg-white"
                            >
                                Explore Listings
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-2.5 text-white font-medium hover:bg-white/10"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------------- Full-bleed CTA ---------------- */
function BigCTA() {
    return (
        <section className="relative isolate overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/about-cta.jpg"     // put this file in /public
                    alt="Happy homeowners celebrating a deal"
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50" />
                <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(1000px 420px at 50% -10%, rgba(99,102,241,0.25), transparent 60%)",
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
                <div className="min-h-[64vh] md:min-h-[72vh] flex items-center justify-center text-center">
                    <div>
                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 ring-1 ring-white/25 backdrop-blur">
                            Join thousands moving smarter
                        </span>
                        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow">
                            Ready to list or find your next home?
                        </h2>
                        <p className="mt-3 max-w-2xl mx-auto text-white/90">
                            Create your account in minutes and get matched with serious buyers and quality
                            listings. Real people, verified listings, fewer headaches.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-[var(--sp-primary)] font-medium hover:bg-white/90"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-white font-medium hover:bg-white/10"
                            >
                                <PhoneCall className="h-4 w-4 mr-2" />
                                Talk to us
                            </Link>
                        </div>

                        {/* Small reassurance row */}
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-white/85 text-sm">
                            <div className="inline-flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Secure & verified
                            </div>
                            <div className="inline-flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Growing daily
                            </div>
                            <div className="inline-flex items-center gap-2">
                                <HeartHandshake className="h-4 w-4" /> People-first support
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------------- Small components ---------------- */
function SectionHeader({ eyebrow, title, subtitle }) {
    return (
        <header className="text-center">
            {eyebrow ? (
                <p className="text-xs font-semibold tracking-wider uppercase text-[var(--sp-primary)]">
                    {eyebrow}
                </p>
            ) : null}
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-2 text-slate-600 max-w-3xl mx-auto">{subtitle}</p> : null}
        </header>
    );
}

function StatCard({ kpi, label, Icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2">
                    <Icon className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-900">{kpi}</div>
                    <div className="text-sm text-slate-600">{label}</div>
                </div>
            </div>
        </div>
    );
}

function Card({ children }) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{children}</div>;
}

function FeatureCard({ Icon, title, text }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-xl bg-slate-100 p-2">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-slate-600">{text}</p>
                </div>
            </div>
        </div>
    );
}

function TimelineStep({ step, title, text }) {
    return (
        <li className="relative pl-6">
            <span className="absolute -left-[27px] top-0 grid h-8 w-8 place-items-center rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700">
                {step}
            </span>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-slate-600">{text}</p>
        </li>
    );
}

function ValueCard({ Icon, title, text }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-xl bg-slate-100 p-2">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-slate-600">{text}</p>
                </div>
            </div>
        </div>
    );
}

function TeamCard({ name, role }) {
    const initials = (name || "U")
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200">
                    <div
                        className="absolute inset-0 grid place-items-center text-white font-semibold"
                        style={{
                            background: "linear-gradient(135deg, var(--sp-primary), var(--sp-primary-alt))",
                        }}
                    >
                        {initials}
                    </div>
                </div>
                <div>
                    <div className="font-semibold text-slate-900">{name}</div>
                    <div className="text-sm text-slate-600">{role}</div>
                </div>
            </div>
        </div>
    );
}
