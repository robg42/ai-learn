import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function BadgeCard({ badge, size = 'md', showDetails = true, animate = false }) {
  const Icon = LucideIcons[badge.icon] || LucideIcons.Award;
  const sizes = {
    sm: { card: 'p-3', icon: 'w-8 h-8', iconInner: 'w-4 h-4', text: 'text-xs' },
    md: { card: 'p-4', icon: 'w-12 h-12', iconInner: 'w-6 h-6', text: 'text-sm' },
    lg: { card: 'p-5', icon: 'w-16 h-16', iconInner: 'w-8 h-8', text: 'text-base' },
  };
  const s = sizes[size];

  return (
    <div
      className={`card flex flex-col items-center text-center ${s.card} ${
        animate ? 'animate-badge-earn animate-glow-pulse' : ''
      }`}
      style={{ borderColor: `${badge.color}30` }}
    >
      <div
        className={`${s.icon} rounded-full flex items-center justify-center mb-2`}
        style={{ backgroundColor: `${badge.color}20` }}
      >
        <Icon className={s.iconInner} style={{ color: badge.color }} />
      </div>
      {showDetails && (
        <>
          <p className={`font-semibold text-text-primary ${s.text}`}>{badge.name}</p>
          {size !== 'sm' && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{badge.description}</p>
          )}
        </>
      )}
    </div>
  );
}
