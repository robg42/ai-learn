import React from 'react';
import BadgeCard from './BadgeCard';
import { Award } from 'lucide-react';

export default function BadgeGrid({ badges, emptyMessage = "No badges earned yet", size = 'md' }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="w-10 h-10 text-text-muted/40 mx-auto mb-2" />
        <p className="text-text-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map(badge => (
        <BadgeCard key={badge.id || badge.slug} badge={badge} size={size} />
      ))}
    </div>
  );
}
