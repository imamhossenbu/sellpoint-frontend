// app/seller/dashboard/listings/create/page.jsx
"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CloudUpload, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

export default function CreateListingPage() {
    const router = useRouter();
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        title: "",
        price: "",
        type: "sale",
        category: "house",
        area: "",
        address: "",
        description: "",
        images: [],
        lat: "",
        lng: "",
    });

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    // --- Upload images to Cloudinary ---
    const uploadToCloudinary = async (file) => {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            toast.error("Cloudinary config missing");
            return null;
        }
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);

        setUploading(true);
        try {
            const res = await fetch(url, { method: "POST", body: fd });
            const data = await res.json();
            if (data.secure_url) {
                toast.success("Image uploaded");
                return data.secure_url;
            }
            throw new Error(data?.error?.message || "Upload failed");
        } catch (err) {
            toast.error(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
        return null;
    };

    const onImagePick = async (files) => {
        const arr = Array.from(files || []);
        for (const file of arr) {
            const url = await uploadToCloudinary(file);
            if (url) {
                setForm((f) => ({ ...f, images: [...f.images, url] }));
            }
        }
    };

    const onDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer?.files?.length) {
            await onImagePick(e.dataTransfer.files);
        }
    };

    const removeImage = (idx) =>
        setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

    const makeCover = (idx) =>
        setForm((f) => {
            if (idx === 0) return f;
            const next = [...f.images];
            const [picked] = next.splice(idx, 1);
            next.unshift(picked);
            return { ...f, images: next };
        });

    // --- Submit listing to API ---
    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const latNum =
                form.lat !== "" && !Number.isNaN(Number(form.lat))
                    ? Number(form.lat)
                    : undefined;
            const lngNum =
                form.lng !== "" && !Number.isNaN(Number(form.lng))
                    ? Number(form.lng)
                    : undefined;

            const payload = {
                title: form.title,
                price: Number(form.price),
                type: form.type,
                category: form.category,
                area: form.area,
                address: form.address,
                description: form.description,
                images: form.images,
                // ✅ Send lat/lng because backend builds `location` from these
                ...(latNum !== undefined ? { lat: latNum } : {}),
                ...(lngNum !== undefined ? { lng: lngNum } : {}),
            };

            await api.post("/listings", payload);
            toast.success("Listing created (pending approval)");
            router.push("/seller/dashboard/listings");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to create");
        } finally {
            setSaving(false);
        }
    };

    const pricePreview = useMemo(() => {
        if (!form.price) return "—";
        try {
            return new Intl.NumberFormat("en-BD", {
                style: "currency",
                currency: "BDT",
                maximumFractionDigits: 0,
            }).format(Number(form.price));
        } catch {
            return form.price;
        }
    }, [form.price]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-brand">Create Listing</h1>
                    <p className="text-sm text-gray-500">
                        Add property details and images. The first image is used as the
                        cover.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="hidden md:inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50 transition"
                >
                    <CloudUpload className="w-4 h-4" />
                    Upload images
                </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* LEFT: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Card: Basic information */}
                    <section className="rounded-2xl border border-[var(--sp-light)] bg-white shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[var(--sp-light)] bg-gray-50/60">
                            <h2 className="font-medium">Basic information</h2>
                            <p className="text-sm text-gray-500">
                                Title, price and listing type.
                            </p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={onChange}
                                    required
                                    placeholder="e.g., Sunny 3-bed house in Dhanmondi"
                                    className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Price (BDT)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={onChange}
                                        required
                                        placeholder="e.g., 12500000"
                                        className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                    />
                                    <p className="text-[12px] text-gray-500 mt-1">
                                        Preview: <span className="font-medium">{pricePreview}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Type</label>
                                    <select
                                        name="type"
                                        value={form.type}
                                        onChange={onChange}
                                        className="mt-1 w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                    >
                                        <option value="sale">Sale</option>
                                        <option value="rent">Rent</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Card: Property details */}
                    <section className="rounded-2xl border border-[var(--sp-light)] bg-white shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[var(--sp-light)] bg-gray-50/60">
                            <h2 className="font-medium">Property details</h2>
                            <p className="text-sm text-gray-500">Category, size & location.</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={onChange}
                                        className="mt-1 w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                    >
                                        <option value="house">House</option>
                                        <option value="flat">Flat</option>
                                        <option value="land">Land</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Area (sqft)</label>
                                    <input
                                        name="area"
                                        value={form.area}
                                        onChange={onChange}
                                        placeholder="e.g., 1450"
                                        className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Address</label>
                                <input
                                    name="address"
                                    value={form.address}
                                    onChange={onChange}
                                    placeholder="Street, area, city"
                                    className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                />
                            </div>

                            {/* Lat/Lng */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="lat"
                                        value={form.lat}
                                        onChange={onChange}
                                        placeholder="e.g., 23.8103"
                                        className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                    />
                                    <p className="text-[12px] text-gray-500 mt-1">Dhaka ≈ 23.8103</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="lng"
                                        value={form.lng}
                                        onChange={onChange}
                                        placeholder="e.g., 90.4125"
                                        className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                                    />
                                    <p className="text-[12px] text-gray-500 mt-1">Dhaka ≈ 90.4125</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Card: Description */}
                    <section className="rounded-2xl border border-[var(--sp-light)] bg-white shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[var(--sp-light)] bg-gray-50/60">
                            <h2 className="font-medium">Description</h2>
                            <p className="text-sm text-gray-500">
                                Highlight unique features, nearby amenities, etc.
                            </p>
                        </div>
                        <div className="p-5">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={onChange}
                                rows={5}
                                placeholder="Write a short, compelling description..."
                                className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 transition"
                            />
                            <div className="mt-1 text-[12px] text-gray-500 flex justify-between">
                                <span>Tip: keep it concise and scannable.</span>
                                <span>{form.description.length}/2000</span>
                            </div>
                        </div>
                    </section>

                    {/* Card: Images */}
                    <section className="rounded-2xl border border-[var(--sp-light)] bg-white shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[var(--sp-light)] bg-gray-50/60 flex items-center justify-between">
                            <div>
                                <h2 className="font-medium">Images</h2>
                                <p className="text-sm text-gray-500">
                                    Drag & drop or click to upload. First image is the cover.
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">
                                {uploading ? "Uploading..." : `${form.images.length} selected`}
                            </div>
                        </div>

                        <div className="p-5">
                            {/* Drop area */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                className={
                                    "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition cursor-pointer " +
                                    (dragOver
                                        ? "border-brand/60 bg-brand/5"
                                        : "border-gray-200 hover:bg-gray-50")
                                }
                                onClick={() => fileRef.current?.click()}
                            >
                                <CloudUpload className="w-8 h-8 opacity-70" />
                                <p className="mt-2 text-sm">
                                    <span className="font-medium">Click to upload</span> or drag & drop
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG up to ~10MB</p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => onImagePick(e.target.files)}
                                    className="hidden"
                                />
                            </div>

                            {/* Thumbnails */}
                            {form.images.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {form.images.map((url, idx) => (
                                        <div
                                            key={idx}
                                            className={
                                                "relative rounded-xl overflow-hidden border " +
                                                (idx === 0 ? "ring-2 ring-brand/60" : "")
                                            }
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt="listing" className="w-28 h-28 object-cover" />
                                            {/* Controls */}
                                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[11px] px-2 py-1 flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => makeCover(idx)}
                                                    className="underline underline-offset-2 disabled:opacity-60"
                                                    disabled={idx === 0}
                                                    title={idx === 0 ? "This is cover" : "Make cover"}
                                                >
                                                    {idx === 0 ? "Cover" : "Make cover"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="opacity-90 hover:opacity-100"
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT: Summary / Actions */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-4 space-y-4">
                        <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 shadow-sm">
                            <h3 className="font-medium">Listing summary</h3>
                            <div className="mt-3 space-y-2 text-sm">
                                <Row label="Title" value={form.title || "—"} />
                                <Row label="Type" value={form.type === "sale" ? "Sale" : "Rent"} />
                                <Row label="Category" value={cap(form.category)} />
                                <Row label="Area" value={form.area ? `${form.area} sqft` : "—"} />
                                <Row label="Price" value={pricePreview} />
                                <Row label="Address" value={form.address || "—"} />
                                <Row label="Images" value={form.images.length ? `${form.images.length} image${form.images.length > 1 ? "s" : ""}` : "—"} />
                                <Row label="Latitude" value={form.lat !== "" ? form.lat : "—"} />
                                <Row label="Longitude" value={form.lng !== "" ? form.lng : "—"} />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    {uploading ? "Uploading images..." : "Ready to submit?"}
                                </div>
                                <span className="text-xs rounded-full bg-gray-100 px-2 py-1">
                                    {form.type === "sale" ? "Sale" : "Rent"}
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl btn-brand px-5 py-2 text-white disabled:opacity-60"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Create listing
                                    </>
                                )}
                            </button>

                            <p className="text-[12px] text-gray-500 mt-2">
                                By creating, you agree the listing may be reviewed before it’s public.
                            </p>
                        </div>
                    </div>
                </aside>
            </form>
        </div>
    );
}

/** small helpers (no new deps) */
function Row({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    );
}
function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}
