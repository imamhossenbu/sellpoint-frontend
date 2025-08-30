// app/layout.jsx
export const metadata = { title: 'SellPoint', description: 'Paid real estate classifieds' };
import './globals.css';
import Toaster from '../components/Toaster';
import { AuthProvider } from '../context/AuthContext';
import AppShell from '@/components/AppShell';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
