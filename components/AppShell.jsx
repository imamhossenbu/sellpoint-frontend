// components/AppShell.jsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppShell({ children }) {
    const pathname = usePathname();
    const isAdmin = pathname?.includes("dashboard");

    if (isAdmin) {
        // No Navbar/Footer for admin area
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />
        </>
    );
}
