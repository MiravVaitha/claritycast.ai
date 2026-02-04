"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
                <Link href="/home" className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">C</span>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">ClarityCast</span>
                </Link>

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
