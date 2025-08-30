// components/Navbar.jsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import {
    Menu, X, Bell, Heart, Home, LayoutGrid, LogOut,
    MapPin, Info, CreditCard, HelpCircle, Phone, Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthCtx } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Image from 'next/image';
import logo from '../public/fav.png';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

const Badge = ({ value }) => {
    if (!value) return null;
    return (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] flex items-center justify-center rounded-full bg-red-500 text-white shadow">
            {value > 99 ? '99+' : value}
        </span>
    );
};

const Avatar = ({ user }) => {
    const letter = (user?.name || user?.email || '?').slice(0, 1).toUpperCase();
    if (user?.avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={user.avatarUrl}
                alt="avatar"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60"
            />
        );
    }
    return (
        <div className="w-9 h-9 rounded-full grid place-items-center font-semibold text-brand bg-white">
            {letter}
        </div>
    );
};

function useClickAway(ref, onAway) {
    useEffect(() => {
        const handler = (e) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) onAway?.();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onAway]);
}

export default function Navbar() {
    const { user, logout } = useAuthCtx();
    const router = useRouter();
    const pathname = usePathname();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const menuRef = useRef(null);
    const moreRef = useRef(null);
    const socketRef = useRef(null);

    useClickAway(menuRef, () => setMenuOpen(false));
    useClickAway(moreRef, () => setMoreOpen(false));

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!mobileOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [mobileOpen]);

    useEffect(() => {
        setMobileOpen(false);
        setMenuOpen(false);
        setMoreOpen(false);
    }, [pathname]);

    const fetchUnread = useCallback(async () => {
        if (!user) {
            setNotifCount(0);
            return;
        }
        try {
            const { data } = await api.get('/notifications', { withCredentials: true });
            setNotifCount((data || []).filter((n) => !n.read).length);
        } catch {
            setNotifCount(0);
        }
    }, [user]);

    useEffect(() => {
        let cancelled = false;

        if (socketRef.current) {
            socketRef.current.off('notification:new');
            socketRef.current.off('connect');
            socketRef.current.off('reconnect');
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (user) {
            const s = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                auth: { userId: user.id || user._id },
            });
            socketRef.current = s;

            const doRefresh = async () => {
                if (cancelled) return;
                await fetchUnread();
            };

            s.on('connect', doRefresh);
            s.on('reconnect', doRefresh);

            s.on('notification:new', (payload) => {
                if (payload && typeof payload.unreadCount === 'number') {
                    setNotifCount(payload.unreadCount);
                } else if (payload && payload.type === 'chat_read') {
                    fetchUnread();
                } else {
                    setNotifCount((c) => c + 1);
                }
            });
        } else {
            setNotifCount(0);
        }

        const id = setInterval(() => { if (!cancelled) fetchUnread(); }, 30000);
        const onVis = () => document.visibilityState === 'visible' && fetchUnread();
        document.addEventListener('visibilitychange', onVis);

        const onNotifsChanged = (e) => {
            if (typeof e?.detail?.unread === 'number') setNotifCount(e.detail.unread);
            else fetchUnread();
        };
        const onNotifsRefresh = () => fetchUnread();
        const onChatRead = () => fetchUnread();

        window.addEventListener('notifications:changed', onNotifsChanged);
        window.addEventListener('notifications:refresh', onNotifsRefresh);
        window.addEventListener('chat:read', onChatRead);

        fetchUnread();

        return () => {
            cancelled = true;
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('notifications:changed', onNotifsChanged);
            window.removeEventListener('notifications:refresh', onNotifsRefresh);
            window.removeEventListener('chat:read', onChatRead);
            if (socketRef.current) {
                socketRef.current.off('notification:new');
                socketRef.current.off('connect');
                socketRef.current.off('reconnect');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user, fetchUnread]);

    useEffect(() => {
        const inInbox =
            pathname?.startsWith('/chat') ||
            pathname?.startsWith('/notifications') ||
            pathname?.startsWith('/inbox');
        if (user && inInbox) {
            fetchUnread();
        }
    }, [pathname, user, fetchUnread]);

    const refetchWishlist = async () => {
        if (!user) return setWishlistCount(0);
        try {
            const { data } = await api.get('/wishlist/me', { withCredentials: true });
            const arr = Array.isArray(data?.wishlist) ? data.wishlist : [];
            setWishlistCount(arr.length);
        } catch {
            setWishlistCount(0);
        }
    };

    useEffect(() => { refetchWishlist(); }, [user]);

    useEffect(() => {
        const onWishlistChanged = (e) => {
            if (typeof e?.detail?.count === 'number') {
                setWishlistCount(e.detail.count);
            } else if (Array.isArray(e?.detail?.ids)) {
                setWishlistCount(e.detail.ids.length);
            } else {
                refetchWishlist();
            }
        };
        const onVisible = () => {
            if (document.visibilityState === 'visible') refetchWishlist();
        };

        window.addEventListener('wishlist:changed', onWishlistChanged);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('wishlist:changed', onWishlistChanged);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [user]);

    const linksPrimary = useMemo(
        () => [
            { href: '/', label: 'Home', icon: Home },
            { href: '/listings', label: 'Browse', icon: LayoutGrid },
            { href: '/pricing', label: 'Pricing', icon: CreditCard },
            { href: '/about', label: 'About', icon: Info },
            { href: '/blog', label: 'Blog', icon: Newspaper },
            { href: '/contact', label: 'Contact', icon: Phone },
        ],
        []
    );


    const dashboardHref =
        user?.role === 'seller' ? '/seller/dashboard' :
            user?.role === 'admin' ? '/admin/dashboard' :
                null;

    const profileHref = user ? '/profile' : '/login';

    const ActivePill = ({ active }) => (
        <AnimatePresence>
            {active && (
                <motion.span
                    layoutId="nav-pill"
                    aria-hidden
                    className="nav-pill absolute inset-0 z-0 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.25 }}
                />
            )}
        </AnimatePresence>
    );

    const NavButton = ({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
        return (
            <Link href={href} className="relative group">
                <ActivePill active={active} />
                <span
                    className={`relative z-10 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 brand-underline
          ${active ? 'text-brand' : 'text-white group-hover:text-brand'}`}
                >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                </span>
            </Link>
        );
    };

    return (
        <>
            <header
                className="fixed top-0 left-0 right-0 z-50"
                style={{ background: 'linear-gradient(90deg, var(--sp-primary), var(--sp-primary-alt))' }}
            >
                <div className={`transition-shadow ${scrolled ? 'shadow-[0_6px_24px_rgba(0,0,0,0.25)]' : ''}`}>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="h-16 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    aria-label="Open menu"
                                    className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
                                    onClick={() => setMobileOpen(true)}
                                >
                                    <Menu className="w-6 h-6" />
                                </button>

                                <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-white">
                                    <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-white/15">
                                        <Image src={logo} alt="logo" width={36} height={36} />
                                    </span>
                                    <span>SellPoint</span>
                                </Link>

                                <nav className="hidden lg:flex items-center gap-1 ml-4">
                                    <div className="flex items-center gap-1 rounded-2xl bg-white/10 backdrop-blur border border-white/20 px-1 py-1 text-white">
                                        {linksPrimary.map(({ href, label, icon }) => (
                                            <div key={href} className="relative">
                                                <NavButton href={href} label={label} Icon={icon} />
                                            </div>
                                        ))}
                                    </div>
                                </nav>
                            </div>

                            <div className="flex items-center gap-2">
                                {dashboardHref && (
                                    <Link
                                        href={dashboardHref}
                                        className="px-3 hidden sm:block py-2 rounded-xl text-[var(--sp-primary)] bg-white hover:bg-white/90 shadow-sm"
                                    >
                                        Dashboard
                                    </Link>
                                )}

                                <Link
                                    href="/wishlist"
                                    className="relative p-2 rounded-xl text-white hover:bg-white/15"
                                    aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
                                    title="Wishlist"
                                >
                                    <Heart className="w-6 h-6" />
                                    <Badge value={wishlistCount} />
                                </Link>

                                <Link
                                    href="/chat"
                                    className="relative p-2 rounded-xl text-white hover:bg-white/15"
                                    aria-label="Notifications"
                                    title="Notifications"
                                >
                                    <Bell className="w-6 h-6" />
                                    <Badge value={notifCount} />
                                </Link>

                                {user ? (
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            className="p-1 rounded-full hover:bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                                            aria-label="Profile menu"
                                            aria-expanded={menuOpen}
                                            onClick={() => setMenuOpen((v) => !v)}
                                        >
                                            <Avatar user={user} />
                                        </button>

                                        <AnimatePresence>
                                            {menuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                                    role="menu"
                                                    className="absolute right-0 mt-2 w-56 rounded-2xl border bg-white shadow-2xl p-2 z-50"
                                                    style={{ borderColor: 'var(--sp-light)' }}
                                                >
                                                    <div className="px-3 py-2 text-sm">
                                                        <div className="font-semibold text-brand">{user.name}</div>
                                                        <div className="truncate text-slate-600">{user.email}</div>
                                                    </div>
                                                    <div className="h-px my-1 bg-slate-200" />

                                                    <Link
                                                        href="/profile"
                                                        role="menuitem"
                                                        className="block px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700"
                                                        onClick={() => setMenuOpen(false)}
                                                    >
                                                        Profile
                                                    </Link>

                                                    {dashboardHref && (
                                                        <Link
                                                            href={dashboardHref}
                                                            role="menuitem"
                                                            className="block px-3 py-2 mt-1 rounded-xl text-[var(--sp-primary)] font-medium bg-white hover:bg-slate-50 shadow-sm"
                                                        >
                                                            Dashboard
                                                        </Link>
                                                    )}

                                                    <div className="h-px my-1 bg-slate-200" />

                                                    <button
                                                        role="menuitem"
                                                        onClick={() => {
                                                            setMenuOpen(false);
                                                            logout();
                                                            router.replace('/');
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-slate-700"
                                                    >
                                                        <LogOut className="w-4 h-4" /> Logout
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="hidden sm:flex items-center gap-2">
                                        <Link
                                            href="/login"
                                            className="px-3 py-2 rounded-xl border border-white/30 text-white hover:bg-white/15"
                                        >
                                            Sign in
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="px-3 py-2 rounded-xl bg-white text-[var(--sp-primary)] hover:bg-white/90"
                                        >
                                            Create account
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        aria-hidden
                        className="h-[2px] w-full"
                        style={{ background: 'linear-gradient(90deg, #B2B0E8, transparent 60%)' }}
                    />
                </div>
            </header>

            <div className="h-16" aria-hidden />

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="fixed inset-0 z-[60]"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation Menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                        <motion.aside
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto
                bg-white shadow-2xl border-r border-[var(--sp-light)]
                pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
                        >
                            <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--sp-light)]">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 font-bold text-lg"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span
                                        className="inline-grid place-items-center w-9 h-9 rounded-xl text-white"
                                        style={{ background: 'linear-gradient(135deg, var(--sp-primary), var(--sp-primary-alt))' }}
                                    >
                                        S
                                    </span>
                                    <span className="text-brand">SellPoint</span>
                                </Link>
                                <button
                                    className="p-2 rounded-xl hover:bg-slate-100"
                                    onClick={() => setMobileOpen(false)}
                                    aria-label="Close menu"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <nav className="p-2">
                                {[...linksPrimary].map(({ href, label, icon: Icon }, idx) => (
                                    <Link
                                        key={idx}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-brand"
                                    >
                                        <Icon className="w-5 h-5" /> {label}
                                    </Link>
                                ))}

                                {dashboardHref && (
                                    <Link
                                        href={dashboardHref}
                                        onClick={() => setMobileOpen(false)}
                                        className="mt-2 flex items-center gap-3 px-3 py-2 rounded-xl text-white"
                                        style={{ background: 'linear-gradient(135deg, var(--sp-primary), var(--sp-primary-alt))' }}
                                    >
                                        Dashboard
                                    </Link>
                                )}

                                <div className="h-px my-3 border-[var(--sp-light)]" />

                                <div className="flex items-center gap-3 px-3 py-2">
                                    <div className="relative">
                                        <Heart className="w-5 h-5 text-brand" />
                                        <Badge value={wishlistCount} />
                                    </div>
                                    <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="text-brand">
                                        Wishlist
                                    </Link>
                                </div>

                                <div className="flex items-center gap-3 px-3 py-2">
                                    <div className="relative">
                                        <Bell className="w-5 h-5 text-brand" />
                                        <Badge value={notifCount} />
                                    </div>
                                    <Link href="/chat" onClick={() => setMobileOpen(false)} className="text-brand">
                                        Notifications
                                    </Link>
                                </div>
                            </nav>

                            <div className="mt-auto p-3 text-sm flex items-center justify-between text-brand-accent">
                                <Link href={profileHref} onClick={() => setMobileOpen(false)} className="underline">
                                    {user ? 'Profile' : 'Sign in'}
                                </Link>
                                {user && (
                                    <button
                                        onClick={() => { setMobileOpen(false); logout(); router.replace('/'); }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                                        style={{ background: 'linear-gradient(135deg, var(--sp-primary), var(--sp-primary-alt))' }}
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                )}
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
