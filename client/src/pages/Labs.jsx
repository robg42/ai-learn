import React, { useState } from 'react';
import { FlaskConical, ArrowLeft } from 'lucide-react';
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

const LAB_LIST = [
  { id: 'tokenizer',     label: 'Tokenizer Lab',          description: 'Visualize how text gets split into tokens.',                    component: TokenizerLab },
  { id: 'temperature',   label: 'Temperature Lab',         description: 'See how sampling temperature affects model output.',            component: TemperatureLab },
  { id: 'context',       label: 'Context Window Lab',      description: 'Explore how context length shapes responses.',                  component: ContextWindowLab },
  { id: 'playground',   label: 'Prompt Playground',        description: 'Craft and iterate on prompts interactively.',                   component: PromptPlayground },
  { id: 'injection',     label: 'Injection Sandbox',       description: 'Test prompt-injection attacks in a safe environment.',          component: InjectionSandbox },
  { id: 'hallucination', label: 'Hallucination Hunter',    description: 'Identify and flag AI hallucinations.',                          component: HallucinationHunter },
  { id: 'rag',           label: 'RAG Quality Lab',         description: 'Evaluate retrieval-augmented generation quality.',              component: RAGQualityLab },
  { id: 'agent-loop',    label: 'Agent Loop Simulator',    description: 'Step through an autonomous agent reasoning loop.',              component: AgentLoopSim },
  { id: 'broken-agent',  label: 'Broken Agent Lab',        description: 'Debug a malfunctioning agent pipeline.',                       component: BrokenAgentLab },
  { id: 'multi-agent',   label: 'Multi-Agent Debate',      description: 'Watch multiple agents argue opposing positions.',               component: MultiAgentDebate },
  { id: 'hitl',          label: 'HITL Design Lab',         description: 'Design human-in-the-loop oversight workflows.',                 component: HITLDesignLab },
  { id: 'redteam',       label: 'Red Team Lab',            description: 'Attempt to break AI safety guardrails.',                        component: RedTeamLab },
  { id: 'defensive',     label: 'Defensive Prompt Lab',    description: 'Build prompts that resist adversarial attacks.',                component: DefensivePromptLab },
];

export default function Labs() {
  const [active, setActive] = useState(null);

  if (active) {
    const lab = LAB_LIST.find(l => l.id === active);
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
        <p className="text-text-muted mt-1">Hands-on experiments to reinforce what you've learned.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAB_LIST.map(lab => (
          <button
            key={lab.id}
            onClick={() => setActive(lab.id)}
            className="card text-left hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                <FlaskConical className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">{lab.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{lab.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
