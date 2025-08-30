// components/home/HowItWorks.jsx
"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Building2, Handshake, ArrowRight } from "lucide-react";
import SectionHeader from "@/components/common/SectionHeader";
import Link from "next/link";

const steps = [
    {
        icon: Building2,
        title: "Find a property",
        text: "Search verified, approved listings with powerful filters.",
        accent: "from-indigo-500/15 via-indigo-500/10 to-transparent",
        href: '/listings'
    },
    {
        icon: BadgeCheck,
        title: "Contact the seller",
        text: "Message or call the seller directly from the listing.",
        accent: "from-emerald-500/15 via-emerald-500/10 to-transparent",
        href: '/contact'
    },
    {
        icon: Handshake,
        title: "Close the deal",
        text: "Meet, verify, and pay in cash — simple and transparent.",
        accent: "from-amber-500/20 via-amber-500/10 to-transparent",
        href: '/faq'
    },
];

const container = {
    hidden: { opacity: 0, y: 8 },
    show: {
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.12, ease: "easeOut", duration: 0.35 },
    },
};

const item = {
    hidden: { opacity: 0, y: 14, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { ease: "easeOut", duration: 0.38 } },
};

export default function HowItWorks() {
    return (
        <section className="relative max-w-6xl mx-auto px-4">
            {/* Soft background flourish */}
            <div className="pointer-events-none absolute inset-x-0 -top-6 mx-auto h-40 w-[72%] rounded-full bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-amber-500/10 blur-3xl" />

            <SectionHeader
                title="How SellPoint Works"
                subtitle="From discovery to handshake in three easy steps."
                align="center"
            />

            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
                {steps.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={i}
                            variants={item}
                            whileHover={{ y: -6 }}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                        >
                            {/* Accent glow */}
                            <div
                                className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${s.accent} blur-2xl transition-opacity group-hover:opacity-100 opacity-80`}
                            />

                            {/* Icon badge */}
                            <div className="relative inline-flex items-center justify-center rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                                <span className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-white via-white to-slate-50" />
                                <Icon className="h-6 w-6 text-slate-800" />
                                {/* Animated ring on hover */}
                                <motion.span
                                    aria-hidden
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    whileHover={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/20 to-amber-500/20 blur"
                                />
                            </div>

                            {/* Title & copy */}
                            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                                {s.title}
                            </h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.text}</p>

                            {/* CTA chevron */}
                            <Link href={s.href} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-700">
                                Learn more
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>


                            {/* Bottom gradient border on hover */}
                            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
}
