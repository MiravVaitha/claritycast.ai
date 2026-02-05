"use client";

import { useEffect, useState, useRef } from "react";
import { CommunicateOutput } from "@/lib/schemas";
import { useLocalStorage } from "@/hooks/use-local-storage";
import DraftCard from "@/components/DraftCard";
import { stableHash, getCachedResult, setCachedResult, clearExpiredCache } from "@/lib/aiCache";
import { apiClient, APIError } from "@/lib/api-client";

interface CommunicationStoredData {
    requestHash: string;
    result: CommunicateOutput;
}

interface RateLimitInfo {
    retryAfterSeconds: number;
    countdown: number;
}

export default function CommunicationPage() {
    const [inputText, setInputText] = useLocalStorage<string>("communication_input", "");

    type ContextType = "evaluative" | "technical" | "persuasive" | "personal";
    const [contexts, setContexts] = useLocalStorage<ContextType[]>("communication_contexts", []);

    const [intent, setIntent] = useLocalStorage<string>("communication_intent", "inform");
    const [options, setOptions] = useLocalStorage("communication_options", {
        preserveMeaning: true,
        concise: false,
        formal: false,
    });

    const [storedData, setStoredData] = useLocalStorage<CommunicationStoredData | null>("communication_stored_data", null);
    const [refiningAnswer, setRefiningAnswer] = useLocalStorage<string>("communication_refine_answer", "");

    const [draftsData, setDraftsData] = useState<CommunicateOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<any>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

    const resultsRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const hasHydrated = useRef(false);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Compute current base request hash (excluding refining answer)
    const computeBaseHash = async (textToHash: string, contextsToHash: string[], intentToHash: string, optionsToHash: any) => {
        return await stableHash({
            message: textToHash,
            contexts: contextsToHash,
            intent: intentToHash,
            options: optionsToHash
        });
    };

    // Clear expired cache on mount
    useEffect(() => {
        setIsClient(true);
        clearExpiredCache();
    }, []);

    // Initial hydration ONLY on mount
    useEffect(() => {
        setIsClient(true);
        clearExpiredCache();

        if (hasHydrated.current) return;

        const restore = async () => {
            if (!storedData) return;

            // Restore if hashes match
            const currentHash = await computeBaseHash(inputText, contexts, intent, options);
            if (storedData.requestHash === currentHash) {
                setDraftsData(storedData.result);
            }

            hasHydrated.current = true;
        };

        restore();
    }, []); // Run ONLY once on mount

    // Clear answer when inputs change
    useEffect(() => {
        if (!isClient || !draftsData || !storedData) return;

        const validate = async () => {
            const currentHash = await computeBaseHash(inputText, contexts, intent, options);
            if (storedData.requestHash !== currentHash) {
                setRefiningAnswer("");
            }
        };
        validate();
    }, [inputText, contexts, intent, options, isClient]);

    // Countdown timer for rate limit
    useEffect(() => {
        if (rateLimitInfo && rateLimitInfo.countdown > 0) {
            countdownIntervalRef.current = setInterval(() => {
                setRateLimitInfo(prev => {
                    if (!prev || prev.countdown <= 1) {
                        if (countdownIntervalRef.current) {
                            clearInterval(countdownIntervalRef.current);
                        }
                        return null;
                    }
                    return { ...prev, countdown: prev.countdown - 1 };
                });
            }, 1000);

            return () => {
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                }
            };
        }
    }, [rateLimitInfo]);

    const toggleContext = (val: ContextType) => {
        const isSelected = contexts.includes(val);
        if (isSelected) {
            setContexts(contexts.filter(c => c !== val));
        } else {
            setContexts([...contexts, val]);
        }
    };

    const handleGenerate = async (isRefining = false) => {
        if (!inputText.trim()) {
            setError("Please enter the message you want to communicate.");
            return;
        }
        if (contexts.length === 0) {
            setError("Please select at least one communication context.");
            return;
        }

        // Prevent concurrent requests
        if (isLoading) return;

        // Build request object
        const request = {
            message: inputText,
            contexts,
            intent: intent.toLowerCase(),
            options,
            refiningAnswer: isRefining ? refiningAnswer || undefined : undefined
        };

        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
        setRateLimitInfo(null);

        try {
            // Only use cache for fresh generations
            if (!isRefining) {
                const cacheKey = await stableHash(request);
                const cached = getCachedResult(cacheKey);

                if (cached) {
                    setDraftsData(cached.data);
                    const currentHash = await computeBaseHash(inputText, contexts, intent, options);
                    setStoredData({ requestHash: currentHash, result: cached.data });
                    setIsLoading(false);
                    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    return;
                }
            }

            // Make API call using apiClient
            const data = await apiClient<CommunicateOutput>("/api/communicate", request);

            // Success - store
            const currentHash = await computeBaseHash(inputText, contexts, intent, options);
            setStoredData({ requestHash: currentHash, result: data });
            setDraftsData(data);

            if (isRefining) {
                setRefiningAnswer(""); // Clear typed answer after successful refinement
            } else {
                setRefiningAnswer(""); // Clear on fresh generate too
            }

            // Cache base requests
            if (!isRefining) {
                const cacheKey = await stableHash(request);
                setCachedResult(cacheKey, data);
            }

            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        } catch (err: any) {
            const apiErr = err as APIError;
            if (apiErr.errorType === "RATE_LIMIT") {
                const retryAfter = apiErr.retryAfterSeconds || 60;
                setRateLimitInfo({ retryAfterSeconds: retryAfter, countdown: retryAfter });
                setError(apiErr.message);
            } else {
                setError(apiErr.message || "Failed to generate drafts");
                if (apiErr.debug || apiErr.details) setErrorDetails(apiErr.debug || apiErr.details);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        if (confirm("Clear current session? This will remove your input and results.")) {
            setInputText("");
            setDraftsData(null);
            setStoredData(null);
        }
    };

    const fillExample = () => {
        setInputText("I need to tell my boss that the project is delayed by 2 weeks because the backend team changed the API without telling us.");
        setContexts(["evaluative", "technical"]);
        setIntent("inform");
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
                        <span className="w-3 h-8 bg-indigo-600 rounded-full"></span>
                        Communication Engine
                    </h1>
                    <p className="text-slate-500 mt-2">Tailor your message for the right audience and intent.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fillExample}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
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

            {/* Rate Limit Banner */}
            {rateLimitInfo && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-amber-900 mb-1">Rate Limit Hit</h3>
                            <p className="text-amber-800 text-sm">
                                Gemini free-tier quota reached. Try again in <span className="font-bold text-lg">{rateLimitInfo.countdown}s</span> or enable billing to increase limits.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && !rateLimitInfo && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl relative overflow-hidden group">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-sm md:text-base">{error}</span>
                        </div>
                        <button
                            onClick={() => handleGenerate(false)}
                            className="flex-shrink-0 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            Try Again
                        </button>
                    </div>
                    {errorDetails && (
                        <details className="mt-3 text-[10px] md:text-xs">
                            <summary className="cursor-pointer font-semibold opacity-70 hover:opacity-100 transition-opacity">Technical Details</summary>
                            <pre className="mt-2 p-3 bg-red-100/50 rounded-lg overflow-x-auto border border-red-200/50">
                                {JSON.stringify(errorDetails, null, 2)}
                            </pre>
                        </details>
                    )}
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
                                { id: "evaluative", label: "Evaluative", sub: "Recruiter/Boss" },
                                { id: "technical", label: "Technical", sub: "Engineer/Teammate" },
                                { id: "persuasive", label: "Persuasive", sub: "Customer/Invest." },
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
                            {["inform", "persuade", "explain", "apologise"].map((i) => (
                                <option key={i} value={i} className="capitalize">{i}</option>
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
                        onClick={() => handleGenerate(false)}
                        disabled={isLoading || contexts.length === 0 || rateLimitInfo !== null}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Generating...
                            </>
                        ) : rateLimitInfo ? (
                            `Retry in ${rateLimitInfo.countdown}s`
                        ) : (
                            draftsData ? "Regenerate Drafts" : "Generate Drafts"
                        )}
                    </button>
                </section>

                <section className="lg:col-span-8 space-y-6" ref={resultsRef}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Drafts</label>
                    </div>

                    {/* Refining Question Display */}
                    {draftsData?.refining_question && (
                        <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 space-y-4">
                            <div className="flex gap-3">
                                <div className="p-2 bg-white rounded-lg h-fit text-indigo-600 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800">Refining Question</h3>
                                    <p className="text-indigo-900 font-medium italic">"{draftsData.refining_question}"</p>
                                    <p className="text-indigo-600/70 text-xs text-balance">Answering this helps create more accurate drafts.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <textarea
                                    value={refiningAnswer}
                                    onChange={(e) => setRefiningAnswer(e.target.value)}
                                    placeholder="Your answer..."
                                    className="w-full h-24 p-4 bg-white border border-indigo-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none text-sm"
                                />
                                <button
                                    onClick={() => handleGenerate(true)}
                                    disabled={isLoading || !refiningAnswer.trim()}
                                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                                >
                                    {isLoading ? "Refining..." : "Refine drafts"}
                                </button>
                            </div>
                        </div>
                    )}

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
