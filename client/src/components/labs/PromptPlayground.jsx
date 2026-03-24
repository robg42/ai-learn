import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle, Send, RotateCcw, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

const CHALLENGES = [
  {
    id: 'json',
    title: 'JSON Only',
    difficulty: 'Easy',
    description: 'Write a prompt that makes the model output ONLY a valid JSON object — no other text, no explanation, no markdown fences.',
    context: 'You have a customer record: Name: Alice Chen, Plan: Pro, MRR: $99, Since: 2022-03-15',
    placeholder: 'Your prompt here… e.g. "Output a JSON object containing..."',
    successCheck: (output) => {
      const trimmed = output.trim();
      try { JSON.parse(trimmed); return true; } catch {}
      // Allow json in code fences as partial pass
      const match = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) { try { JSON.parse(match[1].trim()); return true; } catch {} }
      return false;
    },
    successNote: 'Clean JSON output — ready to feed directly into code. This is structured output in action.',
    failNote: 'The model included extra text or the JSON is invalid. Try being more explicit: "Output ONLY valid JSON, nothing else."',
  },
  {
    id: 'bullets',
    title: 'Exactly 3 Bullet Points',
    difficulty: 'Easy',
    description: 'Summarise the following passage in exactly 3 bullet points — no more, no fewer.',
    context: 'Passage: "Large language models are trained on vast amounts of text data to predict the next token in a sequence. This simple objective, applied at scale, results in models that can write code, answer questions, translate languages, and reason through complex problems. The key insight is that next-token prediction, when trained on diverse human knowledge, produces remarkably general capabilities."',
    placeholder: 'Your prompt here…',
    successCheck: (output) => {
      const bullets = (output.match(/^[\s]*[-•*]\s/gm) || []).length +
                      (output.match(/^\s*\d+\.\s/gm) || []).length;
      return bullets === 3;
    },
    successNote: 'Exactly 3 bullet points — precise format control achieved. Useful for generating structured content for UIs.',
    failNote: 'Got more or fewer than 3 bullets. Try being very explicit about the count and format.',
  },
  {
    id: 'extract',
    title: 'Entity Extraction',
    difficulty: 'Medium',
    description: 'Extract all company names from the text below. Output ONLY a comma-separated list of company names — nothing else.',
    context: 'Text: "Apple and Microsoft are competing in the AI space, while Anthropic and OpenAI lead in foundation models. Google DeepMind continues its research push, and Meta AI has open-sourced Llama. Meanwhile, startups like Mistral AI and Cohere are gaining traction with enterprise customers."',
    placeholder: 'Your prompt here…',
    successCheck: (output) => {
      const trimmed = output.trim().toLowerCase();
      const expected = ['apple', 'microsoft', 'anthropic', 'openai', 'google', 'meta', 'mistral', 'cohere'];
      const found = expected.filter(name => trimmed.includes(name));
      // Must find at least 6 of 8 names and output should be mostly a list (no long sentences)
      return found.length >= 6 && output.trim().split('\n').length <= 3;
    },
    successNote: 'Clean entity extraction — no extra commentary. This pattern powers information extraction pipelines.',
    failNote: 'Try: "Output ONLY a comma-separated list of company names from the text, nothing else." Explicit format constraints help.',
  },
  {
    id: 'constraint',
    title: 'Exactly 50 Words',
    difficulty: 'Hard',
    description: 'Explain what a neural network is in exactly 50 words. Not 49, not 51 — exactly 50.',
    context: 'Topic: What is a neural network?',
    placeholder: 'Your prompt here…',
    successCheck: (output) => {
      const words = output.trim().split(/\s+/).filter(w => w.length > 0);
      return words.length === 50;
    },
    successNote: `Exactly 50 words! Getting models to hit precise word counts is hard — you likely needed to iterate. This teaches why exact-length constraints are difficult and sometimes need post-processing.`,
    failNote: (output) => {
      const words = output.trim().split(/\s+/).filter(w => w.length > 0);
      return `Got ${words.length} words. ${words.length > 50 ? 'Try asking the model to be more concise.' : 'Try asking for a more detailed explanation.'} Exact word counts are notoriously tricky — consider asking for "around 50 words" in production.`;
    },
  },
  {
    id: 'cot',
    title: 'Structured Reasoning',
    difficulty: 'Hard',
    description: 'Get the model to reason through this problem step-by-step and show its work before giving a final answer.',
    context: 'Problem: A company\'s AI system processes 10,000 API calls per day. Each call uses an average of 2,000 input tokens and 500 output tokens. Input costs $3 per million tokens; output costs $15 per million tokens. What is the monthly API cost, and is this more or less than $2,000/month?',
    placeholder: 'Your prompt here… try to get step-by-step reasoning visible',
    successCheck: (output) => {
      const lower = output.toLowerCase();
      // Must show working and reach the right answer (~$3,150/month)
      const hasSteps = lower.includes('step') || lower.includes('first') || lower.includes('calculate') || lower.includes('1.');
      const hasAnswer = lower.includes('3,15') || lower.includes('3150') || lower.includes('$3,1') || lower.includes('more than');
      return hasSteps && hasAnswer;
    },
    successNote: 'Step-by-step reasoning with the correct answer ($3,150/month, which is more than $2,000). Chain-of-thought prompting dramatically improves accuracy on arithmetic and multi-step problems.',
    failNote: 'Try adding "Think step by step" or "Show your working" to your prompt. Chain-of-thought prompting is one of the highest-impact prompting techniques for reasoning tasks.',
  },
];

export default function PromptPlayground({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [prompts, setPrompts] = useState(Array(CHALLENGES.length).fill(''));
  const [outputs, setOutputs] = useState(Array(CHALLENGES.length).fill(''));
  const [results, setResults] = useState(Array(CHALLENGES.length).fill(null));
  const [streaming, setStreaming] = useState(false);
  const [showHint, setShowHint] = useState(Array(CHALLENGES.length).fill(false));

  const challenge = CHALLENGES[currentIdx];
  const currentPrompt = prompts[currentIdx];
  const currentOutput = outputs[currentIdx];
  const currentResult = results[currentIdx];

  const run = async () => {
    if (!currentPrompt.trim() || streaming) return;

    setOutputs(prev => prev.map((v, i) => i === currentIdx ? '' : v));
    setResults(prev => prev.map((v, i) => i === currentIdx ? null : v));
    setStreaming(true);

    const fullPrompt = `${currentPrompt}\n\n${challenge.context}`;

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [{ role: 'user', content: fullPrompt }],
          mode: 'playground',
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullOutput = '';

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
              fullOutput += parsed.text;
              setOutputs(prev => prev.map((v, i) => i === currentIdx ? fullOutput : v));
            }
          } catch {}
        }
      }

      const passed = challenge.successCheck(fullOutput);
      setResults(prev => prev.map((v, i) => i === currentIdx ? (passed ? 'pass' : 'fail') : v));
    } catch {
      setOutputs(prev => prev.map((v, i) => i === currentIdx ? '⚠️ Error — try again' : v));
    } finally {
      setStreaming(false);
    }
  };

  const passCount = results.filter(r => r === 'pass').length;
  const difficultyColor = { Easy: 'text-success bg-success/10', Medium: 'text-warning bg-warning/10', Hard: 'text-red-400 bg-red-400/10' };

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {CHALLENGES.map((c, i) => (
            <button key={c.id} onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                currentIdx === i
                  ? 'bg-primary/20 border border-primary/40 text-primary'
                  : results[i] === 'pass'
                  ? 'bg-success/10 border border-success/20 text-success'
                  : results[i] === 'fail'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-white/5 border border-white/10 text-text-muted'
              }`}>
              {results[i] === 'pass' ? '✓' : results[i] === 'fail' ? '✗' : i + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-warning" />
          <span className="text-text-primary font-semibold">{passCount}</span>
          <span className="text-text-muted">/ {CHALLENGES.length} passed</span>
        </div>
      </div>

      {/* Challenge card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{challenge.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
        </div>
        <p className="text-sm text-text-muted">{challenge.description}</p>

        {/* Context */}
        <div className="bg-bg-dark rounded-lg p-3">
          <p className="text-xs text-text-muted/60 mb-1">Given to the model:</p>
          <p className="text-xs text-text-primary/80 font-mono">{challenge.context}</p>
        </div>

        {/* Hint toggle */}
        <button onClick={() => setShowHint(prev => prev.map((v, i) => i === currentIdx ? !v : v))}
          className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
          {showHint[currentIdx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showHint[currentIdx] ? 'Hide hint' : 'Show hint'}
        </button>
        {showHint[currentIdx] && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-primary/80">
            <strong>Hint:</strong>{' '}
            {challenge.id === 'json' && 'Be explicit: "Output ONLY valid JSON, no other text." Try adding an example of the structure you want.'}
            {challenge.id === 'bullets' && 'Specify format precisely: "Output exactly 3 bullet points using • as the bullet character."'}
            {challenge.id === 'extract' && '"Extract all company names mentioned. Output ONLY a comma-separated list."'}
            {challenge.id === 'constraint' && 'LLMs struggle with exact counts. Try: "Explain in exactly 50 words. Count carefully."'}
            {challenge.id === 'cot' && 'Add "Think step by step" or "Show your calculation for each step" to your prompt.'}
          </div>
        )}
      </div>

      {/* Prompt input */}
      <div className="space-y-2">
        <label className="text-xs text-text-muted font-medium">Your Prompt</label>
        <textarea
          value={currentPrompt}
          onChange={e => setPrompts(prev => prev.map((v, i) => i === currentIdx ? e.target.value : v))}
          onKeyDown={e => e.key === 'Enter' && e.metaKey && run()}
          placeholder={challenge.placeholder}
          rows={4}
          disabled={streaming}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none disabled:opacity-50 font-mono"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted/50">⌘/Ctrl+Enter to run</p>
          <div className="flex gap-2">
            <button onClick={() => {
              setPrompts(prev => prev.map((v, i) => i === currentIdx ? '' : v));
              setOutputs(prev => prev.map((v, i) => i === currentIdx ? '' : v));
              setResults(prev => prev.map((v, i) => i === currentIdx ? null : v));
            }} className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <button onClick={run} disabled={!currentPrompt.trim() || streaming}
              className="btn-primary px-4 py-1.5 text-xs flex items-center gap-2">
              {streaming ? 'Running…' : 'Run Prompt'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      {(currentOutput || streaming) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-muted font-medium">Model Output</label>
            {currentResult && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                currentResult === 'pass' ? 'text-success' : 'text-red-400'
              }`}>
                {currentResult === 'pass'
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Passed!</>
                  : <><XCircle className="w-3.5 h-3.5" /> Not quite</>
                }
              </div>
            )}
          </div>
          <div className={`bg-bg-dark border rounded-xl p-4 text-sm font-mono whitespace-pre-wrap text-text-primary/90 max-h-48 overflow-y-auto transition-colors ${
            currentResult === 'pass' ? 'border-success/20' : currentResult === 'fail' ? 'border-red-500/20' : 'border-white/10'
          }`}>
            {currentOutput || <span className="text-text-muted animate-pulse">●●●</span>}
          </div>

          {/* Feedback */}
          {currentResult && (
            <div className={`rounded-xl p-4 text-xs ${
              currentResult === 'pass'
                ? 'bg-success/10 border border-success/20 text-success'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              {currentResult === 'pass'
                ? (typeof challenge.successNote === 'function' ? challenge.successNote(currentOutput) : challenge.successNote)
                : (typeof challenge.failNote === 'function' ? challenge.failNote(currentOutput) : challenge.failNote)
              }
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        {currentIdx > 0 && (
          <button onClick={() => setCurrentIdx(prev => prev - 1)} className="btn-secondary px-4 py-2 text-sm">
            ← Previous
          </button>
        )}
        {currentIdx < CHALLENGES.length - 1 && (
          <button onClick={() => setCurrentIdx(prev => prev + 1)} className="btn-secondary px-4 py-2 text-sm ml-auto">
            Next →
          </button>
        )}
      </div>

      {/* Complete */}
      {passCount >= 3 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-warning flex items-center gap-2">
            <Trophy className="w-4 h-4" /> {passCount}/5 challenges passed!
          </p>
          <p className="text-xs text-text-muted">
            You've demonstrated core prompting skills: structured output, format control, entity extraction, and reasoning. These patterns appear in virtually every production LLM application.
          </p>
          <button onClick={onComplete} className="btn-primary w-full">Mark Lab Complete</button>
        </div>
      )}
      {passCount < 3 && (
        <p className="text-xs text-text-muted text-center">Pass 3 or more challenges to complete the lab ({passCount}/3)</p>
      )}
    </div>
  );
}
