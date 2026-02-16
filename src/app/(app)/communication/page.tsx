"use client";

import { useEffect, useState, useRef } from "react";
import { CommunicateOutput } from "@/lib/schemas";
import { useLocalStorage } from "@/hooks/use-local-storage";
import DraftCard from "@/components/DraftCard";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import CollapsibleSection from "@/components/CollapsibleSection";
import { stableHash, getCachedResult, setCachedResult, clearExpiredCache } from "@/lib/aiCache";
import { apiClient, APIError } from "@/lib/api-client";
import ConfirmationModal from "@/components/ConfirmationModal";

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

const GlassSelect = ({ value, onChange, options, label }: { value: string, onChange: (val: string) => void, options: string[], label?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full h-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-full px-4 py-3 bg-white/80 border border-white/40 rounded-xl flex items-center justify-between text-sm font-black uppercase tracking-widest text-indigo-950 focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm hover:bg-white/100"
            >
                <span className="capitalize">{value}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 z-50 glass-luminous overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
                    <div className="py-1">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors ${value === opt ? "bg-indigo-600 text-white" : "text-slate-900 hover:bg-indigo-50"}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

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
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
            if (err.errorType === "RATE_LIMIT") {
                const retryAfter = err.retryAfterSeconds || 60;
                setRateLimitInfo({ retryAfterSeconds: retryAfter, countdown: retryAfter });
                setError(err.message);
            } else {
                setError(err.message || "Failed to generate drafts");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearSession = () => {
        setInputText("");
        setDraftsData(null);
        setStoredData(null);
        setIsResetModalOpen(false);
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-bg-heading flex items-center gap-3">
                    <span className="w-2 md:w-3 h-8 bg-indigo-600 rounded-full"></span>
                    Communication Engine
                </h1>
                <p className="text-on-bg-body text-sm md:text-base">Tailor your message for the right audience and intent.</p>
            </header>

            {/* Mobile Settings Accordion */}
            <div className="lg:hidden">
                <CollapsibleSection title="Settings" variant="indigo" defaultOpen={!draftsData}>
                    <div className="space-y-6 pt-2">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">The Message</label>
                                <button onClick={fillExample} className="text-[10px] font-bold text-indigo-400 uppercase hover:underline">Use Example</button>
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="What do you want to say?"
                                className="w-full h-32 p-4 bg-white/80 border border-white/40 rounded-2xl focus:ring-2 focus:ring-indigo-600 focus:bg-white/100 outline-none transition-all resize-none text-sm leading-relaxed text-slate-950 font-medium placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">Context</label>
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
                                        className={`p-3 text-center rounded-xl border transition-all font-black text-xs uppercase tracking-widest ${contexts.includes(c.id as ContextType)
                                            ? "bg-indigo-700 border-indigo-700 text-white shadow-md shadow-indigo-500/20"
                                            : "bg-white/80 border-white/40 text-slate-900 hover:bg-white/100"
                                            }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">Intent</label>
                                <div className="h-12">
                                    <GlassSelect
                                        value={intent}
                                        onChange={setIntent}
                                        options={["inform", "persuade", "explain", "apologise"]}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">Constraints</label>
                                <div className="flex flex-wrap gap-2 p-1.5 bg-black/5 rounded-xl border border-white/10">
                                    {[
                                        { key: "preserveMeaning", label: "Faithful" },
                                        { key: "concise", label: "Concise" },
                                        { key: "formal", label: "Formal" },
                                    ].map((opt) => (
                                        <label key={opt.key} className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 cursor-pointer group py-2 px-3 rounded-lg transition-all ${(options as any)[opt.key] ? 'bg-white border border-indigo-400 shadow-md scale-[1.02]' : 'bg-white/10 border border-white/10 hover:bg-white/20'}`}>
                                            <input
                                                type="checkbox"
                                                checked={(options as any)[opt.key]}
                                                onChange={() => setOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                                                className="w-4 h-4 rounded border-indigo-300 text-indigo-700 focus:ring-indigo-700"
                                            />
                                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${(options as any)[opt.key] ? 'text-indigo-900' : 'text-white group-hover:text-white/80'}`}>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            {/* Desktop Inputs */}
            <div className="hidden lg:block space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">The Message</label>
                        <button onClick={fillExample} className="text-[10px] font-bold text-indigo-400 hover:underline flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Use Example
                        </button>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter the raw message or thoughts you want to communicate..."
                        className="w-full p-6 bg-white/80 border-2 border-white/60 rounded-3xl text-slate-950 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white/100 outline-none transition-all min-h-[300px] font-bold text-base md:text-lg leading-relaxed shadow-sm"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">Audience Context</label>
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
                                    ? "bg-indigo-700 border-indigo-700 text-white shadow-xl shadow-indigo-500/30 scale-[1.02]"
                                    : "bg-white/80 border-white/50 text-slate-950 hover:bg-white/100 hover:border-white/60 shadow-sm"
                                    }`}
                            >
                                <span className="font-black text-xs uppercase tracking-widest block">{c.label}</span>
                                <span className={`text-[10px] font-bold ${contexts.includes(c.id as ContextType) ? "text-indigo-100" : "text-slate-600"}`}>{c.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">Intent</label>
                            <div className="h-12 w-full max-w-sm">
                                <GlassSelect
                                    value={intent}
                                    onChange={setIntent}
                                    options={["inform", "persuade", "explain", "apologise"]}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-on-bg-muted">Constraints</label>
                            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/10 w-full">
                                {[
                                    { key: "preserveMeaning", label: "Preserve meaning" },
                                    { key: "concise", label: "Concise" },
                                    { key: "formal", label: "Formal" },
                                ].map((opt) => (
                                    <label key={opt.key} className={`flex-1 flex items-center justify-center gap-3 cursor-pointer group py-3 px-4 rounded-xl transition-all ${(options as any)[opt.key] ? 'bg-white border border-indigo-400 shadow-lg scale-[1.02]' : 'bg-white/10 border border-white/10 hover:bg-white/20'}`}>
                                        <input
                                            type="checkbox"
                                            checked={(options as any)[opt.key]}
                                            onChange={() => setOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                                            className="w-4 h-4 rounded border-indigo-300 text-indigo-700 focus:ring-indigo-700"
                                        />
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${(options as any)[opt.key] ? 'text-indigo-950' : 'text-white group-hover:text-white/80'}`}>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
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
                    <button onClick={() => setIsResetModalOpen(true)} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                        Reset Session
                    </button>
                )}
            </div>

            <ConfirmationModal
                isOpen={isResetModalOpen}
                title="Reset session?"
                message="This will clear your current input, results, and refining questions."
                confirmLabel="Reset session"
                onConfirm={clearSession}
                onCancel={() => setIsResetModalOpen(false)}
                variant="destructive"
            />
        </div>
    );

    const rightContent = (
        <div className="space-y-6">
            {draftsData ? (
                <>
                    <div className="space-y-4">
                        {draftsData.drafts.map((draft, idx) => (
                            <DraftCard key={`${storedData?.requestHash}-${idx}`} draft={draft} defaultOpen={false} />
                        ))}
                    </div>

                    {/* Refining Question Card */}
                    <div className="p-6 glass-light !bg-indigo-50 !border-indigo-400/40 rounded-2xl shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-700 text-white rounded-lg flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">✨</div>
                            <h3 className="font-black text-indigo-950 uppercase tracking-widest text-[10px]">Help me refine</h3>
                        </div>
                        <p className="text-base font-black text-indigo-950 leading-relaxed italic">
                            &quot;{draftsData.refining_question}&quot;
                        </p>
                        <div className="space-y-3">
                            <textarea
                                value={refiningAnswer}
                                onChange={(e) => setRefiningAnswer(e.target.value)}
                                placeholder="Answer this question or add more context..."
                                className="w-full p-4 bg-white border-2 border-indigo-200 rounded-xl text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-400/60 min-h-[100px] text-indigo-950 font-bold"
                            />
                            <button
                                onClick={() => handleGenerate(true)}
                                disabled={isLoading || !refiningAnswer.trim()}
                                className="w-full py-3 bg-indigo-600 text-white border border-indigo-700 rounded-xl font-black hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest shadow-md disabled:bg-slate-300 disabled:opacity-50 active:scale-95"
                            >
                                {isLoading ? "Refining..." : "Update Drafts"}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 glass-light !bg-white/10 !border-dashed !border-white/20">
                    <div className="w-16 h-16 mb-6 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl shadow-sm">✍️</div>
                    <h3 className="font-bold text-white mb-2">Write with Impact</h3>
                    <p className="text-white/60 text-sm max-w-xs">Define your audience and message to see tailored drafts here.</p>
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
