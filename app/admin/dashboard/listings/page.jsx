// app/admin/dashboard/listings/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import Swal from "sweetalert2";

const PAGE_SIZE = 12;

export default function AdminListingsPage() {
    const search = useSearchParams();
    const router = useRouter();

    const q = search.get("q") || "";
    const status = search.get("status") || "all"; // all|approved|pending|rejected
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
        if (key !== "page") params.delete("page");
        router.push(`/admin/dashboard/listings?${params.toString()}`);
    };

    async function fetchData() {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/listings", {
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
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Failed to load",
                text: e?.response?.data?.message || "Could not fetch listings.",
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
            await Swal.fire({
                toast: true,
                position: "top-end",
                timer: 1400,
                showConfirmButton: false,
                icon: "success",
                title: "Refreshed",
            });
        } finally {
            setRefreshing(false);
        }
    };

    const approve = async (it) => {
        const res = await Swal.fire({
            icon: "question",
            title: "Approve listing?",
            text: `“${it.title || "Untitled"}” will be visible to buyers.`,
            showCancelButton: true,
            confirmButtonText: "Yes, approve",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#10b981", // emerald
        });
        if (!res.isConfirmed) return;

        setBusyId(it._id);
        try {
            await api.patch(`/admin/listings/${it._id}/approve`);
            await fetchData();
            await Swal.fire({
                icon: "success",
                title: "Approved",
                text: "The listing is now approved.",
            });
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Approve failed",
                text: e?.response?.data?.message || "Something went wrong.",
            });
        } finally {
            setBusyId(null);
        }
    };

    const reject = async (it) => {
        const res = await Swal.fire({
            icon: "warning",
            title: "Reject listing?",
            text: `“${it.title || "Untitled"}” will be marked as rejected.`,
            showCancelButton: true,
            confirmButtonText: "Yes, reject",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444", // red
        });
        if (!res.isConfirmed) return;

        setBusyId(it._id);
        try {
            await api.patch(`/admin/listings/${it._id}/reject`);
            await fetchData();
            await Swal.fire({
                icon: "success",
                title: "Rejected",
                text: "The listing has been rejected.",
            });
        } catch (e) {
            await Swal.fire({
                icon: "error",
                title: "Reject failed",
                text: e?.response?.data?.message || "Something went wrong.",
            });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-brand">Listings</h1>
                <button
                    onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-light)] bg-white px-3 py-2 text-sm shadow-sm hover:shadow"
                >
                    {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                            placeholder="Search title, address, area…"
                            defaultValue={q}
                            onKeyDown={(e) =>
                                e.key === "Enter" && setParam("q", e.currentTarget.value.trim())
                            }
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
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="ml-auto text-sm text-slate-500">
                        Total:{" "}
                        <strong className="text-slate-800">
                            {fmt.format(meta.total)}
                        </strong>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[var(--sp-light)] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <Th>Title</Th>
                                <Th>Seller</Th>
                                <Th>Status</Th>
                                <Th>Created</Th>
                                <Th className="text-right pr-4">Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-500">
                                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />{" "}
                                        Loading…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-500">
                                        No listings found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((it) => (
                                    <tr key={it._id} className="border-t">
                                        <Td className="max-w-[360px]">
                                            <div className="truncate font-medium text-slate-800">
                                                {it.title || "Untitled"}
                                            </div>
                                            <div className="text-xs text-slate-500">{it.address}</div>
                                        </Td>
                                        <Td>
                                            <div className="text-slate-800">
                                                {it?.seller?.name || it?.seller?.email || "—"}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {it?.seller?.email}
                                            </div>
                                        </Td>
                                        <Td>
                                            <StatusPill status={it.status} />
                                        </Td>
                                        <Td className="text-slate-500">
                                            {new Date(it.createdAt).toLocaleString()}
                                        </Td>
                                        <Td className="text-right pr-3">
                                            <div className="inline-flex items-center gap-2">
                                                <Link
                                                    href={`/admin/dashboard/listings/${it._id}`}
                                                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs hover:bg-slate-50"
                                                >
                                                    View
                                                </Link>
                                                {it.status !== "approved" && (
                                                    <ActionBtn
                                                        title="Approve"
                                                        onClick={() => approve(it)}
                                                        disabled={busyId === it._id}
                                                        icon={<CheckCircle2 className="h-4 w-4" />}
                                                    />
                                                )}
                                                {it.status !== "rejected" && (
                                                    <ActionBtn
                                                        title="Reject"
                                                        onClick={() => reject(it)}
                                                        disabled={busyId === it._id}
                                                        danger
                                                        icon={<XCircle className="h-4 w-4" />}
                                                    />
                                                )}
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

function Th({ children, className = "" }) {
    return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
    return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
function StatusPill({ status }) {
    const map = {
        approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
        pending: "bg-amber-50 text-amber-700 border-amber-100",
        rejected: "bg-rose-50 text-rose-700 border-rose-100",
    };
    const cls = map[status] || "bg-slate-50 text-slate-700 border-slate-100";
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
            {status}
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
