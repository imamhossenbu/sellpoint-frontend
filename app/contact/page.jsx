// app/contact/page.jsx
import Link from "next/link";
import Image from "next/image";
import {
    Mail,
    PhoneCall,
    MapPin,
    Clock,
    ShieldCheck,
    TrendingUp,
    HeartHandshake,
} from "lucide-react";
import heroImage from "@/public/blog-hero.jpg"; // reuse an existing image in /public
import ContactForm from "@/components/forms/ContactForm";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-white text-slate-800">
            <Hero />

            {/* Contact info + form */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
                    {/* Info cards */}
                    <div className="space-y-4">
                        <InfoCard
                            Icon={PhoneCall}
                            title="Call us"
                            lines={["+880 1234-567890", "+880 9876-543210"]}
                            hint="Sun–Thu, 10:00–18:00 (BST)"
                        />
                        <InfoCard
                            Icon={Mail}
                            title="Email"
                            lines={["support@sellpoint.com", "sales@sellpoint.com"]}
                            hint="We reply within 1 business day"
                        />
                        <InfoCard
                            Icon={MapPin}
                            title="Office"
                            lines={["Road 12, Gulshan", "Dhaka, Bangladesh"]}
                            hint="Visits by appointment"
                        />
                        <InfoCard
                            Icon={Clock}
                            title="Hours"
                            lines={["Sun–Thu: 10:00–18:00", "Fri–Sat: Closed"]}
                            hint="Emergency support available"
                        />
                    </div>

                    {/* Contact form (client component) */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                        <SectionHeader
                            eyebrow="Get in touch"
                            title="Tell us how we can help"
                            subtitle="Fill the form and our team will get back to you shortly."
                            align="left"
                        />
                        <div className="mt-6">
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </section>

            {/* Map */}
            <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pb-12 sm:pb-16">
                <SectionHeader
                    eyebrow="Find us"
                    title="Our location"
                    subtitle="We’re centrally located and easy to reach."
                />
                <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200">
                    {/* Replace the src with your own Google Maps embed */}
                    <iframe
                        title="SellPoint Office Map"
                        src="https://maps.google.com/maps?q=Rupatoli%20Barisal&t=&z=13&ie=UTF8&iwloc=&output=embed"
                        className="w-full h-[320px] sm:h-[380px] md:h-[440px]"
                        loading="lazy"
                    />
                </div>
            </section>

            {/* FAQ (no JS needed) */}
            <section className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pb-12 sm:pb-16">
                <SectionHeader
                    eyebrow="FAQ"
                    title="Common questions"
                    subtitle="Quick answers to the things we get asked the most."
                />
                <div className="mt-6 divide-y divide-slate-200 border border-slate-200 rounded-2xl">
                    <FAQ q="How fast do you respond?" a="We usually reply within one business day. For urgent issues, call us and choose support." />
                    <FAQ q="Do you offer on-site visits?" a="Yes—by appointment. Use the form to schedule your preferred time." />
                    <FAQ q="Is my data safe?" a="Absolutely. We follow industry best practices and never sell your data." />
                </div>
            </section>

            {/* Full-bleed CTA */}
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
                    src={heroImage} // StaticImageData from /public
                    alt="Contact SellPoint"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                {/* Gradient wash & accent */}
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

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                <div className="h-[42vh] sm:h-[56vh] md:h-[64vh] flex items-end sm:items-center">
                    <div className="pb-8 sm:pb-0 text-white">
                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 ring-1 ring-white/25 backdrop-blur">
                            We’re here to help
                        </span>
                        <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold drop-shadow">
                            Contact SellPoint
                        </h1>
                        <p className="mt-2 max-w-2xl text-white/90">
                            Questions, feedback, or partnership ideas? Let’s talk.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href="mailto:support@sellpoint.com"
                                className="inline-flex items-center justify-center rounded-xl bg-white/90 px-4 py-2.5 text-[var(--sp-primary)] font-medium hover:bg-white"
                            >
                                Email Support
                            </Link>
                            <Link
                                href="tel:+8801234567890"
                                className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-2.5 text-white font-medium hover:bg-white/10"
                            >
                                Call Us
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
                    src="/about-cta.jpg" // ensure this exists in /public
                    alt="Happy customers"
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
                <div className="min-h-[60vh] md:min-h-[68vh] flex items-center justify-center text-center">
                    <div>
                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs text-white/90 ring-1 ring-white/25 backdrop-blur">
                            Join thousands moving smarter
                        </span>
                        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow">
                            Ready to list or find your next home?
                        </h2>
                        <p className="mt-3 max-w-2xl mx-auto text-white/90">
                            Create your account in minutes and get matched with serious buyers and quality
                            listings.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-[var(--sp-primary)] font-medium hover:bg-white/90"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href="/listings"
                                className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-white font-medium hover:bg-white/10"
                            >
                                Browse Listings
                            </Link>
                        </div>

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

/* ---------------- Bits ---------------- */
function SectionHeader({ eyebrow, title, subtitle, align = "center" }) {
    const alignCls = align === "left" ? "text-left" : "text-center";
    return (
        <header className={alignCls}>
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

function InfoCard({ Icon, title, lines = [], hint }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-xl bg-slate-100 p-2">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <ul className="mt-1 space-y-0.5 text-slate-700">
                        {lines.map((l, i) => (
                            <li key={i}>{l}</li>
                        ))}
                    </ul>
                    {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
                </div>
            </div>
        </div>
    );
}

function FAQ({ q, a }) {
    return (
        <details className="group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between">
                <span className="font-medium text-slate-900">{q}</span>
                <span className="ml-4 rounded-full border border-slate-300 px-2 text-xs text-slate-600 group-open:rotate-180 transition">
                    ▼
                </span>
            </summary>
            <p className="mt-3 text-slate-600">{a}</p>
        </details>
    );
}
