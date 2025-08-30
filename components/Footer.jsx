// components/Footer.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Mail, Phone, MapPin, BellRing, BellOff, CheckCircle2, AlertCircle,
    Github, Twitter, Instagram, Linkedin, Youtube, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import logo from '../public/fav.png';
import Image from 'next/image';

const isEmail = (v = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function Footer() {
    const { user } = useAuth();

    const [email, setEmail] = useState('');
    const [checking, setChecking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text: string }
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (user?.email) setEmail(user.email);
    }, [user]);

    useEffect(() => {
        setMsg(null);
        if (!isEmail(email)) {
            setSubscribed(false);
            return;
        }
        setChecking(true);
        const t = setTimeout(async () => {
            try {
                const { data } = await api.get('/newsletter/status', { params: { email } });
                setSubscribed(!!data?.subscribed);
            } catch {
            } finally {
                setChecking(false);
            }
        }, 450);
        return () => clearTimeout(t);
    }, [email]);

    useEffect(() => {
        if (!msg?.type) return;
        const t = setTimeout(() => setMsg(null), msg.type === 'ok' ? 3500 : 5000);
        return () => clearTimeout(t);
    }, [msg]);

    const onSubmit = async (e) => {
        e.preventDefault();
        const clean = (email || '').trim().toLowerCase();
        setTouched(true);
        if (!isEmail(clean)) {
            setMsg({ type: 'err', text: 'Enter a valid email.' });
            return;
        }
        setMsg(null);
        setLoading(true);
        try {
            if (subscribed) {
                await api.post('/newsletter/unsubscribe', { email: clean });
                setSubscribed(false);
                setMsg({ type: 'ok', text: 'You have been unsubscribed.' });
            } else {
                await api.post('/newsletter/subscribe', { email: clean });
                setSubscribed(true);
                setMsg({ type: 'ok', text: 'Thanks! You’re subscribed.' });
            }
        } catch {
            setMsg({ type: 'err', text: 'Something went wrong. Try again.' });
        } finally {
            setLoading(false);
        }
    };

    const statusChip = useMemo(() => {
        if (!isEmail(email)) return null;
        if (checking) {
            return (
                <span
                    role="status"
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border text-white/90"
                    style={{ borderColor: 'rgba(255,255,255,0.35)' }}
                >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
                </span>
            );
        }
        return subscribed ? (
            <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border"
                style={{ borderColor: 'rgba(34,197,94,.5)', color: '#bbf7d0' /* green-200 on dark */ }}
            >
                <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed
            </span>
        ) : (
            <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border text-white/80"
                style={{ borderColor: 'rgba(255,255,255,0.35)' }}
            >
                Not subscribed
            </span>
        );
    }, [email, checking, subscribed]);

    const emailInvalid = touched && !isEmail(email);

    return (
        <footer
            className="relative text-white"
            style={{ background: 'linear-gradient(90deg, var(--sp-primary), var(--sp-primary-alt))' }}
        >
            {/* subtle top glow to mirror navbar accent */}
            <div aria-hidden className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #B2B0E8, transparent 60%)' }} />

            <div className="border-t border-white/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-8">
                        {/* Brand */}
                        <div className="xl:col-span-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-grid place-items-center w-9 h-9 rounded-full bg-white/15 text-white">
                                    <Image src={logo} alt='logo' />
                                </span>
                                <span className="text-xl font-semibold">SellPoint</span>
                            </div>
                            <p className="mt-3 text-sm text-white/80">
                                Find, save, and manage real estate listings with a modern, fast experience.
                            </p>

                            <div className="mt-4 flex items-center gap-2 text-sm text-white/85">
                                <MapPin className="w-4 h-4 text-white" />
                                <span>Dhaka, Bangladesh</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-white/85">
                                <Mail className="w-4 h-4 text-white" />
                                <a className="hover:underline" href="mailto:support@sellpoint.app">support@sellpoint.app</a>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-white/85">
                                <Phone className="w-4 h-4 text-white" />
                                <a className="hover:underline" href="tel:+8801000000000">+880 10-0000-0000</a>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                {[
                                    { Icon: Github, href: '#' },
                                    { Icon: Twitter, href: '#' },
                                    { Icon: Instagram, href: '#' },
                                    { Icon: Linkedin, href: '#' },
                                    { Icon: Youtube, href: '#' },
                                ].map(({ Icon, href }, i) => (
                                    <Link
                                        key={i}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-9 h-9 rounded-full grid place-items-center border border-white/30 hover:bg-white/10 transition"
                                        aria-label="social link"
                                    >
                                        <Icon className="w-4 h-4 text-white" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Explore */}
                        <div>
                            <h4 className="text-sm font-semibold">Explore</h4>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li><Link href="/" className="hover:underline text-white/85">Home</Link></li>
                                <li><Link href="/listings" className="hover:underline text-white/85">Browse</Link></li>
                                <li><Link href="/map" className="hover:underline text-white/85">Map View</Link></li>
                                <li><Link href="/pricing" className="hover:underline text-white/85">Pricing</Link></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="text-sm font-semibold">Resources</h4>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li><Link href="/blog" className="hover:underline text-white/85">Blog</Link></li>
                                <li><Link href="/faq" className="hover:underline text-white/85">FAQ</Link></li>
                                <li><Link href="/contact" className="hover:underline text-white/85">Contact</Link></li>
                                <li><Link href="/about" className="hover:underline text-white/85">About</Link></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-sm font-semibold">Legal</h4>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li><Link href="/privacy" className="hover:underline text-white/85">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:underline text-white/85">Terms of Service</Link></li>
                                <li><Link href="/cookies" className="hover:underline text-white/85">Cookie Policy</Link></li>
                            </ul>
                        </div>

                        {/* Newsletter — glass on dark gradient */}
                        <div className="md:col-span-2 xl:col-span-2">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-semibold">Newsletter</h4>
                                {statusChip}
                            </div>
                            <p className="mt-3 text-sm text-white/80">
                                {subscribed ? 'You are subscribed. Unsubscribe anytime.' : 'Get market tips & product updates.'}
                            </p>

                            <form onSubmit={onSubmit} className="mt-3">
                                <div
                                    className="rounded-2xl p-3 sm:p-4"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.08))',
                                        border: '1px solid rgba(255,255,255,.25)',
                                        backdropFilter: 'blur(18px)',
                                        WebkitBackdropFilter: 'blur(18px)'
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onBlur={() => setTouched(true)}
                                                placeholder="you@example.com"
                                                aria-invalid={emailInvalid}
                                                aria-describedby="nl-help nl-msg"
                                                className="w-full rounded-xl border bg-white/90 text-[rgba(0,0,0,.85)] placeholder-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                                style={{ borderColor: emailInvalid ? 'rgba(220,38,38,.45)' : 'rgba(255,255,255,.35)' }}
                                            />
                                            <span
                                                id="nl-help"
                                                className="absolute -bottom-5 left-1 text-xs"
                                                style={{ color: emailInvalid ? '#fecaca' : 'transparent' }}
                                            >
                                                Enter a valid email
                                            </span>
                                        </div>

                                        {subscribed ? (
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
                                                style={{ borderColor: 'rgba(254,226,226,.6)', color: '#fecaca', backgroundColor: 'transparent' }}
                                                aria-label="Unsubscribe"
                                                title="Unsubscribe"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
                                                {loading ? 'Unsubscribing…' : 'Unsubscribe'}
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={loading || checking}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[var(--sp-primary)] bg-white text-sm font-medium transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 hover:bg-white/95"
                                                aria-label="Subscribe"
                                                title="Subscribe"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                                                {loading ? 'Subscribing…' : 'Subscribe'}
                                            </button>
                                        )}
                                    </div>

                                    <p
                                        id="nl-msg"
                                        className={`mt-3 inline-flex items-center gap-1 text-xs ${msg?.type === 'ok' ? 'text-[#bbf7d0]' : msg?.type === 'err' ? 'text-[#fecaca]' : 'text-transparent'
                                            }`}
                                        aria-live={msg?.type ? 'polite' : 'off'}
                                    >
                                        {msg?.type === 'ok' && <CheckCircle2 className="w-4 h-4" />}
                                        {msg?.type === 'err' && <AlertCircle className="w-4 h-4" />}
                                        {msg?.text || 'placeholder'}
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* bottom bar */}
                    <div className="mt-12 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-white/80">
                            © {new Date().getFullYear()} SellPoint. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-white/85">
                            <Link href="/privacy" className="hover:underline">Privacy</Link>
                            <Link href="/terms" className="hover:underline">Terms</Link>
                            <Link href="/cookies" className="hover:underline">Cookies</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
