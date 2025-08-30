"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Send, RefreshCw, Paperclip, X } from "lucide-react";
import { api } from "@/lib/api";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
const MAX_FILES = 5;
const MAX_MB = 10;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export default function AdminTicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [msg, setMsg] = useState("");
    const [toast, setToast] = useState(null);
    const [statusBusy, setStatusBusy] = useState(false);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);

    const fire = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/support/tickets/${id}`);
            setTicket(data);
        } catch (e) {
            fire("error", e?.response?.data?.message || "Failed to load ticket.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { if (id) load(); /* eslint-disable-next-line */ }, [id]);

    const setStatus = async (status) => {
        setStatusBusy(true);
        try {
            await api.patch(`/admin/support/tickets/${id}/status`, { status });
            await load();
            fire("success", `Status updated to "${status}".`);
        } catch (e) {
            fire("error", e?.response?.data?.message || "Failed to update status.");
        } finally {
            setStatusBusy(false);
        }
    };

    const onPick = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (attachments.length + files.length > MAX_FILES) {
            return fire("error", `Up to ${MAX_FILES} files.`);
        }
        if (files.find(f => f.size > MAX_MB * 1024 * 1024 || !ALLOWED_MIME.includes(f.type))) {
            return fire("error", `Only images/PDF up to ${MAX_MB}MB each.`);
        }
        setUploading(true);
        try {
            const results = await Promise.all(files.map(upload));
            const ok = results.filter(Boolean);
            setAttachments(prev => [...prev, ...ok].slice(0, MAX_FILES));
            if (ok.length !== files.length) fire("error", "Some files failed to upload.");
        } finally {
            setUploading(false);
            try { e.target.value = ""; } catch { }
        }
    };

    const removeAttachment = (publicId) => {
        setAttachments(prev => prev.filter(a => a.publicId !== publicId));
    };

    const send = async (e) => {
        e?.preventDefault();
        if (!msg.trim() && attachments.length === 0) return fire("error", "Write a message or attach files.");
        setSending(true);
        try {
            await api.post(`/admin/support/tickets/${id}/replies`, { message: msg.trim(), attachments });
            setMsg("");
            setAttachments([]);
            await load();
            fire("success", "Reply sent.");
        } catch (e) {
            fire("error", e?.response?.data?.message || "Failed to send.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard/support" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <h1 className="text-2xl font-semibold text-brand">Ticket</h1>
                </div>
                <button
                    onClick={load}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                {/* Thread */}
                <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                    {loading ? (
                        <div className="text-slate-500 text-sm"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>
                    ) : !ticket ? (
                        <div className="text-slate-500 text-sm">Not found.</div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <div className="text-lg font-semibold text-slate-800">{ticket.subject}</div>
                                <div className="text-xs text-slate-500">
                                    From: {ticket?.seller?.name || ticket?.seller?.email || "Seller"} • {new Date(ticket.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div className="mb-4">
                                <StatusPill status={ticket.status} />
                            </div>

                            <div className="space-y-4">
                                {ticket.messages?.map((m) => (
                                    <Message key={m._id} m={m} />
                                ))}
                            </div>

                            {/* Reply box */}
                            <form onSubmit={send} className="mt-6 grid gap-3">
                                <label className="grid gap-1">
                                    <span className="text-sm text-slate-600">Reply</span>
                                    <textarea
                                        value={msg}
                                        onChange={(e) => setMsg(e.target.value)}
                                        rows={4}
                                        className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Type your response…"
                                    />
                                </label>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <label className="inline-flex items-center gap-2 text-sm">
                                        <input
                                            type="file"
                                            multiple
                                            accept={ALLOWED_MIME.join(',')}
                                            onChange={onPick}
                                            className="hidden"
                                            id="filepick"
                                            disabled={uploading || sending}
                                        />
                                        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                                            <Paperclip className="h-4 w-4" />
                                            <span>Attach</span>
                                        </span>
                                    </label>
                                    {uploading ? <span className="text-xs text-slate-500 inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</span> : null}
                                    <div className="ml-auto flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={statusBusy}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                            onClick={() => setStatus('open')}
                                        >Mark Open</button>
                                        <button
                                            type="button"
                                            disabled={statusBusy}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                            onClick={() => setStatus('pending')}
                                        >Mark Pending</button>
                                        <button
                                            type="button"
                                            disabled={statusBusy}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                            onClick={() => setStatus('resolved')}
                                        >Resolve</button>
                                        <button
                                            type="button"
                                            disabled={statusBusy}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                            onClick={() => setStatus('closed')}
                                        >Close</button>
                                    </div>
                                </div>

                                {/* Attachment preview */}
                                <AttachmentRow items={attachments} onRemove={(pid) => removeAttachment(pid)} />

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={sending || uploading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                {ticket && (
                    <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                        <div className="font-semibold text-slate-800 mb-3">Meta</div>
                        <div className="grid gap-2 text-sm">
                            <MetaRow k="Category" v={labelForCategory(ticket.category)} />
                            <MetaRow k="Status" v={<StatusPill status={ticket.status} />} />
                            <MetaRow k="Created" v={new Date(ticket.createdAt).toLocaleString()} />
                            <MetaRow k="Updated" v={new Date(ticket.updatedAt).toLocaleString()} />
                            <MetaRow k="Seller" v={ticket?.seller?.email || ticket?.seller?.name || "—"} />
                        </div>
                    </div>
                )}
            </div>

            {toast && (
                <Toast type={toast.type} message={toast.message} />
            )}
        </div>
    );
}

/* ---- helpers / UI ---- */

async function upload(file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(UPLOAD_URL, { method: "POST", body: fd });
    if (!res.ok) return null;
    const json = await res.json();
    return {
        url: json.secure_url,
        publicId: json.public_id,
        format: json.format,
        bytes: json.bytes,
        width: json.width,
        height: json.height,
        originalFilename: json.original_filename,
        resourceType: json.resource_type,
    };
}

function Message({ m }) {
    const isAdmin = m.authorType === "admin";
    return (
        <div className={`rounded-xl border p-3 ${isAdmin ? "bg-indigo-50/40 border-indigo-100" : "bg-slate-50 border-slate-100"}`}>
            <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                    {isAdmin ? "Admin" : "Seller"} • {m?.author?.name || m?.author?.email || "User"}
                </div>
                <div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-sm whitespace-pre-line text-slate-800">{m.body || "—"}</div>
            {m.attachments?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                    {m.attachments.map((a, i) => (
                        <AttachmentCard key={a.publicId || i} a={a} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function AttachmentCard({ a }) {
    const isImg = a.resourceType === "image";
    return (
        <a href={a.url} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
            <div className="h-9 w-9 overflow-hidden rounded bg-slate-100 grid place-items-center">
                {isImg
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={a.url} alt={a.originalFilename || "attachment"} className="h-full w-full object-cover" />
                    : <Paperclip className="h-4 w-4 text-slate-600" />}
            </div>
            <div className="min-w-0">
                <div className="truncate text-xs text-slate-700">{a.originalFilename || a.publicId}</div>
                <div className="text-[11px] text-slate-500">{a.format?.toUpperCase?.() || a.resourceType}</div>
            </div>
        </a>
    );
}

function AttachmentRow({ items = [], onRemove }) {
    if (!items.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {items.map(a => (
                <div key={a.publicId} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                    <div className="h-8 w-8 overflow-hidden rounded bg-slate-100 grid place-items-center">
                        {a.resourceType === "image"
                            ? /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={a.url} alt={a.originalFilename || "attachment"} className="h-full w-full object-cover" />
                            : <Paperclip className="h-4 w-4 text-slate-600" />}
                    </div>
                    <span className="text-xs text-slate-700 max-w-[160px] truncate">{a.originalFilename || a.publicId}</span>
                    <button type="button" onClick={() => onRemove?.(a.publicId)} className="p-1 rounded hover:bg-slate-100" title="Remove">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}

function MetaRow({ k, v }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="text-slate-500">{k}</div>
            <div className="text-slate-800">{typeof v === 'string' ? v : v}</div>
        </div>
    );
}

function StatusPill({ status }) {
    const map = {
        open: "bg-amber-50 text-amber-700 border-amber-100",
        pending: "bg-indigo-50 text-indigo-700 border-indigo-100",
        resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
        closed: "bg-slate-50 text-slate-600 border-slate-100",
    };
    const cls = map[status] || "bg-slate-50 text-slate-700 border-slate-100";
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${cls}`}>{status}</span>;
}

function Toast({ type, message }) {
    return (
        <div
            className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
            role="status"
            aria-live="polite"
        >
            {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message}
        </div>
    );
}

function labelForCategory(c) {
    return (
        { general: "General", listing: "Listing", payment: "Payment", bug: "Bug / Technical", account: "Account & Login" }[c] || "General"
    );
}
