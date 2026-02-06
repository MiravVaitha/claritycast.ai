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
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <BrandLogo size="nav" />

                <div className="hidden md:flex items-center gap-8">
                    <Link href="/home" className={`text-sm font-medium transition-colors ${pathname === '/home' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Home</Link>
                    <Link href="/clarity" className={`text-sm font-medium transition-colors ${pathname === '/clarity' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Clarity</Link>
                    <Link href="/communication" className={`text-sm font-medium transition-colors ${pathname === '/communication' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Communication</Link>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
