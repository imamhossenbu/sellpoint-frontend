"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";

export default function BlogDetailPage() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/blog/${slug}`);
                if (!data || !data._id) {
                    setErr("Not found");
                    return;
                }
                setPost(data);
            } catch {
                setErr("Failed to load post.");
            }
        })();
    }, [slug]);

    if (err === "Not found") return notFound();

    return (
        <section className="max-w-3xl mx-auto px-4 py-10">
            {/* Back button */}
            <div className="mb-4">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Blog
                </Link>
            </div>

            {/* Loading skeleton */}
            {!post ? (
                <div className="grid gap-3">
                    <div className="h-8 w-2/3 rounded bg-slate-200/70 animate-pulse" />
                    <div className="h-5 w-1/3 rounded bg-slate-200/70 animate-pulse" />
                    <div className="h-60 w-full rounded-xl bg-slate-200/70 animate-pulse" />
                    <div className="h-4 w-full rounded bg-slate-200/70 animate-pulse" />
                    <div className="h-4 w-11/12 rounded bg-slate-200/70 animate-pulse" />
                    <div className="h-4 w-9/12 rounded bg-slate-200/70 animate-pulse" />
                </div>
            ) : (
                <>
                    {/* Title + meta */}
                    <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
                    <div className="mt-1 text-sm text-slate-500">
                        {formatDate(post.publishedAt || post.updatedAt || post.createdAt)} •{" "}
                        {post.readTime || "4 min read"}
                    </div>

                    {/* Cover image */}
                    <div className="relative mt-4 h-72 w-full overflow-hidden rounded-xl ring-1 ring-slate-200">
                        {post.coverUrl ? (
                            <Image
                                src={post.coverUrl}
                                alt={post.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 768px"
                            />
                        ) : (
                            <div className="grid h-full w-full place-items-center bg-slate-100">
                                <ImageIcon className="h-6 w-6 text-slate-400" />
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {Array.isArray(post.tags) && post.tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {post.tags.map((t) => (
                                <Link
                                    key={t}
                                    href={`/blog?tag=${encodeURIComponent(t)}`}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
                                >
                                    #{t}
                                </Link>
                            ))}
                        </div>
                    ) : null}

                    {/* Content */}
                    <div className="prose prose-slate mt-6 max-w-none prose-headings:scroll-mt-20 prose-a:text-indigo-600 hover:prose-a:underline">
                        {/* API returns HTML → use dangerouslySetInnerHTML */}
                        <div dangerouslySetInnerHTML={{ __html: post.content || "" }} />
                    </div>
                </>
            )}
        </section>
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
