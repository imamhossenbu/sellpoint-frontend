'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Lock, CheckCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export default function ResetPasswordPage() {
    const search = useSearchParams();
    const router = useRouter();
    const token = search.get('token') || '';
    const [valid, setValid] = useState(null);
    const [email, setEmail] = useState('');

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
        useForm({ defaultValues: { password: '', confirm: '' } });

    useEffect(() => {
        if (!token) { setValid(false); return; }
        fetch(`${API_BASE}/api/auth/reset/verify?token=${encodeURIComponent(token)}`)
            .then(r => r.json())
            .then(d => { setValid(Boolean(d.valid)); setEmail(d.email || ''); })
            .catch(() => setValid(false));
    }, [token]);

    const onSubmit = async ({ password, confirm }) => {
        if (password !== confirm) {
            setError('confirm', { message: 'Passwords do not match' });
            return;
        }
        const res = await fetch(`${API_BASE}/api/auth/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setError('root', { message: j?.message || 'Reset failed' });
            return;
        }
        router.replace('/login');
    };

    return (
        <main className="min-h-screen grid place-items-center relative overflow-hidden page-surface">
            <section className="w-full max-w-lg mx-4">
                <div className="rounded-3xl glass-card p-8 sm:p-10">
                    <div className="h-1 rounded-full mb-6"
                        style={{ background: 'linear-gradient(90deg, #B2B0E8, transparent 60%)' }} />

                    <div className="flex items-center gap-3">
                        <span className="inline-grid place-items-center w-10 h-10 rounded-xl text-white bg-brand">S</span>
                        <h1 className="text-2xl font-semibold text-brand">Reset password</h1>
                    </div>

                    {valid === null && <p className="mt-2 text-sm text-brand-accent">Checking your reset link…</p>}

                    {valid === false && (
                        <div className="mt-4 rounded-xl border px-3 py-3 text-sm bg-white"
                            style={{ borderColor: 'var(--sp-light)', color: '#0f172a' }}>
                            This reset link is invalid or has expired. Please request a new one.
                        </div>
                    )}

                    {valid && (
                        <>
                            {email && (
                                <p className="mt-1 text-sm text-brand-accent">
                                    Resetting password for <span className="text-brand font-medium">{email}</span>
                                </p>
                            )}

                            {errors.root?.message && (
                                <div className="mt-4 rounded-xl border px-3 py-2 text-sm bg-white"
                                    style={{ borderColor: 'rgba(220,38,38,0.35)', color: '#7f1d1d' }}>
                                    {errors.root.message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
                                <label className="block">
                                    <span className="text-sm text-brand-accent">New password</span>
                                    <div className="relative mt-1">
                                        <input
                                            type="password"
                                            placeholder="At least 6 characters"
                                            className="w-full rounded-xl border bg-white text-slate-900 placeholder-slate-400 pl-10 pr-3 py-2 focus:outline-none"
                                            style={{ borderColor: 'var(--sp-light)' }}
                                            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                                        />
                                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
                                    </div>
                                    {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
                                </label>

                                <label className="block">
                                    <span className="text-sm text-brand-accent">Confirm new password</span>
                                    <div className="relative mt-1">
                                        <input
                                            type="password"
                                            placeholder="Repeat password"
                                            className="w-full rounded-xl border bg-white text-slate-900 placeholder-slate-400 pl-10 pr-3 py-2 focus:outline-none"
                                            style={{ borderColor: 'var(--sp-light)' }}
                                            {...register('confirm', { required: 'Please confirm your password' })}
                                        />
                                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
                                    </div>
                                    {errors.confirm && <span className="text-xs text-red-600">{errors.confirm.message}</span>}
                                </label>

                                <button type="submit" disabled={isSubmitting}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 btn-brand text-white">
                                    <CheckCircle className="w-4 h-4" /> {isSubmitting ? 'Updating...' : 'Update password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
