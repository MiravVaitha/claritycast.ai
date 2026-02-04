import { DraftCard as DraftCardType } from "@/lib/types";
import { CommunicateOutput } from "@/lib/types";

interface Props {
    draft: CommunicateOutput["drafts"][0];
}

export default function DraftCard({ draft }: Props) {
    return (
        <div className="p-6 bg-slate-900 text-slate-50 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                <span className="capitalize">{draft.audience}</span>
                <span>•</span>
                <span className="capitalize">{draft.intent}</span>
            </div>
            <p className="text-base leading-relaxed font-medium mb-4 whitespace-pre-wrap">{draft.draft}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {draft.key_changes.map((change, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[9px] font-medium">
                        {change}
                    </span>
                ))}
            </div>
            <button
                onClick={() => {
                    navigator.clipboard.writeText(draft.draft);
                    // Optional: Show toast or feedback
                }}
                className="text-xs font-bold text-white underline-offset-4 hover:underline"
            >
                Copy Draft
            </button>
        </div>
    );
}
