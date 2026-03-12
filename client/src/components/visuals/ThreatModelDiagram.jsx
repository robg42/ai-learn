import React, { useState } from 'react';

const THREATS = [
  {
    id: 'prompt-injection',
    label: 'Prompt Injection',
    description: 'Malicious text in user input or retrieved documents hijacks LLM instructions',
    color: '#EF4444',
    position: { x: 30, y: 100 },
  },
  {
    id: 'data-leak',
    label: 'Data Leakage',
    description: 'Sensitive data from training or context leaks via model outputs',
    color: '#F59E0B',
    position: { x: 220, y: 60 },
  },
  {
    id: 'jailbreak',
    label: 'Jailbreak',
    description: 'Crafted prompts bypass safety guardrails and content filters',
    color: '#EC4899',
    position: { x: 30, y: 40 },
  },
  {
    id: 'tool-abuse',
    label: 'Tool Abuse',
    description: 'Agent is tricked into misusing tools (email, code exec, APIs) with real-world impact',
    color: '#8B5CF6',
    position: { x: 220, y: 140 },
  },
];

export default function ThreatModelDiagram() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 text-center">
        LLM Threat Model
      </h4>
      <p className="text-xs text-text-muted text-center mb-4">
        Key attack vectors targeting LLM-based systems
      </p>

      <div className="relative mx-auto" style={{ maxWidth: 340 }}>
        <svg viewBox="0 0 300 200" className="w-full">
          <defs>
            <marker id="threat-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(239,68,68,0.6)" />
            </marker>
          </defs>

          {/* Central LLM box */}
          <rect x={110} y={75} width={80} height={50} rx={10}
            fill="#6B46C120" stroke="#6B46C1" strokeWidth={1.5} />
          <text x={150} y={96} textAnchor="middle" fill="#6B46C1" fontSize={11} fontWeight="bold">LLM</text>
          <text x={150} y={112} textAnchor="middle" fill="#94A3B8" fontSize={9}>+ Tools</text>

          {/* User → LLM */}
          <rect x={20} y={85} width={70} height={30} rx={6} fill="#1A1A2E" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <text x={55} y={103} textAnchor="middle" fill="#F1F5F9" fontSize={10}>User</text>
          <line x1={90} y1={100} x2={110} y2={100} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} markerEnd="url(#threat-arrow)" />

          {/* LLM → Output */}
          <rect x={210} y={85} width={70} height={30} rx={6} fill="#1A1A2E" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <text x={245} y={103} textAnchor="middle" fill="#F1F5F9" fontSize={10}>Output</text>
          <line x1={190} y1={100} x2={210} y2={100} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} markerEnd="url(#threat-arrow)" />

          {/* Threat indicators */}
          {THREATS.map(t => {
            const isHovered = hovered === t.id;
            return (
              <g
                key={t.id}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={t.position.x + 8}
                  cy={t.position.y + 8}
                  r={isHovered ? 10 : 8}
                  fill={`${t.color}30`}
                  stroke={t.color}
                  strokeWidth={1.5}
                  style={{ transition: 'all 0.2s' }}
                />
                <text
                  x={t.position.x + 8}
                  y={t.position.y + 12}
                  textAnchor="middle"
                  fill={t.color}
                  fontSize={10}
                  fontWeight="bold"
                >
                  !
                </text>
                <text
                  x={t.position.x + 22}
                  y={t.position.y + 12}
                  fill={isHovered ? '#F1F5F9' : '#94A3B8'}
                  fontSize={8}
                  style={{ transition: 'fill 0.2s' }}
                >
                  {t.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Description panel */}
      {hovered ? (
        <div
          className="mt-3 p-3 rounded-lg border text-sm text-text-primary transition-all duration-200 animate-fade-in-up"
          style={{
            backgroundColor: `${THREATS.find(t => t.id === hovered)?.color}10`,
            borderColor: `${THREATS.find(t => t.id === hovered)?.color}30`
          }}
        >
          <strong style={{ color: THREATS.find(t => t.id === hovered)?.color }}>
            {THREATS.find(t => t.id === hovered)?.label}:
          </strong>{' '}
          {THREATS.find(t => t.id === hovered)?.description}
        </div>
      ) : (
        <p className="text-xs text-text-muted text-center mt-3">Hover over a threat indicator to learn more</p>
      )}
    </div>
  );
}
