// app/admin/dashboard/security/page.jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth"; // optional; guarded below

export default function AdminSecurityPage() {
    const router = useRouter();
    const { logout } = useAuth?.() || {}; // safe-guarded

    const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null);

    const fire = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.oldPassword || !form.newPassword) return fire("error", "Fill all fields.");
        if (form.newPassword !== form.confirm) return fire("error", "Passwords do not match.");
        setBusy(true);
        try {
            await api.post("/auth/change-password", {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });

            // Success toast
            fire("success", "Password updated. Redirecting to login…");

            // Clear local auth (use your hook if available, else localStorage)
            try { logout?.(); } catch { }
            try { localStorage.removeItem("token"); } catch { }

            // Redirect quickly so the admin signs in again with new credentials
            setTimeout(() => router.replace("/login"), 600);

            setForm({ oldPassword: "", newPassword: "", confirm: "" });
        } catch (e) {
            fire("error", e?.response?.data?.message || "Failed to update password.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="grid gap-6">
            <h1 className="text-2xl font-semibold text-brand">Security</h1>

            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm max-w-xl">
                <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-xl bg-slate-50 p-2 text-slate-700"><Lock className="h-5 w-5" /></div>
                    <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
                </div>

                <form onSubmit={submit} className="grid gap-3">
                    <Field
                        label="Current Password"
                        type="password"
                        value={form.oldPassword}
                        onChange={(v) => setForm((s) => ({ ...s, oldPassword: v }))}
                    />
                    <Field
                        label="New Password"
                        type="password"
                        value={form.newPassword}
                        onChange={(v) => setForm((s) => ({ ...s, newPassword: v }))}
                    />
                    <Field
                        label="Confirm New Password"
                        type="password"
                        value={form.confirm}
                        onChange={(v) => setForm((s) => ({ ...s, confirm: v }))}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Save
                        </button>
                    </div>
                </form>
            </div>

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

function Field({ label, type = "text", value, onChange }) {
    return (
        <label className="grid gap-1">
            <span className="text-sm text-slate-600">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
        </label>
    );
}
