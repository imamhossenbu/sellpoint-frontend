'use client';
import Link from 'next/link';

export default function ListingCard({ item }) {
    return (
        <Link href={`/(public)/listings/${item._id}`} className="block bg-white rounded shadow hover:shadow-md transition p-3">
            <div className="h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">Image</div>
            <div className="font-medium">{item.title}</div>
            <div className="text-sm text-gray-600">৳ {item.price} • {item.category} • {item.type}</div>
            <div className="text-xs text-gray-500">{item.address}</div>
        </Link>
    );
}
