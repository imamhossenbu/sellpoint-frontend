// context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    // Clean up legacy key
    useEffect(() => {
        try { localStorage.removeItem('sp_auth'); } catch { }
    }, []);

    /** Attach/remove Authorization header on the shared axios instance */
    const setAuthHeader = useCallback((token) => {
        if (token) {
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common.Authorization;
        }
    }, []);

    /** Fetch the fully-populated profile */
    const refreshUser = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data.user);
            return data.user;
        } catch (e) {
            // Token might be invalid or expired
            localStorage.removeItem('token');
            setAuthHeader(null);
            setUser(null);
            throw e;
        }
    }, [setAuthHeader]);

    // Hydrate from token on first load
    useEffect(() => {
        const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!t) { setReady(true); return; }
        setAuthHeader(t);
        refreshUser().finally(() => setReady(true));
    }, [refreshUser, setAuthHeader]);

    /** Broadcast user changes so other parts of the app can react if they want */
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:user', { detail: { user } }));
            // If user logs out, some UIs (e.g., wishlist badge) may want to clear immediately:
            if (!user) {
                window.dispatchEvent(new CustomEvent('wishlist:changed', { detail: { ids: [] } }));
            }
        }
    }, [user]);

    /** Standard email/password login */
    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setAuthHeader(data.token);

        // Pull the full profile immediately so avatar/fields are ready on first render
        try {
            const u = await refreshUser();
            toast.success('Welcome back');
            return { token: data.token, user: u };
        } catch {
            // Fallback to payload if /auth/me fails unexpectedly
            setUser(data.user);
            toast.success('Welcome back');
            return { token: data.token, user: data.user };
        }
    };

    /** If you receive a token (e.g., social login or magic link), hydrate and fetch profile */
    const loginWithToken = async (token, userObj) => {
        localStorage.setItem('token', token);
        setAuthHeader(token);
        try {
            const u = await refreshUser();
            return { token, user: u };
        } catch {
            setUser(userObj || null);
            return { token, user: userObj || null };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthHeader(null);
        setUser(null);
    };

    /** Update a subset of user fields locally (e.g., after editing profile/avatar) */
    const updateUser = (partial) => {
        setUser((prev) => (prev ? { ...prev, ...partial } : prev));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                ready,
                login,
                loginWithToken,
                logout,
                updateUser,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthCtx = () => useContext(AuthContext);
/** Re-export as useAuth for convenience if other code imports from hooks/useAuth */
export const useAuth = useAuthCtx;
