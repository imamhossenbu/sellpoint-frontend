"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Send, Trash2, Pencil } from "lucide-react";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export default function ChatThreadPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const myId = useMemo(() => String(user?._id || user?.id || ""), [user]);

    const [conv, setConv] = useState(null);
    const [loadingConv, setLoadingConv] = useState(true);
    const [messages, setMessages] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(true);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState("");

    const socketRef = useRef(null);
    const seenRef = useRef(new Set());
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        let alive = true;
        (async () => {
            setLoadingConv(true);
            try {
                const { data } = await api.get("/chat/conversations", {
                    params: { type: "all" },
                    withCredentials: true,
                });
                const list = Array.isArray(data?.items) ? data.items : [];
                const found = list.find((c) => String(c._id) === String(id)) || null;
                if (!alive) return;
                setConv(found);
            } catch {
                setConv(null);
            } finally {
                alive && setLoadingConv(false);
            }
        })();
        return () => { alive = false; };
    }, [user, id]);

    useEffect(() => {
        if (!user || !id) return;
        let alive = true;
        (async () => {
            setLoadingMsgs(true);
            try {
                const { data } = await api.get(`/chat/${id}/messages`, {
                    params: { limit: 500 },
                    withCredentials: true,
                });
                if (!alive) return;
                const arr = Array.isArray(data?.items) ? data.items : [];
                setMessages(arr);
                arr.forEach((m) =>
                    seenRef.current.add(
                        m._id ? `id:${m._id}` : `sig:${m.from}|${m.to}|${m.text}|${m.createdAt}`
                    )
                );
                try { await api.post(`/chat/${id}/read`, null, { withCredentials: true }); } catch { }
            } finally {
                alive && setLoadingMsgs(false);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }
        })();
        return () => { alive = false; };
    }, [user, id]);

    useEffect(() => {
        if (!myId) return;
        const s = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            auth: { userId: myId },
            path: "/socket.io",
        });
        socketRef.current = s;

        s.on("message:new", (msg) => {
            if (String(msg.conversation || "") !== String(id)) return;
            if (String(msg.from) === myId) return; // my own message comes via ACK
            const key = msg._id ? `id:${msg._id}` : `sig:${msg.from}|${msg.to}|${msg.text}|${msg.createdAt}`;
            if (seenRef.current.has(key)) return;
            seenRef.current.add(key);
            setMessages((m) => [...m, msg]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
        });

        return () => {
            s.removeAllListeners();
            s.disconnect();
            socketRef.current = null;
        };
    }, [myId, id]);

    const other = useMemo(() => getOtherParticipant(conv, myId), [conv, myId]);

    const send = useCallback(() => {
        const text = draft.trim();
        if (!text || !socketRef.current || !conv) return;
        setSending(true);
        socketRef.current.emit(
            "message:send",
            { conversationId: conv._id, text },
            (res) => {
                setSending(false);
                if (res?.ok && res.msg) {
                    const msg = res.msg;
                    const key = msg._id ? `id:${msg._id}` : `sig:${msg.from}|${msg.to}|${msg.text}|${msg.createdAt}`;
                    if (!seenRef.current.has(key)) {
                        seenRef.current.add(key);
                        setMessages((m) => [...m, msg]);
                    }
                    setDraft("");
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
                }
            }
        );
    }, [draft, conv]);

    const beginEdit = (m) => {
        setEditingId(m._id);
        setEditDraft(m.text || "");
    };

    const saveEdit = async () => {
        const txt = editDraft.trim();
        if (!txt || !editingId) return;
        try {
            await api.patch(`/chat/message/${editingId}`, { text: txt }, { withCredentials: true });
            setMessages((arr) => arr.map((m) => (m._id === editingId ? { ...m, text: txt } : m)));
            setEditingId(null);
            setEditDraft("");
        } catch { }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditDraft("");
    };

    const removeMessage = async (mid) => {
        if (!mid) return;
        try {
            await api.delete(`/chat/message/${mid}`, { withCredentials: true });
            setMessages((arr) => arr.filter((m) => m._id !== mid));
        } catch { }
    };

    if (!user) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="rounded-xl border bg-white p-4 shadow-sm">Please sign in to view this chat.</div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl h-[calc(100vh-4rem)] px-4 py-6 grid grid-rows-[auto,1fr,auto]">
            <div className="h-14 border rounded-t-2xl bg-white px-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/chat")} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Back">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <HeaderListing listing={conv?.listing} />
                    <div className="ml-2">
                        <div className="text-sm font-medium text-slate-900">{conv?.listing?.title || "Listing"}</div>
                        <div className="text-xs text-slate-500">{other?.name || other?.email || "User"}</div>
                    </div>
                </div>
                <div className="text-xs text-slate-500 pr-1">{formatTime(conv?.lastMessageAt || conv?.updatedAt)}</div>
            </div>

            <div className="border-x bg-slate-50 overflow-y-auto px-4 py-3">
                {loadingConv || loadingMsgs ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-sm text-slate-500">Say hello 👋</div>
                ) : (
                    messages.map((m) => (
                        <Bubble
                            key={m._id}
                            mine={String(m.from) === myId}
                            text={m.text}
                            at={m.createdAt}
                            onEdit={() => beginEdit(m)}
                            onDelete={() => removeMessage(m._id)}
                            isEditing={editingId === m._id}
                            editDraft={editDraft}
                            setEditDraft={setEditDraft}
                            onSaveEdit={saveEdit}
                            onCancelEdit={cancelEdit}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <div className="h-16 border rounded-b-2xl bg-white p-3">
                <div className="flex items-center gap-2">
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                        placeholder="Type a message…"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                    />
                    <button
                        onClick={send}
                        disabled={!draft.trim() || sending}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

function HeaderListing({ listing }) {
    const src = listing?.coverUrl || listing?.images?.[0] || "";
    const s = 36;
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

function Bubble({ mine, text, at, onEdit, onDelete, isEditing, editDraft, setEditDraft, onSaveEdit, onCancelEdit }) {
    return (
        <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-1.5`}>
            <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow ${mine
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-900 rounded-bl-sm border border-slate-200"
                    }`}
            >
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <input
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            className="w-full rounded-lg px-2 py-1 text-sm text-slate-900"
                        />
                        <div className="flex items-center gap-2 text-xs">
                            <button onClick={onSaveEdit} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/20 hover:bg-white/30">
                                <Pencil className="w-3 h-3" /> Save
                            </button>
                            <button onClick={onCancelEdit} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="whitespace-pre-wrap break-words">{text}</div>
                        <div className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-slate-600"}`}>{formatTime(at)}</div>
                        {mine && (
                            <div className="mt-1 flex gap-2 text-[11px] opacity-90">
                                <button onClick={onEdit} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20">
                                    <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={onDelete} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function getOtherParticipant(conv, myId) {
    const arr = Array.isArray(conv?.participants) ? conv.participants : [];
    return arr.find((u) => String(u._id) !== String(myId)) || arr[0] || null;
}
function formatTime(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
