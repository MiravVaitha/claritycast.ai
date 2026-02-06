"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import BrandLogo from "./BrandLogo";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        if (confirm("Are you sure you want to logout? Locally stored data will be preserved.")) {
            router.push("/");
        }
    };

    if (pathname === "/") return null;

    return (
        <nav className="sticky top-0 z-50 px-4 py-4 md:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16 glass-light !bg-white/35 !rounded-2xl !border-white/15 !shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <BrandLogo size="nav" />

                <div className="hidden md:flex items-center gap-8">
                    <Link href="/home" className={`text-sm font-bold transition-all hover:scale-105 ${pathname === '/home' ? 'text-slate-900' : 'text-slate-600/80 hover:text-slate-900'}`}>Home</Link>
                    <Link href="/clarity" className={`text-sm font-bold transition-all hover:scale-105 ${pathname === '/clarity' ? 'text-slate-900' : 'text-slate-600/80 hover:text-slate-900'}`}>Clarity</Link>
                    <Link href="/communication" className={`text-sm font-bold transition-all hover:scale-105 ${pathname === '/communication' ? 'text-slate-900' : 'text-slate-600/80 hover:text-slate-900'}`}>Communication</Link>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-sm font-bold text-slate-500 hover:text-red-500 transition-all hover:scale-105"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
