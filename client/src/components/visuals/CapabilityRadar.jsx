import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

const data = [
  { subject: 'Summarisation', LLM: 92 },
  { subject: 'Code Generation', LLM: 85 },
  { subject: 'Creative Writing', LLM: 88 },
  { subject: 'Translation', LLM: 90 },
  { subject: 'Precise Maths', LLM: 45 },
  { subject: 'Real-time Data', LLM: 20 },
  { subject: 'Factual Accuracy', LLM: 68 },
  { subject: 'Long Reasoning', LLM: 72 },
];

export default function CapabilityRadar() {
  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 text-center">
        LLM Capability Profile
      </h4>
      <p className="text-xs text-text-muted text-center mb-4">
        Where LLMs excel — and where they struggle
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
          />
          <Radar
            name="LLM Score"
            dataKey="LLM"
            stroke="#6B46C1"
            fill="#6B46C1"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              background: '#1A1A2E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [`${v}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs text-text-muted text-center mt-2">
        Scores are approximate and vary across models and tasks
      </p>
    </div>
  );
}
