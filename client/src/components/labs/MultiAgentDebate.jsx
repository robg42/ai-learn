import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Play, Edit3, RotateCcw } from 'lucide-react';

const TOPICS = [
  {
    label: 'AI Regulation',
    question: 'Should AI development be heavily regulated by governments?',
    defaultAgents: [
      { name: 'Optimist', persona: 'You believe AI will solve humanity\'s greatest problems. You are enthusiastic about AI progress and think regulation will slow down beneficial innovation. Keep responses to 2-3 sentences.', color: '#22c55e' },
      { name: 'Skeptic', persona: 'You are deeply concerned about AI risks — job displacement, misinformation, and existential risk. You believe strong regulation is essential before deploying powerful AI. Keep responses to 2-3 sentences.', color: '#ef4444' },
    ],
  },
  {
    label: 'Open Source AI',
    question: 'Should frontier AI models be open-sourced?',
    defaultAgents: [
      { name: 'Open Advocate', persona: 'You strongly support open-source AI. You believe transparency, reproducibility, and democratized access outweigh any risks. Keep responses to 2-3 sentences.', color: '#3b82f6' },
      { name: 'Safety Researcher', persona: 'You worry that open-sourcing powerful models enables misuse — bioweapons, cyberattacks, and disinformation at scale. You think capability evaluations must precede any release. Keep responses to 2-3 sentences.', color: '#f59e0b' },
    ],
  },
  {
    label: 'AGI Timeline',
    question: 'Will we achieve AGI within the next 10 years?',
    defaultAgents: [
      { name: 'Accelerationist', persona: 'You believe AGI is coming very soon — within 5 years. Scaling laws show no sign of plateauing and current research trajectories point to transformative AI imminently. Keep responses to 2-3 sentences.', color: '#8b5cf6' },
      { name: 'Gradualist', persona: 'You think AGI is still decades away. Current LLMs lack genuine understanding, common sense, and embodied cognition. Real-world deployment difficulties reveal deep limitations. Keep responses to 2-3 sentences.', color: '#64748b' },
    ],
  },
];

const ROUNDS = 3;

export default function MultiAgentDebate({ onComplete }) {
  const { token } = useAuth();
  const [topicIdx, setTopicIdx] = useState(0);
  const [agents, setAgents] = useState(null);
  const [editing, setEditing] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const [completed, setCompleted] = useState(false);

  const topic = TOPICS[topicIdx];

  const initAgents = () => {
    setAgents(topic.defaultAgents.map(a => ({ ...a })));
    setTranscript([]);
    setRound(0);
    setDone(false);
  };

  const resetDebate = () => {
    setTranscript([]);
    setRound(0);
    setDone(false);
    setAgents(null);
  };

  const streamAgentResponse = async (agent, history) => {
    const messages = [
      { role: 'user', content: `Topic: "${topic.question}"\n\nDebate history so far:\n${history || '(no history yet — you go first)'}\n\nNow give your next argument. Be direct and stay in character.` },
    ];
    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages, mode: 'tutor', lessonTitle: agent.persona, lessonContent: '' }),
      });
      if (!res.ok) return '(error)';
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
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
          try { const p = JSON.parse(data); if (p.text) full += p.text; } catch {}
        }
      }
      return full.trim();
    } catch {
      return '(error fetching response)';
    }
  };

  const runNextRound = async () => {
    if (running) return;
    setRunning(true);
    const currentRound = round + 1;

    const history = transcript.map(t => `${t.name}: ${t.text}`).join('\n\n');

    // Run both agents (sequentially to avoid rate limits)
    const currentAgents = agents || topic.defaultAgents;
    for (const agent of currentAgents) {
      const text = await streamAgentResponse(agent, history);
      setTranscript(prev => [...prev, { name: agent.name, text, color: agent.color, roundNum: currentRound }]);
    }

    if (currentRound >= ROUNDS) {
      setDone(true);
      if (!completed) {
        setCompleted(true);
        onComplete?.();
      }
    }
    setRound(currentRound);
    setRunning(false);
  };

  const activeAgents = agents || topic.defaultAgents;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-1">Multi-Agent Debate</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Watch two AI agents with opposing viewpoints debate a topic. You can modify their personas
              before starting to see how different framing affects the arguments they make.
              This demonstrates how system prompts shape AI behavior and "perspective."
            </p>
          </div>
        </div>
      </div>

      {/* Topic selector */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-2">Choose a debate topic:</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t, i) => (
            <button key={i} onClick={() => { setTopicIdx(i); resetDebate(); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${i === topicIdx
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm font-medium text-text-primary bg-white/5 rounded-lg px-3 py-2">
          "{topic.question}"
        </p>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeAgents.map((agent, i) => (
          <div key={i} className="rounded-xl border bg-white/3 p-3 overflow-hidden" style={{ borderColor: `${agent.color}30` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
              <p className="text-sm font-semibold" style={{ color: agent.color }}>{agent.name}</p>
            </div>
            {editing ? (
              <textarea
                value={agent.persona}
                onChange={e => {
                  const updated = [...activeAgents];
                  updated[i] = { ...updated[i], persona: e.target.value };
                  setAgents(updated);
                }}
                className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-text-muted resize-none focus:outline-none focus:border-primary/50"
                rows={4}
              />
            ) : (
              <p className="text-xs text-text-muted leading-relaxed">{agent.persona}</p>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {transcript.length === 0 && (
          <button onClick={() => { setEditing(!editing); if (!agents) initAgents(); }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors border border-white/10 rounded-lg px-3 py-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            {editing ? 'Done editing' : 'Edit personas'}
          </button>
        )}
        {transcript.length > 0 && (
          <button onClick={resetDebate}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
        {!done && (
          <button onClick={runNextRound} disabled={running || editing}
            className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 ml-auto">
            {running ? <span className="animate-spin text-base">⟳</span> : <Play className="w-4 h-4" />}
            {round === 0 ? 'Start Debate' : `Round ${round + 1} / ${ROUNDS}`}
          </button>
        )}
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider">Debate Transcript</p>
          {[...Array(Math.max(...transcript.map(t => t.roundNum)))].map((_, ri) => (
            <div key={ri}>
              <p className="text-[10px] text-text-muted/60 uppercase tracking-wider mb-2">— Round {ri + 1} —</p>
              {transcript.filter(t => t.roundNum === ri + 1).map((turn, ti) => (
                <div key={ti} className="rounded-xl border p-3 mb-2 bg-white/3" style={{ borderColor: `${turn.color}20` }}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: turn.color }}>{turn.name}</p>
                  <p className="text-sm text-text-primary leading-relaxed">{turn.text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {done && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-text-muted space-y-2">
          <p className="text-text-primary font-medium">Debate complete. What to observe:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>Each agent consistently argued from its assigned perspective — even on complex, nuanced topics.</li>
            <li>If you edited the personas, you changed the direction of the entire debate.</li>
            <li>This is why system prompts in multi-agent systems need careful design — agents inherit their worldview from them.</li>
            <li>In production, uncoordinated agents with conflicting goals can produce incoherent or contradictory outputs.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
