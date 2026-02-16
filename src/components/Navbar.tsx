"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";
import ConfirmationModal from "./ConfirmationModal";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        router.push("/");
    };

    if (pathname === "/") return null;

    return (
        <nav className="sticky top-0 z-50 px-4 py-4 md:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16 glass-luminous !shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                <BrandLogo size="nav" variant="light" />

                <div className="hidden md:flex items-center gap-8">
                    <Link href="/home" className={`text-sm font-bold transition-all hover:scale-105 ${pathname === '/home' ? 'text-slate-900 underline decoration-blue-500/30 underline-offset-4' : 'text-slate-600/90 hover:text-slate-900'}`}>Home</Link>
                    <Link href="/clarity" className={`text-sm font-bold transition-all hover:scale-105 ${pathname === '/clarity' ? 'text-slate-900 underline decoration-blue-500/30 underline-offset-4' : 'text-slate-600/90 hover:text-slate-900'}`}>Clarity</Link>
                    <Link href="/communication" className={`text-sm font-bold transition-all hover:scale-105 ${pathname === '/communication' ? 'text-slate-900 underline decoration-blue-500/30 underline-offset-4' : 'text-slate-600/90 hover:text-slate-900'}`}>Communication</Link>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-sm font-bold text-slate-600 hover:text-red-500 transition-all hover:scale-105"
                >
                    Logout
                </button>
            </div>

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                title="Log out?"
                message="Are you sure you want to log out? Locally stored data will be preserved."
                confirmLabel="Log out"
                onConfirm={confirmLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
                variant="destructive"
            />
        </nav>
    );
}
