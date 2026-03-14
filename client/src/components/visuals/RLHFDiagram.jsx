import React from 'react';

export default function RLHFDiagram() {
  const nodes = [
    { id: 'model', label: 'Language Model', sub: 'Generates responses', x: 50, y: 20, color: '#6366f1' },
    { id: 'human', label: 'Human Raters', sub: 'Rank outputs A vs B', x: 85, y: 55, color: '#F59E0B' },
    { id: 'reward', label: 'Reward Model', sub: 'Learns preferences', x: 50, y: 88, color: '#10B981' },
    { id: 'ppo', label: 'PPO Update', sub: 'Optimises policy', x: 15, y: 55, color: '#38BDF8' },
  ];

  const arrows = [
    { from: { x: 60, y: 27 }, to: { x: 80, y: 50 }, label: 'candidate outputs' },
    { from: { x: 80, y: 62 }, to: { x: 63, y: 83 }, label: 'preference pairs' },
    { from: { x: 37, y: 88 }, to: { x: 20, y: 62 }, label: 'reward signal' },
    { from: { x: 20, y: 50 }, to: { x: 37, y: 27 }, label: 'gradient update' },
  ];

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4 text-center">
        Reinforcement Learning from Human Feedback (RLHF)
      </h4>
      <div className="relative w-full max-w-xs mx-auto" style={{ paddingBottom: '100%' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Arrow paths */}
          {arrows.map((a, i) => (
            <g key={i}>
              <defs>
                <marker id={`arr-${i}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <path d="M0,0 L0,4 L4,2 z" fill="rgba(148,163,184,0.4)" />
                </marker>
              </defs>
              <line
                x1={a.from.x} y1={a.from.y} x2={a.to.x} y2={a.to.y}
                stroke="rgba(148,163,184,0.3)" strokeWidth="0.8"
                markerEnd={`url(#arr-${i})`}
                strokeDasharray="3 2"
              />
            </g>
          ))}
          {/* Nodes */}
          {nodes.map((n) => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r="12" fill={`${n.color}20`} stroke={`${n.color}60`} strokeWidth="0.8" />
              <text x={n.x} y={n.y - 1} textAnchor="middle" dominantBaseline="middle" fontSize="4.5" fill={n.color} fontWeight="600">{n.label}</text>
              <text x={n.x} y={n.y + 5} textAnchor="middle" dominantBaseline="middle" fontSize="3" fill="rgba(148,163,184,0.8)">{n.sub}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {nodes.map(n => (
          <div key={n.id} className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: `${n.color}10` }}>
            <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: n.color }} />
            <div>
              <p className="text-xs font-medium" style={{ color: n.color }}>{n.label}</p>
              <p className="text-[10px] text-text-muted">{n.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted text-center mt-4">
        RLHF closes the loop: human preferences train a reward model that guides the policy toward outputs humans actually prefer.
      </p>
    </div>
  );
}
