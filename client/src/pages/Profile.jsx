import React from 'react';
import { Trophy, CheckCircle, BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress, getSectionCourses, getAllSubsections } from '../context/ProgressContext';
import { SECTIONS } from '../content/course';
import BadgeGrid from '../components/badges/BadgeGrid';
import ProgressBar from '../components/learn/ProgressBar';

export default function Profile() {
  const { user } = useAuth();
  const { badges, getSectionProgress, getOverallProgress, isSubsectionCompleted } = useProgress();
  const overall = getOverallProgress();

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg">
            {initials}
          </div>

          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-text-primary">{user?.name}</h1>
            <p className="text-text-muted">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
              {memberSince && (
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Calendar className="w-4 h-4" />
                  Member since {memberSince}
                </div>
              )}
              {user?.role === 'admin' && (
                <span className="badge-pill bg-primary/20 text-primary border border-primary/30 text-xs">
                  Admin
                </span>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{overall.percent}%</div>
            <div className="text-xs text-text-muted mt-1">Overall complete</div>
            <div className="text-sm text-text-muted mt-0.5">{overall.completed}/{overall.total} lessons</div>
          </div>
        </div>
      </div>

      {/* Course Progress — 3 columns, one per section */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Course Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SECTIONS.map(section => {
            const prog = getSectionProgress(section.id);
            return (
              <div key={section.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
                  <h3 className="font-semibold text-text-primary text-sm">{section.title}</h3>
                  <span className="ml-auto text-sm text-text-muted">{prog.completed}/{prog.total}</span>
                </div>
                <ProgressBar percent={prog.percent} color={section.color} size="sm" showLabel={false} />
                <div className="mt-3 space-y-0.5">
                  {getSectionCourses(section).map(course => (
                    <div key={course.id} className="mt-2">
                      <p className="text-[10px] font-semibold text-text-muted/50 uppercase tracking-wide mb-1">
                        {course.title.replace(/^Course \d+: /, '')}
                      </p>
                      {course.subsections.map(sub => {
                        const done = isSubsectionCompleted(sub.id);
                        return (
                          <div key={sub.id} className="flex items-center gap-1.5 text-xs py-0.5">
                            <CheckCircle
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: done ? '#10B981' : undefined, opacity: done ? 1 : 0.25 }}
                            />
                            <span className={done ? 'text-text-primary' : 'text-text-muted/60 truncate'}>{sub.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges — full width so cards have room */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Badges ({badges.length})
        </h2>
        <div className="card">
          <BadgeGrid badges={badges} emptyMessage="Complete lessons to earn badges!" />
        </div>
      </div>
    </div>
  );
}
