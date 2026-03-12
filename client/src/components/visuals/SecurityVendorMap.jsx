import React, { useState } from 'react';

const CAPABILITIES = [
  {
    id: 'discovery',
    label: 'AI Discovery',
    color: '#6B46C1',
    description: 'Find shadow AI usage across the org — which tools employees are using and what data they\'re sharing',
    risks: ['Data Leakage', 'Shadow AI', 'Compliance Gaps'],
    x: 60, y: 40,
  },
  {
    id: 'monitoring',
    label: 'Runtime Monitoring',
    color: '#38BDF8',
    description: 'Watch agent behaviour in real-time for anomalous actions, unexpected tool calls, or policy violations',
    risks: ['Tool Abuse', 'Prompt Injection', 'Goal Drift'],
    x: 200, y: 40,
  },
  {
    id: 'enforcement',
    label: 'Policy Enforcement',
    color: '#10B981',
    description: 'Apply guardrails, block unsafe outputs, enforce data handling policies across LLM interactions',
    risks: ['Jailbreaks', 'Data Leakage', 'Privilege Escalation'],
    x: 60, y: 140,
  },
  {
    id: 'compliance',
    label: 'Compliance Reporting',
    color: '#F59E0B',
    description: 'Generate audit logs, demonstrate GDPR/SOC2 adherence, track PII exposure and access patterns',
    risks: ['GDPR Risk', 'Audit Failure', 'Regulatory Exposure'],
    x: 200, y: 140,
  },
];

export default function SecurityVendorMap() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 text-center">
        AI Security Vendor Capability Map
      </h4>
      <p className="text-xs text-text-muted text-center mb-6">
        Four core capability categories in the emerging AI security space
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {CAPABILITIES.map(cap => (
          <button
            key={cap.id}
            onClick={() => setSelected(selected?.id === cap.id ? null : cap)}
            className="p-4 rounded-xl border text-left transition-all duration-200 hover:scale-102"
            style={{
              borderColor: selected?.id === cap.id ? cap.color : 'rgba(255,255,255,0.1)',
              backgroundColor: selected?.id === cap.id ? `${cap.color}12` : 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: `${cap.color}20` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cap.color }} />
            </div>
            <p className="text-sm font-semibold text-text-primary">{cap.label}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {cap.risks.map(r => (
                <span
                  key={r}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${cap.color}15`, color: cap.color }}
                >
                  {r}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="p-4 rounded-xl border animate-fade-in-up transition-all duration-200"
          style={{ backgroundColor: `${selected.color}10`, borderColor: `${selected.color}30` }}
        >
          <h5 className="font-semibold mb-1" style={{ color: selected.color }}>{selected.label}</h5>
          <p className="text-sm text-text-primary">{selected.description}</p>
        </div>
      )}

      {!selected && (
        <p className="text-xs text-text-muted text-center">Click a capability category to learn more</p>
      )}
    </div>
  );
}
