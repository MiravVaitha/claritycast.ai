import { ClarifyOutput } from "@/lib/schemas";

interface Props {
    data: ClarifyOutput;
}

export default function ClarityResults({ data }: Props) {
    // Safe access with fallbacks
    const hidden_assumptions = data.hidden_assumptions ?? [];
    const tradeoffs = data.tradeoffs ?? [];
    const decision_levers = data.decision_levers ?? [];
    const options = data.options ?? [];
    const next_steps = data.next_steps_14_days ?? [];
    const core_issue = data.core_issue || "Analysis unavailable.";
    const sharp_question = data.one_sharp_question || "No key question identified.";

    return (
        <div className="space-y-6">

            {/* Core Issue */}
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold uppercase text-xs tracking-wider">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Core Issue
                </div>
                <p className="text-blue-900 font-medium text-lg leading-relaxed">{core_issue}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hidden Assumptions */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="text-slate-400">#</span> Hidden Assumptions
                    </h3>
                    {hidden_assumptions.length > 0 ? (
                        <ul className="space-y-2">
                            {hidden_assumptions.map((item, i) => (
                                <li key={i} className="text-slate-600 text-sm leading-relaxed flex items-start gap-2">
                                    <span className="text-slate-300 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-xs italic">None identified.</p>
                    )}
                </div>

                {/* Trade-offs */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="text-slate-400">⇄</span> Trade-offs
                    </h3>
                    {tradeoffs.length > 0 ? (
                        <ul className="space-y-2">
                            {tradeoffs.map((item, i) => (
                                <li key={i} className="text-slate-600 text-sm leading-relaxed flex items-start gap-2">
                                    <span className="text-slate-300 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-xs italic">None identified.</p>
                    )}
                </div>
            </div>

            {/* Decision Levers */}
            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                <h3 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-wide">Decision Levers (Reduces Uncertainty)</h3>
                {decision_levers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {decision_levers.map((item, i) => (
                            <span key={i} className="px-3 py-1 bg-white text-indigo-700 border border-indigo-200 rounded-full text-sm font-medium">
                                {item}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-indigo-400 text-xs italic">None identified.</p>
                )}
            </div>

            {/* Options */}
            <div className="space-y-3">
                <h3 className="font-bold text-slate-900">Strategic Options</h3>
                {options.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt, i) => (
                            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl border-l-4 border-l-slate-900">
                                <div className="font-bold text-lg text-slate-900 mb-1">{opt.option || "Option"}</div>
                                <p className="text-slate-600 text-sm mb-2">{opt.why || ""}</p>
                                {opt.when_it_wins && (
                                    <div className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                                        Wins when: {opt.when_it_wins}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm italic border border-dashed border-slate-200 p-4 rounded-xl text-center">No options generated.</p>
                )}
            </div>

            {/* Next Steps */}
            <div className="p-5 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    Next Steps (14 Days)
                </h3>
                {next_steps.length > 0 ? (
                    <ul className="space-y-3">
                        {next_steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                                <span className="text-green-900 text-sm font-medium">{step}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-green-700 text-sm italic">No next steps generated.</p>
                )}
            </div>

            {/* Key Question */}
            <div className="p-6 bg-slate-900 rounded-xl shadow-lg text-white">
                <h3 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-xs">The Sharp Question</h3>
                <p className="text-xl font-medium leading-relaxed">"{sharp_question}"</p>
            </div>

        </div>
    );
}
