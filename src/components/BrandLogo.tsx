"use client";

import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
    size?: "nav" | "auth" | "hero";
    showText?: boolean;
}

export default function BrandLogo({ size = "nav", showText = true }: BrandLogoProps) {
    // Sizing mapping
    const sizes = {
        nav: {
            img: 32,
            text: "text-xl",
            gap: "gap-2.5"
        },
        auth: {
            img: 48,
            text: "text-4xl",
            gap: "gap-4"
        },
        hero: {
            img: 48,
            text: "text-4xl",
            gap: "gap-4"
        }
    };

    const current = sizes[size];

    return (
        <Link
            href="/home"
            className={`flex items-center ${current.gap} group transition-transform active:scale-95 leading-none cursor-pointer`}
        >
            <div className="relative">
                <Image
                    src="/claritycast-logo.png"
                    alt="ClarityCast Logo"
                    width={current.img * 2} // Higher quality source
                    height={current.img * 2}
                    style={{ height: `${current.img}px`, width: 'auto' }}
                    className="object-contain hover:opacity-90 transition-opacity"
                    priority
                />
            </div>
            {showText && (
                <span className={`font-bold ${current.text} text-slate-600 tracking-tight leading-none h-fit`}>
                    ClarityCast
                </span>
            )}
        </Link>
    );
}
