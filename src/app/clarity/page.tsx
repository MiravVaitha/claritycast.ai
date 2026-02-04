"use client";

import { useEffect, useState } from "react";
import { ClarifyOutput, ClarityMode, ClarityCard as ClarityCardType } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import ClarityCard from "@/components/ClarityCard";

export default function ClarityPage() {
    const [inputText, setInputText] = useLocalStorage<string>("clarity_input", "");
    const [mode, setMode] = useLocalStorage<ClarityMode>("clarity_mode", "brain_dump");
    const [clarityData, setClarityData] = useLocalStorage<ClarifyOutput | null>("clarity_data", null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hydration fix for localStorage
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    const handleGenerate = async () => {
        if (!inputText.trim()) {
            setError("Please enter some thoughts first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/clarify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode, text: inputText }),
            });

            if (!response.ok) {
                let errorMessage = "Failed to generate clarity cards";
                try {
                    const errData = await response.json();
                    errorMessage = errData.error || errorMessage;
                } catch {
                    const textError = await response.text();
                    errorMessage = textError.substring(0, 100) || "Internal Server Error";
                }
                throw new Error(`${response.status} – ${errorMessage}`);
            }

            const data = await response.json();
            setClarityData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        if (confirm("Clear current session? This will remove your input and results.")) {
            setInputText("");
            setClarityData(null);
        }
    };

    const clarityCards: ClarityCardType[] = clarityData ? [
        { id: 'summary', title: 'Summary', content: clarityData.summary },
        { id: 'priority', title: 'Priority', content: clarityData.priorities[0] },
        { id: 'risk', title: 'Key Risk', content: `${clarityData.risks[0].risk} (${clarityData.risks[0].likelihood})` },
        { id: 'question', title: 'Key Question', content: clarityData.key_question },
    ] : [];

    if (!isClient) {
        return (
            <div className="min-h-screen p-8 md:p-12 max-w-7xl mx-auto flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 md:p-12 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <span className="w-3 h-8 bg-blue-600 rounded-full"></span>
                        Clarity Engine
                    </h1>
                    <p className="text-slate-500 mt-2">Structure your chaotic thoughts into clear action items.</p>
                </div>
                <button
                    onClick={clearSession}
                    className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
                >
                    Clear session
                </button>
            </header>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Input</label>
                            <div className="flex gap-2">
                                {[
                                    { id: "decision", label: "Decision" },
                                    { id: "plan", label: "Plan" },
                                    { id: "brain_dump", label: "Brain Dump" },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id as ClarityMode)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === m.id
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Dump your thoughts here..."
                            className="w-full h-96 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-lg leading-relaxed"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {isLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                        Generate Insights
                    </button>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Results</label>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {clarityCards.length > 0 ? (
                            clarityCards.map((card) => (
                                <ClarityCard key={card.id} card={card} />
                            ))
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <div className="w-12 h-12 mb-4 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">✨</div>
                                <p>Insights will appear here</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
