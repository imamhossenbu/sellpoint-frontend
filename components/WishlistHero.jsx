// components/WishlistHero.jsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function WishlistHero({
    count = 0,
    authed = false,
    onClear = null,            // optional; pass to show a "Clear all" button
    bgImage = "/hero-wishlist.jpg",
}) {
    const title = authed ? "Your Wishlist" : "Save your favorite places";
    const subtitle = authed
        ? `${count} saved ${count === 1 ? "listing" : "listings"}.`
        : "Sign in to start saving listings you love.";

    return (
        <section className="relative h-[44vh] md:h-[48vh] overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bgImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/35" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-5xl"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{title}</h1>
                    <p className="mt-3 text-white/85 md:text-lg">{subtitle}</p>

                    {/* Simple CTAs — no search */}
                    <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/listings"
                            className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold
                         bg-white text-[var(--sp-primary)] hover:bg-white/90"
                        >
                            Browse Listings
                        </Link>

                        {!authed ? (
                            <Link
                                href="/login"
                                className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-medium
                           border border-white/30 bg-white/10 text-white hover:bg-white/15"
                            >
                                Sign in
                            </Link>
                        ) : onClear && count > 0 ? (
                            <button
                                onClick={onClear}
                                className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-medium
                           border border-white/30 bg-white/10 text-white hover:bg-white/15"
                            >
                                Clear all
                            </button>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
