import React from 'react';

export default function LLMConceptDiagram() {
  const steps = [
    {
      label: 'Input',
      sublabel: 'Your prompt',
      color: '#6B46C1',
      bg: '#6B46C1',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Tokenisation',
      sublabel: 'Text → tokens',
      color: '#8B5CF6',
      bg: '#8B5CF6',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      label: 'LLM Model',
      sublabel: 'Neural network',
      color: '#38BDF8',
      bg: '#38BDF8',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <circle cx="12" cy="12" r="3" />
          <circle cx="4" cy="6" r="2" />
          <circle cx="20" cy="6" r="2" />
          <circle cx="4" cy="18" r="2" />
          <circle cx="20" cy="18" r="2" />
          <path d="M6 6l4 4M14 14l4 4M18 6l-4 4M6 18l4-4" />
        </svg>
      ),
    },
    {
      label: 'Output',
      sublabel: 'Generated text',
      color: '#10B981',
      bg: '#10B981',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-6 text-center">
        How an LLM Processes Your Input
      </h4>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center text-center w-28">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg"
                style={{ backgroundColor: `${step.bg}20`, border: `1px solid ${step.bg}40`, color: step.color }}
              >
                {step.icon}
              </div>
              <p className="text-sm font-semibold text-text-primary">{step.label}</p>
              <p className="text-xs text-text-muted">{step.sublabel}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="sm:flex items-center justify-center mx-2 rotate-90 sm:rotate-0">
                <svg className="w-6 h-6 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <p className="text-xs text-text-muted text-center mt-6 max-w-md mx-auto">
        Every prompt goes through tokenisation, inference across billions of parameters, and detokenisation back into readable text — all in seconds.
      </p>
    </div>
  );
}
