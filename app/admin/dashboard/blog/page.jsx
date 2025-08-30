// app/admin/dashboard/blog/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Image as ImageIcon,
    Search,
    RefreshCw,
    X,
} from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/lib/api";

const PAGE_SIZE = 10;

export default function AdminBlogPage() {
    const search = useSearchParams();
    const router = useRouter();

    const q = search.get("q") || "";
    const status = search.get("status") || "all"; // all|published|draft
    const page = Number(search.get("page") || 1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState(null);

    // modal state
    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverUrl: "",
        tags: "",
        readTime: "4 min read",
        isPublished: false,
    });

    // cloudinary
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [uploading, setUploading] = useState(false);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);

    const setParam = (key, value) => {
        const params = new URLSearchParams(search.toString());
        if (!value || value === "all" || value === "") params.delete(key);
        else params.set(key, value);
        if (key !== "page") params.delete("page");
        router.push(`/admin/dashboard/blog?${params.toString()}`);
    };

    async function fetchData() {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/blogs", {
                params: {
                    q: q || undefined,
                    status: status === "all" ? undefined : status,
                    page,
                    limit: PAGE_SIZE,
                    sort: "-createdAt",
                },
            });
            setRows(data.items || []);
            setMeta({
                total: data.total || 0,
                page: data.page || 1,
                pages: data.pages || 1,
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, status, page]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const resetForm = () => {
        setForm({
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            coverUrl: "",
            tags: "",
            readTime: "4 min read",
            isPublished: false,
        });
        setFile(null);
        setPreview("");
    };

    const openCreate = () => {
        setEditing(null);
        resetForm();
        setOpenModal(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            title: row.title || "",
            slug: row.slug || "",
            excerpt: row.excerpt || "",
            content: row.content || "",
            coverUrl: row.coverUrl || "",
            tags: (row.tags || []).join(", "),
            readTime: row.readTime || "4 min read",
            isPublished: !!row.isPublished,
        });
        setFile(null);
        setPreview(row.coverUrl || "");
        setOpenModal(true);
    };

    function handleFile(f) {
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            Swal.fire({ icon: "warning", title: "Invalid file", text: "Please select an image file." });
            return;
        }
        if (f.size > 8 * 1024 * 1024) {
            Swal.fire({ icon: "warning", title: "Too large", text: "Max 8MB allowed." });
            return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
    }

    function uploadToCloudinary(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            if (!CLOUD_NAME || !UPLOAD_PRESET) return reject(new Error("Cloudinary env vars missing."));

            setUploading(true);
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
            const fd = new FormData();
            fd.append("file", file);
            fd.append("upload_preset", UPLOAD_PRESET);
            fd.append("folder", "sellpoint/blog");

            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    setUploading(false);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const json = JSON.parse(xhr.responseText);
                        if (json.secure_url) return resolve(json.secure_url);
                        return reject(new Error("Upload missing secure_url"));
                    }
                    try {
                        const json = JSON.parse(xhr.responseText);
                        reject(new Error(json?.error?.message || "Upload failed"));
                    } catch {
                        reject(new Error("Upload failed"));
                    }
                }
            };
            xhr.onerror = () => {
                setUploading(false);
                reject(new Error("Network error"));
            };
            xhr.send(fd);
        });
    }

    const save = async (e) => {
        e?.preventDefault();

        if (!form.title.trim()) {
            await Swal.fire({ icon: "warning", title: "Missing fields", text: "Title is required." });
            return;
        }

        try {
            let coverUrl = (form.coverUrl || "").trim();
            if (file) coverUrl = await uploadToCloudinary(file);

            const payload = {
                ...form,
                coverUrl,
                tags: form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
            };

            if (editing) {
                await api.patch(`/admin/blogs/${editing._id}`, payload);
                await Swal.fire({ icon: "success", title: "Updated" });
            } else {
                await api.post(`/admin/blogs`, payload);
                await Swal.fire({ icon: "success", title: "Created" });
            }

            setOpenModal(false);
            setEditing(null);
            resetForm();
            await refresh();
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Save failed",
                text: e?.message || e?.response?.data?.message || "Please try again.",
            });
        }
    };

    const togglePublish = async (row) => {
        setBusyId(row._id);
        try {
            await api.patch(`/admin/blogs/${row._id}/publish`);
            await refresh();
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Failed",
                text: e?.response?.data?.message || "Could not change publish status.",
            });
        } finally {
            setBusyId(null);
        }
    };

    const removeRow = async (row) => {
        const ok = await Swal.fire({
            icon: "warning",
            title: "Delete post?",
            text: `This will permanently delete "${row.title}".`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#dc2626",
        });
        if (!ok.isConfirmed) return;

        setBusyId(row._id);
        try {
            await api.delete(`/admin/blogs/${row._id}`);
            await Swal.fire({ icon: "success", title: "Deleted" });
            await refresh();
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Failed",
                text: e?.response?.data?.message || "Could not delete.",
            });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="grid gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-slate-900">Blog</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        New Post
                    </button>
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                            placeholder="Search title or text…"
                            defaultValue={q}
                            onKeyDown={(e) => e.key === "Enter" && setParam("q", e.currentTarget.value.trim())}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm w-72"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-500">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setParam("status", e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>

                    <div className="ml-auto text-sm text-slate-500">
                        Total: <strong className="text-slate-800">{fmt.format(meta.total)}</strong>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <Th>Title</Th>
                                <Th>Slug</Th>
                                <Th>Published</Th>
                                <Th>Updated</Th>
                                <Th className="text-right pr-4">Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-500">
                                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                                        Loading…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-500">No posts found.</td>
                                </tr>
                            ) : (
                                rows.map((t) => (
                                    <tr key={t._id} className="border-t hover:bg-slate-50/50">
                                        <Td className="max-w-[420px]">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-20 rounded-lg overflow-hidden bg-slate-100 grid place-items-center ring-1 ring-slate-200">
                                                    {t.coverUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={t.coverUrl} alt={t.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="h-5 w-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="truncate">
                                                    <div className="font-medium text-slate-800 truncate">{t.title || "—"}</div>
                                                    {t.tags?.length ? (
                                                        <div className="mt-0.5 flex flex-wrap gap-1">
                                                            {t.tags.slice(0, 3).map((tg) => (
                                                                <span key={tg} className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px]">
                                                                    {tg}
                                                                </span>
                                                            ))}
                                                            {t.tags.length > 3 ? (
                                                                <span className="text-[11px] text-slate-500">+{t.tags.length - 3}</span>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400">No tags</div>
                                                    )}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className="text-slate-700">{t.slug}</Td>
                                        <Td>
                                            {t.isPublished ? (
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-100">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border-amber-100">
                                                    Draft
                                                </span>
                                            )}
                                        </Td>
                                        <Td className="text-slate-500">
                                            {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "—"}
                                        </Td>
                                        <Td className="text-right pr-3">
                                            <div className="inline-flex items-center gap-2">
                                                <ActionBtn
                                                    title={t.isPublished ? "Unpublish" : "Publish"}
                                                    onClick={() => togglePublish(t)}
                                                    disabled={busyId === t._id}
                                                    icon={t.isPublished ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                    danger={t.isPublished}
                                                />
                                                <ActionBtn title="Edit" onClick={() => openEdit(t)} icon={<Edit3 className="h-4 w-4" />} />
                                                <ActionBtn title="Delete" onClick={() => removeRow(t)} icon={<Trash2 className="h-4 w-4" />} danger />
                                            </div>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {meta.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-slate-600">
                            Page <strong>{meta.page}</strong> of <strong>{meta.pages}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={meta.page <= 1}
                                onClick={() => setParam("page", String(meta.page - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                disabled={meta.page >= meta.pages}
                                onClick={() => setParam("page", String(meta.page + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {openModal && (
                <Modal
                    onClose={() => setOpenModal(false)}
                    title={editing ? "Edit Post" : "New Post"}
                    footer={
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setOpenModal(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="blog-form"
                                disabled={uploading}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                            >
                                <SaveIcon />
                                {editing ? "Update" : "Create"}
                            </button>
                        </div>
                    }
                >
                    {/* Scrollable body */}
                    <form id="blog-form" onSubmit={save} className="grid gap-4">
                        <Row>
                            <Field label="Title *" value={form.title} onChange={(v) => setForm((s) => ({ ...s, title: v }))} />
                            <Field label="Slug (optional)" value={form.slug} onChange={(v) => setForm((s) => ({ ...s, slug: v }))} />
                        </Row>

                        <Row>
                            <Field label="Read time" value={form.readTime} onChange={(v) => setForm((s) => ({ ...s, readTime: v }))} />
                            <Field
                                label="Tags (comma separated)"
                                value={form.tags}
                                onChange={(v) => setForm((s) => ({ ...s, tags: v }))}
                            />
                        </Row>

                        <TextArea
                            label="Excerpt"
                            rows={3}
                            value={form.excerpt}
                            onChange={(v) => setForm((s) => ({ ...s, excerpt: v }))}
                        />

                        <TextArea
                            label="Content (Markdown/HTML)"
                            rows={10}
                            value={form.content}
                            onChange={(v) => setForm((s) => ({ ...s, content: v }))}
                        />

                        {/* Cover */}
                        <Row>
                            <label className="grid gap-1">
                                <span className="text-sm text-slate-600">Cover (Upload or Drag & Drop)</span>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const f = e.dataTransfer.files?.[0];
                                        handleFile(f);
                                    }}
                                    className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-16 w-28 rounded-lg overflow-hidden bg-slate-100 grid place-items-center ring-1 ring-slate-200">
                                            {preview ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={preview} alt="cover preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="grid gap-1">
                                            <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} className="text-sm" />
                                            {file ? (
                                                <div className="text-xs text-slate-500">Selected: {file.name}</div>
                                            ) : (
                                                <span className="text-xs text-slate-500">PNG/JPG up to 8MB. Or paste a URL at right.</span>
                                            )}
                                            {uploading ? (
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </label>

                            <Field
                                label="Cover URL"
                                value={form.coverUrl}
                                onChange={(v) => setForm((s) => ({ ...s, coverUrl: v }))}
                                placeholder="https://res.cloudinary.com/.../image/upload/..."
                            />
                        </Row>

                        <Checkbox
                            label="Published"
                            checked={form.isPublished}
                            onChange={(v) => setForm((s) => ({ ...s, isPublished: v }))}
                        />
                    </form>
                </Modal>
            )}
        </div>
    );
}

/* ---------- UI bits ---------- */
function Th({ children, className = "" }) {
    return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
    return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
function ActionBtn({ title, onClick, icon, danger = false, disabled = false }) {
    return (
        <button
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${danger
                ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                } disabled:opacity-50`}
        >
            {icon}
            {title}
        </button>
    );
}

/**
 * Modal with sticky header & footer, scrollable content.
 * Usage: <Modal title="" onClose={} footer={<Buttons/>}>{form}</Modal>
 */
function Modal({ children, title, onClose, footer }) {
    return (
        <div className="fixed inset-0 z-50">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            {/* dialog */}
            <div className="absolute inset-x-0 top-10 mx-auto w-[96%] max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* header (sticky) */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-white rounded-t-2xl">
                    <div className="text-lg font-semibold text-slate-900">{title}</div>
                    <button
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* body (scrollable) */}
                <div className="max-h-[75vh] overflow-y-auto px-5 py-6">{children}</div>

                {/* footer (sticky) */}
                <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-3 rounded-b-2xl">
                    {footer}
                </div>
            </div>
        </div>
    );
}

function Row({ children }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, value, onChange, placeholder = "" }) {
    return (
        <label className="grid gap-1">
            <span className="text-sm text-slate-600">{label}</span>
            <input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </label>
    );
}
function TextArea({ label, value, onChange, rows = 4, placeholder = "" }) {
    return (
        <label className="grid gap-1">
            <span className="text-sm text-slate-600">{label}</span>
            <textarea
                rows={rows}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </label>
    );
}
function Checkbox({ label, checked, onChange }) {
    return (
        <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            <span className="text-sm text-slate-700">{label}</span>
        </label>
    );
}
function SaveIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V7l4-4h9l5 5v11a2 2 0 0 1-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
        </svg>
    );
}
