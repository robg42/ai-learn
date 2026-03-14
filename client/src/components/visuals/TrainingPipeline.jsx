import React from 'react';

const stages = [
  {
    label: 'Raw Data',
    sublabel: 'Web, books, code',
    color: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    ),
  },
  {
    label: 'Tokenisation',
    sublabel: 'Text → token IDs',
    color: '#8B5CF6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="3" width="5" height="5" rx="1" /><rect x="10" y="3" width="5" height="5" rx="1" />
        <rect x="17" y="3" width="4" height="5" rx="1" /><rect x="3" y="11" width="4" height="5" rx="1" />
        <rect x="10" y="11" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Pre-training',
    sublabel: 'Next-token prediction',
    color: '#38BDF8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'SFT',
    sublabel: 'Supervised fine-tune',
    color: '#10B981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    label: 'RLHF',
    sublabel: 'Human preference',
    color: '#F59E0B',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

export default function TrainingPipeline() {
  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-6 text-center">
        LLM Training Pipeline
      </h4>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 flex-wrap">
        {stages.map((stage, i) => (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center text-center w-24">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow"
                style={{ backgroundColor: `${stage.color}20`, border: `1px solid ${stage.color}40`, color: stage.color }}
              >
                {stage.icon}
              </div>
              <p className="text-xs font-semibold text-text-primary leading-tight">{stage.label}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{stage.sublabel}</p>
            </div>
            {i < stages.length - 1 && (
              <div className="sm:mx-1 rotate-90 sm:rotate-0">
                <svg className="w-5 h-5 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-xs text-text-muted text-center mt-5 max-w-md mx-auto">
        Most frontier models go through all five stages. Pre-training is compute-intensive; RLHF is relatively cheap but dramatically shapes safety and helpfulness.
      </p>
    </div>
  );
}
