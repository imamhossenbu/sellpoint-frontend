// app/(components)/blog/BlogHero.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Tag, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";

/** Helpers: read & write filters via querystring (q + tag only) */
const readFilters = (sp) => ({
    q: sp.get("q") ?? "",
    tag: sp.get("tag") ?? "",
});
const toQuery = (f) => {
    const params = new URLSearchParams();
    if (f.q) params.set("q", f.q);
    if (f.tag) params.set("tag", f.tag);
    return params.toString();
};

export default function BlogHero({
    bgImage = "/blog-hero.jpg",
    title = "Learn. Decide. Move.",
    subtitle = "Guides and insights to help you buy or sell smarter on SellPoint.",
}) {
    const router = useRouter();
    const sp = useSearchParams();

    // initial state from URL (keeps state if user navigates back with params)
    const initial = useMemo(() => readFilters(sp), [sp]);
    const [local, setLocal] = useState(initial);

    // dynamic tags from backend
    const [tags, setTags] = useState(null); // null = loading, [] = none
    const [tagsErr, setTagsErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                // if you want counts, call /blog/tags?withCounts=1 and map x.tag
                const { data } = await api.get("/blog/tags");
                const list = Array.isArray(data?.items) ? data.items : [];
                setTags(list.slice(0, 40)); // safety cap
            } catch {
                setTagsErr("Could not load tags.");
                setTags([]);
            }
        })();
    }, []);

    const submit = (e) => {
        e?.preventDefault?.();
        const qs = toQuery(local);
        router.push(qs ? `/blog?${qs}` : "/blog");
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter") submit();
    };

    const applyAndGo = (nextState) => {
        setLocal(nextState);
        const qs = toQuery(nextState);
        router.push(qs ? `/blog?${qs}` : "/blog");
    };

    const toggleTag = (t) => {
        const next = local.tag === t ? "" : t;
        applyAndGo({ ...local, tag: next });
    };

    return (
        <section className="relative h-[58vh] md:h-[62vh] min-h-[380px] overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <Image
                    src={bgImage}
                    alt="Blog hero"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/40 to-black/35" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38 }}
                    className="w-full max-w-6xl"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{title}</h1>
                    <p className="mt-3 text-white/85 md:text-lg">{subtitle}</p>

                    {/* Glass search/filter bar */}
                    <form
                        onSubmit={submit}
                        className="
              mt-6 md:mt-8
              rounded-2xl border border-white/25
              bg-white/12 backdrop-blur-xl
              shadow-[0_20px_60px_rgba(0,0,0,0.25)]
              px-3 py-3 md:px-4 md:py-4
              flex flex-col md:flex-row md:items-center max-w-5xl mx-auto md:flex-nowrap gap-3 md:gap-4
              text-white
            "
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-2 py-1.5 md:px-3 md:py-2 md:min-w-[260px]">
                            <Search className="w-4 h-4 opacity-80" />
                            <input
                                value={local.q}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                onKeyDown={onKeyDown}
                                placeholder="Search posts… (e.g., pricing, mortgage, checklist)"
                                className="w-full bg-transparent outline-none placeholder-white/70 text-sm"
                            />
                            {local.q ? (
                                <button
                                    type="button"
                                    onClick={() => setLocal((s) => ({ ...s, q: "" }))}
                                    className="rounded-lg p-1 text-white/80 hover:bg-white/10"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>

                        {/* Tag dropdown (dynamic) */}
                        <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm">
                            <Tag className="w-4 h-4 opacity-80" />
                            <select
                                value={local.tag}
                                onChange={(e) =>
                                    setLocal((s) => ({ ...s, tag: e.target.value }))
                                }
                                className="bg-transparent outline-none text-white/95"
                                aria-label="Tag"
                            >
                                <option className="text-black" value="">
                                    All topics
                                </option>
                                {tags === null ? (
                                    <option className="text-black" value="" disabled>
                                        Loading…
                                    </option>
                                ) : (
                                    tags.map((t) => (
                                        <option className="text-black" key={t} value={t}>
                                            {t}
                                        </option>
                                    ))
                                )}
                            </select>
                            {local.tag ? (
                                <button
                                    type="button"
                                    onClick={() => setLocal((s) => ({ ...s, tag: "" }))}
                                    className="rounded-lg p-1 text-white/80 hover:bg-white/10"
                                    aria-label="Clear tag"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="ml-0 md:ml-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm
               bg-white text-[var(--sp-primary)] hover:bg-white/90"
                            title="Search"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Apply
                        </button>
                    </form>

                    {/* Quick chips — show top tags dynamically */}
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {tagsErr ? (
                            <span className="text-xs text-white/80 bg-black/20 rounded px-2 py-1">
                                {tagsErr}
                            </span>
                        ) : tags === null ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <span
                                    key={i}
                                    className="brand-chip bg-white/70 w-20 h-6 animate-pulse"
                                />
                            ))
                        ) : (
                            tags.slice(0, 8).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleTag(t)}
                                    className={`brand-chip hover:bg-white/80 ${local.tag === t ? "bg-white" : "bg-white/95"
                                        }`}
                                    title={`Filter by ${t}`}
                                >
                                    {t}
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
