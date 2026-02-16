"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string;
    variant?: "default" | "amber" | "blue" | "indigo" | "rose" | "green" | "purple";
}

export default function CollapsibleSection({
    title,
    icon,
    children,
    defaultOpen = true,
    badge,
    variant = "default",
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const variants = {
        default: "glass-light",
        amber: "glass-light !bg-amber-50/95 !border-amber-400/40 text-amber-950 shadow-sm",
        blue: "glass-light !bg-blue-50/95 !border-blue-400/40 text-blue-950 shadow-sm",
        indigo: "glass-light !bg-indigo-50/95 !border-indigo-400/40 text-indigo-950 shadow-sm",
        rose: "glass-light !bg-rose-50/95 !border-rose-400/40 text-rose-950 shadow-sm",
        green: "glass-light !bg-green-50/95 !border-green-400/40 text-green-950 shadow-sm",
        purple: "glass-light !bg-purple-50/95 !border-purple-400/40 text-purple-950 shadow-sm",
    };

    const iconColors = {
        default: "text-slate-600",
        amber: "text-amber-800",
        blue: "text-blue-800",
        indigo: "text-indigo-800",
        rose: "text-rose-800",
        green: "text-green-800",
        purple: "text-purple-800",
    };

    return (
        <div className={`overflow-hidden transition-all duration-300 ${variants[variant]}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors hover:bg-black/5"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className={`${iconColors[variant]} transition-transform duration-300 ${isOpen ? '' : 'scale-110'}`}>{icon}</span>}
                    <div>
                        <h3 className="font-bold text-sm md:text-base uppercase tracking-wide">{title}</h3>
                        {badge && !isOpen && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 mt-1 inline-block">
                                {badge}
                            </span>
                        )}
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100 p-4 md:p-5 pt-0 border-t border-black/5" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
            >
                {children}
            </div>
        </div>
    );
}
