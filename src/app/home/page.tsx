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
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="py-20 px-8 text-center bg-white border-b border-slate-100 flex flex-col items-center">
                <div className="mb-8 flex justify-center">
                    <BrandLogo size="hero" />
                </div>
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
                        Unblock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Thought Process</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        ClarityCast helps you untangle complex thoughts and turn them into clear, effective communication for any audience.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link
                            href="/clarity"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-105"
                        >
                            Get Clarity
                        </Link>
                        <Link
                            href="/communication"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-bold hover:border-slate-300 hover:bg-slate-50 transition-all"
                        >
                            Draft Message
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sections Grid */}
            <section className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-2xl mb-4">💡</div>
                    <h3 className="text-xl font-bold text-slate-900">Get Clarity</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Stuck in analysis paralysis? Dump your raw thoughts, planning notes, or messy ideas. We'll verify the core problem, risks, and next steps for you.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-2xl mb-4">📣</div>
                    <h3 className="text-xl font-bold text-slate-900">Communicate</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Need to send a high-stakes email? We transform your structured thoughts into tailored messages for recruiters, engineers, or stakeholders.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center text-2xl mb-4">🚀</div>
                    <h3 className="text-xl font-bold text-slate-900">Take Action</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Stop overthinking and start doing. Move from "I don't know what to do" to "Here is the plan" in seconds.
                    </p>
                </div>
            </section>

            {/* Quick Start Examples */}
            <section className="py-20 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Jump Right In</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Clarity Example */}
                        <button
                            onClick={() => handleQuickStart("I have two job offers, one pays more but is boring, the other is exciting but risky. I don't know which to choose.", "/clarity")}
                            className="text-left p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all group bg-slate-50 hover:bg-white"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Decision</span>
                            <p className="font-semibold text-slate-900 mb-2 group-hover:text-blue-700">"Weighing two job offers..."</p>
                            <p className="text-sm text-slate-500 line-clamp-2">One pays more but is boring, the other is exciting but risky...</p>
                        </button>

                        {/* Communication Example */}
                        <button
                            onClick={() => handleQuickStart("We are going to miss the deadline because the API isn't ready. We need 2 more days.", "/communication")}
                            className="text-left p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 transition-all group bg-slate-50 hover:bg-white"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2 block">Status Update</span>
                            <p className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-700">"Missed deadline..."</p>
                            <p className="text-sm text-slate-500 line-clamp-2">We are going to miss the deadline because the API isn't ready...</p>
                        </button>

                        {/* Brain Dump Example */}
                        <button
                            onClick={() => handleQuickStart("My team is fighting about coding standards and it's slowing us down. I need to fix this cultural issue.", "/clarity")}
                            className="text-left p-6 rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-50 transition-all group bg-slate-50 hover:bg-white"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2 block">Problem Solving</span>
                            <p className="font-semibold text-slate-900 mb-2 group-hover:text-rose-700">"Team conflict..."</p>
                            <p className="text-sm text-slate-500 line-clamp-2">My team is fighting about coding standards and it's slowing us down...</p>
                        </button>

                    </div>
                </div>
            </section>
        </div>
    );
}
