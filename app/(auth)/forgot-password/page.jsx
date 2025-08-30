'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export default function ForgotPasswordPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } =
        useForm({ defaultValues: { email: '' } });
    const [sent, setSent] = useState(false);

    const onSubmit = async ({ email }) => {
        await fetch(`${API_BASE}/api/auth/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        setSent(true);
    };

    return (
        <main className="min-h-screen grid place-items-center relative overflow-hidden page-surface">
            <section className="w-full max-w-lg mx-4">
                <div className="rounded-3xl glass-card p-8 sm:p-10">
                    <div className="h-1 rounded-full mb-6"
                        style={{ background: 'linear-gradient(90deg, #B2B0E8, transparent 60%)' }} />

                    <div className="flex items-center gap-3">
                        <span className="inline-grid place-items-center w-10 h-10 rounded-xl text-white bg-brand">S</span>
                        <h1 className="text-2xl font-semibold text-brand">Forgot password</h1>
                    </div>
                    <p className="mt-1 text-sm text-brand-accent">
                        Enter your email. If it exists, we’ll send you a reset link (valid for 15 minutes).
                    </p>

                    {sent ? (
                        <div className="mt-6 rounded-xl border px-3 py-3 text-sm bg-white"
                            style={{ borderColor: 'var(--sp-light)', color: '#0f172a' }}>
                            If an account exists for that email, a reset link has been sent. Check your inbox and spam folder.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
                            <label className="block">
                                <span className="text-sm text-brand-accent">Email</span>
                                <div className="relative mt-1">
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl border bg-white text-slate-900 placeholder-slate-400 pl-10 pr-3 py-2 focus:outline-none"
                                        style={{ borderColor: 'var(--sp-light)' }}
                                        {...register('email', { required: 'Email is required' })}
                                    />
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
                                </div>
                                {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
                            </label>

                            <button type="submit" disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 btn-brand text-white">
                                <Send className="w-4 h-4" /> {isSubmitting ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 flex items-center justify-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-brand hover:opacity-80">
                            <ArrowLeft className="w-4 h-4" /> Back to sign in
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
