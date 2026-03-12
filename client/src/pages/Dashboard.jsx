import React from 'react';
import { Trophy, BookOpen, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { SECTIONS } from '../content/course';
import SectionCard from '../components/learn/SectionCard';
import BadgeCard from '../components/badges/BadgeCard';
import ProgressBar from '../components/learn/ProgressBar';

export default function Dashboard({ setCurrentPage, setLearnTarget }) {
  const { user } = useAuth();
  const { badges, getSectionProgress, getOverallProgress, isSectionUnlocked, isSubsectionCompleted } = useProgress();

  const overall = getOverallProgress();

  // Find "continue" target: first incomplete unlocked subsection
  const continueTarget = (() => {
    for (const section of SECTIONS) {
      if (!isSectionUnlocked(section.id)) continue;
      for (const sub of section.subsections) {
        if (!isSubsectionCompleted(sub.id)) {
          return { sectionId: section.id, subsectionId: sub.id };
        }
      }
    }
    return null;
  })();

  const handleContinue = () => {
    if (continueTarget) {
      setLearnTarget(continueTarget);
      setCurrentPage('learn');
    }
  };

  const recentBadges = badges.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome header */}
      <div className="card mb-8 bg-gradient-to-br from-primary/20 to-accent/10 border-primary/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-text-muted mt-1">
              {overall.completed === 0
                ? "Ready to start your AI learning journey?"
                : overall.completed === overall.total
                ? "You've completed the entire course. Amazing work!"
                : `You've completed ${overall.completed} of ${overall.total} subsections.`
              }
            </p>
            <div className="mt-4 max-w-xs">
              <ProgressBar percent={overall.percent} color="#6B46C1" size="md" />
            </div>
          </div>
          <div className="text-center bg-white/5 rounded-xl p-4 min-w-[100px]">
            <div className="text-4xl font-bold text-primary">{overall.percent}%</div>
            <div className="text-xs text-text-muted mt-1">Complete</div>
          </div>
        </div>

        {continueTarget && (
          <button
            onClick={handleContinue}
            className="mt-6 btn-primary flex items-center gap-2 w-fit"
          >
            <TrendingUp className="w-4 h-4" />
            Continue where you left off
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course sections */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Course Sections
          </h2>
          <div className="space-y-4">
            {SECTIONS.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                onClick={() => {
                  setLearnTarget({ sectionId: section.id });
                  setCurrentPage('learn');
                }}
              />
            ))}
          </div>
        </div>

        {/* Right column: badges + stats */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Your Progress
            </h3>
            <div className="space-y-3">
              {SECTIONS.map(section => {
                const prog = getSectionProgress(section.id);
                return (
                  <div key={section.id}>
                    <ProgressBar
                      percent={prog.percent}
                      label={section.title}
                      color={section.color}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4 text-warning" />
                Recent Badges
              </h3>
              {badges.length > 0 && (
                <button
                  onClick={() => setCurrentPage('profile')}
                  className="text-xs text-accent hover:underline"
                >
                  View all
                </button>
              )}
            </div>

            {recentBadges.length === 0 ? (
              <div className="text-center py-6">
                <Trophy className="w-10 h-10 text-text-muted/30 mx-auto mb-2" />
                <p className="text-text-muted text-sm">Complete subsections to earn badges</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {recentBadges.map(badge => (
                  <BadgeCard key={badge.id || badge.slug} badge={badge} size="sm" showDetails={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
