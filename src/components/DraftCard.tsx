import { CommunicateOutput } from "@/lib/schemas";

interface Props {
    draft: CommunicateOutput["drafts"][0];
}

export default function DraftCard({ draft }: Props) {
    return (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <svg className="w-16 h-16 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${draft.context === "combined"
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                        : "bg-slate-900 text-white"
                    }`}>
                    {draft.context}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-l border-slate-300 pl-3">
                    {draft.intent}
                </span>
                <div className="ml-auto text-xs font-medium text-slate-500 italic">
                    {draft.tone}
                </div>
            </div>

            {/* Draft Content */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">{draft.draft}</p>
            </div>

            {/* Key Changes */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Key Adjusments</h4>
                <div className="flex flex-wrap gap-2">
                    {draft.key_changes.map((change, i) => (
                        <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-[10px] uppercase font-bold shadow-sm">
                            {change}
                        </span>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(draft.draft);
                        // Optional: visual feedback
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    Copy Draft
                </button>
            </div>
        </div>
    );
}
