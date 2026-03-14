import React, { useState } from 'react';

const TREE = {
  id: 'root',
  label: 'Goal',
  sub: 'Write report on X',
  color: '#6366f1',
  children: [
    {
      id: 'a',
      label: 'Plan A',
      sub: 'Research first',
      color: '#10B981',
      selected: true,
      children: [
        { id: 'a1', label: 'Search web', sub: '✓ done', color: '#10B981', done: true, children: [] },
        { id: 'a2', label: 'Summarise', sub: 'current step', color: '#F59E0B', current: true, children: [] },
        { id: 'a3', label: 'Draft', sub: 'pending', color: '#6366f1', pending: true, children: [] },
      ],
    },
    {
      id: 'b',
      label: 'Plan B',
      sub: 'Draft first',
      color: '#94A3B8',
      pruned: true,
      children: [
        { id: 'b1', label: 'Draft', sub: 'skipped', color: '#94A3B8', pruned: true, children: [] },
        { id: 'b2', label: 'Fill gaps', sub: 'skipped', color: '#94A3B8', pruned: true, children: [] },
      ],
    },
  ],
};

function Node({ node, depth = 0 }) {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className={`flex flex-col items-center ${depth > 0 ? 'mt-3' : ''}`}>
      <div
        className={`px-2.5 py-1.5 rounded-lg border text-center min-w-[70px] transition-all ${
          node.pruned ? 'opacity-30' : node.current ? 'ring-2 ring-offset-1 ring-offset-bg-card' : ''
        }`}
        style={{
          borderColor: `${node.color}50`,
          backgroundColor: node.done ? `${node.color}25` : node.current ? `${node.color}20` : `${node.color}10`,
          ringColor: node.current ? node.color : undefined,
        }}
      >
        <p className="text-[11px] font-semibold" style={{ color: node.pruned ? '#64748B' : node.color }}>
          {node.label}
        </p>
        <p className="text-[9px] text-text-muted mt-0.5">{node.sub}</p>
      </div>
      {hasChildren && (
        <div className="flex gap-4 mt-0">
          {node.children.map((child, i) => (
            <div key={child.id} className="flex flex-col items-center">
              <div className="w-px h-3 bg-white/10" />
              <Node node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlanningDiagram() {
  return (
    <div className="card">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 text-center">
        Agent Planning: Tree Search
      </h4>
      <p className="text-xs text-text-muted text-center mb-5">
        The agent explores multiple plans, selects the best branch, and executes step by step — backtracking or replanning when needed.
      </p>
      <div className="flex justify-center overflow-x-auto pb-2">
        <Node node={TREE} />
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-5">
        {[
          { color: '#10B981', label: 'Completed step' },
          { color: '#F59E0B', label: 'Current step' },
          { color: '#6366f1', label: 'Pending step' },
          { color: '#94A3B8', label: 'Pruned branch' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `${color}40`, border: `1px solid ${color}80` }} />
            <span className="text-[10px] text-text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
