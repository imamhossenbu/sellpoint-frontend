// app/seller/dashboard/security/page.jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import Swal from "sweetalert2"; // npm i sweetalert2
import { useAuth } from "@/hooks/useAuth"; // optional; guarded below

export default function SellerSecurityPage() {
    const router = useRouter();
    const { logout } = useAuth?.() || {}; // guard in case the hook path differs or doesn't exist

    const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.oldPassword || !form.newPassword || !form.confirm) {
            return Swal.fire({ icon: "warning", title: "Missing fields", text: "Please fill all fields." });
        }
        if (form.newPassword !== form.confirm) {
            return Swal.fire({ icon: "error", title: "Mismatch", text: "New passwords do not match." });
        }

        setBusy(true);
        try {
            await api.post("/auth/change-password", {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });

            await Swal.fire({ icon: "success", title: "Password updated", text: "Please log in again." });

            // Proactively invalidate local client session:
            try {
                // Prefer your app's auth hook if present
                logout?.();
            } catch { }
            try {
                // Fallback if your auth hook isn't present or doesn't clear storage
                localStorage.removeItem("token");
            } catch { }

            // Send them to the login page
            router.replace("/login");
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Update failed",
                text: e?.response?.data?.message || "Could not update password.",
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="grid gap-6">
            <h1 className="text-2xl font-semibold text-brand">Security</h1>

            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-6 shadow-sm max-w-xl">
                <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-xl bg-slate-50 p-2 text-slate-700">
                        <Lock className="h-5 w-5" />
                    </div>
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

                <p className="mt-3 text-xs text-slate-500">
                    Tip: Use at least 6 characters with a mix of letters, numbers, and symbols.
                </p>
            </div>
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
