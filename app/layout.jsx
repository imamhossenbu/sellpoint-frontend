// app/layout.jsx
export const metadata = { title: 'SellPoint', description: 'Paid real estate classifieds' };
import './globals.css';
import Toaster from '../components/Toaster';
import { AuthProvider } from '../context/AuthContext';
import AppShell from '@/components/AppShell';
import { Suspense } from "react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Suspense fallback={<div className="p-4">Loading dashboard…</div>}>
            <AppShell>{children}</AppShell>
          </Suspense>

          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
