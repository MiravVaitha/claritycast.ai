"use client";

import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function Background() {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none isolate overflow-hidden">
            {/* The main animation layer */}
            <BackgroundGradientAnimation
                containerClassName="fixed inset-0"
                interactive={true}
            />
            {/* Scrim layer for contrast */}
            <div className="fixed inset-0 bg-slate-950/40 pointer-events-none" />

            {/* Vignette overlay */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 100%)"
                }}
            />
        </div>
    );
}
