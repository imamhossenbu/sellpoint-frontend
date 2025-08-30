// WishlistButton.jsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const idEq = (a, b) => String(a) === String(b);

export default function WishlistButton({ listingId }) {
    const { user } = useAuth();
    const [on, setOn] = useState(false);
    const listingIdStr = String(listingId);

    useEffect(() => {
        if (!user) { setOn(false); return; }
        api.get('/wishlist/me')
            .then(r => {
                const ids = (r.data?.wishlist || []).map(x => String(x?._id ?? x));
                setOn(ids.includes(listingIdStr));
            })
            .catch(() => {/* ignore */ });
    }, [user, listingIdStr]);

    const toggle = async () => {
        if (!user) return toast.error('Login first');
        try {
            const { data } = await api.post(`/wishlist/${listingIdStr}/toggle`);
            const ids = (data?.wishlist || []).map(x => String(x?._id ?? x));
            setOn(ids.includes(listingIdStr));
            toast.success(ids.includes(listingIdStr) ? 'Added to wishlist' : 'Removed from wishlist');
            +   // Notify navbar to update its badge immediately
                +   window.dispatchEvent(new CustomEvent('wishlist:changed', { detail: { ids, count: ids.length } }));
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update wishlist');
        }
    };


    return (
        <button
            onClick={toggle}
            className={"px-3 py-1 rounded " + (on ? "bg-pink-600 text-white" : "bg-gray-200")}
            aria-pressed={on}
        >
            {on ? "Wishlisted ♥" : "Add to Wishlist ♡"}
        </button>
    );
}
