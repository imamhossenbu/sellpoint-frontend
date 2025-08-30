// app/(components)/home/Testimonials.jsx
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import SectionHeader from "@/components/common/SectionHeader";

export default function Testimonials() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/testimonials");
                setItems(data.items || []);
            } catch {
                setItems([]);
            }
        })();
    }, []);

    if (!items.length) return null;

    return (
        <section className="max-w-6xl mx-auto px-4">
            <SectionHeader
                title="What our users say"
                subtitle="Real experiences from buyers and sellers on SellPoint."
                align="center"
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => (
                    <figure
                        key={t._id}
                        className="
              group rounded-xl border border-slate-200 bg-white p-6 shadow-sm
              transition-transform duration-300 hover:-translate-y-1 hover:shadow-md
            "
                    >
                        {/* quote */}
                        <blockquote className="relative text-slate-700">
                            <span className="absolute -top-3 left-0 text-4xl text-indigo-200">“</span>
                            <p className="pl-5 text-sm leading-relaxed">{t.quote}</p>
                        </blockquote>

                        {/* author */}
                        <figcaption className="mt-5 flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={t.avatarUrl || "/avatar.svg"}
                                alt={t.name}
                                className="h-10 w-10 rounded-full object-cover bg-slate-100"
                            />
                            <div>
                                <div className="font-semibold text-slate-800">{t.name}</div>
                                <div className="text-xs text-slate-500">{t.role || "Customer"}</div>
                            </div>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}
