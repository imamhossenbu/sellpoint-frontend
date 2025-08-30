'use client';
import useSWR from 'swr';
import ListingCard from './ListingCard';
import { api } from '../lib/api';

const fetcher = (url) => api.get(url).then(r => r.data);
export default function ListingGrid() {
    const { data } = useSWR('/listings', fetcher);
    const items = data?.items || [];
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(l => <ListingCard key={l._id} item={l} />)}
        </div>
    );
}
