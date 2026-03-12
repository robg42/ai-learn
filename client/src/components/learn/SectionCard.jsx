import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ProgressBar from './ProgressBar';
import { useProgress } from '../../context/ProgressContext';

export default function SectionCard({ section, onClick, isActive }) {
  const { isSectionUnlocked, getSectionProgress } = useProgress();
  const unlocked = isSectionUnlocked(section.id);
  const progress = getSectionProgress(section.id);

  const Icon = LucideIcons[section.icon] || LucideIcons.BookOpen;

  return (
    <div
      onClick={() => unlocked && onClick()}
      className={`card group relative overflow-hidden transition-all duration-300 ${
        unlocked
          ? 'cursor-pointer hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5'
          : 'opacity-60 cursor-not-allowed'
      } ${isActive ? 'animate-border-sweep' : ''}`}
    >
      {/* Gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: section.color }}
      />

      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${section.color}20` }}
        >
          {unlocked
            ? <Icon className="w-6 h-6" style={{ color: section.color }} />
            : <Lock className="w-6 h-6 text-text-muted" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-text-primary">{section.title}</h3>
            {unlocked && (
              <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transform duration-200" />
            )}
          </div>
          <p className="text-sm text-text-muted mt-1 line-clamp-2">{section.description}</p>

          {unlocked ? (
            <div className="mt-3">
              <ProgressBar
                percent={progress.percent}
                color={section.color}
                size="sm"
                showLabel={false}
              />
              <p className="text-xs text-text-muted mt-1.5">
                {progress.completed}/{progress.total} subsections complete
              </p>
            </div>
          ) : (
            <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Complete previous section to unlock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
