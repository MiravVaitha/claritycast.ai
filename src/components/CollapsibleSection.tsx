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
        default: "bg-white border-slate-200 text-slate-900 shadow-sm",
        amber: "bg-amber-50 border-amber-200 text-amber-900",
        blue: "bg-blue-50 border-blue-200 text-blue-900",
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
        rose: "bg-rose-50 border-rose-200 text-rose-900",
        green: "bg-green-50 border-green-200 text-green-900",
        purple: "bg-purple-50 border-purple-200 text-purple-900",
    };

    const iconColors = {
        default: "text-slate-400",
        amber: "text-amber-600",
        blue: "text-blue-600",
        indigo: "text-indigo-600",
        rose: "text-rose-600",
        green: "text-green-600",
        purple: "text-purple-600",
    };

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${variants[variant]}`}>
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
