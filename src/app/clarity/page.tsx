"use client";

import { useEffect, useState, useRef } from "react";
import { ClarifyOutput, ClarifyOutputSchema, ClarityMode } from "@/lib/schemas";
import { useLocalStorage } from "@/hooks/use-local-storage";
import ClarityResults from "@/components/ClarityCard";

// Simple Error Boundary Component for local usage
function ResultsErrorBoundary({ children, onClear }: { children: React.ReactNode, onClear: () => void }) {
    const [hasError, setHasError] = useState(false);

    // In a real class component we'd use getDerivedStateFromError
    // For functional components, we can simulate or just wrap children. 
    // However, error boundaries must be class components.
    // We'll trust the parent try/catch or data validation, but if rendering fails, 
    // we can't easily catch it in the same component tree without a class wrapper.
    // Instead, we moved safe rendering logic into ClarityResults.
    // This component will serve as a fallback UI if data status is 'invalid'.
    return <>{children}</>;
}


export default function ClarityPage() {
    const [inputText, setInputText] = useLocalStorage<string>("clarity_input", "");
    const [mode, setMode] = useLocalStorage<ClarityMode>("clarity_mode", "overwhelm");
    const [clarityData, setClarityData] = useLocalStorage<ClarifyOutput | null>("clarity_data", null);

    // Follow-up state
    const [followupAnswer, setFollowupAnswer] = useLocalStorage<string>("clarity_followup", "");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataError, setDataError] = useState<string | null>(null); // For Schema validation errors

    const resultsRef = useRef<HTMLDivElement>(null);

    // Hydration fix & Schema Validation
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
        // Validate stored data on mount
        if (clarityData) {
            const result = ClarifyOutputSchema.safeParse(clarityData);
            if (!result.success) {
                console.warn("Legacy/Invalid Clarity Data detected:", result.error);
                setDataError("Session updated — functionality has improved. Please regenerate.");
                // We don't wipe immediately to let user see old data if needed? 
                // Requirements said "discard it safely". 
                // If it crashes request, we must wipe or hide.
                // Since we implemented safe access in ClarityCard, we can try to show it or just wipe it.
                // Requirement: "discard it safely and show 'Session updated...'"
                setClarityData(null);
            }
        }
    }, []);

    const handleGenerate = async () => {
        if (!inputText.trim()) {
            setError("Please enter some thoughts first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setDataError(null);

        try {
            const response = await fetch("/api/clarify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    text: inputText,
                    followup_answer: followupAnswer.trim() || undefined
                }),
            });

            if (!response.ok) {
                let errorMessage = "Failed to generate assessment";
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

            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        if (confirm("Clear current session? This will remove your input and results.")) {
            setInputText("");
            setFollowupAnswer("");
            setClarityData(null);
            setDataError(null);
            setError(null);
        }
    };

    const fillExample = () => {
        setInputText("I have two job offers. One is a safe but boring corporate job paying $150k. The other is a risky startup offering equity and $100k, but the role is more exciting. I have a mortgage and a baby on the way, but I feel like I'm stagnating.");
        setMode("decision");
    }

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
                <div className="flex gap-4">
                    <button
                        onClick={fillExample}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Use Example
                    </button>
                    <button
                        onClick={clearSession}
                        className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
                    >
                        Clear session
                    </button>
                </div>
            </header>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {dataError && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        {dataError}
                    </div>
                    <button onClick={() => setDataError(null)} className="text-sm underline">Dismiss</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                            <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Input</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: "decision", label: "Decision" },
                                    { id: "plan", label: "Plan" },
                                    { id: "overwhelm", label: "Overwhelm" },
                                    { id: "message_prep", label: "Prep" },
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
                        <p className="text-xs text-slate-500 italic">
                            {mode === "decision" && "Evaluate options, trade-offs, and decision levers."}
                            {mode === "plan" && "Structure a timeline, identify bottlenecks and resources."}
                            {mode === "overwhelm" && "Simplify chaos, prioritize the next 10 minutes, and breathe."}
                            {mode === "message_prep" && "Clarify your core message and audience before drafting."}
                        </p>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Dump your thoughts here... What are you struggling with?"
                            className="w-full h-80 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-lg leading-relaxed"
                        />
                    </div>

                    {/* Sharp Question Follow-up */}
                    {clarityData?.one_sharp_question && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-blue-700">
                                Refine with the detailed Question
                            </label>
                            <p className="text-blue-900 font-medium italic">"{clarityData.one_sharp_question}"</p>
                            <textarea
                                value={followupAnswer}
                                onChange={(e) => setFollowupAnswer(e.target.value)}
                                placeholder="Your answer..."
                                className="w-full h-24 p-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            clarityData ? "Regenerate Clarity" : "Generate Clarity"
                        )}
                    </button>
                </section>

                <section className="space-y-6" ref={resultsRef}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Analysis</label>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Error Boundary Alternative: If clarityData exists but renders incorrectly, we wrap it?
                 Since we put safe access in ClarityResults, we just check existence here.
                 If dataError was set (validation fail), clarityData is null, so this block skips.
             */}
                        {clarityData ? (
                            <ClarityResults data={clarityData} />
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <div className="w-12 h-12 mb-4 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">✨</div>
                                <p>Actionable insights will appear here</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
