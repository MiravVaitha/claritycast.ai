import { useState } from "react";
import { CommunicateOutput } from "@/lib/schemas";

interface Props {
    draft: CommunicateOutput["drafts"][0];
    defaultOpen?: boolean;
}

export default function DraftCard({ draft, defaultOpen = true }: Props) {
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(draft.draft);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <div
            className={`glass-light !rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${isOpen ? 'p-6 hover:-translate-y-0.5' : 'p-4 cursor-pointer hover:bg-black/5'}`}
            onClick={() => !isOpen && setIsOpen(true)}
        >
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <svg className="w-16 h-16 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
            </div>

            {/* Header */}
            <div
                className={`flex items-center gap-3 ${isOpen ? 'mb-4' : ''} transition-all`}
                onClick={(e) => {
                    if (isOpen) {
                        e.stopPropagation();
                        setIsOpen(false);
                    }
                }}
            >
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${draft.context === "combined"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-slate-900 text-white"
                    }`}>
                    {draft.context}
                </span>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-l border-slate-300 pl-3">
                    {draft.intent}
                </span>
                <div className="ml-auto flex items-center gap-3">
                    <div className="text-[10px] font-bold text-slate-500 italic uppercase tracking-wider">
                        {draft.tone}
                    </div>
                    <svg
                        className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Collapsible Content */}
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                {/* Draft Content */}
                <div className="p-5 bg-white/40 rounded-xl border border-white/20 mb-4 group-hover:bg-white/60 transition-colors">
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium text-sm md:text-base">{draft.draft}</p>
                </div>

                {/* Key Changes */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Key Adjustments</h4>
                    <div className="flex flex-wrap gap-2">
                        {draft.key_changes.map((change, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white/60 border border-white/40 text-slate-700 rounded-lg text-[10px] uppercase font-bold shadow-sm transition-colors hover:bg-white/90">
                                {change}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleCopy}
                        className={`text-xs font-bold transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${copied
                            ? "text-green-600 border-green-200 bg-green-50"
                            : "text-indigo-600 border-transparent hover:bg-indigo-50 active:scale-95"
                            }`}
                        aria-live="polite"
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy Draft
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

