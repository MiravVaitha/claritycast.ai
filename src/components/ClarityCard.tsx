import { ClarifyOutput } from "@/lib/schemas";

interface Props {
    data: ClarifyOutput;
}

export default function ClarityResults({ data }: Props) {
    // Shared fields
    const core_issue = data.core_issue || "Analysis unavailable.";
    const sharp_question = data.one_sharp_question || "No key question identified.";

    // Mode-specific optional fields
    const hidden_assumptions = data.hidden_assumptions ?? [];
    const tradeoffs = data.tradeoffs ?? [];
    const decision_levers = data.decision_levers ?? []; // Also used for "success_metrics" in Plan
    const options = data.options ?? [];
    const next_steps = data.next_steps_14_days ?? [];

    // Overwhelm specific
    const top_3_priorities = data.top_3_priorities_today ?? [];
    const top_3_defer = data.top_3_defer_or_ignore ?? [];
    const next_10_min = data.next_10_minutes;
    const next_24_hr = data.next_24_hours;
    const constraint = data.constraint_or_boundary;

    // Prep specific
    const purpose = data.purpose_outcome;
    const key_points = data.key_points ?? [];
    const structure = data.structure_outline;
    const objections = data.likely_questions_or_objections ?? [];
    const checklist = data.rehearsal_checklist ?? [];

    const isOverwhelm = data.problem_type === "overwhelm";
    const isPrep = data.problem_type === "message_prep";
    const isPlan = data.problem_type === "plan";
    const isDecision = data.problem_type === "decision";

    return (
        <div className="space-y-6">

            {/* Core Issue / Purpose */}
            <div className={`p-6 border rounded-xl shadow-sm ${isOverwhelm ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                <div className={`flex items-center gap-2 mb-2 font-bold uppercase text-xs tracking-wider ${isOverwhelm ? "text-amber-800" : "text-blue-800"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {isPrep ? "Purpose & Outcome" : "Core Issue"}
                </div>
                <p className={`font-medium text-lg leading-relaxed ${isOverwhelm ? "text-amber-900" : "text-blue-900"}`}>
                    {isPrep ? purpose : core_issue}
                </p>
                {/* Overwhelm Constraint */}
                {constraint && (
                    <div className="mt-4 p-3 bg-white/60 rounded-lg border border-amber-100 text-amber-800 text-sm italic">
                        <span className="font-bold not-italic">Constraint: </span> {constraint}
                    </div>
                )}
            </div>

            {/* OVERWHELM: Immediate Triage */}
            {isOverwhelm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase">Priority: Do Today</h3>
                        <ul className="space-y-2">
                            {top_3_priorities.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="text-green-500 font-bold">✓</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm opacity-75">
                        <h3 className="font-bold text-slate-500 mb-3 text-sm uppercase">Defer / Ignore</h3>
                        <ul className="space-y-2">
                            {top_3_defer.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-500 decoration-slate-400">
                                    <span className="text-slate-300">×</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* PREP: Structure & Points */}
            {isPrep && structure && (
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Messaging Structure</h3>
                    <div className="space-y-4">
                        <div className="pl-4 border-l-2 border-indigo-200">
                            <span className="text-xs font-bold text-indigo-500 uppercase">Opening</span>
                            <p className="text-slate-700 text-sm">{structure.opening}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-indigo-400">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Body</span>
                            <p className="text-slate-700 text-sm">{structure.body}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-indigo-600">
                            <span className="text-xs font-bold text-indigo-800 uppercase">Closing</span>
                            <p className="text-slate-700 text-sm">{structure.close}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Prep: Purpose & Structure */}
            {isPrep && purpose && (
                <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-purple-900 mb-2 text-sm uppercase tracking-wide">Purpose & Outcome</h3>
                    <p className="text-purple-900 font-medium">{purpose}</p>
                </div>
            )}

            {isPrep && structure && (
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Message Structure</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-slate-700 text-xs uppercase mb-1">Opening</h4>
                            <p className="text-slate-600 text-sm">{structure.opening}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-700 text-xs uppercase mb-2">Body</h4>
                            {Array.isArray(structure.body) ? (
                                <ul className="space-y-2">
                                    {structure.body.map((point, i) => (
                                        <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                            <span className="text-slate-300 mt-1">•</span> {point}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-600 text-sm">{structure.body}</p>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-700 text-xs uppercase mb-1">Close</h4>
                            <p className="text-slate-600 text-sm">{structure.close}</p>
                        </div>
                    </div>
                </div>
            )}

            {isPrep && checklist.length > 0 && (
                <div className="p-5 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-green-900 mb-3 text-sm uppercase tracking-wide">Rehearsal Checklist</h3>
                    <ul className="space-y-2">
                        {checklist.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                                <span className="text-green-500 font-bold">✓</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Shared Grid: Assumptions / Trade-offs / Objections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hidden_assumptions.length > 0 && (
                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                            <span className="text-slate-400">#</span> {isPlan ? "Milestones & Key Points" : "Hidden Assumptions"}
                        </h3>
                        <ul className="space-y-2">
                            {hidden_assumptions.map((item, i) => (
                                <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                    <span className="text-slate-300 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {key_points.length > 0 && (
                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-3 text-sm">Key Discussion Points</h3>
                        <ul className="space-y-2">
                            {key_points.map((item, i) => (
                                <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                    <span className="text-slate-300 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {(tradeoffs.length > 0 || objections.length > 0) && (
                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                            <span className="text-slate-400">⇄</span> {isPrep ? "Likely Questions/Objections" : isPlan ? "Risks & Mitigations" : "Trade-offs"}
                        </h3>
                        <ul className="space-y-2">
                            {(isPrep ? objections : tradeoffs).map((item, i) => (
                                <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                    <span className="text-slate-300 mt-1">•</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Decision Levers / Success Metrics */}
            {decision_levers.length > 0 && (
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <h3 className="font-bold text-indigo-900 mb-3 text-sm uppercase tracking-wide">
                        {isPlan ? "Success Metrics" : "Decision Levers"}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {decision_levers.map((item, i) => (
                            <span key={i} className="px-3 py-1 bg-white text-indigo-700 border border-indigo-200 rounded-full text-sm font-medium">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Options (Decision/General) */}
            {options.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-bold text-slate-900">Strategic Options</h3>
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
                </div>
            )}

            {/* Rehearsal Checklist (Prep) */}
            {checklist.length > 0 && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase">Rehearsal Checklist</h3>
                    <ul className="space-y-2">
                        {checklist.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Next Steps (General, Plan, Overwhelm) */}
            {/* If Overwhelm, we display next_10_min and next_24_hr distinctively */}
            {isOverwhelm ? (
                <div className="space-y-4">
                    {next_10_min && (
                        <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-4">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-2xl">⚡</div>
                            <div>
                                <h3 className="font-bold text-rose-900 text-xs uppercase tracking-wide">Next 10 Minutes</h3>
                                <p className="text-rose-900 font-bold text-lg">{next_10_min}</p>
                            </div>
                        </div>
                    )}
                    {next_24_hr && (
                        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-4">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-2xl">📅</div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-xs uppercase tracking-wide">Next 24 Hours</h3>
                                <p className="text-blue-900 font-medium">{next_24_hr}</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Standard Next Steps */
                next_steps.length > 0 && (
                    <div className="p-5 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                        <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                            {isDecision ? "Small Experiment (Next 7 Days)" : "Next Steps (14 Days)"}
                        </h3>
                        <ul className="space-y-3">
                            {next_steps.map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                                    <span className="text-green-900 text-sm font-medium">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            )}

            {/* Key Question */}
            <div className="p-6 bg-slate-900 rounded-xl shadow-lg text-white">
                <h3 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-xs">
                    {isOverwhelm ? "Reflection Question" : "The Sharp Question"}
                </h3>
                <p className="text-xl font-medium leading-relaxed">"{sharp_question}"</p>
            </div>

        </div>
    );
}
