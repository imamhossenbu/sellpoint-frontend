"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import WishlistButton from "@/components/WishlistButton";
import {
    MessageSquare, Star, Send, X, Loader2, BellDot, MapPin,
    ChevronLeft, ChevronRight,
    Mail, Phone, Copy, ExternalLink
} from "lucide-react"; // ⬅️ added icons
import { useAuth } from "@/context/AuthContext";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export default function ListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    const [chatOpen, setChatOpen] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [convId, setConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [unread, setUnread] = useState(0);

    const [reviews, setReviews] = useState([]);
    const [revMeta, setRevMeta] = useState({ avg: 0, count: 0 });
    const [savingReview, setSavingReview] = useState(false);
    const [form, setForm] = useState({ rating: 5, comment: "" });
    const [reviewNotice, setReviewNotice] = useState("");
    console.log(item);

    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const revBottomRef = useRef(null);
    const seenRef = useRef(new Set());

    const myId = useMemo(() => String(user?._id || user?.id || ""), [user]);
    const sellerId = useMemo(() => String(item?.seller?._id || ""), [item]);
    const isOwner = !!myId && !!sellerId && myId === sellerId;

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const [{ data: listing }, { data: rev }] = await Promise.all([
                    api.get(`/listings/${id}`),
                    api.get(`/reviews/${id}`),
                ]);
                if (!alive) return;
                setItem(listing);
                setReviews(Array.isArray(rev?.items) ? rev.items : []);
                setRevMeta({ avg: Number(rev?.average || 0), count: Number(rev?.count || 0) });
            } catch {
                setItem(null);
            } finally {
                alive && setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [id]);

    useEffect(() => {
        if (!SOCKET_URL || !myId || !sellerId || isOwner) return;

        setConnecting(true);
        const s = io(SOCKET_URL, {
            path: "/socket.io",
            transports: ["websocket", "polling"],
            withCredentials: true,
            auth: { userId: myId },
        });
        socketRef.current = s;

        s.on("connect", () => setConnecting(false));
        s.on("connect_error", (err) => { console.error("[socket] connect_error:", err?.message || err); setConnecting(false); });
        s.on("error", (err) => console.error("[socket] error:", err));

        s.on("message:new", (msg) => {
            if (String(msg.from) === myId) return;
            const key = msg._id ? `id:${msg._id}` : `sig:${msg.from}|${msg.to}|${msg.text}|${msg.createdAt}`;
            if (seenRef.current.has(key)) return;
            seenRef.current.add(key);
            setMessages((m) => [...m, msg]);
            if (!chatOpen) setUnread((u) => u + 1);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
        });

        s.on("message:updated", (msg) => {
            setMessages((m) => m.map((x) => (String(x._id) === String(msg._id) ? { ...x, text: msg.text } : x)));
        });

        s.on("message:deleted", ({ _id }) => {
            setMessages((m) => m.filter((x) => String(x._id) !== String(_id)));
        });

        return () => {
            s.removeAllListeners();
            s.disconnect();
            socketRef.current = null;
        };
    }, [SOCKET_URL, myId, sellerId, isOwner, chatOpen]);

    useEffect(() => {
        if (!myId || !sellerId || isOwner) return;
        (async () => {
            try {
                const { data } = await api.post(
                    "/chat/start",
                    { listingId: id, sellerId },
                    { withCredentials: true }
                );
                const cid = data?.conversation?._id || null;
                setConvId(cid);
                const initial = Array.isArray(data?.messages) ? data.messages : [];
                setMessages(initial);
                initial.forEach((m) => {
                    const k = m._id ? `id:${m._id}` : `sig:${m.from}|${m.to}|${m.text}|${m.createdAt}`;
                    seenRef.current.add(k);
                });
                socketRef.current?.emit("join", { listingId: id });
            } catch (e) {
                setConvId("adhoc");
            }
        })();
    }, [myId, sellerId, isOwner, id]);

    useEffect(() => {
        if (!chatOpen || !convId || convId === "adhoc") return;
        setUnread(0);
        (async () => {
            try {
                setLoadingMsgs(true);
                const { data } = await api.get(`/chat/${convId}/messages`, {
                    params: { limit: 100 },
                    withCredentials: true,
                });
                const arr = Array.isArray(data?.items) ? data.items : [];
                setMessages(arr);
                seenRef.current = new Set(arr.map((m) => (m._id ? `id:${m._id}` : `sig:${m.from}|${m.to}|${m.text}|${m.createdAt}`)));
                try { await api.post(`/chat/${convId}/read`, null, { withCredentials: true }); } catch { }
            } finally {
                setLoadingMsgs(false);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
            }
        })();
    }, [chatOpen, convId]);

    useEffect(() => {
        if (!chatOpen) return;
        if (convId === "adhoc" && sellerId) {
            (async () => {
                try {
                    setLoadingMsgs(true);
                    const { data } = await api.get(`/chat/thread`, {
                        params: { listingId: id, otherId: sellerId, limit: 200 },
                        withCredentials: true
                    });
                    const arr = Array.isArray(data?.items) ? data.items : [];
                    setMessages(arr);
                    seenRef.current = new Set(arr.map((m) => (m._id ? `id:${m._id}` : `sig:${m.from}|${m.to}|${m.text}|${m.createdAt}`)));
                } finally {
                    setLoadingMsgs(false);
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
                }
            })();
        }
    }, [chatOpen, convId, sellerId, id]);

    const sendMessage = () => {
        const text = draft.trim();
        if (!text || !socketRef.current || !sellerId) return;
        socketRef.current.emit(
            "message:send",
            { listingId: id, to: sellerId, text },
            (res) => {
                if (res?.ok && res.msg) {
                    const msg = res.msg;
                    const key = msg._id ? `id:${msg._id}` : `sig:${msg.from}|${msg.to}|${msg.text}|${msg.createdAt}`;
                    if (!seenRef.current.has(key)) {
                        seenRef.current.add(key);
                        setMessages((m) => [...m, msg]);
                    }
                    setDraft("");
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
                } else {
                    console.error("send failed", res?.error);
                }
            }
        );
    };

    const avgStar = useMemo(() => {
        if (revMeta.count > 0 && revMeta.avg) return revMeta.avg;
        if (reviews.length) {
            const s = reviews.reduce((a, r) => a + (r.rating || 0), 0);
            return s / reviews.length;
        }
        return 0;
    }, [reviews, revMeta]);

    const submitReview = async (e) => {
        e?.preventDefault?.();
        setReviewNotice("");
        if (!form.comment.trim()) return;
        if (form.rating < 1 || form.rating > 5) return;
        setSavingReview(true);
        try {
            const { data: created } = await api.post(
                "/reviews",
                {
                    listingId: id,
                    rating: Number(form.rating),
                    comment: form.comment?.trim(),
                    authorName: user?.name,
                    avatarUrl: user?.avatarUrl,
                },
                { withCredentials: true }
            );
            setReviews((prev) => [...prev, created]);
            setForm({ rating: 5, comment: "" });
            setReviewNotice("Thanks! Your review was submitted and is awaiting moderation.");
            setTimeout(() => revBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } finally {
            setSavingReview(false);
        }
    };

    const imagesAll = useMemo(() => {
        if (!item) return [];
        const arr = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
        if (item.coverUrl) arr.unshift(item.coverUrl);
        return Array.from(new Set(arr));
    }, [item]);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const openLightbox = useCallback((idx) => { setLightboxIndex(idx); setLightboxOpen(true); }, []);
    const nextImg = useCallback(() => setLightboxIndex((i) => (i + 1) % imagesAll.length), [imagesAll.length]);
    const prevImg = useCallback(() => setLightboxIndex((i) => (i - 1 + imagesAll.length) % imagesAll.length), [imagesAll.length]);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") setLightboxOpen(false);
            if (e.key === "ArrowRight") nextImg();
            if (e.key === "ArrowLeft") prevImg();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxOpen, nextImg, prevImg]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 w-2/3 rounded bg-slate-200 animate-pulse" />
                <div className="h-5 w-1/3 rounded bg-slate-200 animate-pulse" />
                <div className="h-64 w-full rounded-xl bg-slate-200 animate-pulse" />
            </div>
        );
    }

    if (!item) {
        return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Listing not found.</div>;
    }

    const [lng, lat] = Array.isArray(item?.location?.coordinates) ? item.location.coordinates : [];
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
    const mapEmbed = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}&z=15&hl=en&output=embed` : "";

    return (
        <div className="grid py-10 px-10 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
                        <p className="text-slate-600 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {item.address}
                        </p>
                    </div>
                    <WishlistButton listingId={item._id} />
                </div>

                <div className="text-slate-700">
                    <span className="text-xl font-semibold">৳ {formatNum(item.price)}</span> • {item.category} • {item.type}
                </div>

                <Gallery images={item.images} coverUrl={item.coverUrl} title={item.title} onOpen={openLightbox} />

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="font-semibold text-slate-900 mb-2">Description</h2>
                    <p className="text-slate-700 whitespace-pre-line">{item.description || "—"}</p>
                    <div className="mt-3 text-xs text-slate-500">Views: {formatNum(item.views || 0)}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">Reviews</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <StarRow value={avgStar} />
                            <span>{avgStar > 0 ? avgStar.toFixed(1) : "—"} ({revMeta.count} reviews)</span>
                        </div>
                    </div>

                    <form onSubmit={submitReview} className="mt-3 grid gap-2">
                        <label className="text-sm text-slate-700">Your rating</label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setForm((s) => ({ ...s, rating: n }))} className="p-1" title={`${n} star${n > 1 ? "s" : ""}`}>
                                    <Star className={`h-5 w-5 ${n <= form.rating ? "text-yellow-500 fill-yellow-400" : "text-slate-300"}`} />
                                </button>
                            ))}
                        </div>

                        <label className="text-sm text-slate-700 mt-2">Your review</label>
                        <textarea
                            rows={4}
                            value={form.comment}
                            onChange={(e) => setForm((s) => ({ ...s, comment: e.target.value }))}
                            placeholder="Share your experience with this listing…"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {reviewNotice ? <div className="text-xs text-slate-600">{reviewNotice}</div> : null}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={savingReview || !form.comment.trim()}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {savingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post Review
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reviews.length === 0 ? (
                            <div className="text-sm col-span-full text-slate-500">No reviews yet. Be the first!</div>
                        ) : (
                            reviews.map((r) => {
                                const name = r.user?.name || r.authorName || "Buyer";
                                const href = profileUrl(r.user);
                                return (
                                    <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={name} url={r?.avatarUrl} size={48} />
                                            <div className="min-w-0">
                                                {href ? (
                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:underline truncate" title={`Open ${name}'s profile`}>
                                                        {name}
                                                    </a>
                                                ) : (
                                                    <div className="font-semibold text-slate-900 truncate">{name}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-3">
                                            <StarRow value={Number(r.rating) || 0} />
                                            <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{r.comment || "—"}</p>
                                    </div>
                                );
                            })
                        )}
                        <div id="reviews-bottom" ref={revBottomRef} className="col-span-full" />
                    </div>
                </div>
            </div>

            <aside className="space-y-4">
                {/* 🆕 Seller Contact Card */}
                <ContactInfoCard
                    seller={item?.seller}
                    isOwner={isOwner}
                    onChat={() => setChatOpen(true)}
                />

                {/* Messages card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">Messages</h2>
                        {!isOwner && unread > 0 && (
                            <span title={`${unread} new`} className="inline-flex items-center gap-1 text-xs text-indigo-700">
                                <BellDot className="h-4 w-4" /> {unread}
                            </span>
                        )}
                    </div>

                    {isOwner ? (
                        <p className="mt-1 text-sm text-slate-600">This is your listing. Buyers can message you; reply from your inbox.</p>
                    ) : (
                        <>
                            <p className="mt-1 text-sm text-slate-600">Chat with the seller in real time.</p>
                            <button
                                onClick={() => setChatOpen(true)}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                            >
                                <MessageSquare className="h-4 w-4" /> Open Chat
                            </button>
                            {!SOCKET_URL && (
                                <p className="mt-2 text-xs text-amber-600">
                                    Set <code>NEXT_PUBLIC_SOCKET_URL</code> to enable chat.
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="font-semibold text-slate-900">Location</h2>
                    {hasCoords ? (
                        <div className="mt-2">
                            <div className="rounded-lg overflow-hidden border border-slate-200">
                                <iframe title="map" src={mapEmbed} className="w-full h-64" loading="lazy" />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">Lat: {lat}, Lng: {lng}</div>
                        </div>
                    ) : (
                        <div className="mt-2 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">Location unavailable</div>
                    )}
                </div>
            </aside>

            {chatOpen && !isOwner && (
                <div className="fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setChatOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl grid grid-rows-[auto,1fr,auto]">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Chat with {item?.seller?.name || "Seller"}
                            </div>
                            <button onClick={() => setChatOpen(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-4 py-3 space-y-2">
                            {connecting || loadingMsgs ? (
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> {connecting ? "Connecting…" : "Loading…"}
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-sm text-slate-500">Say hello 👋</div>
                            ) : (
                                messages.map((m, i) => (
                                    <ChatBubble
                                        key={m._id || `${m.createdAt}-${i}`}
                                        mine={String(m.from) === myId}
                                        text={m.text}
                                        at={m.createdAt}
                                    />
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="border-t p-3">
                            <div className="flex items-center gap-2">
                                <input
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                                    placeholder="Type a message…"
                                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isOwner || !draft.trim() || connecting}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" /> Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {lightboxOpen && imagesAll.length > 0 && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setLightboxOpen(false)} />
                    <div className="absolute inset-0 flex items-center justify-center px-4">
                        <button onClick={prevImg} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Previous">
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button onClick={nextImg} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Next">
                            <ChevronRight className="h-6 w-6" />
                        </button>
                        <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
                            <X className="h-5 w-5" />
                        </button>
                        <div className="relative w-full max-w-5xl aspect-[16/10]">
                            <Image src={imagesAll[lightboxIndex]} alt={`Image ${lightboxIndex + 1}`} fill className="object-contain" unoptimized />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------------- Contact card ---------------- */

function ContactInfoCard({ seller, isOwner, onChat }) {
    const name = seller?.name || "Seller";
    const email = seller?.email || "";
    const phone = seller?.phone || "";
    const pUrl = profileUrl(seller);


    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // fallback
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-3">Seller</h2>

            <div className="flex items-center gap-3">
                <Avatar name={name} url={seller?.avatarUrl} size={40} />
                <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                        {name}{isOwner ? " (you)" : ""}
                    </div>

                </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span>{email || "Not provided"}</span>
                    </div>
                    {email ? (
                        <div className="flex items-center gap-1">
                            <a href={`mailto:${email}`} className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">Email</a>
                            <button onClick={() => copy(email)} className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50" title="Copy email">
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span>{phone || "Not provided"}</span>
                    </div>
                    {phone ? (
                        <div className="flex items-center gap-1">
                            <a href={`tel:${phone}`} className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">Call</a>
                            <button onClick={() => copy(phone)} className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50" title="Copy phone">
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>


        </div>
    );
}

/* ---------------- Rest of your helpers/components ---------------- */

function Gallery({ images = [], coverUrl, title = "", onOpen }) {
    const all = useMemo(() => {
        const arr = Array.isArray(images) ? images.filter(Boolean) : [];
        if (coverUrl) arr.unshift(coverUrl);
        return Array.from(new Set(arr));
    }, [images, coverUrl]);

    if (!all.length) {
        return <div className="grid h-64 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">No images</div>;
    }

    const main = all[0];
    const thumbs = all.slice(1, 5);

    return (
        <div className="grid gap-3">
            <button type="button" onClick={() => onOpen?.(0)} className="relative h-72 w-full overflow-hidden rounded-2xl border border-slate-200 group" title="View image">
                <Image src={main} alt={title} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover group-hover:opacity-95" unoptimized />
            </button>
            {thumbs.length ? (
                <div className="grid grid-cols-5 gap-3">
                    {thumbs.map((src, i) => (
                        <button key={src + i} type="button" onClick={() => onOpen?.(i + 1)} className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-200" title="View image">
                            <Image src={src} alt={`${title} ${i + 2}`} fill sizes="20vw" className="object-cover" unoptimized />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function StarRow({ value = 0 }) {
    const v = Math.round(value);
    return (
        <div className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-4 w-4 ${n <= v ? "text-yellow-500 fill-yellow-400" : "text-slate-300"}`} />
            ))}
        </div>
    );
}

function ChatBubble({ mine, text, at }) {
    return (
        <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow ${mine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                <div className="whitespace-pre-wrap">{text}</div>
                <div className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-slate-500"}`}>{formatDateTime(at)}</div>
            </div>
        </div>
    );
}

function formatNum(n) { try { return new Intl.NumberFormat().format(n || 0); } catch { return String(n || 0); } }
function formatDate(d) { if (!d) return ""; const dt = new Date(d); if (isNaN(dt)) return ""; return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
function formatDateTime(d) { if (!d) return ""; const dt = new Date(d); if (isNaN(dt)) return ""; return dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";
function profileUrl(user) { if (!user?._id) return null; if (user.profileUrl) return user.profileUrl; if (!API_BASE) return null; const base = API_BASE.replace(/\/+$/, ""); return `${base}/users/${user._id}`; }
function Avatar({ name = "User", url, size = 40 }) {
    const s = Math.max(32, Number(size) || 40);
    const initials = (name || "U").split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
    if (!url) {
        return <div className="grid place-items-center rounded-full bg-slate-200 text-slate-700 font-medium border border-slate-300" style={{ width: s, height: s, fontSize: Math.round(s * 0.42) }} title={name}>{initials}</div>;
    }
    return <img src={url} alt={name} width={s} height={s} className="rounded-full object-cover border border-slate-200" onError={(e) => { e.currentTarget.style.display = "none"; }} />;
}
