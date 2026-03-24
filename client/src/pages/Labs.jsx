import React, { useState } from 'react';
import { FlaskConical, ArrowLeft, Brain, Bot, Shield } from 'lucide-react';
import {
  TokenizerLab,
  AgentLoopSim,
  InjectionSandbox,
  PromptPlayground,
  TemperatureLab,
  HallucinationHunter,
  RAGQualityLab,
  ContextWindowLab,
  BrokenAgentLab,
  MultiAgentDebate,
  HITLDesignLab,
  RedTeamLab,
  DefensivePromptLab,
} from '../components/labs';

const DIFFICULTY = {
  easy:   { label: 'Easy',   className: 'bg-green-500/15 text-green-400' },
  medium: { label: 'Medium', className: 'bg-yellow-500/15 text-yellow-400' },
  hard:   { label: 'Hard',   className: 'bg-red-500/15 text-red-400' },
};

const SECTIONS = [
  {
    id: 'llm-basics',
    label: 'LLM Basics',
    icon: Brain,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    labs: [
      { id: 'tokenizer',     difficulty: 'easy',   label: 'Tokenizer Lab',       description: 'Visualize how text gets split into tokens.',                  component: TokenizerLab },
      { id: 'temperature',   difficulty: 'easy',   label: 'Temperature Lab',      description: 'See how sampling temperature affects model output.',          component: TemperatureLab },
      { id: 'context',       difficulty: 'medium', label: 'Context Window Lab',   description: 'Explore how context length shapes model responses.',          component: ContextWindowLab },
      { id: 'playground',    difficulty: 'medium', label: 'Prompt Playground',    description: 'Craft and iterate on prompts interactively.',                 component: PromptPlayground },
      { id: 'hallucination', difficulty: 'medium', label: 'Hallucination Hunter', description: 'Identify and flag confident-sounding AI errors.',             component: HallucinationHunter },
      { id: 'rag',           difficulty: 'hard',   label: 'RAG Quality Lab',      description: 'Evaluate retrieval-augmented generation quality end-to-end.', component: RAGQualityLab },
    ],
  },
  {
    id: 'agentic-ai',
    label: 'Agentic AI',
    icon: Bot,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    labs: [
      { id: 'agent-loop',  difficulty: 'easy',   label: 'Agent Loop Simulator', description: 'Step through an autonomous agent reasoning loop.',       component: AgentLoopSim },
      { id: 'multi-agent', difficulty: 'medium', label: 'Multi-Agent Debate',   description: 'Watch two agents argue opposing positions.',              component: MultiAgentDebate },
      { id: 'broken-agent',difficulty: 'medium', label: 'Broken Agent Lab',     description: 'Debug a malfunctioning agent pipeline.',                  component: BrokenAgentLab },
      { id: 'hitl',        difficulty: 'hard',   label: 'HITL Design Lab',      description: 'Design human-in-the-loop oversight workflows.',           component: HITLDesignLab },
    ],
  },
  {
    id: 'ai-security',
    label: 'AI Security',
    icon: Shield,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    labs: [
      { id: 'injection',  difficulty: 'easy',   label: 'Injection Sandbox',    description: 'Test prompt-injection attacks in a safe environment.',   component: InjectionSandbox },
      { id: 'redteam',    difficulty: 'medium', label: 'Red Team Lab',         description: 'Attempt to break AI safety guardrails.',                  component: RedTeamLab },
      { id: 'defensive',  difficulty: 'hard',   label: 'Defensive Prompt Lab', description: 'Build prompts that resist adversarial attacks.',          component: DefensivePromptLab },
    ],
  },
];

// Flat lookup for active lab rendering
const ALL_LABS = SECTIONS.flatMap(s => s.labs);

export default function Labs() {
  const [active, setActive] = useState(null);

  if (active) {
    const lab = ALL_LABS.find(l => l.id === active);
    const Component = lab.component;
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => setActive(null)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Labs
        </button>
        <Component />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-primary" />
          Interactive Labs
        </h1>
        <p className="text-text-muted mt-1">Hands-on experiments to reinforce what you've learned. Labs are ordered easy to hard within each section.</p>
      </div>

      <div className="space-y-10">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.id}>
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${section.border}`}>
                <div className={`w-7 h-7 rounded-md ${section.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${section.color}`} />
                </div>
                <h2 className={`font-semibold text-base ${section.color}`}>{section.label}</h2>
                <span className="text-xs text-text-muted ml-1">{section.labs.length} labs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.labs.map(lab => {
                  const diff = DIFFICULTY[lab.difficulty];
                  return (
                    <button
                      key={lab.id}
                      onClick={() => setActive(lab.id)}
                      className="card text-left hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg ${section.bg} flex items-center justify-center flex-shrink-0 group-hover:opacity-80 transition-opacity`}>
                          <FlaskConical className={`w-4 h-4 ${section.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-text-primary text-sm">{lab.label}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${diff.className}`}>
                              {diff.label}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">{lab.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
