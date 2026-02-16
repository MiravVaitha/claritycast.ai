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

    // Determine theme based on route
    const isDarkTheme = pathname === "/clarity" || pathname === "/communication";
    const navClass = isDarkTheme
        ? "glass-dark-nav !shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        : "glass-luminous !shadow-[0_20px_50px_rgba(31,38,135,0.1)]";

    const brandVariant = isDarkTheme ? "light" : "dark";
    const textBaseClass = isDarkTheme ? "text-white/90 hover:text-white" : "text-slate-600 hover:text-slate-900";
    const activeTextClass = isDarkTheme ? "text-white font-black" : "text-slate-950 font-black";
    const underlineClass = isDarkTheme ? "decoration-white/50" : "decoration-blue-500/30";

    return (
        <nav className="sticky top-0 z-50 px-4 py-4 md:px-8">
            <div className={`max-w-7xl mx-auto flex items-center justify-between px-6 h-16 ${navClass} transition-all duration-500`}>
                <BrandLogo size="nav" variant={brandVariant} />

                <div className="hidden md:flex items-center gap-8">
                    {[
                        { label: "Home", href: "/home" },
                        { label: "Clarity", href: "/clarity" },
                        { label: "Communication", href: "/communication" },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm tracking-tight transition-all hover:scale-105 ${pathname === item.href
                                    ? `${activeTextClass} underline ${underlineClass} underline-offset-4`
                                    : textBaseClass
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <button
                    onClick={handleLogout}
                    className={`text-sm font-bold transition-all hover:scale-105 ${isDarkTheme ? "text-white/70 hover:text-red-400" : "text-slate-600 hover:text-red-500"
                        }`}
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
