"use client";

import { useState } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("Brain dump");
  const [audience, setAudience] = useState<string[]>([]);
  const [intent, setIntent] = useState("Explain");
  const [options, setOptions] = useState({
    preserveMeaning: true,
    concise: false,
    formal: false,
  });

  const [clarityCards, setClarityCards] = useState([
    { id: 1, title: "Nuance Identified", content: "The user is feeling overwhelmed by the technical details and needs a high-level summary." },
    { id: 2, title: "Actionable Goal", content: "Convert complex architectural diagrams into simple flow-oriented metaphors." },
  ]);

  const [draftCards, setDraftCards] = useState([
    { id: 1, audience: "Customer", intent: "Explain", content: "We're updating our systems to make them faster and more secure for you. You won't notice much change, but everything will run smoother!" },
  ]);

  const toggleAudience = (val: string) => {
    setAudience(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]);
  };

  const handleGenerateClarity = () => {
    // Mock generation
    console.log("Generating Clarity Cards...");
  };

  const handleGenerateDrafts = () => {
    // Mock generation
    console.log("Generating Drafts...");
  };

  return (
    <div className="min-h-screen p-8 md:p-12 lg:p-16 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">ClarityCast</h1>
        <p className="text-slate-600 border-l-2 border-slate-900 pl-4 py-1">Turn chaos into clear communication.</p>
      </header>

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
                {["Decision", "Plan", "Brain dump", "Message prep"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateClarity}
                className="ml-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                Generate Clarity Cards
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              Clarity Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {clarityCards.map((card) => (
                <div key={card.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{card.content}</p>
                </div>
              ))}
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
                    className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      audience.includes(a)
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
              className="w-full py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-lg font-bold hover:bg-slate-50 transition-colors"
            >
              Generate Drafts
            </button>
          </section>

          <section className="space-y-4 pt-10 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border-2 border-slate-900"></span>
              Draft Cards
            </h2>
            <div className="space-y-4">
              {draftCards.map((draft) => (
                <div key={draft.id} className="p-6 bg-slate-900 text-slate-50 rounded-2xl shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 mb-3">
                    <span>{draft.audience}</span>
                    <span>•</span>
                    <span>{draft.intent}</span>
                  </div>
                  <p className="text-base leading-relaxed font-medium">{draft.content}</p>
                  <button className="mt-4 text-xs font-bold text-white underline-offset-4 hover:underline">Copy Draft</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
