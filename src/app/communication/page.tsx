"use client";

import { useEffect, useState, useRef } from "react";
import { CommunicateOutput } from "@/lib/schemas";
import { useLocalStorage } from "@/hooks/use-local-storage";
import DraftCard from "@/components/DraftCard";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import CollapsibleSection from "@/components/CollapsibleSection";
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

type ContextType = "evaluative" | "technical" | "persuasive" | "personal";
type IntentType = "inform" | "persuade" | "explain" | "apologise";

interface CommunicationExample {
    id: string;
    label: string;
    message: string;
    contexts: ContextType[];
    intent: IntentType;
    options: { preserveMeaning: boolean; concise: boolean; formal: boolean };
}

const COMMUNICATION_EXAMPLES: CommunicationExample[] = [
    {
        id: "server-delay",
        label: "Technical Delay",
        message: "The server migration is delayed by 3 days because we found some inconsistent database locks during the dry run. We're fixing it now.",
        contexts: ["technical", "evaluative"],
        intent: "inform",
        options: { preserveMeaning: true, concise: true, formal: true }
    },
    {
        id: "salary-negotiation",
        label: "Salary Increase",
        message: "I've been exceeding my targets for a year and taking on extra lead-dev responsibilities. I'd like to talk about adjusting my compensation to match the market rate and my impact.",
        contexts: ["evaluative", "persuasive"],
        intent: "persuade",
        options: { preserveMeaning: true, concise: false, formal: true }
    },
    {
        id: "product-pitch",
        label: "Feature Pitch",
        message: "We should add a Dark Mode to the app. Users have been asking for it in every survey, and it would reduce eye strain. It's a low effort for high satisfaction.",
        contexts: ["persuasive", "technical"],
        intent: "persuade",
        options: { preserveMeaning: true, concise: true, formal: false }
    },
];

export default function CommunicationPage() {
    const [inputText, setInputText] = useLocalStorage<string>("communication_input", "");
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
    const [lastExampleId, setLastExampleId] = useLocalStorage<string | null>("communication_last_example_id", null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

    const [isClient, setIsClient] = useState(false);
    const hasHydrated = useRef(false);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const computeBaseHash = async (textToHash: string, contextsToHash: string[], intentToHash: string, optionsToHash: any) => {
        return await stableHash({
            message: textToHash,
            contexts: contextsToHash,
            intent: intentToHash,
            options: optionsToHash
        });
    };

    useEffect(() => {
        setIsClient(true);
        clearExpiredCache();

        if (hasHydrated.current) return;
        const restore = async () => {
            if (!storedData) return;
            const currentHash = await computeBaseHash(inputText, contexts, intent, options);
            if (storedData.requestHash === currentHash) {
                setDraftsData(storedData.result);
            }
            hasHydrated.current = true;
        };
        restore();
    }, [inputText, contexts, intent, options, storedData]);

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

    const toggleContext = (val: ContextType) => {
        const isSelected = contexts.includes(val);
        if (isSelected) setContexts(contexts.filter(c => c !== val));
        else setContexts([...contexts, val]);
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

        if (isLoading) return;

        const request = {
            message: inputText,
            contexts,
            intent: intent.toLowerCase(),
            options,
            refiningAnswer: isRefining ? refiningAnswer || undefined : undefined
        };

        setIsLoading(true);
        setError(null);
        setRateLimitInfo(null);

        try {
            if (!isRefining) {
                const cacheKey = await stableHash(request);
                const cached = getCachedResult(cacheKey);
                if (cached) {
                    setDraftsData(cached.data);
                    const currentHash = await computeBaseHash(inputText, contexts, intent, options);
                    setStoredData({ requestHash: currentHash, result: cached.data });
                    setIsLoading(false);
                    return;
                }
            }

            const data = await apiClient<CommunicateOutput>("/api/communicate", request);
            const currentHash = await computeBaseHash(inputText, contexts, intent, options);
            setStoredData({ requestHash: currentHash, result: data });
            setDraftsData(data);
            setRefiningAnswer("");

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
                setError(apiErr.message || "Failed to generate drafts");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        if (typeof window !== "undefined" && window.confirm("Clear current session?")) {
            setInputText("");
            setDraftsData(null);
            setStoredData(null);
        }
    };

    const fillExample = () => {
        let available = COMMUNICATION_EXAMPLES;
        if (lastExampleId) {
            available = COMMUNICATION_EXAMPLES.filter(ex => ex.id !== lastExampleId);
        }
        const randomExample = available[Math.floor(Math.random() * available.length)];
        setDraftsData(null);
        setStoredData(null);
        setRefiningAnswer("");
        setError(null);
        setInputText(randomExample.message);
        setContexts(randomExample.contexts);
        setIntent(randomExample.intent);
        setOptions(randomExample.options);
        setLastExampleId(randomExample.id);
    };

    if (!isClient) return null;

    const leftContent = (
        <div className="space-y-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <span className="w-2 md:w-3 h-8 bg-indigo-600 rounded-full"></span>
                    Communication Engine
                </h1>
                <p className="text-slate-500 text-sm md:text-base">Tailor your message for the right audience and intent.</p>
            </header>

            {/* Mobile Settings Accordion */}
            <div className="lg:hidden">
                <CollapsibleSection title="Settings" variant="indigo" defaultOpen={!draftsData}>
                    <div className="space-y-6 pt-2">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">The Message</label>
                                <button onClick={fillExample} className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">Use Example</button>
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="What do you want to say?"
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none text-sm leading-relaxed"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Context</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "evaluative", label: "Evaluative" },
                                    { id: "technical", label: "Technical" },
                                    { id: "persuasive", label: "Persuasive" },
                                    { id: "personal", label: "Personal" },
                                ].map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => toggleContext(c.id as ContextType)}
                                        className={`p-3 text-center rounded-xl border transition-all font-bold text-xs uppercase tracking-wider ${contexts.includes(c.id as ContextType)
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                                            }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Intent & Tuning</label>
                            <select
                                value={intent}
                                onChange={(e) => setIntent(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium"
                            >
                                {["inform", "persuade", "explain", "apologise"].map((i) => (
                                    <option key={i} value={i} className="capitalize">{i}</option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                {[
                                    { key: "preserveMeaning", label: "Faithful" },
                                    { key: "concise", label: "Concise" },
                                    { key: "formal", label: "Formal" },
                                ].map((opt) => (
                                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={(options as any)[opt.key]}
                                            onChange={() => setOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <span className="text-[10px] font-bold uppercase text-indigo-900/60 group-hover:text-indigo-900 transition-colors uppercase tracking-widest">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            {/* Desktop Inputs */}
            <div className="hidden lg:block space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">The Message</label>
                        <button onClick={fillExample} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Use Example
                        </button>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="What do you want to say?"
                        className="w-full h-56 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none text-base leading-relaxed"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Audience Context</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: "evaluative", label: "Evaluative", desc: "Professional" },
                            { id: "technical", label: "Technical", desc: "Precise" },
                            { id: "persuasive", label: "Persuasive", desc: "Strategic" },
                            { id: "personal", label: "Personal", desc: "Casual" },
                        ].map((c) => (
                            <button
                                key={c.id}
                                onClick={() => toggleContext(c.id as ContextType)}
                                className={`p-4 text-left rounded-2xl border transition-all ${contexts.includes(c.id as ContextType)
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                                    }`}
                            >
                                <span className="font-bold text-xs uppercase tracking-wider block">{c.label}</span>
                                <span className={`text-[10px] ${contexts.includes(c.id as ContextType) ? "text-indigo-100" : "text-slate-400"}`}>{c.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Intent & Constraints</label>
                    <div className="flex gap-4">
                        <select
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-bold uppercase tracking-wider"
                        >
                            {["inform", "persuade", "explain", "apologise"].map((i) => (
                                <option key={i} value={i} className="capitalize">{i}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-4 px-4 bg-slate-50 border border-slate-200 rounded-xl">
                            {[
                                { key: "preserveMeaning", label: "Meaning" },
                                { key: "concise", label: "Concise" },
                                { key: "formal", label: "Formal" },
                            ].map((opt) => (
                                <label key={opt.key} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={(options as any)[opt.key]}
                                        onChange={() => setOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
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
                    disabled={isLoading || contexts.length === 0 || !!rateLimitInfo}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    {isLoading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Processing...
                        </>
                    ) : rateLimitInfo ? (
                        `Cooldown: ${rateLimitInfo.countdown}s`
                    ) : (
                        draftsData ? "Regenerate Drafts" : "Generate Drafts"
                    )}
                </button>
                {draftsData && (
                    <button onClick={clearSession} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                        Reset Session
                    </button>
                )}
            </div>
        </div>
    );

    const rightContent = (
        <div className="space-y-6">
            {draftsData ? (
                <>
                    {/* Refining Question Card */}
                    <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 text-white p-2 rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Help me refine</h3>
                        </div>
                        <p className="text-indigo-900 font-medium italic text-sm">&quot;{draftsData.refining_question}&quot;</p>
                        <div className="space-y-3">
                            <textarea
                                value={refiningAnswer}
                                onChange={(e) => setRefiningAnswer(e.target.value)}
                                placeholder="Your answer..."
                                className="w-full h-24 p-4 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none text-sm placeholder:text-indigo-300"
                            />
                            <button
                                onClick={() => handleGenerate(true)}
                                disabled={isLoading || !refiningAnswer.trim()}
                                className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all text-xs uppercase tracking-widest shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? "Refining..." : "Update Drafts"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {draftsData.drafts.map((draft, idx) => (
                            <DraftCard key={idx} draft={draft} />
                        ))}
                    </div>
                </>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 mb-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl shadow-sm">✍️</div>
                    <h3 className="font-bold text-slate-900 mb-2">Write with Impact</h3>
                    <p className="text-slate-500 text-sm max-w-xs">Define your audience and message to see tailored drafts here.</p>
                </div>
            )}
        </div>
    );

    return (
        <ResponsiveLayout
            leftContent={leftContent}
            rightContent={rightContent}
            hasResults={!!draftsData}
            themeColor="indigo"
        />
    );
}
