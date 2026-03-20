import React, { useState } from 'react';
import { User, CheckCircle, XCircle, Trophy, Info } from 'lucide-react';

const OVERSIGHT_LEVELS = [
  { id: 'full-auto', label: 'Fully Automated', description: 'Agent acts immediately, no human review', color: '#ef4444', icon: '🤖' },
  { id: 'notify', label: 'Notify & Log', description: 'Agent acts, human notified after the fact', color: '#f59e0b', icon: '📣' },
  { id: 'review', label: 'Human Review', description: 'Agent proposes action, human approves before execution', color: '#3b82f6', icon: '👁️' },
  { id: 'manual', label: 'Human Executes', description: 'Agent only provides recommendations, human does everything', color: '#22c55e', icon: '✋' },
];

const SCENARIOS = [
  {
    question: 'An AI agent monitors server logs and detects a possible intrusion. It wants to block the suspicious IP address.',
    context: 'Production system, ~50ms to act, false positive rate ~15%',
    recommended: 'review',
    reasoning: {
      'full-auto': 'Too risky — 15% false positive rate means blocking legitimate users frequently. Blocking is a significant action with real consequences.',
      'notify': 'Better, but notifying after blocking means the damage (legitimate user blocked) is already done.',
      'review': 'Best balance — agent can prepare the block with one click for human approval. The small delay (seconds) is worth avoiding false positives.',
      'manual': 'Overly conservative — humans can\'t monitor logs 24/7. The agent provides clear value in detection; only the execution decision needs oversight.',
    },
  },
  {
    question: 'An AI coding assistant auto-formats code and adds docstrings to new files in a shared repository.',
    context: 'Low-stakes, fully reversible via git, no security implications',
    recommended: 'full-auto',
    reasoning: {
      'full-auto': 'Correct — the task is fully reversible (git revert), low stakes, and adding friction would defeat the purpose of the tool.',
      'notify': 'Reasonable but creates unnecessary noise in notifications for a trivial, reversible action.',
      'review': 'Overkill — requiring approval for formatting adds friction without meaningful benefit.',
      'manual': 'Defeats the entire purpose of the tool. Developer might as well format code themselves.',
    },
  },
  {
    question: 'An AI customer service agent wants to issue a $500 refund to a customer who claims a product was damaged.',
    context: 'Financial action, fraud rate for refunds ~2%, customer is frustrated',
    recommended: 'review',
    reasoning: {
      'full-auto': 'Risky for financial actions — while fraud rate is low, $500 automated refunds are an attractive target for abuse at scale.',
      'notify': 'Notification after issuing $500 doesn\'t help if the refund was fraudulent.',
      'review': 'Best choice — human can quickly verify the claim, approve legitimate cases, and flag suspicious patterns. The 2% fraud rate matters at scale.',
      'manual': 'Too slow for customer satisfaction. The agent should surface the claim, verify what it can, and escalate clearly — not do nothing.',
    },
  },
  {
    question: 'An AI research assistant adds summaries to a personal notes database as you read articles.',
    context: 'Personal productivity tool, single user, no external effects',
    recommended: 'full-auto',
    reasoning: {
      'full-auto': 'Perfect use case — single user, personal notes, fully reversible, and constant approvals would destroy usability.',
      'notify': 'Fine but unnecessary friction for personal productivity. Notifications add noise without benefit.',
      'review': 'Defeats the purpose — you\'d spend more time approving summaries than the summaries save.',
      'manual': 'Same as not having the tool at all.',
    },
  },
  {
    question: 'An AI agent is given access to send emails on behalf of a CEO, responding to routine scheduling requests.',
    context: 'High-visibility, external communication, reputational risk if wrong',
    recommended: 'review',
    reasoning: {
      'full-auto': 'Too risky — external emails from a CEO carry significant reputational weight. Even small errors (wrong time, wrong attendee) have consequences.',
      'notify': 'Better but emails sent on behalf of a CEO should not go out without verification — you can\'t unsend.',
      'review': 'Correct — agent drafts the response, CEO approves with one click. Keeps efficiency while maintaining control over external communications.',
      'manual': 'The agent adds no value if the human has to type every response. The value is in drafting, not sending.',
    },
  },
  {
    question: 'An AI pipeline validates data quality and flags records with missing fields before import.',
    context: 'Flags only, no data modification, part of ETL pipeline',
    recommended: 'full-auto',
    reasoning: {
      'full-auto': 'Correct — the agent only flags; it doesn\'t modify or delete data. Read-only analysis with no side effects is ideal for full automation.',
      'notify': 'Reasonable, but sending a notification for every flagged record in a large ETL pipeline creates noise.',
      'review': 'Overkill — approval required for flagging is unnecessary when no action is taken.',
      'manual': 'Not viable for large-scale data pipelines. Automated validation is the entire point.',
    },
  },
];

export default function HITLDesignLab({ onComplete }) {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [completed, setCompleted] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];
  const answer = answers[scenarioIdx];
  const isRevealed = revealed[scenarioIdx];
  const isCorrect = answer === scenario.recommended;

  const handleSelect = (levelId) => {
    if (isRevealed) return;
    setAnswers(prev => ({ ...prev, [scenarioIdx]: levelId }));
  };

  const handleReveal = () => {
    setRevealed(prev => ({ ...prev, [scenarioIdx]: true }));
  };

  const handleNext = () => {
    if (scenarioIdx + 1 >= SCENARIOS.length) {
      if (!completed) {
        setCompleted(true);
        onComplete?.();
      }
    } else {
      setScenarioIdx(s => s + 1);
    }
  };

  const score = Object.entries(answers).filter(([idx, ans]) => SCENARIOS[+idx].recommended === ans).length;
  const answered = Object.keys(revealed).length;

  if (completed) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">HITL Design Complete!</h3>
        <p className="text-text-muted">You matched {score}/{SCENARIOS.length} recommended oversight levels.</p>
        <div className="text-xs text-text-muted mt-4 max-w-md mx-auto bg-white/5 rounded-xl p-4 text-left space-y-2">
          <p className="font-medium text-text-primary flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Design principles:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong className="text-text-primary">Reversibility</strong> — reversible actions need less oversight.</li>
            <li><strong className="text-text-primary">Stakes</strong> — financial, reputational, or safety risks need human review.</li>
            <li><strong className="text-text-primary">Blast radius</strong> — single-user vs external effects changes the calculus.</li>
            <li><strong className="text-text-primary">Error rate</strong> — even 2% errors matter at scale in high-volume automated systems.</li>
            <li><strong className="text-text-primary">Speed</strong> — some decisions (intrusions) need to be fast; design accordingly.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-300 mb-1">Human-in-the-Loop Design</p>
            <p className="text-xs text-text-muted leading-relaxed">
              For each scenario, choose the appropriate level of human oversight. There's no single right answer for all
              situations — good HITL design matches oversight to risk, reversibility, and stakes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Scenario {scenarioIdx + 1} / {SCENARIOS.length}</span>
        <span>Score: {score} / {answered}</span>
      </div>

      {/* Scenario */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-text-primary">{scenario.question}</p>
        <p className="text-xs text-text-muted italic">{scenario.context}</p>
      </div>

      {/* Oversight level options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OVERSIGHT_LEVELS.map(level => {
          const isSelected = answer === level.id;
          const isRecommended = level.id === scenario.recommended;
          let borderColor = isSelected ? level.color : 'rgba(255,255,255,0.1)';
          let bg = isSelected ? `${level.color}15` : 'rgba(255,255,255,0.02)';

          if (isRevealed) {
            if (isRecommended) { borderColor = level.color; bg = `${level.color}15`; }
            else { borderColor = 'rgba(255,255,255,0.05)'; bg = 'rgba(255,255,255,0.02)'; }
          }

          return (
            <div key={level.id} onClick={() => handleSelect(level.id)}
              className={`rounded-xl border p-3 transition-all ${isRevealed ? 'cursor-default' : 'cursor-pointer hover:border-white/20'}`}
              style={{ borderColor, backgroundColor: bg }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{level.icon}</span>
                  <p className="text-sm font-semibold" style={{ color: isSelected || (isRevealed && isRecommended) ? level.color : undefined }}>
                    {level.label}
                  </p>
                </div>
                {isRevealed && isRecommended && <CheckCircle className="w-4 h-4 text-green-400" />}
                {isRevealed && isSelected && !isRecommended && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-xs text-text-muted">{level.description}</p>
              {isRevealed && scenario.reasoning[level.id] && (
                <p className={`text-xs mt-2 leading-relaxed ${isRecommended ? 'text-green-300' : 'text-text-muted/70'}`}>
                  {scenario.reasoning[level.id]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        {!isRevealed && (
          <button onClick={handleReveal} disabled={!answer}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Reveal Answer
          </button>
        )}
        {isRevealed && (
          <button onClick={handleNext}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all">
            {scenarioIdx + 1 >= SCENARIOS.length ? 'Complete Lab ✓' : 'Next Scenario →'}
          </button>
        )}
      </div>
    </div>
  );
}
