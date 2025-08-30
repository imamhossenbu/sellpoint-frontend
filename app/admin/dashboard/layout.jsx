// app/admin/dashboard/layout.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Menu, X, LayoutGrid, List, CreditCard, BarChart2, LifeBuoy, ShieldCheck, LogOut, Home, User,
    MessageCircle, Newspaper, MessageSquareText, Package, Mail, UsersIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // adjust/remove if your hook differs

export default function AdminDashboardLayout({ children }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, loading } = useAuth?.() || {}; // be defensive

    // --- Guard: keep non-admins out
    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/login?next=/admin/dashboard");
            return;
        }
        if (user.role !== "admin") {
            router.replace("/");
        }
    }, [user, loading, router]);

    const items = useMemo(
        () => [
            { href: "/admin/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
            { href: "/admin/dashboard/listings", label: "Listings", icon: List },
            { href: "/admin/dashboard/users", label: "Users", icon: User },
            { href: "/admin/dashboard/sellers", label: "Sellers", icon: UsersIcon },
            { href: "/admin/dashboard/plans", label: "Plans", icon: Package },               // NEW
            { href: "/admin/dashboard/seller-requests", label: "Seller-Requests", icon: Mail },      // NEW
            { href: "/admin/dashboard/transactions", label: "Transactions", icon: CreditCard },
            { href: "/admin/dashboard/testimonials", label: "Testimonials", icon: MessageCircle },
            { href: "/admin/dashboard/blog", label: "Blog", icon: Newspaper },
            { href: "/admin/dashboard/reviews", label: "Reviews", icon: MessageSquareText },
            { href: "/admin/dashboard/analytics", label: "Analytics", icon: BarChart2 },
            { href: "/admin/dashboard/support", label: "Support", icon: LifeBuoy },
            { href: "/admin/dashboard/security", label: "Security", icon: ShieldCheck },
        ],
        []
    );

    const isActive = (href, exact = false) => (exact ? pathname === href : pathname.startsWith(href));

    const NavLink = ({ href, label, Icon, exact }) => {
        const active = isActive(href, exact);
        return (
            <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${active
                    ? "bg-white border-[var(--sp-light)] text-[var(--sp-primary)] shadow-sm"
                    : "bg-white/70 border-slate-200 hover:bg-white text-slate-700"
                    }`}
            >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFF]">
            {/* Topbar */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
                <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                            onClick={() => setOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link href="/" className="inline-flex items-center gap-2 text-[var(--sp-primary)] font-semibold">
                            <Home className="w-5 h-5" />
                            <span>SellPoint</span>
                        </Link>
                        <span className="text-slate-400 mx-2">/</span>
                        <span className="font-semibold text-slate-700">Admin Dashboard</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {user && (
                            <div className="hidden sm:flex text-sm text-slate-600 mr-2">
                                {user.name}
                                <span className="mx-1 text-slate-300">•</span>
                                <span className="uppercase">{user.role}</span>
                            </div>
                        )}
                        <button
                            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                            onClick={() => {
                                logout?.();
                                router.replace("/");
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Shell */}
            <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-6">
                {/* Sidebar (desktop) */}
                <aside className="hidden md:block">
                    <nav className="sticky top-20 space-y-1">
                        {items.map(({ href, label, icon: Icon, exact }) => (
                            <NavLink key={href} href={href} label={label} Icon={Icon} exact={exact} />
                        ))}
                        <button
                            onClick={() => {
                                logout?.();
                                router.replace("/");
                            }}
                            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </nav>
                </aside>

                {/* Drawer (mobile) */}
                {open && (
                    <div className="fixed inset-0 z-40 md:hidden">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                        <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-semibold text-[var(--sp-primary)]">Admin</div>
                                <button
                                    className="p-2 rounded-lg hover:bg-slate-100"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="space-y-1">
                                {items.map(({ href, label, icon: Icon, exact }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setOpen(false)}
                                        aria-current={isActive(href, exact) ? "page" : undefined}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${isActive(href, exact)
                                            ? "bg-white border-[var(--sp-light)] text-[var(--sp-primary)] shadow-sm"
                                            : "bg-white/70 border-slate-200 hover:bg-white text-slate-700"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm">{label}</span>
                                    </Link>
                                ))}
                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        logout?.();
                                        router.replace("/");
                                    }}
                                    className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm">Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Content */}
                <main className="min-h-[60vh]">{children}</main>
            </div>
        </div>
    );
}
