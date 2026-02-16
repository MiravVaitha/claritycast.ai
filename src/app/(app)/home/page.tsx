"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

export default function Home() {
    const router = useRouter();

    const handleQuickStart = (text: string, path: string) => {
        // We'll write to localStorage for the target page to pick up
        // This assumes the keys we use in those pages: 'clarity_input' or 'communication_input'
        if (typeof window !== "undefined") {
            const storageKey = path === "/clarity" ? "clarity_input" : "communication_input";
            // We need to match the structure that useLocalStorage assumes if it's just a string, 
            // but useLocalStorage wraps value in JSON.stringify? No, wait. 
            // The useLocalStorage hook: window.localStorage.setItem(key, JSON.stringify(valueToStore));
            // So here we need to store a JSON stringified string.
            window.localStorage.setItem(storageKey, JSON.stringify(text));
        }
        router.push(path);
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="py-20 px-8 text-center flex flex-col items-center">
                <div className="mb-8 flex justify-center">
                    <BrandLogo size="hero" variant="dark" />
                </div>
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-on-bg-heading">
                        Unblock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Thought Process</span>
                    </h1>
                    <p className="text-xl text-on-bg-body max-w-2xl mx-auto leading-relaxed font-medium">
                        ClarityCast helps you untangle complex thoughts and turn them into clear, effective communication for any audience.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
                        <Link
                            href="/clarity"
                            className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
                        >
                            Get Clarity
                        </Link>
                        <Link
                            href="/communication"
                            className="w-full sm:w-auto px-10 py-5 glass-light !bg-white/40 text-slate-900 border-white/40 rounded-2xl font-bold hover:bg-white/60 transition-all hover:scale-105 active:scale-95"
                        >
                            Draft Message
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sections Grid */}
            <section className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 glass-light !bg-white/70 !border-blue-400/30 rounded-3xl space-y-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-blue-500/30">💡</div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Get Clarity</h3>
                    <p className="text-slate-700 leading-relaxed text-sm font-semibold">
                        Stuck in analysis paralysis? Dump your raw thoughts, planning notes, or messy ideas. We'll verify the core problem, risks, and next steps for you.
                    </p>
                </div>
                <div className="p-8 glass-light !bg-white/70 !border-indigo-400/30 rounded-3xl space-y-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-indigo-500/30">📣</div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Communicate</h3>
                    <p className="text-slate-700 leading-relaxed text-sm font-semibold">
                        Need to send a high-stakes email? We transform your structured thoughts into tailored messages for recruiters, engineers, or stakeholders.
                    </p>
                </div>
                <div className="p-8 glass-light !bg-white/70 !border-rose-400/30 rounded-3xl space-y-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-rose-500/30">🚀</div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Take Action</h3>
                    <p className="text-slate-700 leading-relaxed text-sm font-semibold">
                        Stop overthinking and start doing. Move from "I don't know what to do" to "Here is the plan" in seconds.
                    </p>
                </div>
            </section>

            {/* Quick Start Examples */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-8">
                    <h2 className="text-3xl font-bold text-on-bg-heading mb-12 text-center uppercase tracking-widest text-sm font-bold">Jump Right In</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Clarity Example */}
                        <button
                            onClick={() => handleQuickStart("I have two job offers, one pays more but is boring, the other is exciting but risky. I don't know which to choose.", "/clarity")}
                            className="text-left p-8 glass-light !bg-white/70 !border-blue-400/30 hover:!bg-white/85 hover:!border-blue-400/50 hover:shadow-2xl transition-all duration-300 group rounded-3xl active:scale-[0.98] hover:-translate-y-1"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-3 block">Decision Strategy</span>
                            <p className="font-extrabold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors text-lg">"Weighing two job offers..."</p>
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium italic">One pays more but is boring, the other is exciting but risky...</p>
                        </button>

                        {/* Communication Example */}
                        <button
                            onClick={() => handleQuickStart("We are going to miss the deadline because the API isn't ready. We need 2 more days.", "/communication")}
                            className="text-left p-8 glass-light !bg-white/70 !border-indigo-400/30 hover:!bg-white/85 hover:!border-indigo-400/50 hover:shadow-2xl transition-all duration-300 group rounded-3xl active:scale-[0.98] hover:-translate-y-1"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-3 block">Status Update</span>
                            <p className="font-extrabold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors text-lg">"Missed deadline..."</p>
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium italic">We are going to miss the deadline because the API isn't ready...</p>
                        </button>

                        {/* Brain Dump Example */}
                        <button
                            onClick={() => handleQuickStart("My team is fighting about coding standards and it's slowing us down. I need to fix this cultural issue.", "/clarity")}
                            className="text-left p-8 glass-light !bg-white/70 !border-rose-400/30 hover:!bg-white/85 hover:!border-rose-400/50 hover:shadow-2xl transition-all duration-300 group rounded-3xl active:scale-[0.98] hover:-translate-y-1"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-3 block">Problem Solving</span>
                            <p className="font-extrabold text-slate-900 mb-2 group-hover:text-rose-700 transition-colors text-lg">"Team conflict..."</p>
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium italic">My team is fighting about coding standards and it's slowing us down...</p>
                        </button>

                    </div>
                </div>
            </section>
        </div>
    );
}
