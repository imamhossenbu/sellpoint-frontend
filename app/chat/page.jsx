"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Search, Loader2, Filter } from "lucide-react";

export default function ChatsPage() {
    const { user } = useAuth();
    const [filterType, setFilterType] = useState("all");
    const [loading, setLoading] = useState(true);
    const [convs, setConvs] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user) return;
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const { data } = await api.get("/chat/conversations", {
                    params: { type: filterType },
                    withCredentials: true,
                });
                if (!alive) return;
                setConvs(Array.isArray(data?.items) ? data.items : []);
            } catch {
                setConvs([]);
            } finally {
                alive && setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [user, filterType]);

    const list = useMemo(() => {
        const q = search.trim().toLowerCase();
        let arr = convs;
        if (q) {
            arr = convs.filter((c) => {
                const title = c?.listing?.title?.toLowerCase() || "";
                const other = otherUserName(c, user)?.toLowerCase() || "";
                return (
                    title.includes(q) ||
                    other.includes(q) ||
                    (c.lastMessage || "").toLowerCase().includes(q)
                );
            });
        }
        return arr.sort((a, b) => {
            const ta = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
            const tb = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
            return tb - ta;
        });
    }, [convs, search, user?._id]);

    if (!user) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="rounded-xl border bg-white p-4 shadow-sm">Please sign in to view your chats.</div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl h-[calc(100vh-4rem)] px-4 py-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 text-slate-700">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">Filter</span>
                </div>
                <FilterChip active={filterType === "all"} onClick={() => setFilterType("all")}>All</FilterChip>
                <FilterChip active={filterType === "sale"} onClick={() => setFilterType("sale")}>For sale</FilterChip>
                <FilterChip active={filterType === "rent"} onClick={() => setFilterType("rent")}>For rent</FilterChip>

                <div className="ml-auto w-full sm:w-72">
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-white">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search chats…"
                            className="w-full outline-none text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden">
                {loading ? (
                    <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading conversations…
                    </div>
                ) : list.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">No chats.</div>
                ) : (
                    <ul className="divide-y">
                        {list.map((c) => {
                            const other = getOtherParticipant(c, user);
                            const unreadCount = (c.unread && c.unread[String(user._id)]) || 0;
                            return (
                                <li key={c._id}>
                                    <Link href={`/chat/${c._id}`} className="block px-4 py-3 hover:bg-slate-50">
                                        <div className="flex gap-3">
                                            <ListingThumb listing={c.listing} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="font-medium text-slate-900 truncate">{c.listing?.title || "Listing"}</div>
                                                    <div className="text-xs text-slate-500">{formatTime(c.lastMessageAt || c.updatedAt)}</div>
                                                </div>
                                                <div className="text-xs text-slate-600 truncate">
                                                    with {other?.name || "User"} · {badgeText(c.listing?.type)}
                                                </div>
                                                <div className="mt-0.5 text-sm text-slate-700 truncate">{c.lastMessage || "…"}</div>
                                            </div>
                                            {unreadCount > 0 && (
                                                <span className="self-start inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] rounded-full bg-indigo-600 text-white">
                                                    {unreadCount > 99 ? "99+" : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ListingThumb({ listing, size = 48 }) {
    const src = listing?.coverUrl || listing?.images?.[0] || "";
    const s = size;
    if (!src) {
        return (
            <div className="grid place-items-center rounded-lg bg-slate-200 text-slate-600" style={{ width: s, height: s }}>
                {listing?.type === "rent" ? "R" : "S"}
            </div>
        );
    }
    return (
        <div className="relative rounded-lg overflow-hidden border border-slate-200" style={{ width: s, height: s }}>
            <Image src={src} alt={listing?.title || "Listing"} fill className="object-cover" unoptimized />
        </div>
    );
}

function FilterChip({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm border ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
        >
            {children}
        </button>
    );
}

function otherUserName(conv, me) {
    const p = getOtherParticipant(conv, me);
    return p?.name || p?.email || "User";
}
function getOtherParticipant(conv, me) {
    const myId = String(me?._id);
    const arr = Array.isArray(conv?.participants) ? conv.participants : [];
    return arr.find((u) => String(u._id) !== myId) || arr[0] || null;
}
function formatTime(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function badgeText(t) {
    if (t === "rent") return "Rent";
    if (t === "sale") return "Sale";
    return "—";
}
