import axios from 'axios';

export const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api`,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const t = localStorage.getItem('token');
        if (t) config.headers.Authorization = `Bearer ${t}`;
        else delete config.headers.Authorization;
    }
    return config;
});
