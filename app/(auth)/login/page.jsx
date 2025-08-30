'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const { user, login } = useAuth();
    const router = useRouter();
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
        useForm({ defaultValues: { email: '', password: '' } });

    useEffect(() => { if (user) router.replace('/'); }, [user, router]);

    const onSubmit = async (values) => {
        try {
            await login(values.email, values.password);
            router.replace('/');
        } catch (err) {
            const msg = err?.message || 'Login failed';
            setError('root', { message: msg });
            toast.error(msg);
        }
    };

    return (
        <main className="min-h-screen relative overflow-hidden grid place-items-center page-surface">
            <section className="w-full max-w-lg px-4">
                <div className="rounded-3xl glass-card p-8 sm:p-10">
                    <div className="h-1 rounded-full mb-6"
                        style={{ background: 'linear-gradient(90deg, #B2B0E8, transparent 60%)' }} />

                    <div className="flex items-center gap-3">
                        <span className="inline-grid place-items-center w-10 h-10 rounded-xl text-white bg-brand">S</span>
                        <h1 className="text-2xl font-semibold text-brand">SellPoint</h1>
                    </div>
                    <p className="mt-1 text-sm text-brand-accent">Sign in to your account</p>

                    {errors.root?.message && (
                        <div className="mt-4 rounded-xl border px-3 py-2 text-sm bg-white"
                            style={{ borderColor: 'rgba(220,38,38,0.35)', color: '#7f1d1d' }}>
                            {errors.root.message}
                        </div>
                    )}

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

                        <label className="block">
                            <span className="text-sm text-brand-accent">Password</span>
                            <div className="relative mt-1">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border bg-white text-slate-900 placeholder-slate-400 pl-10 pr-3 py-2 focus:outline-none"
                                    style={{ borderColor: 'var(--sp-light)' }}
                                    {...register('password', { required: 'Password is required' })}
                                />
                                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
                            </div>
                            {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
                        </label>

                        <div className="flex items-center justify-between">
                            <Link href="/forgot-password" className="text-sm underline text-brand">Forgot password?</Link>
                            <button type="submit" disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 btn-brand text-white">
                                <LogIn className="w-4 h-4" /> {isSubmitting ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>

                    <p className="text-sm mt-5">
                        <span className="text-brand-accent">New here?</span>{' '}
                        <Link href="/register" className="underline text-brand">Create an account</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
