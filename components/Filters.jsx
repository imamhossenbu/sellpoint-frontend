'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function Filters() {
    const sp = useSearchParams();
    const [q, setQ] = useState(sp.get('q') || '');
    const [type, setType] = useState(sp.get('type') || '');
    const [category, setCategory] = useState(sp.get('category') || '');
    const [minPrice, setMin] = useState(sp.get('minPrice') || '');
    const [maxPrice, setMax] = useState(sp.get('maxPrice') || '');
    const router = useRouter();
    const submit = () => {
        const p = new URLSearchParams();
        if (q) p.set('q', q);
        if (type) p.set('type', type);
        if (category) p.set('category', category);
        if (minPrice) p.set('minPrice', minPrice);
        if (maxPrice) p.set('maxPrice', maxPrice);
        router.push(`/(public)/listings?${p.toString()}`);
    };
    return (
        <div className="bg-white rounded shadow p-4 flex flex-wrap gap-2 items-end">
            <input className="input" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} />
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
                <option value="">Type</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
            </select>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Category</option>
                <option value="house">House</option>
                <option value="flat">Flat</option>
                <option value="land">Land</option>
            </select>
            <input className="input" placeholder="Min price" value={minPrice} onChange={e => setMin(e.target.value)} />
            <input className="input" placeholder="Max price" value={maxPrice} onChange={e => setMax(e.target.value)} />
            <button className="btn" onClick={submit}>Apply</button>
            <style jsx>{`
        .input{padding:.5rem;border:1px solid #e5e7eb;border-radius:.5rem}
        .btn{padding:.5rem 1rem;background:#111827;color:white;border-radius:.5rem}
      `}</style>
        </div>
    );
}
