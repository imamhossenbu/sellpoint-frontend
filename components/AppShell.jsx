// components/AppShell.jsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Loading from "./Loading";
import { useAuthCtx } from "@/context/AuthContext";

export default function AppShell({ children }) {
    const { ready } = useAuthCtx();
    if (!ready) return <Loading />;

    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/dashboard");

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-[100dvh]">
            <Navbar />
            <main style={{ minHeight: "calc(100dvh - 300px)" }}>
                {children}
            </main>
            <Footer />
        </div>
    );
}
