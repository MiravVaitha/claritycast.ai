"use client";

import { useState } from "react";
import { ClarifyOutput, CommunicateOutput, ClarityMode, ClarityCard } from "@/lib/types";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<ClarityMode>("brain_dump");
  const [audience, setAudience] = useState<string[]>([]);
  const [intent, setIntent] = useState("Explain");
  const [options, setOptions] = useState({
    preserveMeaning: true,
    concise: false,
    formal: false,
  });

  const [clarityData, setClarityData] = useState<ClarifyOutput | null>(null);
  const [draftsData, setDraftsData] = useState<CommunicateOutput | null>(null);
  const [isLoadingClarity, setIsLoadingClarity] = useState(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAudience = (val: string) => {
    setAudience(prev => prev.includes(val.toLowerCase()) ? prev.filter(a => a !== val.toLowerCase()) : [...prev, val.toLowerCase()]);
  };

  const handleGenerateClarity = async () => {
    if (!inputText.trim()) {
      setError("Please enter some thoughts first.");
      return;
    }

    setIsLoadingClarity(true);
    setError(null);
    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: inputText }),
      });

      if (!response.ok) {
        // Try to parse error as JSON first, fallback to text if it's HTML or other
        let errorMessage = "Failed to generate clarity cards";
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch {
          const textError = await response.text();
          errorMessage = textError.substring(0, 100) || "Internal Server Error";
        }
        throw new Error(`${response.status} – ${errorMessage}`);
      }

      const data = await response.json();
      setClarityData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingClarity(false);
    }
  };

  const handleGenerateDrafts = async () => {
    if (!clarityData) {
      setError("Please generate clarity cards first.");
      return;
    }
    if (audience.length === 0) {
      setError("Please select at least one audience.");
      return;
    }

    setIsLoadingDrafts(true);
    setError(null);
    try {
      const response = await fetch("/api/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clarity: clarityData,
          audiences: audience,
          intent: intent.toLowerCase(),
          options,
        }),
      });

      if (!response.ok) {
        // Try to parse error as JSON first, fallback to text if it's HTML or other
        let errorMessage = "Failed to generate drafts";
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch {
          const textError = await response.text();
          errorMessage = textError.substring(0, 100) || "Internal Server Error";
        }
        throw new Error(`${response.status} – ${errorMessage}`);
      }

      const data = await response.json();
      setDraftsData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  const clarityCards: ClarityCard[] = clarityData ? [
    { id: 'summary', title: 'Summary', content: clarityData.summary },
    { id: 'priority', title: 'Priority', content: clarityData.priorities[0] },
    { id: 'risk', title: 'Key Risk', content: `${clarityData.risks[0].risk} (${clarityData.risks[0].likelihood})` },
    { id: 'question', title: 'Key Question', content: clarityData.key_question },
  ] : [];

  return (
    <div className="min-h-screen p-8 md:p-12 lg:p-16 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">ClarityCast</h1>
        <p className="text-slate-600 border-l-2 border-slate-900 pl-4 py-1">Turn chaos into clear communication.</p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-10">
          <section className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Your Thoughts</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Dump your thoughts here..."
                className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none text-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {[
                  { id: "decision", label: "Decision" },
                  { id: "plan", label: "Plan" },
                  { id: "brain_dump", label: "Brain dump" },
                  { id: "message_prep", label: "Message prep" }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as ClarityMode)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === m.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateClarity}
                disabled={isLoadingClarity}
                className="ml-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
              >
                {isLoadingClarity && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Generate Clarity Cards
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              Clarity Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm min-h-[100px]">
              {clarityCards.length > 0 ? (
                clarityCards.map((card) => (
                  <div key={card.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{card.content}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                  {isLoadingClarity ? "Thinking..." : "Generate clarity cards to see insights here."}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-10 lg:border-l lg:border-slate-200 lg:pl-12">
          <section className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Audience</label>
              <div className="flex flex-wrap gap-2">
                {["Recruiter", "Engineer", "Customer", "Friend"].map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAudience(a)}
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${audience.includes(a.toLowerCase())
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Intent</label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
              >
                {["Inform", "Persuade", "Explain", "Apologise"].map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Style Options</label>
              <div className="space-y-3">
                {[
                  { key: "preserveMeaning", label: "Preserve meaning" },
                  { key: "concise", label: "Concise" },
                  { key: "formal", label: "Formal" },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(options as any)[opt.key]}
                      onChange={() => setOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900 transition-colors">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateDrafts}
              disabled={isLoadingDrafts || !clarityData}
              className="w-full py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-lg font-bold hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoadingDrafts && <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>}
              Generate Drafts
            </button>
          </section>

          <section className="space-y-4 pt-10 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border-2 border-slate-900"></span>
              Draft Cards
            </h2>
            <div className="space-y-4 min-h-[100px]">
              {draftsData && draftsData.drafts.length > 0 ? (
                draftsData.drafts.map((draft, idx) => (
                  <div key={idx} className="p-6 bg-slate-900 text-slate-50 rounded-2xl shadow-xl relative overflow-hidden group">
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
                    <p className="text-base leading-relaxed font-medium mb-4">{draft.draft}</p>
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
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                  {isLoadingDrafts ? "Drafting..." : "Drafts will appear here after generation."}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
