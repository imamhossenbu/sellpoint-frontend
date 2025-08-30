// app/seller/dashboard/support/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import {
    LifeBuoy,
    Send,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    RefreshCw,
    X,
} from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

/**
 * Cloudinary unsigned upload helper (client-side)
 */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

// Limit & constraints
const MAX_FILES = 5;
const MAX_MB = 10; // 10MB per file
const ALLOWED_MIME = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
];

export default function SupportPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [toast, setToast] = useState(null);

    // Attachments we will send to backend after Cloudinary upload
    const [attachments, setAttachments] = useState([]); // [{url, publicId, format, bytes, width?, height?, originalFilename}]
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({
        subject: "",
        category: "general", // general | listing | payment | bug | account
        message: "",
    });

    const fireToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3200);
    };

    const loadTickets = async () => {
        setLoading(true);
        try {
            // Expected: { items:[{_id, subject, category, status, createdAt}], total }
            const { data } = await api.get("/seller/support/tickets", { params: { limit: 50 } });
            setTickets(data.items || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTickets(); }, []);

    const onPickFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Basic validations
        if (attachments.length + files.length > MAX_FILES) {
            fireToast("error", `You can attach up to ${MAX_FILES} files.`);
            return;
        }
        const invalid = files.find(
            (f) => f.size > MAX_MB * 1024 * 1024 || !ALLOWED_MIME.includes(f.type)
        );
        if (invalid) {
            fireToast(
                "error",
                `Invalid file(s). Allowed: images/PDF up to ${MAX_MB}MB each.`
            );
            return;
        }

        setUploading(true);
        try {
            const results = await Promise.all(files.map(uploadToCloudinary));
            // Filter any failed uploads (null)
            const ok = results.filter(Boolean);
            setAttachments((prev) => [...prev, ...ok].slice(0, MAX_FILES));
            if (ok.length !== files.length) {
                fireToast("error", "Some files failed to upload.");
            } else {
                fireToast("success", "File(s) uploaded.");
            }
        } catch {
            fireToast("error", "Failed to upload files.");
        } finally {
            setUploading(false);
            // reset input so same file can be re-selected if needed
            try { e.target.value = ""; } catch { }
        }
    };

    const removeAttachment = (publicId) => {
        setAttachments((prev) => prev.filter((a) => a.publicId !== publicId));
    };

    const submit = async (e) => {
        e?.preventDefault();
        if (!form.subject.trim() || !form.message.trim()) {
            return fireToast("error", "Please fill subject and message.");
        }
        setSubmitting(true);
        try {
            await api.post("/seller/support/tickets", {
                subject: form.subject.trim(),
                category: form.category,
                message: form.message.trim(),
                attachments, // send uploaded files metadata
            });
            fireToast("success", "Ticket submitted. Our team will get back to you.");
            setForm({ subject: "", category: "general", message: "" });
            setAttachments([]);
            loadTickets();
        } catch (e) {
            fireToast("error", e?.response?.data?.message || "Failed to submit ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-brand">Support</h1>
                <button
                    onClick={loadTickets}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Submit ticket */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-xl bg-slate-50 p-2 text-slate-700">
                        <LifeBuoy className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Create a Support Ticket</h2>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Subject"
                        value={form.subject}
                        onChange={(v) => setForm((s) => ({ ...s, subject: v }))}
                        placeholder="e.g., Unable to edit my listing"
                        className="md:col-span-2"
                    />

                    <Select
                        label="Category"
                        value={form.category}
                        onChange={(v) => setForm((s) => ({ ...s, category: v }))}
                        options={[
                            { value: "general", label: "General" },
                            { value: "listing", label: "Listing" },
                            { value: "payment", label: "Payment" },
                            { value: "bug", label: "Bug / Technical" },
                            { value: "account", label: "Account & Login" },
                        ]}
                    />

                    {/* File input + Cloudinary thumbnails */}
                    <FileInput
                        label={`Attachments (optional) — up to ${MAX_FILES} files`}
                        onChange={onPickFiles}
                        uploading={uploading}
                    />

                    {/* Previews */}
                    <AttachmentGrid items={attachments} onRemove={removeAttachment} className="md:col-span-2" />

                    <TextArea
                        label="Message"
                        value={form.message}
                        onChange={(v) => setForm((s) => ({ ...s, message: v }))}
                        placeholder="Describe your issue in detail…"
                        className="md:col-span-2"
                    />

                    <div className="md:col-span-2 flex justify-end">
                        <Button loading={submitting || uploading} type="submit">
                            <Send className="h-4 w-4" />
                            Submit Ticket
                        </Button>
                    </div>
                </form>

                <p className="mt-3 text-xs text-slate-500">
                    We typically respond within 24–48 hours. For urgent account issues, call your account manager.
                </p>
            </div>

            {/* Tickets list */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm">
                <div className="mb-3 font-semibold text-slate-800">Your Recent Tickets</div>
                {loading ? (
                    <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading tickets…
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-slate-500 text-sm">No tickets yet.</div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {tickets.map((t) => (
                            <li
                                key={t._id}
                                className="py-3 flex items-start justify-between gap-4"
                            >
                                <div>
                                    {/* Make subject clickable */}
                                    <Link
                                        href={`/seller/dashboard/support/${t._id}`}
                                        className="font-medium text-slate-800 hover:underline"
                                    >
                                        {t.subject}
                                    </Link>
                                    <div className="text-xs text-slate-500">
                                        {new Date(t.createdAt).toLocaleString()} • {labelForCategory(t.category)}
                                    </div>
                                </div>

                                <StatusPill status={t.status} />
                            </li>
                        ))}

                    </ul>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow ${toast.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}

/* ---------------- Cloudinary upload ---------------- */

async function uploadToCloudinary(file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(UPLOAD_URL, {
        method: "POST",
        body: fd,
    });

    if (!res.ok) return null;

    const json = await res.json();
    // Normalize payload you’ll store/send
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

/* ------------- little UI bits ------------- */

function Input({ label, value, onChange, placeholder = "", className = "" }) {
    return (
        <label className={`grid gap-1 ${className}`}>
            <span className="text-sm text-slate-600">{label}</span>
            <input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </label>
    );
}

function Select({ label, value, onChange, options = [] }) {
    return (
        <label className="grid gap-1">
            <span className="text-sm text-slate-600">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function TextArea({ label, value, onChange, placeholder = "", className = "" }) {
    return (
        <label className={`grid gap-1 ${className}`}>
            <span className="text-sm text-slate-600">{label}</span>
            <textarea
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                rows={5}
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </label>
    );
}

function StatusPill({ status = "open" }) {
    const map = {
        open: { cls: "bg-amber-50 text-amber-700 border-amber-100", text: "Open" },
        pending: { cls: "bg-indigo-50 text-indigo-700 border-indigo-100", text: "Pending" },
        resolved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "Resolved" },
        closed: { cls: "bg-slate-50 text-slate-600 border-slate-100", text: "Closed" },
    };
    const m = map[status] || map.open;
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${m.cls}`}>
            {m.text}
        </span>
    );
}

function FileInput({ label, onChange, uploading }) {
    return (
        <label className="grid gap-1">
            <span className="text-sm text-slate-600">{label}</span>
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    multiple
                    accept={ALLOWED_MIME.join(",")}
                    onChange={onChange}
                    className="text-sm"
                    disabled={uploading}
                />
                <Paperclip className="h-4 w-4 text-slate-500" />
                {uploading ? (
                    <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                    </span>
                ) : null}
            </div>
        </label>
    );
}

function AttachmentGrid({ items = [], onRemove, className = "" }) {
    if (!items.length) return null;
    return (
        <div className={`grid gap-3 ${className}`}>
            <div className="text-sm text-slate-600">Attachments</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((a) => (
                    <div
                        key={a.publicId}
                        className="flex items-center gap-3 rounded-xl border border-[var(--sp-light)] bg-white p-3 shadow-sm"
                    >
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 grid place-items-center">
                            {a.resourceType === "image" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={a.url}
                                    alt={a.originalFilename || "attachment"}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Paperclip className="h-5 w-5 text-slate-500" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-slate-800">{a.originalFilename || a.publicId}</div>
                            <div className="text-xs text-slate-500">
                                {(a.bytes ? (a.bytes / 1024 / 1024).toFixed(2) : "—")} MB
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove?.(a.publicId)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                            aria-label="Remove attachment"
                            title="Remove"
                        >
                            <X className="h-4 w-4 text-slate-600" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Button({ children, loading, type = "button" }) {
    return (
        <button
            type={type}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {children}
        </button>
    );
}

function labelForCategory(c) {
    return (
        { general: "General", listing: "Listing", payment: "Payment", bug: "Bug / Technical", account: "Account & Login" }[
        c
        ] || "General"
    );
}
