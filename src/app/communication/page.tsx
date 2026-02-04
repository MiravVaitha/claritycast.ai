"use client";

import { useEffect, useState } from "react";
import { CommunicateOutput } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import DraftCard from "@/components/DraftCard";

export default function CommunicationPage() {
    const [inputText, setInputText] = useLocalStorage<string>("communication_input", "");

    // Renaming 'audience' to 'context' as per requirements
    type ContextType = "evaluative" | "technical" | "persuasive" | "personal";
    const [contexts, setContexts] = useLocalStorage<ContextType[]>("communication_contexts", []);

    const [intent, setIntent] = useLocalStorage<string>("communication_intent", "Inform");
    const [options, setOptions] = useLocalStorage("communication_options", {
        preserveMeaning: true,
        concise: false,
        formal: false,
    });

    const [draftsData, setDraftsData] = useLocalStorage<CommunicateOutput | null>("communication_data", null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hydration fix for localStorage
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    const toggleContext = (val: ContextType) => {
        const isSelected = contexts.includes(val);
        if (isSelected) {
            setContexts(contexts.filter(c => c !== val));
        } else {
            setContexts([...contexts, val]);
        }
    };

    const handleGenerate = async () => {
        if (!inputText.trim()) {
            setError("Please enter the message you want to communicate.");
            return;
        }
        if (contexts.length === 0) {
            setError("Please select at least one communication context.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Mocking clarity data structure for the communication API since we are bypassing the clarity step
            // The API expects `clarity` object. We will just pass the input text as the summary.
            const mockClarity = {
                summary: inputText,
                priorities: [],
                risks: [],
                key_question: ""
            };

            const response = await fetch("/api/communicate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clarity: mockClarity,
                    audiences: contexts, // Mapping contexts to audiences for the backend
                    intent: intent.toLowerCase(),
                    options,
                }),
            });

            if (!response.ok) {
                let errorMessage = "Failed to generate drafts";
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
            setDraftsData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        if (confirm("Clear current session? This will remove your input and results.")) {
            setInputText("");
            setDraftsData(null);
        }
    };

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
                        <span className="w-3 h-8 bg-indigo-600 rounded-full"></span>
                        Communication Engine
                    </h1>
                    <p className="text-slate-500 mt-2">Tailor your message for the right audience and intent.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <section className="lg:col-span-4 space-y-8">
                    <div className="space-y-4">
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Inputs</label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="What do you want to say?"
                            className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none text-base"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Context</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: "evaluative", label: "Evaluative", sub: "Recruiter/Interviewer" },
                                { id: "technical", label: "Technical", sub: "Engineer/Teammate" },
                                { id: "persuasive", label: "Persuasive", sub: "Customer/Stakeholder" },
                                { id: "personal", label: "Personal", sub: "Friend/Network" },
                            ].map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => toggleContext(c.id as ContextType)}
                                    className={`p-3 text-left rounded-lg border transition-all ${contexts.includes(c.id as ContextType)
                                            ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                                            : "bg-white border-slate-200 hover:border-indigo-300"
                                        }`}
                                >
                                    <div className={`font-semibold text-sm ${contexts.includes(c.id as ContextType) ? "text-indigo-900" : "text-slate-900"}`}>{c.label}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{c.sub}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Fine-tuning</label>
                        <select
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                            {["Inform", "Persuade", "Explain", "Apologise"].map((i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>

                        <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {[
                                { key: "preserveMeaning", label: "Preserve meaning" },
                                { key: "concise", label: "Concise" },
                                { key: "formal", label: "Formal" },
                            ].map((opt) => (
                                <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={(options as any)[opt.key]}
                                        onChange={() => setOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        {isLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                        Generate Drafts
                    </button>
                </section>

                <section className="lg:col-span-8 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Drafts</label>
                    </div>

                    <div className="space-y-4">
                        {draftsData && draftsData.drafts.length > 0 ? (
                            draftsData.drafts.map((draft, idx) => (
                                <DraftCard key={idx} draft={draft} />
                            ))
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <div className="w-12 h-12 mb-4 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">📝</div>
                                <p>Your drafts will appear here</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
