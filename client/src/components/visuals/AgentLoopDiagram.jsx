import React, { useEffect, useState } from 'react';

const STEPS = [
  {
    id: 'think',
    label: 'Think',
    sublabel: 'Reason about the task',
    color: '#6B46C1',
    angle: 270,
  },
  {
    id: 'act',
    label: 'Act',
    sublabel: 'Call a tool or API',
    color: '#38BDF8',
    angle: 30,
  },
  {
    id: 'observe',
    label: 'Observe',
    sublabel: 'Process the result',
    color: '#10B981',
    angle: 150,
  },
];

function polarToCart(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default function AgentLoopDiagram() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(v => (v + 1) % 3);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const cx = 150, cy = 120, r = 75;

  const positions = STEPS.map(s => polarToCart(cx, cy, r, s.angle));

  // Arc paths between steps
  const arcs = STEPS.map((step, i) => {
    const next = (i + 1) % STEPS.length;
    const from = positions[i];
    const to = positions[next];
    const mid = {
      x: cx + (from.x - cx + to.x - cx) * 0.5 * 0.6,
      y: cy + (from.y - cy + to.y - cy) * 0.5 * 0.6,
    };
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  });

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 text-center">
        The Agent Loop
      </h4>
      <p className="text-xs text-text-muted text-center mb-4">
        Agents cycle through Think → Act → Observe repeatedly until the task is complete
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
        {/* SVG diagram */}
        <svg viewBox="0 0 300 240" className="w-64 h-52 flex-shrink-0">
          {/* Center circle */}
          <circle cx={cx} cy={cy} r={20} fill="#1A1A2E" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
          <text x={cx} y={cy + 5} textAnchor="middle" fill="#94A3B8" fontSize={8} fontWeight="bold">AGENT</text>

          {/* Arc paths */}
          {arcs.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={active === i ? STEPS[i].color : 'rgba(255,255,255,0.1)'}
              strokeWidth={active === i ? 2 : 1.5}
              strokeDasharray={active === i ? '0' : '4 3'}
              style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
              markerEnd={`url(#arrow-${i})`}
            />
          ))}

          {/* Arrow markers */}
          <defs>
            {STEPS.map((s, i) => (
              <marker key={i} id={`arrow-${i}`} markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill={active === i ? s.color : 'rgba(255,255,255,0.2)'} />
              </marker>
            ))}
          </defs>

          {/* Step nodes */}
          {STEPS.map((step, i) => {
            const pos = positions[i];
            const isActive = active === i;
            return (
              <g key={step.id} style={{ cursor: 'pointer' }} onClick={() => setActive(i)}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={26}
                  fill={isActive ? `${step.color}30` : '#1A1A2E'}
                  stroke={isActive ? step.color : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isActive ? 2 : 1}
                  style={{ transition: 'all 0.4s' }}
                />
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fill={isActive ? step.color : '#94A3B8'}
                  fontSize={12}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  style={{ transition: 'fill 0.4s' }}
                >
                  {step.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Step details */}
        <div className="space-y-3 w-full max-w-xs">
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className="p-3 rounded-lg border transition-all duration-300 cursor-pointer"
              style={{
                borderColor: active === i ? `${step.color}50` : 'rgba(255,255,255,0.08)',
                backgroundColor: active === i ? `${step.color}10` : 'transparent',
              }}
              onClick={() => setActive(i)}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: step.color }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{step.label}</p>
                  <p className="text-xs text-text-muted">{step.sublabel}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-text-muted pl-1">Repeats until goal is complete or a limit is hit</p>
        </div>
      </div>
    </div>
  );
}
