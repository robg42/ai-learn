import React, { useState } from 'react';

const PROVIDERS = [
  {
    name: 'OpenAI',
    model: 'GPT-5.4',
    type: 'Closed',
    cost: '$$$',
    strength: 'Frontier reasoning & coding, tiered portfolio (5.3 Instant → 5.4 Pro), vast ecosystem',
    color: '#10B981',
    logo: 'O',
  },
  {
    name: 'Anthropic',
    model: 'Claude 4',
    type: 'Closed',
    cost: '$$',
    strength: 'Safety-focused Constitutional AI, long context, nuanced instruction following',
    color: '#6B46C1',
    logo: 'A',
  },
  {
    name: 'Google',
    model: 'Gemini 2.0',
    type: 'Closed',
    cost: '$-$$$',
    strength: 'Multimodal by design, massive context windows, deep Google Cloud integration',
    color: '#38BDF8',
    logo: 'G',
  },
  {
    name: 'Meta',
    model: 'Llama 4',
    type: 'Open',
    cost: 'Free',
    strength: 'Open weights, fully self-hostable, huge community fine-tune ecosystem',
    color: '#F59E0B',
    logo: 'M',
  },
  {
    name: 'Mistral',
    model: 'Mistral Large',
    type: 'Open/Closed',
    cost: '$',
    strength: 'Efficient inference, European provider, strong multilingual & code performance',
    color: '#EC4899',
    logo: 'Mi',
  },
];

export default function ProviderComparison() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4 text-center">
        LLM Provider Comparison
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {PROVIDERS.map(p => (
          <button
            key={p.name}
            onClick={() => setSelected(selected?.name === p.name ? null : p)}
            className={`p-3 rounded-xl border transition-all duration-200 text-center ${
              selected?.name === p.name
                ? 'border-opacity-100 scale-105 shadow-lg'
                : 'border-white/10 hover:border-white/30 hover:scale-102'
            }`}
            style={selected?.name === p.name ? {
              borderColor: p.color,
              backgroundColor: `${p.color}15`,
            } : {}}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-2"
              style={{ backgroundColor: p.color }}
            >
              {p.logo}
            </div>
            <p className="text-xs font-semibold text-text-primary">{p.name}</p>
            <p className="text-xs text-text-muted">{p.model}</p>
          </button>
        ))}
      </div>

      {selected ? (
        <div
          className="rounded-xl p-4 border transition-all duration-300 animate-fade-in-up"
          style={{ backgroundColor: `${selected.color}10`, borderColor: `${selected.color}30` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: selected.color }}>
              {selected.logo}
            </div>
            <h5 className="font-semibold text-text-primary">{selected.name} — {selected.model}</h5>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Model Type</p>
              <span
                className={`badge-pill text-xs ${selected.type === 'Open' ? 'bg-success/20 text-success' : selected.type === 'Closed' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}
              >
                {selected.type}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Cost Tier</p>
              <p className="text-sm font-semibold text-text-primary">{selected.cost}</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-text-muted mb-1">Key Strength</p>
            <p className="text-sm text-text-primary">{selected.strength}</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-text-muted">Click a provider to see details</p>
      )}
    </div>
  );
}
