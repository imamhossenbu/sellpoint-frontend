"use client";
import Skeleton from "react-loading-skeleton";

export default function Loading() {
    return (
        <div className="min-h-[40vh] flex flex-col items-center gap-6 py-10">
            <div className="w-full max-w-6xl px-6 space-y-6">
                {/* Page title + toolbar */}
                <div className="flex items-center justify-between gap-4">
                    <Skeleton height={28} width={240} />
                    <div className="flex items-center gap-3">
                        <Skeleton height={36} width={120} />
                        <Skeleton height={36} width={120} />
                    </div>
                </div>

                {/* Filters row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton height={40} />
                    <Skeleton height={40} />
                    <Skeleton height={40} />
                </div>

                {/* Card grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-gray-200 p-4">
                            <Skeleton height={160} className="mb-4" />
                            <Skeleton width="70%" className="mb-2" />
                            <Skeleton width="50%" />
                            <div className="mt-4 flex items-center justify-between">
                                <Skeleton width={80} height={32} />
                                <Skeleton width={100} height={32} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
