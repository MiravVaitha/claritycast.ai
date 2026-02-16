"use client";

import Link from "next/link";

interface BrandLogoProps {
    size?: "nav" | "auth" | "hero";
    showText?: boolean;
    variant?: "light" | "dark";
}

export default function BrandLogo({ size = "nav", showText = true, variant = "dark" }: BrandLogoProps) {
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
    const isLight = variant === "light";

    return (
        <Link
            href="/home"
            className={`flex items-center ${current.gap} group transition-transform active:scale-95 leading-none cursor-pointer bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0 rounded-lg`}
        >
            {/* 
                  variant="light": Inverted (White) | variant="dark": Standard (Dark)
                */}
            <img
                src="/claritycast-logo.png"
                alt="ClarityCast Logo"
                style={{
                    height: `${current.img}px`,
                    width: 'auto',
                    mixBlendMode: isLight ? 'screen' : (size === 'hero' ? 'normal' : 'multiply'),
                    filter: isLight
                        ? 'invert(1) grayscale(1) brightness(2)'
                        : size === 'hero'
                            ? 'sepia(100%) saturate(300%) hue-rotate(190deg) brightness(1.1) contrast(1.1)'
                            : 'brightness(1.2) contrast(1.2)'
                }}
                className={`block hover:opacity-90 transition-opacity ${size === 'hero'
                    ? 'drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]'
                    : ''
                    }`}
            />
            {showText && (
                <span
                    className={`font-bold ${current.text} ${isLight ? 'text-white' : 'text-[hsl(var(--brand-blue))]'
                        } tracking-tight leading-none h-fit ${size === 'hero'
                            ? 'drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]'
                            : ''
                        }`}
                >
                    ClarityCast
                </span>
            )}
        </Link>
    );
}
