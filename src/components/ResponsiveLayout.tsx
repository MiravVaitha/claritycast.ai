"use client";

import { useState, useEffect } from "react";

interface ResponsiveLayoutProps {
    leftContent: React.ReactNode;
    rightContent: React.ReactNode;
    hasResults: boolean;
    themeColor?: "blue" | "indigo";
}

export default function ResponsiveLayout({
    leftContent,
    rightContent,
    hasResults,
    themeColor = "blue",
}: ResponsiveLayoutProps) {
    const [activeTab, setActiveTab] = useState<"input" | "results">("input");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Automatically switch to results tab on mobile when hasResults becomes true
    useEffect(() => {
        if (isMobile && hasResults) {
            setActiveTab("results");
        }
    }, [hasResults, isMobile]);

    const activeColorClass = themeColor === "blue" ? "bg-blue-600" : "bg-indigo-600";

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
            {/* Mobile Tab Switcher */}
            {isMobile && (
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-2 flex gap-2">
                    <button
                        onClick={() => setActiveTab("input")}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "input"
                            ? `${activeColorClass} text-white shadow-md`
                            : "text-slate-500 hover:bg-slate-100"
                            }`}
                    >
                        Input
                    </button>
                    <button
                        onClick={() => setActiveTab("results")}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "results"
                            ? `${activeColorClass} text-white shadow-md`
                            : "text-slate-500 hover:bg-slate-100"
                            }`}
                    >
                        Results
                        {hasResults && !isMobile && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        )}
                    </button>
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
                {/* Left Column / Input Tab */}
                <section
                    className={`${isMobile ? (activeTab === "input" ? "block" : "hidden") : "lg:col-span-5"
                        } space-y-8`}
                >
                    {leftContent}
                </section>

                {/* Right Column / Results Tab */}
                <section
                    className={`${isMobile ? (activeTab === "results" ? "block" : "hidden") : "lg:col-span-7"
                        } lg:sticky lg:top-24 h-fit`}
                >
                    <div className="space-y-6">
                        {!isMobile && (
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${activeColorClass}`}></span>
                                <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    {themeColor === "blue" ? "Results" : "Drafts"}
                                </label>
                            </div>
                        )}
                        {rightContent}
                    </div>
                </section>
            </div>
        </div>
    );
}
