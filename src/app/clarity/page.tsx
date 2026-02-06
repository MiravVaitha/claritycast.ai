"use client";

import { useEffect, useState, useRef } from "react";
import { ClarifyOutput, ClarifyOutputSchema, ClarityMode } from "@/lib/schemas";
import { useLocalStorage } from "@/hooks/use-local-storage";
import ClarityResults from "@/components/ClarityCard";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import CollapsibleSection from "@/components/CollapsibleSection";
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
        id: "startup-pivot",
        label: "Startup Pivot",
        mode: "plan",
        inputText: "Our social media app isn't gaining traction with teens as expected, but high-end interior designers are using it for mood boards. We need to pivot the entire product strategy to serve this new niche in 30 days."
    },
];

export default function ClarityPage() {
    const [inputText, setInputText] = useLocalStorage<string>("clarity_input", "");
    const [mode, setMode] = useLocalStorage<ClarityMode>("clarity_mode", "overwhelm");
    const [storedData, setStoredData] = useLocalStorage<ClarityStoredData | null>("clarity_stored_data", null);
    const [followupAnswer, setFollowupAnswer] = useLocalStorage<string>("clarity_followup", "");

    const [clarityData, setClarityData] = useState<ClarifyOutput | null>(null);
    const [lastExampleId, setLastExampleId] = useLocalStorage<string | null>("clarity_last_example_id", null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

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

    // Initial hydration ONLY on mount
    useEffect(() => {
        setIsClient(true);
        clearExpiredCache();

        if (hasHydrated.current) return;

        const restore = async () => {
            if (!storedData) return;
            const currentHash = await computeBaseHash(inputText, mode);
            if (storedData.requestHash === currentHash) {
                setClarityData(storedData.result);
            }
            hasHydrated.current = true;
        };

        restore();
    }, [inputText, mode, storedData]);

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

    // Countdown timer for rate limit
    useEffect(() => {
        if (rateLimitInfo && rateLimitInfo.countdown > 0) {
            countdownIntervalRef.current = setInterval(() => {
                setRateLimitInfo(prev => {
                    if (!prev || prev.countdown <= 1) {
                        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                        return null;
                    }
                    return { ...prev, countdown: prev.countdown - 1 };
                });
            }, 1000);
            return () => {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
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
        setRateLimitInfo(null);

        try {
            if (!isRefining) {
                const cacheKey = await stableHash(request);
                const cached = getCachedResult(cacheKey);
                if (cached) {
                    setClarityData(cached.data);
                    const currentHash = await computeBaseHash(inputText, mode);
                    setStoredData({ requestHash: currentHash, result: cached.data });
                    setIsLoading(false);
                    return;
                }
            }

            const data = await apiClient<ClarifyOutput>("/api/clarify", request);
            const currentHash = await computeBaseHash(inputText, mode);
            setStoredData({ requestHash: currentHash, result: data });
            setClarityData(data);
            setFollowupAnswer("");

            if (!isRefining) {
                const cacheKey = await stableHash(request);
                setCachedResult(cacheKey, data);
            }
        } catch (err: any) {
            const apiErr = err as APIError;
            if (apiErr.errorType === "RATE_LIMIT") {
                const retryAfter = apiErr.retryAfterSeconds || 60;
                setRateLimitInfo({ retryAfterSeconds: retryAfter, countdown: retryAfter });
                setError(apiErr.message);
            } else {
                setError(apiErr.message || "Failed to generate clarity assessment");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        if (typeof window !== "undefined" && window.confirm("Clear current session?")) {
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
        setClarityData(null);
        setStoredData(null);
        setFollowupAnswer("");
        setError(null);
        setInputText(randomExample.inputText);
        setMode(randomExample.mode);
        setLastExampleId(randomExample.id);
    };

    if (!isClient) return null;

    const leftContent = (
        <div className="space-y-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <span className="w-2 md:w-3 h-8 bg-blue-600 rounded-full"></span>
                    Clarity Engine
                </h1>
                <p className="text-slate-500 text-sm md:text-base">Cut through the noise. Get strategic clarity.</p>
            </header>

            {/* Inputs in Accordion for Mobile */}
            <div className="lg:hidden">
                <CollapsibleSection title="Settings" variant="blue" defaultOpen={!clarityData}>
                    <div className="space-y-6 pt-2">
                        {/* Mode Selection */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "decision" as ClarityMode, label: "Decision", icon: "⚖️" },
                                    { id: "plan" as ClarityMode, label: "Plan", icon: "📋" },
                                    { id: "overwhelm" as ClarityMode, label: "Overwhelm", icon: "🌊" },
                                    { id: "message_prep" as ClarityMode, label: "Prep", icon: "🎯" },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`p-3 text-left rounded-xl border transition-all ${mode === m.id
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{m.icon}</span>
                                            <span className="font-bold text-xs uppercase tracking-wider">{m.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Thoughts</label>
                                <button onClick={fillExample} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Use Example</button>
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Unpack your brain here..."
                                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all resize-none text-sm leading-relaxed"
                            />
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            {/* Desktop Inputs (Not collapsed) */}
            <div className="hidden lg:block space-y-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: "decision" as ClarityMode, label: "Decision", icon: "⚖️", desc: "Compare" },
                            { id: "plan" as ClarityMode, label: "Plan", icon: "📋", desc: "Execution" },
                            { id: "overwhelm" as ClarityMode, label: "Overwhelm", icon: "🌊", desc: "Triage" },
                            { id: "message_prep" as ClarityMode, label: "Prep", icon: "🎯", desc: "Strategy" },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`p-4 text-left rounded-2xl border transition-all ${mode === m.id
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                                    }`}
                            >
                                <span className="text-xl block mb-1">{m.icon}</span>
                                <span className="font-bold text-xs uppercase tracking-wider">{m.label}</span>
                                <p className={`text-[10px] ${mode === m.id ? "text-blue-100" : "text-slate-400"}`}>{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Thoughts</label>
                        <button onClick={fillExample} className="text-[10px] font-bold text-blue-600 uppercase hover:underline flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Use Example
                        </button>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Unpack your brain here..."
                        className="w-full h-64 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none text-base leading-relaxed"
                    />
                </div>
            </div>

            <div className="space-y-3">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}
                <button
                    onClick={() => handleGenerate(false)}
                    disabled={isLoading || !!rateLimitInfo}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    {isLoading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Processing...
                        </>
                    ) : rateLimitInfo ? (
                        `Cooldown: ${rateLimitInfo.countdown}s`
                    ) : (
                        clarityData ? "Regenerate Clarity" : "Generate Clarity"
                    )}
                </button>
                {clarityData && (
                    <button onClick={clearSession} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                        Reset Session
                    </button>
                )}
            </div>
        </div>
    );

    const rightContent = (
        <div className="space-y-6">
            {clarityData ? (
                <>
                    <ClarityResults data={clarityData} />

                    {/* Refining Question Card */}
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white p-2 rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                            </div>
                            <h3 className="font-bold text-blue-900 text-xs uppercase tracking-wider">Want to go deeper?</h3>
                        </div>
                        <p className="text-blue-900 font-medium italic text-sm">&quot;{clarityData.one_sharp_question}&quot;</p>
                        <div className="space-y-3">
                            <textarea
                                value={followupAnswer}
                                onChange={(e) => setFollowupAnswer(e.target.value)}
                                placeholder="Your answer..."
                                className="w-full h-24 p-4 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none text-sm placeholder:text-blue-300"
                            />
                            <button
                                onClick={() => handleGenerate(true)}
                                disabled={isLoading || !followupAnswer.trim()}
                                className="w-full py-3 bg-white text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all text-xs uppercase tracking-widest shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? "Refining..." : "Refine Assessment"}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 mb-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-sm">⚡</div>
                    <h3 className="font-bold text-slate-900 mb-2">Ready for Clarity?</h3>
                    <p className="text-slate-500 text-sm max-w-xs">Enter your thoughts on the left to generate a strategic breakdown.</p>
                </div>
            )}
        </div>
    );

    return (
        <ResponsiveLayout
            leftContent={leftContent}
            rightContent={rightContent}
            hasResults={!!clarityData}
            themeColor="blue"
        />
    );
}
