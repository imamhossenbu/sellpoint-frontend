# Frontend — SellPoint

## Overview
A fast, clean, and mobile-friendly frontend for **SellPoint — Paid Real‑Estate Classifieds**.  
Built with **Next.js (App Router)** and **React**, styled with **Tailwind CSS**, and wired to the backend via REST and Socket.IO for realtime chat and notifications.

**Live URL:** https://sell-point.netlify.app

---

## Features
- Property browsing with advanced search and filters
- Listing pages with galleries and details
- Buyer tools: wishlist, recent views, share
- Seller console: add, edit, publish listings
- Realtime chat (buyer ↔ seller), notifications
- Reviews, testimonials, blog, newsletter opt‑in
- Polished UX: loading states, skeletons, toasts, error pages

---

## Tech Stack
- **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS 4**
- **SWR + Axios** (data fetching and caching)
- **Framer Motion** (animations), **Recharts** (charts)
- **SweetAlert2**, **socket.io-client**
- **Cloudinary** (optional image hosting)

---

## Setup

### Prerequisites
- Node.js 18+
- Running backend API with CORS enabled
- Cloudinary account (optional)

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_JWT_STORAGE_KEY=sp_access_token
NEXT_PUBLIC_SOCKET_URL=https://api.your-domain.com

# Optional Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=unsigned_or_preset
```

### Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

---

## Structure
```
/app
  /dashboard
  /listing
/components
/lib
/styles
/public
```

---

## Deployment
- Host on Netlify (live at https://sell-point.netlify.app) or Vercel.  
- Ensure backend CORS allows deployed origin.  
- Use HTTPS in production.
