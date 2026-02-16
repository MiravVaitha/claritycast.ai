import { ClarifyOutput } from "@/lib/schemas";
import CollapsibleSection from "./CollapsibleSection";

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
        <div className="space-y-4">
            {/* Core Issue / Purpose */}
            <CollapsibleSection
                title={isPrep ? "Purpose & Outcome" : "Core Issue"}
                variant={isOverwhelm ? "amber" : "blue"}
                defaultOpen={false}
                icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            >
                <p className="font-medium text-base md:text-lg leading-relaxed">
                    {isPrep ? purpose : core_issue}
                </p>
                {constraint && (
                    <div className="mt-4 p-3 bg-white/40 rounded-xl border border-amber-200 text-amber-900 text-sm italic">
                        <span className="font-bold not-italic">Constraint: </span> {constraint}
                    </div>
                )}
            </CollapsibleSection>

            {/* OVERWHELM: Immediate Triage */}
            {isOverwhelm && (
                <CollapsibleSection
                    title="Priority: Do Today"
                    variant="amber"
                    defaultOpen={false}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    }
                    badge={`${top_3_priorities.length} items`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/50 rounded-xl border border-amber-100">
                            <h4 className="font-bold text-amber-900 mb-3 text-xs uppercase tracking-wider">High Priority</h4>
                            <ul className="space-y-2">
                                {top_3_priorities.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="text-amber-500 font-bold">•</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-4 bg-white/30 rounded-xl border border-amber-100/50">
                            <h4 className="font-bold text-amber-800/60 mb-3 text-xs uppercase tracking-wider">Defer / Ignore</h4>
                            <ul className="space-y-2">
                                {top_3_defer.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                                        <span className="text-slate-300">•</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            {/* PREP: Message Structure */}
            {isPrep && structure && (
                <CollapsibleSection
                    title="Message Structure"
                    variant="purple"
                    defaultOpen={false}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                    }
                >
                    <div className="space-y-4">
                        <div className="pl-4 border-l-2 border-purple-200">
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Opening</span>
                            <p className="text-slate-700 text-sm mt-1">{structure.opening}</p>
                        </div>
                        <div className="pl-4 border-l-2 border-purple-400">
                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Body</span>
                            {Array.isArray(structure.body) ? (
                                <ul className="space-y-1 mt-1">
                                    {structure.body.map((point, i) => (
                                        <li key={i} className="text-slate-700 text-sm">• {point}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-700 text-sm mt-1">{structure.body}</p>
                            )}
                        </div>
                        <div className="pl-4 border-l-2 border-purple-600">
                            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-widest">Closing</span>
                            <p className="text-slate-700 text-sm mt-1">{structure.close}</p>
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            {/* Shared Sections: Assumptions / Milestones / Tradeoffs / Risks */}
            {(hidden_assumptions.length > 0 || key_points.length > 0) && (
                <CollapsibleSection
                    title={isPlan ? "Milestones" : isPrep ? "Key Discussion Points" : "Hidden Assumptions"}
                    variant="default"
                    defaultOpen={false}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 12h.01M7 17h.01M10 7h10M10 12h10M10 17h10" />
                        </svg>
                    }
                    badge={`${(hidden_assumptions.length || key_points.length)} items`}
                >
                    <ul className="space-y-2">
                        {(isPrep ? key_points : hidden_assumptions).map((item, i) => (
                            <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                <span className="text-slate-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0"></span> {item}
                            </li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}

            {(tradeoffs.length > 0 || objections.length > 0) && (
                <CollapsibleSection
                    title={isPrep ? "Likely Objections" : isPlan ? "Risks & Mitigations" : "Trade-offs"}
                    variant="default"
                    defaultOpen={false}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    }
                >
                    <ul className="space-y-2">
                        {(isPrep ? objections : tradeoffs).map((item, i) => (
                            <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                <span className="text-slate-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0"></span> {item}
                            </li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}

            {/* Options / Decisions */}
            {options.length > 0 && (
                <CollapsibleSection
                    title="Strategic Options"
                    variant="blue"
                    defaultOpen={false}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    }
                    badge={`${options.length} options`}
                >
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt, i) => (
                            <div key={i} className="p-4 bg-white/50 border border-blue-100 rounded-xl border-l-4 border-l-blue-600 shadow-sm">
                                <div className="font-bold text-base text-slate-900 mb-1">{opt.option || "Option"}</div>
                                <p className="text-slate-600 text-sm mb-2 leading-relaxed">{opt.why || ""}</p>
                                {opt.when_it_wins && (
                                    <div className="inline-flex px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded uppercase">
                                        Wins when: {opt.when_it_wins}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Levers / Metrics */}
            {decision_levers.length > 0 && (
                <CollapsibleSection
                    title={isPlan ? "Success Metrics" : "Decision Levers"}
                    variant="indigo"
                    defaultOpen={false}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                >
                    <div className="flex flex-wrap gap-2">
                        {decision_levers.map((item, i) => (
                            <span key={i} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold shadow-sm">
                                {item}
                            </span>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Next Steps */}
            {isOverwhelm ? (
                <CollapsibleSection
                    title="Action Plan"
                    variant="rose"
                    defaultOpen={false}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                >
                    <div className="space-y-3">
                        {next_10_min && (
                            <div className="p-4 bg-white/50 rounded-xl border border-rose-100 flex items-center gap-4">
                                <span className="text-2xl">⚡</span>
                                <div>
                                    <h4 className="font-bold text-rose-900 text-[10px] uppercase tracking-wider">Next 10 Minutes</h4>
                                    <p className="text-rose-900 font-bold text-base">{next_10_min}</p>
                                </div>
                            </div>
                        )}
                        {next_24_hr && (
                            <div className="p-4 bg-white/30 rounded-xl border border-rose-100/50 flex items-center gap-4">
                                <span className="text-2xl">📅</span>
                                <div>
                                    <h4 className="font-bold text-rose-800/60 text-[10px] uppercase tracking-wider">Next 24 Hours</h4>
                                    <p className="text-slate-700 font-medium text-sm">{next_24_hr}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            ) : (
                next_steps.length > 0 && (
                    <CollapsibleSection
                        title={isDecision ? "Small Experiment" : "Next Steps (14 Days)"}
                        variant="green"
                        defaultOpen={false}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                        badge={`${next_steps.length} steps`}
                    >
                        <ul className="space-y-3">
                            {next_steps.map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-200 text-green-700 font-bold text-[10px] flex items-center justify-center mt-0.5">{i + 1}</span>
                                    <span className="text-slate-700 text-sm font-medium leading-relaxed">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </CollapsibleSection>
                )
            )}

        </div>
    );
}
