import React, { useState } from 'react';

const AGENTS = [
  { id: 'orchestrator', label: 'Orchestrator', sublabel: 'Plans & delegates', x: 150, y: 40, color: '#6B46C1' },
  { id: 'research', label: 'Research Agent', sublabel: 'Web search & retrieval', x: 50, y: 150, color: '#38BDF8' },
  { id: 'code', label: 'Code Agent', sublabel: 'Writes & executes code', x: 150, y: 150, color: '#10B981' },
  { id: 'comms', label: 'Comms Agent', sublabel: 'Drafts emails & reports', x: 250, y: 150, color: '#F59E0B' },
];

const CONNECTIONS = [
  { from: 'orchestrator', to: 'research', label: 'Task' },
  { from: 'orchestrator', to: 'code', label: 'Task' },
  { from: 'orchestrator', to: 'comms', label: 'Task' },
  { from: 'research', to: 'orchestrator', label: 'Result' },
  { from: 'code', to: 'orchestrator', label: 'Result' },
  { from: 'comms', to: 'orchestrator', label: 'Result' },
];

export default function MultiAgentFlow() {
  const [hovered, setHovered] = useState(null);

  const getAgent = (id) => AGENTS.find(a => a.id === id);

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 text-center">
        Multi-Agent Orchestration
      </h4>
      <p className="text-xs text-text-muted text-center mb-4">
        An orchestrator breaks a complex task into subtasks and coordinates specialist sub-agents
      </p>

      <div className="relative mx-auto" style={{ width: 300, height: 220 }}>
        <svg viewBox="0 0 300 220" className="w-full h-full">
          <defs>
            <marker id="arrow-task" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.3)" />
            </marker>
            <marker id="arrow-result" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.15)" />
            </marker>
          </defs>

          {CONNECTIONS.map((conn, i) => {
            const from = getAgent(conn.from);
            const to = getAgent(conn.to);
            const isTask = conn.label === 'Task';
            const midX = (from.x + to.x) / 2 + (isTask ? -12 : 12);
            const midY = (from.y + to.y) / 2;
            const offset = isTask ? -10 : 10;

            return (
              <g key={i}>
                <line
                  x1={from.x + (isTask ? -4 : 4)}
                  y1={from.y + 20}
                  x2={to.x + (isTask ? -4 : 4)}
                  y2={to.y - 20}
                  stroke={isTask ? 'rgba(107,70,193,0.5)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isTask ? 1.5 : 1}
                  strokeDasharray={isTask ? '0' : '3 3'}
                  markerEnd={isTask ? 'url(#arrow-task)' : 'url(#arrow-result)'}
                />
                <text
                  x={midX + offset}
                  y={midY}
                  textAnchor="middle"
                  fill={isTask ? 'rgba(107,70,193,0.8)' : 'rgba(148,163,184,0.6)'}
                  fontSize={8}
                >
                  {conn.label}
                </text>
              </g>
            );
          })}

          {AGENTS.map(agent => {
            const isHovered = hovered === agent.id;
            return (
              <g
                key={agent.id}
                onMouseEnter={() => setHovered(agent.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={agent.x - 42}
                  y={agent.y - 20}
                  width={84}
                  height={40}
                  rx={8}
                  fill={isHovered ? `${agent.color}25` : '#1A1A2E'}
                  stroke={isHovered ? agent.color : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isHovered ? 1.5 : 1}
                  style={{ transition: 'all 0.2s' }}
                />
                <text
                  x={agent.x}
                  y={agent.y - 3}
                  textAnchor="middle"
                  fill={isHovered ? agent.color : '#F1F5F9'}
                  fontSize={10}
                  fontWeight="bold"
                  style={{ transition: 'fill 0.2s' }}
                >
                  {agent.label}
                </text>
                <text
                  x={agent.x}
                  y={agent.y + 10}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize={8}
                >
                  {agent.sublabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-xs text-text-muted text-center mt-2">
        Each agent has its own tools and context. The orchestrator sees only task summaries, not the full workings of each sub-agent.
      </p>
    </div>
  );
}
