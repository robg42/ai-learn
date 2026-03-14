import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function BadgeCard({ badge, size = 'md', showDetails = true, animate = false }) {
  const Icon = LucideIcons[badge.icon] || LucideIcons.Award;

  if (size === 'sm') {
    return (
      <div
        className={`card flex items-center gap-3 p-3 ${animate ? 'animate-badge-earn animate-glow-pulse' : ''}`}
        style={{ borderColor: `${badge.color}30` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${badge.color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: badge.color }} />
        </div>
        {showDetails && (
          <p className="text-xs font-semibold text-text-primary truncate">{badge.name}</p>
        )}
      </div>
    );
  }

  // md / lg — horizontal card layout: icon left, name + description right
  return (
    <div
      className={`card flex items-start gap-4 p-4 ${animate ? 'animate-badge-earn animate-glow-pulse' : ''}`}
      style={{ borderColor: `${badge.color}30` }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${badge.color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: badge.color }} />
      </div>
      {showDetails && (
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm leading-snug">{badge.name}</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{badge.description}</p>
        </div>
      )}
    </div>
  );
}
