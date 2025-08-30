"use client";

import Link from "next/link";
import { Home, Building2, MapPinned, ArrowRight } from "lucide-react";
import SectionHeader from "@/components/common/SectionHeader";

const items = [
    {
        key: "house",
        label: "Houses",
        icon: Home,
        desc: "Independent homes in great neighborhoods.",
        bg: "from-indigo-50 to-white",
    },
    {
        key: "flat",
        label: "Flats",
        icon: Building2,
        desc: "Modern apartments for rent or sale.",
        bg: "from-emerald-50 to-white",
    },
    {
        key: "land",
        label: "Land",
        icon: MapPinned,
        desc: "Plots in prime and developing areas.",
        bg: "from-amber-50 to-white",
    },
];

export default function CategoriesGrid() {
    return (
        <section className="max-w-6xl mx-auto px-4">
            <SectionHeader
                title="Browse by Category"
                subtitle="Jump straight into the type of property you’re after."
                align="center"
            />

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => {
                    const Icon = c.icon;
                    return (
                        <Link
                            key={c.key}
                            href={`/listings?category=${c.key}`}
                            aria-label={`Explore ${c.label}`}
                            className={`
                group relative overflow-hidden rounded-2xl border border-slate-200
                bg-gradient-to-br ${c.bg}
                flex flex-col justify-between
                p-4 sm:p-5
                shadow-sm hover:shadow-md active:shadow
                transition
                touch-manipulation select-none
              `}
                        >
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="rounded-xl bg-white shadow-sm p-2.5 sm:p-3 shrink-0">
                                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-slate-700" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                                        {c.label}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                                        {c.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Mobile-friendly CTA: full width on small screens, pill on larger */}
                            <div className="mt-4 sm:mt-5">
                                <span
                                    className="
                    inline-flex items-center justify-center gap-2
                    w-full sm:w-auto
                    rounded-xl border border-slate-300/60 bg-white/80 backdrop-blur
                    px-3 py-2 text-sm font-medium text-slate-800
                    group-hover:border-slate-300 group-hover:bg-white
                    transition
                  "
                                >
                                    Explore
                                    <ArrowRight className="h-4 w-4 transition -mr-0.5 group-hover:translate-x-0.5" />
                                </span>
                            </div>

                            {/* Bigger tap target feedback on mobile */}
                            <span className="absolute inset-0 rounded-2xl ring-0 ring-indigo-200/0 group-active:ring-4 transition-[ring-width,ring-color]" />
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
