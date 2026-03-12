import React, { useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';

export default function BadgeModal() {
  const { newBadges, clearNewBadges } = useProgress();

  useEffect(() => {
    if (newBadges.length > 0) {
      const timer = setTimeout(clearNewBadges, 5000);
      return () => clearTimeout(timer);
    }
  }, [newBadges, clearNewBadges]);

  if (!newBadges || newBadges.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-card border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center animate-badge-earn shadow-2xl">
        <button
          onClick={clearNewBadges}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-text-primary mb-1">
          {newBadges.length === 1 ? 'Badge Earned!' : `${newBadges.length} Badges Earned!`}
        </h2>
        <p className="text-text-muted text-sm mb-6">Keep up the great work!</p>

        <div className="space-y-4">
          {newBadges.map(badge => {
            const Icon = LucideIcons[badge.icon] || LucideIcons.Award;
            return (
              <div
                key={badge.id}
                className="flex items-center gap-4 p-4 rounded-xl animate-glow-pulse"
                style={{ backgroundColor: `${badge.color}15`, border: `1px solid ${badge.color}30` }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${badge.color}25` }}
                >
                  <Icon className="w-6 h-6" style={{ color: badge.color }} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-text-primary">{badge.name}</p>
                  <p className="text-xs text-text-muted">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={clearNewBadges}
          className="btn-primary w-full mt-6"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
