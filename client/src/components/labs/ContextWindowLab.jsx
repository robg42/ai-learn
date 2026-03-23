import React, { useState } from 'react';
import { Layers, Play, Info } from 'lucide-react';

// The "needle" fact we'll hide in the haystack
const NEEDLE = 'The secret project codename is AURORA-7.';
const QUESTION = 'What is the secret project codename mentioned in the document?';

// Filler paragraphs — generic corporate-speak
const FILLER = [
  'Q3 results exceeded analyst expectations with revenue growth of 18% year-over-year. The board has approved a dividend increase of $0.05 per share, effective next quarter.',
  'Our cloud infrastructure migration is proceeding on schedule. The DevOps team completed the final data center decommission in Frankfurt last week.',
  'Employee satisfaction scores rose to 4.2/5 in the annual survey. The new flexible work policy has been cited as a major driver of improved morale across all departments.',
  'The legal team is finalizing the acquisition terms for NovaTech Ltd. Due diligence is expected to complete by end of month.',
  'Product roadmap priorities for H2 include an AI-powered analytics dashboard, mobile app redesign, and enterprise SSO support.',
  'Supply chain disruptions have eased significantly. Lead times for key components returned to pre-2022 levels as of September.',
  'The marketing campaign for the APEX product line generated 2.3M impressions in its first week, a 40% improvement over the previous campaign.',
  'R&D investment increased by 12% this year, with new labs opening in Austin and Singapore focused on next-generation battery technology.',
  'Partnership negotiations with GlobalRetail Corp have progressed to the term sheet stage. A formal announcement is anticipated before year-end.',
  'Our data governance team published updated policies on model training data usage and vendor AI risk assessment frameworks.',
  'The new headquarters in downtown Chicago passed final inspection. Occupancy is planned for Q1 of next year.',
  'Customer churn rate fell to 2.1% this quarter, the lowest in company history, attributable to the new onboarding program.',
  'Open source contributions from our engineering team increased by 300% this year, with three new repositories crossing 1,000 GitHub stars.',
  'The compliance audit for SOC 2 Type II was completed successfully with zero critical findings.',
  'Our CTO presented a keynote at TechConf 2024 on scaling microservices, drawing an audience of 5,000 attendees.',
];

const POSITIONS = [
  { label: 'Beginning', position: 0, description: 'Needle is in the first paragraph — should be easy to find.' },
  { label: 'Middle', position: 7, description: 'Needle is buried in the middle of a long document — classic "lost in the middle" scenario.' },
  { label: 'End', position: FILLER.length, description: 'Needle is at the very end — recency bias may help here.' },
];

function buildDocument(needlePos) {
  const doc = [...FILLER];
  doc.splice(needlePos, 0, NEEDLE);
  return doc;
}

export default function ContextWindowLab({ onComplete }) {
  const [selectedPos, setSelectedPos] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);

  const runQuery = async (posIdx) => {
    if (loading) return;
    setSelectedPos(posIdx);
    setResponse('');
    setLoading(true);

    const position = POSITIONS[posIdx];
    const doc = buildDocument(position.position);
    const docText = doc.map((p, i) => `[Paragraph ${i + 1}] ${p}`).join('\n\n');
    const prompt = `Here is a long document:\n\n${docText}\n\n---\n\nQuestion: ${QUESTION}`;

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          mode: 'playground',
        }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
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
              fullResponse += parsed.text;
              setResponse(prev => prev + parsed.text);
            }
          } catch {}
        }
      }
      const found = fullResponse.toLowerCase().includes('aurora-7') || fullResponse.toLowerCase().includes('aurora');
      const newResult = { label: position.label, found, response: fullResponse };
      setResults(prev => {
        const updated = [...prev.filter(r => r.label !== position.label), newResult];
        if (updated.length >= 3 && !completed) {
          setCompleted(true);
          onComplete?.();
        }
        return updated;
      });
    } catch {
      setResponse('⚠️ Error fetching response.');
    }
    setLoading(false);
  };

  const docExample = buildDocument(7);

  return (
    <div className="space-y-6">
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-purple-300 mb-1">Lost in the Middle</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Research shows LLMs are better at using information from the beginning and end of their context window
              than information buried in the middle. This "lost in the middle" effect means long RAG contexts
              can actually hurt performance. In this lab, you'll hide a needle fact in different positions and
              test whether the model can find it.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">The needle (hidden fact)</p>
        <p className="text-sm font-mono text-amber-300 bg-amber-500/10 px-2 py-1 rounded">{NEEDLE}</p>
        <p className="text-[10px] text-text-muted mt-2">Hidden inside a {FILLER.length + 1}-paragraph corporate document. Question asked: "{QUESTION}"</p>
      </div>

      {/* Position buttons */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-3">Select needle position and run:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {POSITIONS.map((pos, idx) => {
            const result = results.find(r => r.label === pos.label);
            return (
              <div key={idx} className="rounded-xl border bg-white/3 overflow-hidden border-white/10">
                <div className="p-3">
                  <p className="text-sm font-semibold text-text-primary mb-1">{pos.label}</p>
                  <p className="text-[10px] text-text-muted mb-3">{pos.description}</p>
                  {result ? (
                    <div className={`text-xs font-medium px-2 py-1 rounded-lg mb-2 ${result.found ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {result.found ? '✓ Found AURORA-7' : '✗ Failed to find it'}
                    </div>
                  ) : null}
                  <button onClick={() => runQuery(idx)} disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    <Play className="w-3.5 h-3.5" />
                    {result ? 'Re-run' : 'Run'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current response */}
      {(response || loading) && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
            Model response — {selectedPos !== null ? POSITIONS[selectedPos].label : ''} position
          </p>
          {loading && !response && (
            <div className="flex gap-1 text-text-muted">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
            </div>
          )}
          <p className="text-sm text-text-primary leading-relaxed">{response}</p>
        </div>
      )}

      {/* Summary after all 3 */}
      {results.length >= 3 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-text-primary">Results Summary</p>
          <div className="grid grid-cols-3 gap-3">
            {results.map(r => (
              <div key={r.label} className={`text-center p-2 rounded-lg ${r.found ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className="text-xs font-medium text-text-primary">{r.label}</p>
                <p className={`text-lg font-bold ${r.found ? 'text-green-400' : 'text-red-400'}`}>{r.found ? '✓' : '✗'}</p>
              </div>
            ))}
          </div>
          <div className="text-xs text-text-muted leading-relaxed space-y-1">
            <p className="text-text-primary font-medium flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Mitigation strategies:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Place the most critical context first or last — not in the middle.</li>
              <li>Use reranking to surface relevant chunks to the top of the context.</li>
              <li>Reduce context window size — fewer chunks means less signal dilution.</li>
              <li>Use structured formats (XML tags, headers) to help models locate facts.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
