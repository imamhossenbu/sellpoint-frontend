// app/layout.jsx
export const metadata = { title: 'SellPoint', description: 'Paid real estate classifieds' };
import './globals.css';
import Toaster from '../components/Toaster';
import { AuthProvider } from '../context/AuthContext';
import AppShell from '@/components/AppShell';
import Loading from '@/components/Loading'; // ← add
import { Suspense } from "react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <AppShell>{children}</AppShell>
          </Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
