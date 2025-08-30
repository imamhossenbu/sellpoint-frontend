"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import SectionHeader from "@/components/common/SectionHeader";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const container = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, duration: 0.35 } },
};
const item = {
    hidden: { opacity: 0, y: 14, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
};

export default function LatestBlog() {
    const [posts, setPosts] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/blog/latest", { params: { limit: 3 } });
                setPosts(data.items || []);
            } catch {
                setPosts([]);
            }
        })();
    }, []);

    if (posts === null) {
        return (
            <section className="max-w-6xl mx-auto px-4">
                <SectionHeader
                    title="Latest from the Blog"
                    subtitle="Tips, trends, and guides to help you buy or sell smarter."
                    align="center"
                />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="h-40 w-full bg-slate-200/70 animate-pulse" />
                            <div className="p-4">
                                <div className="h-3 w-40 bg-slate-200/70 rounded mb-2 animate-pulse" />
                                <div className="h-4 w-60 bg-slate-200/70 rounded mb-2 animate-pulse" />
                                <div className="h-3 w-56 bg-slate-200/70 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!posts.length) return null;

    return (
        <section className="max-w-6xl pb-10 mx-auto px-4">
            <SectionHeader
                title="Latest from the Blog"
                subtitle="Tips, trends, and guides to help you buy or sell smarter."
                align="center"
            />

            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
                {posts.map((p) => (
                    <motion.article
                        key={p.slug}
                        variants={item}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
                    >
                        <Link href={`/blog/${p.slug}`} className="block">
                            <div className="relative h-40 w-full overflow-hidden">
                                {p.coverUrl ? (
                                    <Image
                                        src={p.coverUrl}
                                        alt={p.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                    />
                                ) : (
                                    <div className="grid h-full w-full place-items-center bg-slate-100">
                                        <span className="text-slate-400 text-sm">No image</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                            </div>
                        </Link>

                        <div className="p-4">
                            <div className="text-xs text-slate-500">
                                {formatBlogDate(p.publishedAt || p.createdAt)} • {p.readTime || "4 min read"}
                            </div>
                            <h3 className="mt-1 font-semibold text-slate-900 line-clamp-2">
                                <Link href={`/blog/${p.slug}`} className="hover:underline">
                                    {p.title}
                                </Link>
                            </h3>
                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.excerpt}</p>

                            {/* Learn more button as a link */}
                            <Link
                                href={`/blog/${p.slug}`}
                                className="mt-3 inline-flex items-center text-sm font-medium text-indigo-700 hover:underline"
                            >
                                Read more
                                <svg
                                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </motion.article>
                ))}
            </motion.div>

            <div className="mt-6 text-center">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:shadow"
                >
                    View all posts
                </Link>
            </div>
        </section>
    );
}

function formatBlogDate(d) {
    if (!d) return "";
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "";
    }
}
