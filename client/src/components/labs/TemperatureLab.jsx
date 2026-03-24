import React, { useState } from 'react';
import { Thermometer, Play, RotateCcw, Lightbulb } from 'lucide-react';

const PROMPTS = [
  { label: 'Creative story opener', text: 'Write the opening sentence of a science fiction novel.' },
  { label: 'Explain gravity', text: 'Explain gravity in one sentence.' },
  { label: 'Haiku', text: 'Write a haiku about machine learning.' },
  { label: 'Random number', text: 'Pick a random number between 1 and 100 and explain your choice.' },
  { label: 'Product name', text: 'Suggest a catchy name for an AI-powered calendar app.' },
];

const TEMPERATURES = [0, 0.5, 1.0];
const TEMP_LABELS = { 0: 'Deterministic', 0.5: 'Balanced', 1.0: 'Creative' };
const TEMP_COLORS = { 0: '#3b82f6', 0.5: '#8b5cf6', 1.0: '#ef4444' };
const TEMP_DESC = {
  0: 'Always picks the single most-likely token. Responses are highly consistent.',
  0.5: 'Mild randomness. Good balance of coherence and variety.',
  1.0: 'High randomness. Diverse, sometimes surprising outputs.',
};

export default function TemperatureLab({ onComplete }) {
  const [promptIdx, setPromptIdx] = useState(0);
  const [results, setResults] = useState({ 0: '', 0.5: '', 1.0: '' });
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const runAll = async () => {
    if (loading) return;
    setLoading(true);
    setRan(false);
    setResults({ 0: '', 0.5: '', 1.0: '' });

    const prompt = PROMPTS[promptIdx].text;

    await Promise.all(TEMPERATURES.map(async (temp) => {
      try {
        const res = await fetch('/api/tutor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            mode: 'playground',
            temperature: temp,
          }),
        });
        if (!res.ok) throw new Error('Request failed');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setResults(prev => ({ ...prev, [temp]: (prev[temp] || '') + parsed.text }));
              }
            } catch {}
          }
        }
      } catch {
        setResults(prev => ({ ...prev, [temp]: '⚠️ Error fetching response.' }));
      }
    }));

    setLoading(false);
    setRan(true);
    const newCount = runCount + 1;
    setRunCount(newCount);
    if (newCount >= 2 && !completed) {
      setCompleted(true);
      onComplete?.();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Thermometer className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">Temperature Controls Randomness</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Temperature scales the logits before sampling. At 0, the model always picks the highest-probability token.
              Higher values flatten the distribution, making rare tokens more likely. Run the same prompt multiple times
              to see how temperature affects consistency and creativity.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt selector */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-2">Choose a prompt:</p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p, i) => (
            <button key={i} onClick={() => { setPromptIdx(i); setRan(false); setResults({ 0: '', 0.5: '', 1.0: '' }); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${i === promptIdx
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted italic bg-white/5 rounded-lg px-3 py-2">"{PROMPTS[promptIdx].text}"</p>
      </div>

      {/* Run button */}
      <div className="flex items-center gap-3">
        <button onClick={runAll} disabled={loading}
          className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50">
          {loading ? <span className="animate-spin">⟳</span> : <Play className="w-4 h-4" />}
          Run at all 3 temperatures
        </button>
        {ran && (
          <button onClick={() => { setRan(false); setResults({ 0: '', 0.5: '', 1.0: '' }); }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        {runCount > 0 && (
          <span className="text-xs text-text-muted">Run {runCount}× — run again to see variation</span>
        )}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPERATURES.map(temp => (
          <div key={temp} className="rounded-xl border bg-white/3 overflow-hidden"
            style={{ borderColor: `${TEMP_COLORS[temp]}30` }}>
            <div className="px-3 py-2.5 border-b flex items-center gap-2"
              style={{ borderColor: `${TEMP_COLORS[temp]}20`, backgroundColor: `${TEMP_COLORS[temp]}10` }}>
              <Thermometer className="w-3.5 h-3.5" style={{ color: TEMP_COLORS[temp] }} />
              <span className="text-sm font-semibold" style={{ color: TEMP_COLORS[temp] }}>
                {temp} — {TEMP_LABELS[temp]}
              </span>
            </div>
            <p className="px-3 pt-2 text-[10px] text-text-muted leading-relaxed">{TEMP_DESC[temp]}</p>
            <div className="p-3 min-h-[100px]">
              {loading && !results[temp] && (
                <div className="flex items-center gap-1 text-text-muted text-xs">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                </div>
              )}
              {results[temp] && (
                <p className="text-sm text-text-primary leading-relaxed">{results[temp]}</p>
              )}
              {!loading && !results[temp] && !ran && (
                <p className="text-xs text-text-muted/50 italic">Response will appear here…</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Insight callout after 1st run */}
      {ran && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-text-muted leading-relaxed space-y-1">
              <p className="text-text-primary font-medium text-sm">What to notice:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Temperature 0 responses are nearly identical every run — try it!</li>
                <li>Temperature 1.0 responses diverge most — same prompt, different output each time.</li>
                <li>For factual Q&A, low temperature reduces hallucination risk.</li>
                <li>For brainstorming or creative tasks, higher temperature produces more variety.</li>
              </ul>
              {runCount < 2 && <p className="text-primary font-medium mt-2">Run again with the same prompt to see variation across temperatures!</p>}
              {runCount >= 2 && <p className="text-green-400 font-medium mt-2">✓ Lab complete — you've seen how temperature affects output diversity.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
