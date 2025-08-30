// app/admin/dashboard/users/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    RefreshCw,
    ShieldCheck,
    ShieldOff,
    Trash2,
    Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import Swal from "sweetalert2"; // npm i sweetalert2

const PAGE_SIZE = 12;

export default function AdminUsersPage() {
    const search = useSearchParams();
    const router = useRouter();

    const q = search.get("q") || "";
    const role = search.get("role") || "all";   // all|seller|buyer|admin
    const status = search.get("status") || "all"; // all|active|banned
    const page = Number(search.get("page") || 1);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
    const [busyId, setBusyId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fmt = useMemo(() => new Intl.NumberFormat(), []);

    const setParam = (key, value) => {
        const params = new URLSearchParams(search.toString());
        if (!value || value === "all" || value === "") params.delete(key);
        else params.set(key, value);
        if (key !== "page") params.delete("page"); // reset page on filter/search change
        router.push(`/admin/dashboard/users?${params.toString()}`);
    };

    async function fetchData() {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/users", {
                params: {
                    q: q || undefined,
                    role: role === "all" ? undefined : role,
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
    }, [q, role, status, page]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const onBan = async (user) => {
        const res = await Swal.fire({
            title: `Ban ${user.name || user.email}?`,
            text: "The user will not be able to log in until unbanned.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Ban",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
        });
        if (!res.isConfirmed) return;

        setBusyId(user._id);
        try {
            await api.patch(`/admin/users/${user._id}/ban`);
            await refresh();
            Swal.fire("Banned!", `${user.name || user.email} has been banned.`, "success");
        } finally {
            setBusyId(null);
        }
    };

    const onUnban = async (user) => {
        const res = await Swal.fire({
            title: `Unban ${user.name || user.email}?`,
            text: "The user will regain access to their account.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Unban",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
        });
        if (!res.isConfirmed) return;

        setBusyId(user._id);
        try {
            await api.patch(`/admin/users/${user._id}/unban`);
            await refresh();
            Swal.fire("Unbanned!", `${user.name || user.email} is now active.`, "success");
        } finally {
            setBusyId(null);
        }
    };

    const onDelete = async (user) => {
        const res = await Swal.fire({
            title: `Delete ${user.name || user.email}?`,
            text: "This action cannot be undone!",
            icon: "error",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
        });
        if (!res.isConfirmed) return;

        setBusyId(user._id);
        try {
            await api.delete(`/admin/users/${user._id}`);
            await refresh();
            Swal.fire("Deleted!", `${user.name || user.email} has been removed.`, "success");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-brand">Users</h1>
                <button
                    onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                >
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                            placeholder="Search name or email…"
                            defaultValue={q}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") setParam("q", e.currentTarget.value.trim());
                            }}
                            className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm w-64"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-500">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setParam("role", e.target.value)}
                            className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-500">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setParam("status", e.target.value)}
                            className="rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="banned">Banned</option>
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
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Status</Th>
                                <Th>Joined</Th>
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
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((u) => (
                                    <tr key={u._id} className="border-t">
                                        <Td className="font-medium text-slate-800">{u.name || "—"}</Td>
                                        <Td className="text-slate-700">{u.email}</Td>
                                        <Td><RolePill role={u.role} /></Td>
                                        <Td><StatusPill banned={!u.isActive} /></Td>
                                        <Td className="text-slate-500">{new Date(u.createdAt).toLocaleString()}</Td>
                                        <Td className="text-right pr-3">
                                            <div className="inline-flex items-center gap-2">
                                                {!u.isActive ? (
                                                    <ActionBtn
                                                        title="Unban"
                                                        onClick={() => onUnban(u)}
                                                        disabled={busyId === u._id}
                                                        icon={<ShieldCheck className="h-4 w-4" />}
                                                    />
                                                ) : (
                                                    <ActionBtn
                                                        title="Ban"
                                                        onClick={() => onBan(u)}
                                                        disabled={busyId === u._id}
                                                        icon={<ShieldOff className="h-4 w-4" />}
                                                    />
                                                )}
                                                <ActionBtn
                                                    title="Delete"
                                                    onClick={() => onDelete(u)}
                                                    danger
                                                    disabled={busyId === u._id}
                                                    icon={<Trash2 className="h-4 w-4" />}
                                                />
                                            </div>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
        </div>
    );
}

/* ------------ UI bits ------------ */
function Th({ children, className = "" }) {
    return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
    return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}

function RolePill({ role }) {
    const map = {
        admin: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
        seller: "bg-emerald-50 text-emerald-700 border-emerald-100",
        buyer: "bg-indigo-50 text-indigo-700 border-indigo-100",
    };
    const cls = map[role] || "bg-slate-50 text-slate-700 border-slate-100";
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>{role}</span>;
}

function StatusPill({ banned }) {
    return banned ? (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-rose-50 text-rose-700 border-rose-100">
            Banned
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-100">
            Active
        </span>
    );
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
