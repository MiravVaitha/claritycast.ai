"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export const BackgroundGradientAnimation = ({
    gradientBackgroundStart = "rgb(108, 0, 162)",
    gradientBackgroundEnd = "rgb(0, 17, 82)",
    firstColor = "18, 113, 255",
    secondColor = "221, 74, 255",
    thirdColor = "100, 220, 255",
    fourthColor = "200, 50, 50",
    fifthColor = "180, 180, 50",
    pointerColor = "140, 100, 255",
    size = "80%",
    blendingValue = "hard-light",
    interactive = true,
    containerClassName,
}: {
    gradientBackgroundStart?: string;
    gradientBackgroundEnd?: string;
    firstColor?: string;
    secondColor?: string;
    thirdColor?: string;
    fourthColor?: string;
    fifthColor?: string;
    pointerColor?: string;
    size?: string;
    blendingValue?: string;
    interactive?: boolean;
    containerClassName?: string;
}) => {
    const interactiveRef = useRef<HTMLDivElement>(null);

    // Refs for animation values to avoid re-renders
    const curX = useRef(0);
    const curY = useRef(0);
    const tgX = useRef(0);
    const tgY = useRef(0);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        document.body.style.setProperty("--gradient-background-start", gradientBackgroundStart);
        document.body.style.setProperty("--gradient-background-end", gradientBackgroundEnd);
        document.body.style.setProperty("--first-color", firstColor);
        document.body.style.setProperty("--second-color", secondColor);
        document.body.style.setProperty("--third-color", thirdColor);
        document.body.style.setProperty("--fourth-color", fourthColor);
        document.body.style.setProperty("--fifth-color", fifthColor);
        document.body.style.setProperty("--pointer-color", pointerColor);
        document.body.style.setProperty("--size", size);
        document.body.style.setProperty("--blending-value", blendingValue);
    }, [
        gradientBackgroundStart,
        gradientBackgroundEnd,
        firstColor,
        secondColor,
        thirdColor,
        fourthColor,
        fifthColor,
        pointerColor,
        size,
        blendingValue,
    ]);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            tgX.current = event.clientX;
            tgY.current = event.clientY;
        };

        const animate = () => {
            if (!interactiveRef.current) return;

            // Smoothen the follows
            curX.current = curX.current + (tgX.current - curX.current) / 20;
            curY.current = curY.current + (tgY.current - curY.current) / 20;

            // Adjust for center positioning logic of the gradient layer
            // Using translate3d for better GPU offloading
            interactiveRef.current.style.transform = `translate3d(${Math.round(curX.current)}px, ${Math.round(curY.current)}px, 0)`;

            requestRef.current = requestAnimationFrame(animate);
        };

        if (interactive) {
            window.addEventListener("mousemove", handleMouseMove);
            requestRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (interactive) {
                window.removeEventListener("mousemove", handleMouseMove);
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
            }
        };
    }, [interactive]);

    const [isSafari, setIsSafari] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [setIsSafari, setPrefersReducedMotion]);

    return (
        <div
            className={cn(
                "fixed inset-0 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
                containerClassName
            )}
        >
            <svg className="hidden">
                <defs>
                    <filter id="blurMe">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>

            <div
                className={cn(
                    "gradients-container h-full w-full blur-lg pointer-events-none overflow-hidden",
                    isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]",
                    prefersReducedMotion && "animate-none"
                )}
            >
                {!prefersReducedMotion && (
                    <>
                        <div
                            className={cn(
                                `absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)_no-repeat]`,
                                `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                                `[transform-origin:center_center]`,
                                `animate-first`,
                                `opacity-100`
                            )}
                        ></div>
                        <div
                            className={cn(
                                `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
                                `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                                `[transform-origin:calc(50%-400px)]`,
                                `animate-second`,
                                `opacity-100`
                            )}
                        ></div>
                        <div
                            className={cn(
                                `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
                                `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                                `[transform-origin:calc(50%+400px)]`,
                                `animate-third`,
                                `opacity-100`
                            )}
                        ></div>
                        <div
                            className={cn(
                                `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
                                `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                                `[transform-origin:calc(50%-200px)]`,
                                `animate-fourth`,
                                `opacity-70`
                            )}
                        ></div>
                        <div
                            className={cn(
                                `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
                                `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
                                `[transform-origin:calc(50%-800px)_calc(50%+800px)]`,
                                `animate-fifth`,
                                `opacity-100`
                            )}
                        ></div>
                    </>
                )}

                {interactive && !prefersReducedMotion && (
                    <div
                        ref={interactiveRef}
                        className={cn(
                            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]`,
                            `[mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2`,
                            `opacity-70 will-change-transform`
                        )}
                        style={{ transform: "translate3d(0, 0, 0)" }}
                    ></div>
                )}
            </div>
        </div>
    );
};
