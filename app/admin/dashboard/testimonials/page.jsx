"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    RefreshCw,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Image as ImageIcon,
} from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/lib/api";

const PAGE_SIZE = 12;

export default function AdminTestimonialsPage() {
    const search = useSearchParams();
    const router = useRouter();

    const q = search.get("q") || "";
    const status = search.get("status") || "all"; // all|published|unpublished
    const page = Number(search.get("page") || 1);

    const [loading, setLoading] = useState(true);
    const [allRows, setAllRows] = useState([]); // full result from server
    const [rows, setRows] = useState([]); // paginated slice
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState(null);

    // modal state
    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState(null); // row being edited or null
    const [form, setForm] = useState({
        name: "",
        role: "",
        avatarUrl: "",
        quote: "",
        isPublished: true,
    });

    // cloudinary state
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);

    const setParam = (key, value) => {
        const params = new URLSearchParams(search.toString());
        if (!value || value === "all" || value === "") params.delete(key);
        else params.set(key, value);
        if (key !== "page") params.delete("page"); // reset page on change
        router.push(`/admin/dashboard/testimonials?${params.toString()}`);
    };

    async function fetchData() {
        setLoading(true);
        try {
            // server supports only q; status filter is client-side
            const { data } = await api.get("/admin/testimonials", {
                params: { q: q || undefined },
            });
            const items = Array.isArray(data.items) ? data.items : [];

            // client status filter
            let filtered = items;
            if (status === "published") filtered = items.filter((i) => !!i.isPublished);
            else if (status === "unpublished") filtered = items.filter((i) => !i.isPublished);

            // sort newest first (server already does, but ensure)
            filtered.sort(
                (a, b) => new Date(b.createdAt || b._id?.toString().slice(-8)) - new Date(a.createdAt || a._id?.toString().slice(-8))
            );

            setAllRows(filtered);

            // client pagination
            const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            const safePage = Math.min(Math.max(1, page), pages);
            const start = (safePage - 1) * PAGE_SIZE;
            const slice = filtered.slice(start, start + PAGE_SIZE);

            setRows(slice);
            setMeta({ total: filtered.length, page: safePage, pages });
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
            name: "",
            role: "",
            avatarUrl: "",
            quote: "",
            isPublished: true,
        });
        setAvatarFile(null);
        setAvatarPreview("");
        setUploading(false);
        setUploadProgress(0);
    };

    const openCreate = () => {
        setEditing(null);
        resetForm();
        setOpenModal(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            name: row.name || "",
            role: row.role || "",
            avatarUrl: row.avatarUrl || "",
            quote: row.quote || "",
            isPublished: !!row.isPublished,
        });
        setAvatarFile(null);
        setAvatarPreview(row.avatarUrl || "");
        setOpenModal(true);
    };

    function handleFile(file) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            Swal.fire({ icon: "warning", title: "Invalid file", text: "Please select an image file." });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({ icon: "warning", title: "Too large", text: "Max 5MB allowed." });
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }

    // XHR with progress
    function uploadToCloudinaryXHR(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            if (!CLOUD_NAME || !UPLOAD_PRESET) {
                return reject(new Error("Cloudinary env vars missing."));
            }
            setUploading(true);
            setUploadProgress(0);

            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
            const fd = new FormData();
            fd.append("file", file);
            fd.append("upload_preset", UPLOAD_PRESET);
            fd.append("folder", "sellpoint/testimonials");

            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const p = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(p);
                }
            };
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    setUploading(false);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const json = JSON.parse(xhr.responseText);
                            if (json.secure_url) return resolve(json.secure_url);
                            return reject(new Error("Cloudinary upload missing secure_url"));
                        } catch (err) {
                            return reject(err);
                        }
                    } else {
                        try {
                            const json = JSON.parse(xhr.responseText);
                            return reject(new Error(json?.error?.message || "Cloudinary upload failed"));
                        } catch (err) {
                            return reject(new Error("Cloudinary upload failed"));
                        }
                    }
                }
            };
            xhr.onerror = () => {
                setUploading(false);
                reject(new Error("Network error during upload"));
            };
            xhr.send(fd);
        });
    }

    const save = async (e) => {
        e?.preventDefault();

        if (!form.name.trim() || !form.quote.trim()) {
            await Swal.fire({
                icon: "warning",
                title: "Missing fields",
                text: "Name and quote are required.",
            });
            return;
        }

        try {
            let avatarUrl = (form.avatarUrl || "").trim();
            if (avatarFile) {
                const url = await uploadToCloudinaryXHR(avatarFile);
                avatarUrl = url;
            }

            const payload = { ...form, avatarUrl };

            if (editing) {
                await api.patch(`/admin/testimonials/${editing._id}`, payload);
                await Swal.fire({ icon: "success", title: "Updated" });
            } else {
                await api.post(`/admin/testimonials`, payload);
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
        } finally {
            setUploading(false);
        }
    };

    const togglePublish = async (row) => {
        setBusyId(row._id);
        try {
            // If you mounted publish route at PATCH /admin/testimonials/:id/publish:
            await api.patch(`/admin/testimonials/${row._id}/publish`);
            // If not, fallback to generic PATCH flipping isPublished:
            // await api.patch(`/admin/testimonials/${row._id}`, { isPublished: !row.isPublished });
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
            title: "Delete testimonial?",
            text: `This will permanently delete the testimonial by "${row.name}".`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#dc2626",
        });
        if (!ok.isConfirmed) return;

        setBusyId(row._id);
        try {
            await api.delete(`/admin/testimonials/${row._id}`);
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
                <h1 className="text-2xl font-semibold text-brand">Testimonials</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        New
                    </button>
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                            placeholder="Search name or quote…"
                            defaultValue={q}
                            onKeyDown={(e) => e.key === "Enter" && setParam("q", e.currentTarget.value.trim())}
                            className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm w-72"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-500">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setParam("status", e.target.value)}
                            className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="published">Published</option>
                            <option value="unpublished">Unpublished</option>
                        </select>
                    </div>

                    <div className="ml-auto text-sm text-slate-500">
                        Total: <strong className="text-slate-800">{fmt.format(meta.total)}</strong>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <Th>Author</Th>
                                <Th>Role</Th>
                                <Th>Quote</Th>
                                <Th>Published</Th>
                                <Th>Created</Th>
                                <Th className="text-right pr-4">Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-slate-500">
                                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                                        Loading…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-slate-500">
                                        No testimonials found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((t) => (
                                    <tr key={t._id} className="border-t">
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 grid place-items-center">
                                                    {t.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={t.avatarUrl}
                                                            alt={t.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-5 w-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">{t.name || "—"}</div>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className="text-slate-700">{t.role || "—"}</Td>
                                        <Td className="max-w-[520px]">
                                            <div className="truncate text-slate-700">{t.quote}</div>
                                        </Td>
                                        <Td>
                                            {t.isPublished ? (
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-100">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border-amber-100">
                                                    Unpublished
                                                </span>
                                            )}
                                        </Td>
                                        <Td className="text-slate-500">
                                            {t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}
                                        </Td>
                                        <Td className="text-right pr-3">
                                            <div className="inline-flex items-center gap-2">
                                                <ActionBtn
                                                    title={t.isPublished ? "Unpublish" : "Publish"}
                                                    onClick={() => togglePublish(t)}
                                                    disabled={busyId === t._id}
                                                    icon={
                                                        t.isPublished ? (
                                                            <XCircle className="h-4 w-4" />
                                                        ) : (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        )
                                                    }
                                                    danger={t.isPublished}
                                                />
                                                <ActionBtn
                                                    title="Edit"
                                                    onClick={() => openEdit(t)}
                                                    icon={<Edit3 className="h-4 w-4" />}
                                                />
                                                <ActionBtn
                                                    title="Delete"
                                                    onClick={() => removeRow(t)}
                                                    icon={<Trash2 className="h-4 w-4" />}
                                                    danger
                                                />
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
                <Modal onClose={() => setOpenModal(false)} title={editing ? "Edit Testimonial" : "New Testimonial"}>
                    <form onSubmit={save} className="grid gap-3">
                        <Row>
                            <Field
                                label="Name *"
                                value={form.name}
                                onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                            />
                            <Field
                                label="Role"
                                value={form.role}
                                onChange={(v) => setForm((s) => ({ ...s, role: v }))}
                            />
                        </Row>

                        <Row>
                            {/* Avatar Picker */}
                            <label className="grid gap-1">
                                <span className="text-sm text-slate-600">Avatar (Upload or Drag & Drop)</span>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        handleFile(file);
                                    }}
                                    className="rounded-xl border border-dashed border-[var(--sp-light)] bg-white p-3 text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-100 grid place-items-center">
                                            {avatarPreview ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={avatarPreview} alt="preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="grid gap-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFile(e.target.files?.[0])}
                                                className="text-sm"
                                            />
                                            {uploading ? (
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Uploading… {uploadProgress}%
                                                </div>
                                            ) : avatarFile ? (
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    Selected: {avatarFile.name} ({Math.round(avatarFile.size / 1024)} KB)
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAvatarFile(null);
                                                            setAvatarPreview(form.avatarUrl || "");
                                                        }}
                                                        className="rounded border px-2 py-0.5"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500">PNG/JPG, up to 5MB. You can also paste a URL at right.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Manual URL */}
                            <Field
                                label="Avatar URL (optional)"
                                value={form.avatarUrl}
                                onChange={(v) => setForm((s) => ({ ...s, avatarUrl: v }))}
                                placeholder="https://res.cloudinary.com/.../image/upload/..."
                            />
                        </Row>

                        <TextArea
                            label="Quote *"
                            rows={5}
                            value={form.quote}
                            onChange={(v) => setForm((s) => ({ ...s, quote: v }))}
                        />

                        <Checkbox
                            label="Published"
                            checked={form.isPublished}
                            onChange={(v) => setForm((s) => ({ ...s, isPublished: v }))}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setOpenModal(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
                                disabled={uploading}
                            >
                                <SaveIcon />
                                {editing ? "Update" : "Create"}
                            </button>
                        </div>
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
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${danger ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                } disabled:opacity-50`}
        >
            {icon}
            {title}
        </button>
    );
}

/* ---------- Modal & Fields ---------- */

function Modal({ children, title, onClose }) {
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-x-0 top-14 mx-auto w-[95%] max-w-2xl rounded-2xl border border-[var(--sp-light)] bg-white p-5 shadow-xl">
                <div className="mb-3 text-lg font-semibold text-slate-800">{title}</div>
                {children}
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
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
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
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </label>
    );
}
function Checkbox({ label, checked, onChange }) {
    return (
        <label className="inline-flex items-center gap-2">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
            />
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
