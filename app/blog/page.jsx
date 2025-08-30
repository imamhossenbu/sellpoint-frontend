// app/(routes)/blog/page.jsx  (adjust path if yours is different)
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Image as ImageIcon } from "lucide-react";
import BlogHero from "@/components/blog/BlogHero";

const DEFAULT_LIMIT = 9;

export default function PublicBlogPage() {
    const router = useRouter();
    const sp = useSearchParams();

    // Read filters from URL
    const qParam = sp.get("q") || "";
    const tagParam = sp.get("tag") || "";
    const pageParam = Math.max(1, Number(sp.get("page") || 1));
    const limitParam = Math.min(50, Math.max(3, Number(sp.get("limit") || DEFAULT_LIMIT)));

    // Data state
    const [posts, setPosts] = useState(null); // null = loading
    const [err, setErr] = useState("");
    const [meta, setMeta] = useState({ total: 0, page: pageParam, pages: 1 });

    // Fetch whenever URL query changes
    useEffect(() => {
        (async () => {
            setErr("");
            setPosts(null);
            try {
                const { data } = await api.get("/blog", {
                    params: {
                        q: qParam || undefined,
                        tag: tagParam || undefined,
                        page: pageParam,
                        limit: limitParam,
                    },
                });
                setPosts(Array.isArray(data?.items) ? data.items : []);
                setMeta({
                    total: Number(data?.total || 0),
                    page: Number(data?.page || pageParam),
                    pages: Number(data?.pages || 1),
                });
            } catch {
                setErr("Could not load blog posts.");
                setPosts([]);
                setMeta({ total: 0, page: 1, pages: 1 });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qParam, tagParam, pageParam, limitParam]);

    // Helpers
    const setParam = (key, value) => {
        const p = new URLSearchParams(sp.toString());
        if (value === undefined || value === null || value === "" || value === "all") p.delete(key);
        else p.set(key, String(value));
        // when changing filters (q/tag/limit), reset to page 1
        if (key !== "page") p.set("page", "1");
        router.push(`/blog?${p.toString()}`);
        // scroll to top for better UX
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goToPage = (n) => {
        const page = Math.min(Math.max(1, n), meta.pages || 1);
        setParam("page", String(page));
    };

    const pageNumbers = useMemo(() => {
        // Compact pagination numbers around current page
        const totalPages = meta.pages || 1;
        const cur = meta.page || 1;
        const span = 2; // numbers on each side
        const start = Math.max(1, cur - span);
        const end = Math.min(totalPages, cur + span);
        const out = [];
        for (let i = start; i <= end; i++) out.push(i);
        return out;
    }, [meta.page, meta.pages]);

    return (
        <>
            <BlogHero />
            <section className="max-w-6xl mx-auto py-10 px-4">
                {/* Top bar: results + page size */}
                <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
                    <div className="text-sm text-slate-600">
                        {meta.total ? (
                            <>
                                Showing <strong>{posts?.length || 0}</strong> of{" "}
                                <strong>{new Intl.NumberFormat().format(meta.total)}</strong> posts
                            </>
                        ) : (
                            "—"
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <label className="text-slate-600">Per page</label>
                        <select
                            value={limitParam}
                            onChange={(e) => setParam("limit", Number(e.target.value))}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            {[6, 9, 12, 15, 18].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {err ? (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        {err}
                    </div>
                ) : null}

                {posts === null ? (
                    <SkeletonGrid />
                ) : posts.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
                        No posts found.
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {posts.map((p) => (
                                <article
                                    key={p._id || p.slug}
                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                                >
                                    <Link href={`/blog/${encodeURIComponent(p.slug)}`} className="block">
                                        <div className="relative h-44 w-full overflow-hidden">
                                            <CoverImage coverUrl={p.coverUrl} title={p.title} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                                        </div>

                                        <div className="p-4">
                                            <div className="text-xs text-slate-500">
                                                {formatDate(p.publishedAt || p.updatedAt || p.createdAt)} •{" "}
                                                {p.readTime || "4 min read"}
                                            </div>
                                            <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900">{p.title}</h3>

                                            {p.excerpt ? (
                                                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.excerpt}</p>
                                            ) : null}

                                            {/* Tags (optional) */}
                                            {Array.isArray(p.tags) && p.tags.length ? (
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {p.tags.slice(0, 3).map((t) => (
                                                        <span
                                                            key={t}
                                                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                                                        >
                                                            {t}
                                                        </span>
                                                    ))}
                                                    {p.tags.length > 3 ? (
                                                        <span className="text-[11px] text-slate-500">
                                                            +{p.tags.length - 3}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-[11px] text-slate-400">—</div>
                                            )}

                                            {/* Learn more button */}
                                            <span className="mt-3 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 transition hover:shadow-sm">
                                                Learn more
                                                <svg
                                                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M5 12h14" />
                                                    <path d="m12 5 7 7-7 7" />
                                                </svg>
                                            </span>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta.pages > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                                <span className="text-slate-600">
                                    Page <strong>{meta.page}</strong> of <strong>{meta.pages}</strong>
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => goToPage(meta.page - 1)}
                                        disabled={meta.page <= 1}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                                    >
                                        Prev
                                    </button>

                                    {/* numeric page pills (compact) */}
                                    <div className="flex items-center gap-1">
                                        {meta.page > 3 && (
                                            <>
                                                <PagePill n={1} active={false} onClick={() => goToPage(1)} />
                                                <span className="px-1 text-slate-400">…</span>
                                            </>
                                        )}
                                        {pageNumbers.map((n) => (
                                            <PagePill
                                                key={n}
                                                n={n}
                                                active={n === meta.page}
                                                onClick={() => goToPage(n)}
                                            />
                                        ))}
                                        {meta.page < meta.pages - 2 && (
                                            <>
                                                <span className="px-1 text-slate-400">…</span>
                                                <PagePill
                                                    n={meta.pages}
                                                    active={false}
                                                    onClick={() => goToPage(meta.pages)}
                                                />
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => goToPage(meta.page + 1)}
                                        disabled={meta.page >= meta.pages}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </>
    );
}

/* ------------ Helpers & UI bits ------------ */

function PagePill({ n, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg border text-sm ${active
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
            aria-current={active ? "page" : undefined}
        >
            {n}
        </button>
    );
}

function isValidCover(url) {
    if (!url || typeof url !== "string") return false;
    if (url.startsWith("/")) return true; // site-relative
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function CoverImage({ coverUrl, title }) {
    if (!isValidCover(coverUrl)) {
        return (
            <div className="grid h-full w-full place-items-center bg-slate-100">
                <ImageIcon className="h-6 w-6 text-slate-400" />
            </div>
        );
    }
    return (
        <Image
            src={coverUrl}
            alt={title || "Blog cover"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={(e) => {
                const el = e.currentTarget;
                el.src =
                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
            }}
        />
    );
}

function SkeletonGrid() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="h-44 w-full bg-slate-200/70 animate-pulse" />
                    <div className="p-4">
                        <div className="h-3 w-40 rounded bg-slate-200/70 animate-pulse" />
                        <div className="mt-2 h-4 w-11/12 rounded bg-slate-200/70 animate-pulse" />
                        <div className="mt-2 h-4 w-10/12 rounded bg-slate-200/70 animate-pulse" />
                        <div className="mt-4 h-9 w-28 rounded bg-slate-200/70 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatDate(d) {
    if (!d) return "";
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "";
    }
}
