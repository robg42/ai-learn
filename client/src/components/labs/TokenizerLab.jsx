import React, { useState, useMemo } from 'react';
import { Hash, RotateCcw, Target } from 'lucide-react';

const COLORS = [
  'rgba(99,102,241,0.25)',
  'rgba(16,185,129,0.25)',
  'rgba(245,158,11,0.25)',
  'rgba(239,68,68,0.25)',
  'rgba(139,92,246,0.25)',
  'rgba(6,182,212,0.25)',
];
const BORDERS = [
  'rgba(99,102,241,0.6)',
  'rgba(16,185,129,0.6)',
  'rgba(245,158,11,0.6)',
  'rgba(239,68,68,0.6)',
  'rgba(139,92,246,0.6)',
  'rgba(6,182,212,0.6)',
];

// Educational tokenizer — approximates BPE tokenization for cl100k_base.
// Accurate enough to teach the concept; not production-grade.
function tokenize(text) {
  if (!text) return [];
  const tokens = [];
  // Split on whitespace boundaries, keeping spaces attached to the following word (like BPE)
  const segments = text.split(/(?=\s)/);
  let colorIndex = 0;

  for (const seg of segments) {
    if (!seg) continue;
    // A leading space + word is usually 1 token (BPE behaviour)
    // Punctuation sequences are separate tokens
    // Long words get split every ~4 chars (subword fallback)
    const parts = seg.match(/(\s+[a-zA-Z0-9']{1,}|\s+|[a-zA-Z0-9']{1,}|[^a-zA-Z0-9'\s])/g) || [seg];
    for (const part of parts) {
      if (!part) continue;
      // If the word part (stripping leading space) is > 8 chars, split into subwords
      const trimmed = part.trimStart();
      const leading = part.slice(0, part.length - trimmed.length);
      if (trimmed.length > 8) {
        let first = true;
        let i = 0;
        while (i < trimmed.length) {
          const chunkSize = first ? 4 : 4;
          const chunk = (first ? leading : '') + trimmed.slice(i, i + chunkSize);
          tokens.push({ text: chunk, colorIndex: colorIndex % COLORS.length });
          colorIndex++;
          i += chunkSize;
          first = false;
        }
      } else {
        tokens.push({ text: part, colorIndex: colorIndex % COLORS.length });
        colorIndex++;
      }
    }
  }
  return tokens;
}

const SAMPLES = [
  {
    label: 'Simple sentence',
    text: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    label: 'Technical jargon',
    text: 'LLMs use transformer architectures with self-attention mechanisms to predict next tokens.',
  },
  {
    label: 'Code snippet',
    text: 'function calculateTokens(text) { return text.split(/\\s+/).length; }',
  },
  {
    label: 'Mixed punctuation',
    text: "Don't forget: tokenization isn't just about words — it's about sub-word units!",
  },
];

const CHALLENGE_TARGET = 20;

export default function TokenizerLab({ onComplete }) {
  const [text, setText] = useState(SAMPLES[0].text);
  const [tab, setTab] = useState('visualise'); // 'visualise' | 'challenge'
  const [challengeText, setChallengeText] = useState('');
  const [challengeAttempted, setChallengeAttempted] = useState(false);

  const tokens = useMemo(() => tokenize(text), [text]);
  const challengeTokens = useMemo(() => tokenize(challengeText), [challengeText]);

  const challengeOriginalTokens = useMemo(
    () => tokenize('Large language models tokenize text into sub-word units rather than whole words, which allows them to handle vocabulary efficiently.'),
    []
  );
  const challengeOriginal = 'Large language models tokenize text into sub-word units rather than whole words, which allows them to handle vocabulary efficiently.';

  const challengePassed = challengeTokens.length > 0 && challengeTokens.length <= CHALLENGE_TARGET;

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {['visualise', 'challenge'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize ${
              tab === t ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary'
            }`}>
            {t === 'visualise' ? 'Visualise Tokens' : 'Challenge Mode'}
          </button>
        ))}
      </div>

      {tab === 'visualise' ? (
        <div className="space-y-4">
          {/* Sample buttons */}
          <div className="flex gap-2 flex-wrap">
            {SAMPLES.map(s => (
              <button key={s.label} onClick={() => setText(s.text)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  text === s.text
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Paste or type any text to see how it tokenizes…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
          />

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2.5">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-text-muted">Tokens:</span>
              <span className="font-bold text-text-primary">{tokens.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2.5">
              <span className="text-text-muted">Characters:</span>
              <span className="font-bold text-text-primary">{text.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2.5">
              <span className="text-text-muted">Chars/token:</span>
              <span className="font-bold text-text-primary">
                {tokens.length ? (text.length / tokens.length).toFixed(1) : '—'}
              </span>
            </div>
          </div>

          {/* Token visualisation */}
          {tokens.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-text-muted mb-3">Each coloured block = one token</p>
              <div className="flex flex-wrap gap-px leading-relaxed font-mono text-sm">
                {tokens.map((tok, i) => (
                  <span key={i}
                    style={{
                      backgroundColor: COLORS[tok.colorIndex],
                      borderBottom: `2px solid ${BORDERS[tok.colorIndex]}`,
                      display: 'inline',
                      whiteSpace: 'pre',
                    }}
                    className="rounded-sm px-0.5">
                    {tok.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200/80">
            <strong className="text-amber-200">Key insight:</strong> LLMs don't see words — they see tokens.
            Common words are one token; rare or long words split into subwords. Spaces often attach to the
            following word. This is why token counts matter for cost and why "tokenization" is its own art.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-text-primary">The Challenge</h3>
              <span className="ml-auto text-xs bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded-full">
                Target: ≤ {CHALLENGE_TARGET} tokens
              </span>
            </div>
            <p className="text-sm text-text-muted mb-3">
              Rewrite this sentence to use <strong className="text-text-primary">20 tokens or fewer</strong> while preserving the core meaning:
            </p>
            <div className="bg-bg-dark rounded-lg p-3 text-sm text-text-primary/80 mb-2 font-mono">
              "{challengeOriginal}"
            </div>
            <p className="text-xs text-text-muted">Original: {challengeOriginalTokens.length} tokens</p>
          </div>

          <textarea
            value={challengeText}
            onChange={e => { setChallengeText(e.target.value); setChallengeAttempted(true); }}
            rows={3}
            placeholder="Write your shorter version here…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
          />

          {challengeText && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold ${
                  challengePassed
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-white/5 text-text-muted border border-white/10'
                }`}>
                  <Hash className="w-4 h-4" />
                  Your version: {challengeTokens.length} tokens
                  {challengePassed && ' ✓'}
                </div>
              </div>

              {/* Mini token visualisation */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex flex-wrap gap-px leading-relaxed font-mono text-xs">
                  {challengeTokens.map((tok, i) => (
                    <span key={i}
                      style={{
                        backgroundColor: COLORS[tok.colorIndex],
                        borderBottom: `2px solid ${BORDERS[tok.colorIndex]}`,
                        display: 'inline',
                        whiteSpace: 'pre',
                      }}
                      className="rounded-sm px-0.5">
                      {tok.text}
                    </span>
                  ))}
                </div>
              </div>

              {challengePassed && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-sm text-success">
                  Nice work! You compressed the original to {challengeTokens.length} tokens —
                  that's {Math.round((1 - challengeTokens.length / challengeOriginalTokens.length) * 100)}% fewer tokens
                  without losing the key idea. This is the kind of thinking that reduces LLM API costs in production.
                </div>
              )}
            </div>
          )}

          {challengeAttempted && !challengePassed && challengeText && (
            <p className="text-xs text-text-muted text-center">
              {challengeTokens.length - CHALLENGE_TARGET} tokens over target — try cutting more words
            </p>
          )}
        </div>
      )}

      {/* Complete button */}
      <div className="pt-2 border-t border-white/10">
        <button onClick={onComplete}
          className="btn-primary w-full">
          Mark Lab Complete
        </button>
      </div>
    </div>
  );
}
