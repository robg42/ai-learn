import React, { useState } from 'react';
import { Bug, Wrench, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const BROKEN_AGENTS = [
  {
    id: 1,
    title: 'The Loop Bug',
    systemPrompt: `You are a research assistant. Your job is to help users find information.

When the user asks a question, always search the web first before answering.
After searching, if you are not 100% certain, search again to confirm.
Never answer without searching at least once.
If you find conflicting information, search again until the results agree.`,
    scenario: 'User asks: "What year was Python created?"',
    symptom: 'The agent keeps searching endlessly and never gives an answer.',
    bugs: [
      {
        text: '"if you are not 100% certain, search again"',
        issue: 'LLMs are probabilistic — they\'re never 100% certain. This causes infinite search loops.',
        fix: 'Remove the certainty requirement. Set a hard limit: "Search at most once, then answer with your best information."',
      },
      {
        text: '"search again until the results agree"',
        issue: 'Results may never fully agree. This is another infinite loop trigger.',
        fix: 'Replace with: "If results conflict, present both perspectives and note the uncertainty."',
      },
    ],
    fixedPrompt: `You are a research assistant. When the user asks a question:
1. Search the web once to find relevant information.
2. Synthesize what you found and answer clearly.
3. If information is conflicting or uncertain, say so explicitly.
Do not search more than once per question.`,
  },
  {
    id: 2,
    title: 'The Scope Creep Agent',
    systemPrompt: `You are a helpful file management assistant. Help users organize their files.

You have access to the following tools:
- read_file(path): Read a file's contents
- write_file(path, content): Write content to a file
- delete_file(path): Delete a file
- list_directory(path): List files in a directory
- execute_command(cmd): Run any shell command to help complete tasks

Always try to be maximally helpful and complete tasks thoroughly.
If a file management task requires running commands to achieve it, use execute_command.
Go above and beyond — anticipate what the user might need next and do it proactively.`,
    scenario: 'User asks: "Organize my Downloads folder."',
    symptom: 'Agent deletes files it deems "duplicates," runs cleanup scripts, and modifies system settings "proactively."',
    bugs: [
      {
        text: 'execute_command(cmd): Run any shell command',
        issue: 'Giving a file management agent unrestricted shell execution is a massive blast radius risk. A simple file task should not have system-level access.',
        fix: 'Remove execute_command entirely or restrict it to safe, scoped operations. Use dedicated tools for each action.',
      },
      {
        text: '"anticipate what the user might need next and do it proactively"',
        issue: 'Proactive action in agentic systems is dangerous. Agents should act on explicit instructions, not assumptions.',
        fix: 'Replace with: "Only take actions explicitly requested. If you think additional steps would help, ask the user first."',
      },
      {
        text: '"Go above and beyond"',
        issue: 'Vague instructions to "go above and beyond" encourage unpredictable, hard-to-audit behavior.',
        fix: 'Be specific: define exactly what "helpful" means in scope. E.g., "Only move, rename, or create folders — never delete without explicit confirmation."',
      },
    ],
    fixedPrompt: `You are a file management assistant. You can read, write, and list files.

Rules:
- Only perform actions the user explicitly requests.
- Never delete files. If deletion is needed, ask for confirmation and explain what will be removed.
- Never run shell commands.
- If a task is ambiguous, ask a clarifying question before acting.
- After completing an action, summarize exactly what you did.`,
  },
  {
    id: 3,
    title: 'The Amnesiac Agent',
    systemPrompt: `You are a customer support agent for TechCorp.

Answer customer questions about our products.
If you don't know the answer, make your best guess — customers don't like "I don't know."
Each question is independent. Do not reference previous messages.
Always sound confident and definitive.`,
    scenario: 'Customer asks about a specific product feature, then asks a follow-up clarification.',
    symptom: 'Agent gives confident but wrong answers, ignores context from previous turns, and contradicts itself.',
    bugs: [
      {
        text: '"make your best guess — customers don\'t like I don\'t know"',
        issue: 'Forcing confident guessing causes hallucinations. Customers dislike wrong information far more than honest uncertainty.',
        fix: 'Replace with: "If you don\'t know the answer, say so clearly and offer to escalate to a human agent or documentation."',
      },
      {
        text: '"Each question is independent. Do not reference previous messages."',
        issue: 'Disabling conversation context makes follow-up questions impossible to answer correctly.',
        fix: 'Remove this instruction entirely. Agents should maintain conversation context by default.',
      },
      {
        text: '"Always sound confident and definitive."',
        issue: 'False confidence erodes trust when errors are discovered and prevents appropriate hedging.',
        fix: 'Replace with: "Be clear and direct, but use appropriate uncertainty language when you are not certain (e.g., \'I believe…\', \'You may want to verify…\')."',
      },
    ],
    fixedPrompt: `You are a TechCorp customer support agent.

- Answer questions accurately based on what you know about TechCorp products.
- If you're unsure, say so and offer to connect the customer with documentation or a human agent.
- Maintain context across the conversation — reference earlier messages when relevant.
- Be clear and friendly, but accurate first, confident second.`,
  },
];

export default function BrokenAgentLab({ onComplete }) {
  const [agentIdx, setAgentIdx] = useState(0);
  const [expandedBugs, setExpandedBugs] = useState({});
  const [showFix, setShowFix] = useState(false);
  const [identified, setIdentified] = useState({});
  const [completed, setCompleted] = useState(false);

  const agent = BROKEN_AGENTS[agentIdx];
  const allIdentified = agent.bugs.every((_, i) => identified[`${agentIdx}-${i}`]);

  const toggleBug = (i) => {
    const key = `${agentIdx}-${i}`;
    setIdentified(prev => {
      const next = { ...prev, [key]: true };
      return next;
    });
    setExpandedBugs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    if (agentIdx + 1 >= BROKEN_AGENTS.length) {
      if (!completed) {
        setCompleted(true);
        onComplete?.();
      }
    } else {
      setAgentIdx(agentIdx + 1);
      setShowFix(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Bug className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-300 mb-1">Debug the Broken Agent</p>
            <p className="text-xs text-text-muted leading-relaxed">
              Real-world agent failures usually come from bad system prompt design — not bugs in code.
              Read each broken agent's system prompt and scenario, click the problematic instructions
              to reveal what's wrong and how to fix it.
            </p>
          </div>
        </div>
      </div>

      {/* Agent selector */}
      <div className="flex gap-2">
        {BROKEN_AGENTS.map((a, i) => (
          <button key={i} onClick={() => { setAgentIdx(i); setShowFix(false); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${i === agentIdx
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
              : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}`}>
            {i + 1}. {a.title}
          </button>
        ))}
      </div>

      {/* Scenario */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Scenario</p>
        <p className="text-sm text-text-primary">{agent.scenario}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{agent.symptom}</span>
        </div>
      </div>

      {/* Broken system prompt */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-2">
          Broken system prompt — click highlighted lines to reveal issues:
        </p>
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-xs leading-relaxed space-y-1.5">
          {agent.systemPrompt.split('\n').map((line, lineIdx) => {
            const bugIdx = agent.bugs.findIndex(b => line.includes(b.text.replace(/'/g, "'")));
            const isBug = bugIdx !== -1;
            const key = `${agentIdx}-${bugIdx}`;
            const isExpanded = expandedBugs[key];
            const wasIdentified = identified[key];

            return (
              <div key={lineIdx}>
                <span
                  onClick={isBug ? () => toggleBug(bugIdx) : undefined}
                  className={`block px-2 py-0.5 rounded transition-all ${isBug
                    ? 'bg-red-500/20 text-red-300 cursor-pointer hover:bg-red-500/30 border border-red-500/30'
                    : 'text-text-muted'}`}>
                  {line || '\u00a0'}
                  {isBug && <span className="ml-2 text-[10px] text-red-400/70">{wasIdentified ? '← click for fix' : '← suspicious'}</span>}
                </span>
                {isBug && isExpanded && (
                  <div className="mt-1 mb-2 mx-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">Problem:</p>
                      <p className="text-xs text-text-muted">{agent.bugs[bugIdx].issue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1">Fix:</p>
                      <p className="text-xs text-text-muted">{agent.bugs[bugIdx].fix}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed prompt */}
      {allIdentified && (
        <div>
          <button onClick={() => setShowFix(!showFix)}
            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors">
            <Wrench className="w-4 h-4" />
            {showFix ? 'Hide' : 'Show'} fixed system prompt
            {showFix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showFix && (
            <div className="mt-2 bg-green-500/5 border border-green-500/20 rounded-xl p-4 font-mono text-xs text-green-200 leading-relaxed whitespace-pre-wrap">
              {agent.fixedPrompt}
            </div>
          )}
        </div>
      )}

      {allIdentified && (
        <div className="flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-400">All bugs identified!</span>
          <button onClick={handleNext}
            className="ml-auto bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all">
            {agentIdx + 1 >= BROKEN_AGENTS.length ? 'Complete Lab ✓' : 'Next Agent →'}
          </button>
        </div>
      )}
    </div>
  );
}
