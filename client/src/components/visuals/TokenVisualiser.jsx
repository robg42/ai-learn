import React, { useState, useMemo } from 'react';

// Simple tokenizer: split on common boundaries for demo purposes
function tokenize(text) {
  if (!text.trim()) return [];
  const words = text.match(/\S+|\s+/g) || [];
  const tokens = [];
  const palette = [
    '#6B46C1', '#38BDF8', '#10B981', '#F59E0B', '#EC4899',
    '#8B5CF6', '#0EA5E9', '#34D399', '#FBBF24', '#F472B6',
  ];
  let colorIdx = 0;

  for (const word of words) {
    if (word.trim() === '') continue;
    // Split longer words into sub-tokens (simplified)
    if (word.length > 8) {
      const mid = Math.ceil(word.length / 2);
      tokens.push({ text: word.slice(0, mid), color: palette[colorIdx % palette.length] });
      colorIdx++;
      tokens.push({ text: word.slice(mid), color: palette[colorIdx % palette.length] });
      colorIdx++;
    } else {
      tokens.push({ text: word, color: palette[colorIdx % palette.length] });
      colorIdx++;
    }
  }
  return tokens;
}

const EXAMPLES = [
  'The cat sat on the mat.',
  'Large language models are transforming software.',
  'AI security matters for every organisation.',
];

export default function TokenVisualiser() {
  const [input, setInput] = useState(EXAMPLES[0]);
  const tokens = useMemo(() => tokenize(input), [input]);

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
        Interactive Token Visualiser
      </h4>
      <p className="text-sm text-text-muted mb-4">
        Type any sentence to see how it might be broken into tokens. LLMs don't see words — they see these chunks.
      </p>

      <textarea
        className="input resize-none h-20 text-sm mb-4 font-mono"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type a sentence..."
        maxLength={200}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => setInput(ex)}
            className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
          >
            {ex.slice(0, 30)}…
          </button>
        ))}
      </div>

      {tokens.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5 p-4 bg-black/20 rounded-xl border border-white/5 mb-3 min-h-[60px]">
            {tokens.map((token, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-sm font-mono text-white"
                style={{ backgroundColor: `${token.color}50`, border: `1px solid ${token.color}80` }}
              >
                {token.text}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            ~{tokens.length} tokens ·{' '}
            <span className="text-accent">roughly {Math.ceil(tokens.length * 0.75)} words worth of context</span>
          </p>
        </>
      )}
    </div>
  );
}
