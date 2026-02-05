"use client";

import { useEffect, useState, useRef } from "react";
import { ClarifyOutput, ClarifyOutputSchema, ClarityMode } from "@/lib/schemas";
import { useLocalStorage } from "@/hooks/use-local-storage";
import ClarityResults from "@/components/ClarityCard";
import { stableHash, getCachedResult, setCachedResult, clearExpiredCache } from "@/lib/aiCache";
import { apiClient, APIError } from "@/lib/api-client";

interface ClarityStoredData {
    requestHash: string;
    result: ClarifyOutput;
}

interface RateLimitInfo {
    retryAfterSeconds: number;
    countdown: number;
}

interface ClarityExample {
    id: string;
    label: string;
    mode: ClarityMode;
    inputText: string;
}

const CLARITY_EXAMPLES: ClarityExample[] = [
    {
        id: "burnout",
        label: "Burnout Triage",
        mode: "overwhelm",
        inputText: "I have 12 overlapping deadlines, my inbox is at 400 unread, two team members are out sick, and I'm supposed to present a strategy doc tomorrow that I haven't started. I feel paralyzed and don't know where to begin."
    },
    {
        id: "career-pivot",
        label: "Career Pivot",
        mode: "decision",
        inputText: "I've been a software engineer for 8 years but I'm feeling unfulfilled. I have an offer to move into Product Management at my current company, or I could take a senior dev role at a high-growth startup for more equity but higher risk."
    },
    {
        id: "project-launch",
        label: "Project Launch",
        mode: "plan",
        inputText: "We need to launch the new mobile app by October 1st. We have the design ready, but the backend is only 40% done, and we haven't started QA or the marketing campaign. We need a realistic path to hitting the date."
    },
    {
        id: "board-prep",
        label: "Board Presentation",
        mode: "message_prep",
        inputText: "I need to present our quarterly growth numbers to the board of directors. The numbers are mostly good, but we missed our churn target. I need to explain why this happened and what we are doing to fix it without losing their confidence."
    },
    {
        id: "relocation",
        label: "Relocation Choice",
        mode: "decision",
        inputText: "My partner got a dream job in Berlin. We currently live in New York where my career is thriving. I can work remotely, but I'll be in a different timezone from my team. Is it worth the move for our relationship vs my career momentum?"
    },
    {
        id: "startup-pivot",
        label: "Startup Pivot",
        mode: "plan",
        inputText: "Our social media app isn't gaining traction with teens as expected, but high-end interior designers are using it for mood boards. We need to pivot the entire product strategy to serve this new niche in 30 days."
    },
    {
        id: "work-conflict",
        label: "Team Tension",
        mode: "overwhelm",
        inputText: "The tension between the design and dev teams is reaching a breaking point. Every meeting ends in an argument about technical constraints. I'm spending 4 hours a day just mediating conflicts instead of doing my actual job."
    },
    {
        id: "interview-prep",
        label: "Interview Prep",
        mode: "message_prep",
        inputText: "I have an interview for a CTO position at a mid-sized fintech company. I need to be able to talk about my experience scaling infrastructure while also showing I understand the business side of risk and compliance."
    }
];

export default function ClarityPage() {
    const [inputText, setInputText] = useLocalStorage<string>("clarity_input", "");
    const [mode, setMode] = useLocalStorage<ClarityMode>("clarity_mode", "overwhelm");
    const [storedData, setStoredData] = useLocalStorage<ClarityStoredData | null>("clarity_stored_data", null);
    const [followupAnswer, setFollowupAnswer] = useLocalStorage<string>("clarity_followup", "");

    const [clarityData, setClarityData] = useState<ClarifyOutput | null>(null);
    const [lastExampleId, setLastExampleId] = useLocalStorage<string | null>("clarity_last_example_id", null);
    const [exampleHint, setExampleHint] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<any>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

    const resultsRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const hasHydrated = useRef(false);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Compute current base request hash (excluding followup answer)
    const computeBaseHash = async (textToHash: string, modeToHash: ClarityMode) => {
        return await stableHash({
            mode: modeToHash,
            text: textToHash
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

            // Load results first to see mode/text that generated them
            const validation = ClarifyOutputSchema.safeParse(storedData.result);
            if (!validation.success) {
                console.warn("Invalid stored Clarity data");
                setStoredData(null);
                setClarityData(null);
                return;
            }

            // Restore clarity data if hashes match
            const currentHash = await computeBaseHash(inputText, mode);
            if (storedData.requestHash === currentHash) {
                setClarityData(storedData.result);
            }

            hasHydrated.current = true;
        };

        restore();
    }, []); // Run ONLY once on mount

    // Clear answer when inputs change
    useEffect(() => {
        if (!isClient || !clarityData || !storedData) return;

        const validate = async () => {
            const currentHash = await computeBaseHash(inputText, mode);
            if (storedData.requestHash !== currentHash) {
                setFollowupAnswer("");
            }
        };
        validate();
    }, [inputText, mode, isClient]);

    // Clear data when mode changes
    useEffect(() => {
        if (clarityData && clarityData.problem_type !== mode) {
            setClarityData(null);
            setStoredData(null);
            setFollowupAnswer("");
        }
    }, [mode]);

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

    const handleGenerate = async (isRefining = false) => {
        if (!inputText.trim()) {
            setError("Please enter some thoughts first.");
            return;
        }

        if (isLoading) return;

        const request = {
            mode,
            text: inputText,
            followup_answer: isRefining ? followupAnswer || undefined : undefined
        };

        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
        setRateLimitInfo(null);

        try {
            // Check cache (only for non-refining requests)
            if (!isRefining) {
                const cacheKey = await stableHash(request);
                const cached = getCachedResult(cacheKey);

                if (cached) {
                    setClarityData(cached.data);
                    const currentHash = await computeBaseHash(inputText, mode);
                    setStoredData({ requestHash: currentHash, result: cached.data });
                    setIsLoading(false);
                    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    return;
                }
            }

            const data = await apiClient<ClarifyOutput>("/api/clarify", request);

            // Success - store
            const currentHash = await computeBaseHash(inputText, mode);
            setStoredData({ requestHash: currentHash, result: data });
            setClarityData(data);

            if (isRefining) {
                setFollowupAnswer(""); // Clear typed answer after successful refinement
            } else {
                // If it's a fresh generation, we can clear the old answer if the question changed
                // Actually, let's always clear it on a fresh Generate
                setFollowupAnswer("");
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
                setError(apiErr.message || "Failed to generate clarity assessment");
                if (apiErr.debug || apiErr.details) setErrorDetails(apiErr.debug || apiErr.details);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        if (confirm("Clear current session? This will remove your input and results.")) {
            setInputText("");
            setClarityData(null);
            setStoredData(null);
            setFollowupAnswer("");
        }
    };

    const fillExample = () => {
        let available = CLARITY_EXAMPLES;
        if (lastExampleId) {
            available = CLARITY_EXAMPLES.filter(ex => ex.id !== lastExampleId);
        }

        const randomExample = available[Math.floor(Math.random() * available.length)];

        // Reset results/errors
        setClarityData(null);
        setStoredData(null);
        setFollowupAnswer("");
        setError(null);
        setErrorDetails(null);

        // Load example
        setInputText(randomExample.inputText);
        setMode(randomExample.mode);
        setLastExampleId(randomExample.id);
        setExampleHint(randomExample.label);
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
                        <span className="w-3 h-8 bg-blue-600 rounded-full"></span>
                        Clarity Engine
                    </h1>
                    <p className="text-slate-500 mt-2">Cut through the noise. Get strategic clarity.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end gap-1">
                        <button
                            onClick={fillExample}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Use Example
                        </button>
                        {exampleHint && (
                            <span className="text-[10px] text-blue-400 font-medium animate-in fade-in slide-in-from-right-1">
                                Loaded: {exampleHint}
                            </span>
                        )}
                    </div>
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
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: "decision" as ClarityMode, label: "Decision", icon: "⚖️", desc: "Compare options" },
                                { id: "plan" as ClarityMode, label: "Plan", icon: "📋", desc: "Execution steps" },
                                { id: "overwhelm" as ClarityMode, label: "Overwhelm", icon: "🌊", desc: "Triage & calm" },
                                { id: "message_prep" as ClarityMode, label: "Prep", icon: "🎯", desc: "Message structure" },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`p-3 text-left rounded-lg border transition-all ${mode === m.id
                                        ? "bg-blue-50 border-blue-600 ring-1 ring-blue-600"
                                        : "bg-white border-slate-200 hover:border-blue-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{m.icon}</span>
                                        <div className={`font-semibold text-sm ${mode === m.id ? "text-blue-900" : "text-slate-900"}`}>
                                            {m.label}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Your Thoughts</label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-base"
                        />
                    </div>

                    {clarityData?.one_sharp_question && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            <label className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                Refining Question
                            </label>
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-2">
                                <p className="text-blue-900 font-medium italic text-sm">"{clarityData.one_sharp_question}"</p>
                            </div>
                            <textarea
                                value={followupAnswer}
                                onChange={(e) => setFollowupAnswer(e.target.value)}
                                placeholder="Your answer..."
                                className="w-full h-24 p-4 bg-white border border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-sm"
                            />
                            <button
                                onClick={() => handleGenerate(true)}
                                disabled={isLoading || !followupAnswer.trim()}
                                className="w-full py-2.5 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                {isLoading ? "Refining..." : "Use answer to refine"}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isLoading || rateLimitInfo !== null}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Generating...
                            </>
                        ) : rateLimitInfo ? (
                            `Retry in ${rateLimitInfo.countdown}s`
                        ) : (
                            clarityData ? "Regenerate Clarity" : "Generate Clarity"
                        )}
                    </button>
                </section>

                <section className="lg:col-span-8 space-y-6" ref={resultsRef}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Results</label>
                    </div>

                    {clarityData ? (
                        <ClarityResults data={clarityData} />
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <div className="w-12 h-12 mb-4 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">💡</div>
                            <p>Your clarity assessment will appear here</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
