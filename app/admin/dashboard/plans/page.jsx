"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Check,
    Star,
    CircleSlash2,
} from "lucide-react";
import { api } from "@/lib/api";

/**
 * ---- Endpoints (adjust if your API differs) ----
 * GET    /plans                        -> { items: Plan[] }
 * POST   /plans                        -> { plan }
 * PATCH  /plans/:id                    -> { plan }
 * DELETE /plans/:id                    -> { ok: true }
 *
 * Plan shape (typical):
 * { _id, name, slug, price, currency, interval, features: string[], isPopular, isActive }
 */

export default function PlansPage() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // plan or null
    const [saving, setSaving] = useState(false);

    const fmt = useMemo(() => new Intl.NumberFormat("en-US"), []);

    const emptyForm = {
        name: "",
        slug: "",
        price: 0,
        currency: "BDT",
        interval: "month", // 'month' | 'year' | 'lifetime'
        featuresText: "", // textarea; we will split by newline
        isPopular: false,
        isActive: true,
    };
    const [form, setForm] = useState(emptyForm);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (p) => {
        setEditing(p);
        setForm({
            name: p.name || "",
            slug: p.slug || "",
            price: Number(p.price || 0),
            currency: p.currency || "BDT",
            interval: p.interval || "month",
            featuresText: Array.isArray(p.features) ? p.features.join("\n") : "",
            isPopular: !!p.isPopular,
            isActive: p.isActive !== false,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/plans");
            setPlans(Array.isArray(data?.items) ? data.items : data || []);
        } catch {
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const upsert = async (e) => {
        e?.preventDefault?.();
        if (saving) return;
        setSaving(true);
        const payload = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            price: Number(form.price || 0),
            currency: form.currency || "BDT",
            interval: form.interval || "month",
            features: (form.featuresText || "")
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            isPopular: !!form.isPopular,
            isActive: !!form.isActive,
        };
        try {
            if (editing?._id) {
                await api.patch(`/plans/${editing._id}`, payload);
            } else {
                await api.post("/plans", payload);
            }
            await load();
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Failed to save plan.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (p) => {
        if (!confirm(`Delete plan "${p.name}"?`)) return;
        try {
            await api.delete(`/plans/${p._id}`);
            await load();
        } catch {
            alert("Failed to delete plan.");
        }
    };

    const toggleActive = async (p) => {
        try {
            await api.patch(`/plans/${p._id}`, { isActive: !p.isActive });
            await load();
        } catch {
            alert("Failed to update status.");
        }
    };


    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-brand">Plans</h1>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--sp-primary)] text-white px-3 py-2 hover:opacity-90"
                >
                    <Plus className="w-4 h-4" />
                    New Plan
                </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(loading ? [...Array(3)] : plans).map((p, i) =>
                    loading ? (
                        <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
                    ) : (
                        <PlanCard
                            key={p._id}
                            plan={p}
                            onEdit={() => openEdit(p)}
                            onDelete={() => remove(p)}
                            onToggleActive={() => toggleActive(p)}
                            fmt={fmt}
                        />
                    )
                )}
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full">
                        <thead>
                            <tr className="text-left text-xs text-slate-500">
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Slug</th>
                                <th className="px-3 py-2">Price</th>
                                <th className="px-3 py-2">Interval</th>
                                <th className="px-3 py-2">Popular</th>
                                <th className="px-3 py-2">Active</th>
                                <th className="px-3 py-2 w-28"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-3" colSpan={7}>
                                            <div className="h-8 rounded bg-slate-100 animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : plans.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-6 text-sm text-slate-500" colSpan={7}>
                                        No plans yet. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((p) => (
                                    <tr key={p._id} className="border-t border-slate-100">
                                        <td className="px-3 py-3 font-medium">{p.name}</td>
                                        <td className="px-3 py-3 text-slate-600">{p.slug}</td>
                                        <td className="px-3 py-3 text-slate-700">
                                            {p?.priceBDT} {p?.currency || "BDT"}
                                        </td>
                                        <td className="px-3 py-3 capitalize text-slate-700">{p.interval}</td>
                                        <td className="px-3 py-3">
                                            {p.isPopular ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-xs">
                                                    <Star className="w-3.5 h-3.5" /> Popular
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            {p.isActive ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-xs">
                                                    <Check className="w-3.5 h-3.5" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-xs">
                                                    <CircleSlash2 className="w-3.5 h-3.5" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => remove(p)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
                    <div className="absolute inset-0 grid place-items-center p-4">
                        <form
                            onSubmit={upsert}
                            className="w-full max-w-2xl rounded-2xl border border-[var(--sp-light)] bg-white shadow-xl p-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-semibold text-slate-900">
                                    {editing ? "Edit Plan" : "New Plan"}
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="p-2 rounded-lg hover:bg-slate-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <LabeledInput
                                    label="Name"
                                    value={form.name}
                                    onChange={(v) => setForm((s) => ({ ...s, name: v }))}
                                    required
                                />
                                <LabeledInput
                                    label="Slug"
                                    value={form.slug}
                                    onChange={(v) => setForm((s) => ({ ...s, slug: v }))}
                                    required
                                />

                                <LabeledInput
                                    label="Price"
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={(v) => setForm((s) => ({ ...s, price: v }))}
                                    required
                                />
                                <LabeledSelect
                                    label="Currency"
                                    value={form.currency}
                                    onChange={(v) => setForm((s) => ({ ...s, currency: v }))}
                                    options={["BDT", "USD"]}
                                />

                                <LabeledSelect
                                    label="Billing Interval"
                                    value={form.interval}
                                    onChange={(v) => setForm((s) => ({ ...s, interval: v }))}
                                    options={["month", "year", "lifetime"]}
                                />
                                <div className="flex items-center gap-4">
                                    <Toggle
                                        label="Popular"
                                        checked={form.isPopular}
                                        onChange={(v) => setForm((s) => ({ ...s, isPopular: v }))}
                                    />
                                    <Toggle
                                        label="Active"
                                        checked={form.isActive}
                                        onChange={(v) => setForm((s) => ({ ...s, isActive: v }))}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <LabeledTextarea
                                        label="Features (one per line)"
                                        rows={6}
                                        value={form.featuresText}
                                        onChange={(v) => setForm((s) => ({ ...s, featuresText: v }))}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--sp-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

/* --------- Small bits --------- */

function PlanCard({ plan, onEdit, onDelete, onToggleActive, fmt }) {
    return (
        <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        {plan.name}
                        {plan.isPopular ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 text-[10px]">
                                <Star className="w-3 h-3" /> Popular
                            </span>
                        ) : null}
                    </div>
                    <div className="mt-1 text-slate-700">
                        {fmt.format(plan.priceBDT)} {plan.currency || "BDT"}
                        <span className="text-slate-500">
                            {plan.period === "lifetime" ? "" : " / " + plan?.period}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            </div>

            <ul className="mt-3 text-sm text-slate-700 space-y-1">
                {(plan.features || []).map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-4">
                <button
                    onClick={onToggleActive}
                    className={`rounded-xl px-3 py-1.5 text-sm border ${plan.isActive
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                        : "border-slate-200 text-slate-700 bg-slate-50"
                        }`}
                >
                    {plan.isActive ? "Active" : "Inactive"}
                </button>
            </div>
        </div>
    );
}

function LabeledInput({ label, value, onChange, ...rest }) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="text-slate-600">{label}</span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                {...rest}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </label>
    );
}

function LabeledSelect({ label, value, onChange, options = [] }) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="text-slate-600">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            >
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o.toString().charAt(0).toUpperCase() + o.toString().slice(1)}
                    </option>
                ))}
            </select>
        </label>
    );
}

function LabeledTextarea({ label, value, onChange, rows = 4 }) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="text-slate-600">{label}</span>
            <textarea
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 resize-y"
            />
        </label>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="inline-flex items-center gap-2">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">{label}</span>
        </label>
    );
}
