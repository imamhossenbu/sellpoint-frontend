'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export default function NotificationBell() {
    const { user } = useAuth();
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!user) return;
        const socket = io(process.env.NEXT_PUBLIC_API_BASE.replace('/api', ''), { auth: { userId: user.id } });
        socket.on('notification', () => setCount(c => c + 1));
        return () => socket.close();
    }, [user]);
    return <div className="relative">
        <span>🔔</span>
        {count > 0 && <span className="absolute -top-2 -right-2 text-xs bg-red-600 text-white rounded-full px-1">{count}</span>}
    </div>;
}
