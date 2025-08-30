// pages/profile.jsx  (or app/profile/page.jsx)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    User as UserIcon,
    Mail,
    Phone,
    MapPin,
    CloudUpload,
    Loader2,
    Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

export default function ProfilePage() {
    const { user: authUser, ready, updateUser } = useAuth(); // ✅ get updateUser
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadPct, setUploadPct] = useState(0);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        about: "",
        city: "",
        country: "",
        avatarUrl: "",
    });

    const [error, setError] = useState("");

    // --------- Load current profile ----------
    useEffect(() => {
        if (!ready) return;
        if (!authUser) {
            router.replace("/login");
            return;
        }
        (async () => {
            try {
                const { data } = await api.get("/auth/me");
                const u = data?.user || {};
                setForm((f) => ({
                    ...f,
                    name: u.name || "",
                    email: u.email || "",
                    phone: u.phone || "",
                    about: u.about || "",
                    city: u.city || "",
                    country: u.country || "",
                    avatarUrl: u.avatarUrl || "",
                }));
            } catch {
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        })();
    }, [authUser, ready, router]);

    // Avatar initials
    const initials = useMemo(
        () => (form.name?.trim()?.slice(0, 1) || "?").toUpperCase(),
        [form.name]
    );

    // Inputs
    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    // --------- Cloudinary Upload ----------
    async function uploadToCloudinary(file) {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            toast.error("Cloudinary config missing");
            return null;
        }

        const okType = /image\/(jpeg|png|webp|gif)/i.test(file.type);
        const okSize = file.size <= 3 * 1024 * 1024; // 3MB
        if (!okType) {
            toast.error("Only JPG/PNG/WebP/GIF allowed");
            return null;
        }
        if (!okSize) {
            toast.error("Max 3MB allowed");
            return null;
        }

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);

        setUploading(true);
        setUploadPct(0);

        const uploadPromise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const p = Math.round((e.loaded / e.total) * 100);
                    setUploadPct(p);
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const res = JSON.parse(xhr.responseText);
                        resolve(res.secure_url);
                    } catch {
                        reject(new Error("Upload response parse failed"));
                    }
                } else {
                    reject(new Error("Upload failed"));
                }
            };
            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send(fd);
        });

        try {
            const secureUrl = await uploadPromise;
            toast.success("Image uploaded");
            return secureUrl;
        } catch (e) {
            toast.error(e?.message || "Upload failed");
            return null;
        } finally {
            setUploading(false);
            setUploadPct(0);
        }
    }

    // When user picks an image: upload first, then set URL (preview updates immediately)
    const onAvatarFilePick = async (file) => {
        if (!file) return;
        const url = await uploadToCloudinary(file);
        if (url) {
            setForm((f) => ({ ...f, avatarUrl: url }));
            // Note: we update AuthContext only after backend save, to keep source of truth in sync.
        }
    };

    // --------- Save profile (JSON only) ----------
    const onSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = {
                name: form.name,
                phone: form.phone,
                about: form.about,
                city: form.city,
                country: form.country,
                avatarUrl: form.avatarUrl,
            };
            const { data } = await api.patch("/auth/me", payload);
            const u = data?.user || {};

            // local form sync
            setForm((f) => ({
                ...f,
                name: u.name ?? f.name,
                phone: u.phone ?? f.phone,
                about: u.about ?? f.about,
                city: u.city ?? f.city,
                country: u.country ?? f.country,
                avatarUrl: u.avatarUrl ?? f.avatarUrl,
            }));

            // ✅ immediately update global auth user, so Navbar avatar/name changes without refresh
            if (u) updateUser(u);

            toast.success("Profile updated");
        } catch (e) {
            setError(e?.response?.data?.message || "Update failed");
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (!ready || loading) {
        return (
            <div className="min-h-[60vh] grid place-items-center text-slate-600">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-brand-light shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
                </span>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 page-surface">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
                {/* LEFT: Overview Card */}
                <section className="lg:col-span-4">
                    <div className="rounded-2xl border border-brand-light bg-white shadow-sm p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-[rgba(59,56,160,0.2)] grid place-items-center bg-[rgba(59,56,160,0.06)] text-xl font-semibold text-brand">
                                        {form.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={form.avatarUrl}
                                                alt="avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span>{initials}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-semibold text-brand">
                                        {form.name || "Your name"}
                                    </div>
                                    <div className="text-sm text-brand-accent">Member</div>
                                </div>
                            </div>
                        </div>

                        <div className="my-6 brand-divider" />

                        <div className="space-y-3 text-sm">
                            <Field icon={<Mail className="w-4 h-4" />} label="Email">
                                {form.email || "Not set"}
                            </Field>
                            <Field icon={<Phone className="w-4 h-4" />} label="Phone">
                                {form.phone || "Not set"}
                            </Field>
                            <Field icon={<MapPin className="w-4 h-4" />} label="Location">
                                {[form.city, form.country].filter(Boolean).join(", ") ||
                                    "Not set"}
                            </Field>
                            <Field icon={<UserIcon className="w-4 h-4" />} label="About">
                                {form.about || "Not set"}
                            </Field>
                        </div>
                    </div>
                </section>

                {/* RIGHT: Edit Form */}
                <section className="lg:col-span-8">
                    <form
                        onSubmit={onSave}
                        className="rounded-2xl border border-brand-light bg-white shadow-sm p-6"
                    >
                        <h2 className="text-lg font-semibold text-brand mb-4">
                            Edit Profile
                        </h2>

                        {/* Avatar uploader row */}
                        <div className="mb-6">
                            <label className="text-sm font-medium text-slate-700">
                                Profile photo
                            </label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-[rgba(59,56,160,0.18)] grid place-items-center bg-[rgba(59,56,160,0.06)] text-brand">
                                    {form.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={form.avatarUrl}
                                            alt="avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="w-7 h-7" />
                                    )}
                                </div>

                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-light px-3 py-2 text-sm hover:bg-slate-50">
                                    <CloudUpload className="w-4 h-4" />
                                    <span>{uploading ? "Uploading…" : "Upload"}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => onAvatarFilePick(e.target.files?.[0])}
                                    />
                                </label>

                                {uploading && (
                                    <div className="text-xs text-slate-600">{uploadPct}% uploaded</div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Full name"
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                placeholder="Enter your full name"
                                required
                            />
                            <Input
                                label="Email (read-only)"
                                name="email"
                                value={form.email}
                                disabled
                                placeholder="you@example.com"
                            />
                            <Input
                                label="Phone"
                                name="phone"
                                value={form.phone}
                                onChange={onChange}
                                placeholder="e.g. +8801…"
                            />
                            <Input
                                label="City"
                                name="city"
                                value={form.city}
                                onChange={onChange}
                                placeholder="Dhaka"
                            />
                            <Input
                                label="Country"
                                name="country"
                                value={form.country}
                                onChange={onChange}
                                placeholder="Bangladesh"
                                className="md:col-span-2"
                            />
                            <TextArea
                                label="About"
                                name="about"
                                value={form.about}
                                onChange={onChange}
                                rows={4}
                                placeholder="Short bio (max ~280 chars)"
                                className="md:col-span-2"
                            />
                        </div>

                        {error && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="inline-flex items-center gap-2 rounded-xl btn-brand px-4 py-2 text-white disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Save changes
                            </button>
                        </div>
                    </form>
                </section>
            </motion.div>
        </div>
    );
}

/* ------------------------
   Tiny UI helpers
------------------------ */
function Field({ icon, label, children }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-brand">{icon}</div>
            <div>
                <div className="text-slate-500">{label}</div>
                <div className="font-medium break-words">{children}</div>
            </div>
        </div>
    );
}

function Input({
    label,
    name,
    value,
    onChange,
    placeholder,
    disabled,
    required,
    className = "",
}) {
    return (
        <div className={className}>
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-brand-light px-3 py-2 outline-none focus:ring-2 focus:ring-[rgba(59,56,160,0.25)]"
            />
        </div>
    );
}

function TextArea({
    label,
    name,
    value,
    onChange,
    rows = 4,
    placeholder,
    className = "",
}) {
    return (
        <div className={className}>
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={rows}
                placeholder={placeholder}
                className="mt-1 w-full rounded-xl border border-brand-light px-3 py-2 outline-none focus:ring-2 focus:ring-[rgba(59,56,160,0.25)]"
            />
        </div>
    );
}
