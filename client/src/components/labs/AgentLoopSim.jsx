import React, { useState } from 'react';
import { Search, FileText, CheckSquare, ChevronRight, RotateCcw, Brain, Eye, Zap } from 'lucide-react';

const TASK = 'Research the top 3 open-source LLM frameworks and write a one-paragraph summary comparing them.';

const TOOL_DEFINITIONS = [
  { id: 'search_web', label: 'search_web(query)', icon: Search, color: '#6366f1', description: 'Search the web for information' },
  { id: 'read_page', label: 'read_page(url)', icon: FileText, color: '#10b981', description: 'Read the contents of a URL' },
  { id: 'write_summary', label: 'write_summary(content)', icon: CheckSquare, color: '#f59e0b', description: 'Write the final summary output' },
];

// Pre-scripted agent steps: each step has a "think" phase, then asks the user to pick a tool.
// The "correct" tool is shown as highlighted, but wrong choices are educational.
const STEPS = [
  {
    id: 1,
    thinking: `I need to find the top open-source LLM frameworks. I don't have this information yet, so I should search for it first. Writing a summary now would be empty, and I don't have a URL to read yet.`,
    prompt: 'What should the agent do first?',
    correctTool: 'search_web',
    toolArgs: {
      search_web: 'query: "top open source LLM frameworks 2024"',
      read_page: 'url: ???',
      write_summary: 'content: (nothing yet)',
    },
    toolResults: {
      search_web: {
        success: true,
        output: `Search results:
1. LangChain (langchain.com) — Most popular framework, 80k+ GitHub stars. Tool calling, agents, RAG pipelines.
2. LlamaIndex (llamaindex.ai) — Specialises in data connectors and RAG. Great for document Q&A.
3. Haystack (haystack.deepset.ai) — Production-focused NLP pipelines. Strong enterprise adoption.
4. AutoGen (microsoft.github.io/autogen) — Multi-agent orchestration by Microsoft.`,
      },
      read_page: { success: false, output: 'Error: No URL provided. The agent needs to search first to find URLs.' },
      write_summary: { success: false, output: 'Error: Summary content is empty. The agent has not gathered any information yet.' },
    },
    insight: 'The agent correctly starts with search — it has no information yet. Without data, writing a summary or reading a page is premature.',
  },
  {
    id: 2,
    thinking: `I found three strong candidates: LangChain, LlamaIndex, and Haystack. I should read at least one page to get more detail before writing the summary. Let me read the LangChain page since it has the most GitHub stars.`,
    prompt: 'The agent found search results. What should it do next?',
    correctTool: 'read_page',
    toolArgs: {
      search_web: 'query: "more details about LLM frameworks"',
      read_page: 'url: "langchain.com"',
      write_summary: 'content: (only have search snippets so far)',
    },
    toolResults: {
      search_web: {
        success: true,
        output: `Second search results — similar to first, no new information. Agent is repeating itself. This is a common failure mode called "search loop".`,
      },
      read_page: {
        success: true,
        output: `LangChain documentation:
LangChain is the most widely adopted LLM application framework. Key capabilities: chains (compose LLM calls), agents (autonomous tool use), memory (conversation state), RAG (document retrieval), and 200+ integrations. Best for: building complex, modular LLM pipelines with many components. Actively maintained with daily releases. Python and TypeScript SDKs.`,
      },
      write_summary: {
        success: true,
        output: `⚠️ Partial summary written based on search snippets only:
"LangChain, LlamaIndex, and Haystack are popular frameworks — check their websites for details."
This is technically complete but lacks depth. In a real task, this might be acceptable if the user wants speed over depth.`,
        partial: true,
      },
    },
    insight: 'Reading a page gives deeper information. A second search yields no new value — a common agent failure mode. Writing now gives a partial result; reading first enables a better summary.',
  },
  {
    id: 3,
    thinking: `I have detailed information about LangChain and surface-level info about LlamaIndex and Haystack from the search. I have enough to write a useful comparison paragraph. I could read more pages for even more detail, but the task says "one paragraph" — I have sufficient information.`,
    prompt: 'The agent has read one page. What now?',
    correctTool: 'write_summary',
    toolArgs: {
      search_web: 'query: "LlamaIndex vs Haystack comparison"',
      read_page: 'url: "llamaindex.ai"',
      write_summary: 'content: (detailed info ready)',
    },
    toolResults: {
      search_web: {
        success: true,
        output: `More search results about LlamaIndex and Haystack. Useful, but we already have enough for a one-paragraph summary. The agent is at risk of over-researching.`,
        overresearch: true,
      },
      read_page: {
        success: true,
        output: `LlamaIndex docs: Specialises in connecting LLMs to external data — databases, PDFs, APIs. Built around the concept of "indexes" for efficient retrieval. Best for RAG applications. Also useful, but the agent now has more than enough information for one paragraph.`,
        overresearch: true,
      },
      write_summary: {
        success: true,
        output: `✅ Final summary:
"The three leading open-source LLM frameworks each target different use cases. LangChain is the most popular (80k+ GitHub stars), offering modular chains, agents, and 200+ integrations for complex LLM pipelines. LlamaIndex specialises in RAG — connecting LLMs to structured and unstructured data sources with efficient indexing. Haystack is production-focused, favoured in enterprise settings for reliable NLP pipeline deployment. For new projects: LangChain for flexibility, LlamaIndex for document Q&A, Haystack for production reliability."`,
      },
    },
    insight: 'The agent correctly stops researching and writes the summary. Continuing to search or read more pages would be over-engineering — the task asked for one paragraph, and the agent has enough information.',
  },
];

export default function AgentLoopSim({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState('think'); // 'think' | 'act' | 'observe'
  const [selectedTool, setSelectedTool] = useState(null);
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleToolSelect = (toolId) => {
    if (phase !== 'act') return;
    setSelectedTool(toolId);
    setPhase('observe');

    const result = step.toolResults[toolId];
    setHistory(prev => [...prev, {
      step: step.id,
      thinking: step.thinking,
      tool: toolId,
      args: step.toolArgs[toolId],
      result,
      isCorrect: toolId === step.correctTool,
    }]);
  };

  const handleNext = () => {
    if (isLastStep && selectedTool === 'write_summary') {
      setDone(true);
    } else {
      setCurrentStep(prev => prev + 1);
      setPhase('think');
      setSelectedTool(null);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setPhase('think');
    setSelectedTool(null);
    setHistory([]);
    setDone(false);
  };

  const ToolIcon = (toolId) => {
    const def = TOOL_DEFINITIONS.find(t => t.id === toolId);
    if (!def) return null;
    const Icon = def.icon;
    return <Icon className="w-3.5 h-3.5" />;
  };

  if (done) {
    return (
      <div className="space-y-4">
        <div className="bg-success/10 border border-success/20 rounded-xl p-5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-lg font-bold text-success mb-2">Task Complete!</h3>
          <p className="text-sm text-text-muted mb-4">
            The agent completed the research task in 3 steps: Search → Read → Write.
            That's the agent loop: <strong className="text-text-primary">Think → Act → Observe</strong>, repeated until done.
          </p>
        </div>

        {/* Full trajectory */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Full Agent Trajectory</h4>
          {history.map((h, i) => {
            const toolDef = TOOL_DEFINITIONS.find(t => t.id === h.tool);
            return (
              <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-text-muted bg-white/5 px-2 py-0.5 rounded">Step {h.step}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${h.isCorrect ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {h.isCorrect ? '✓ Optimal' : '⚠ Suboptimal'}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-2">Called: <span className="font-mono text-primary">{toolDef?.label}</span></p>
                <p className="text-xs text-text-muted/70 font-mono bg-bg-dark rounded p-2">{h.result.output.slice(0, 150)}{h.result.output.length > 150 ? '…' : ''}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2 flex-1">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button onClick={onComplete} className="btn-primary flex-1">Mark Lab Complete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Task header */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">TASK</span>
          <span className="text-xs text-text-muted">Step {currentStep + 1} of {STEPS.length}</span>
        </div>
        <p className="text-sm text-text-primary">{TASK}</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {['Think', 'Act', 'Observe'].map((p, i) => {
          const phases = ['think', 'act', 'observe'];
          const isDone = phases.indexOf(phase) > i;
          const isCurrent = phase === phases[i];
          const PhaseIcon = [Brain, Zap, Eye][i];
          return (
            <React.Fragment key={p}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCurrent ? 'bg-primary/20 text-primary' : isDone ? 'bg-success/10 text-success' : 'bg-white/5 text-text-muted/50'
              }`}>
                <PhaseIcon className="w-3.5 h-3.5" />
                {p}
              </div>
              {i < 2 && <ChevronRight className="w-3 h-3 text-text-muted/30 flex-shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* THINK phase */}
      {(phase === 'think') && (
        <div className="space-y-3">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Agent is thinking…</span>
            </div>
            <p className="text-sm text-text-primary/80 italic">"{step.thinking}"</p>
          </div>
          <button onClick={() => setPhase('act')} className="btn-primary w-full flex items-center justify-center gap-2">
            Continue to Action <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ACT phase */}
      {phase === 'act' && (
        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-medium text-text-primary mb-3">{step.prompt}</p>
            <p className="text-xs text-text-muted mb-4">Choose which tool the agent should call:</p>
            <div className="space-y-2">
              {TOOL_DEFINITIONS.map(tool => {
                const ToolIconComp = tool.icon;
                return (
                  <button key={tool.id} onClick={() => handleToolSelect(tool.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tool.color}20` }}>
                      <ToolIconComp className="w-4 h-4" style={{ color: tool.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-text-primary">{tool.label}</p>
                      <p className="text-xs text-text-muted">{step.toolArgs[tool.id]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* OBSERVE phase */}
      {phase === 'observe' && selectedTool && (
        <div className="space-y-3">
          {/* Result */}
          <div className={`rounded-xl p-4 border ${
            step.toolResults[selectedTool].success && !step.toolResults[selectedTool].overresearch
              ? 'bg-success/5 border-success/20'
              : step.toolResults[selectedTool].overresearch
              ? 'bg-warning/5 border-warning/20'
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted">Tool Output</span>
              {selectedTool === step.correctTool && (
                <span className="ml-auto text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Optimal choice</span>
              )}
              {selectedTool !== step.correctTool && (
                <span className="ml-auto text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                  {step.toolResults[selectedTool].overresearch ? 'Over-researching' : 'Suboptimal'}
                </span>
              )}
            </div>
            <pre className="text-xs text-text-primary/80 font-mono whitespace-pre-wrap bg-bg-dark/50 rounded-lg p-3 overflow-hidden">
              {step.toolResults[selectedTool].output}
            </pre>
          </div>

          {/* Insight */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-primary mb-1">Insight</p>
            <p className="text-sm text-text-muted">{step.insight}</p>
          </div>

          <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
            {isLastStep && selectedTool === 'write_summary' ? 'See Results' : 'Next Step'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* History (mini) */}
      {history.length > 0 && phase === 'act' && (
        <div className="mt-2">
          <p className="text-xs text-text-muted mb-2">Previous steps:</p>
          <div className="space-y-1">
            {history.map((h, i) => {
              const def = TOOL_DEFINITIONS.find(t => t.id === h.tool);
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-text-muted bg-white/5 rounded-lg px-3 py-1.5">
                  <span className="text-text-muted/50">Step {h.step}:</span>
                  <span className="font-mono text-text-primary/70">{def?.label.split('(')[0]}</span>
                  <span className={h.isCorrect ? 'text-success ml-auto' : 'text-warning ml-auto'}>
                    {h.isCorrect ? '✓' : '⚠'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
