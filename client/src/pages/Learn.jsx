import React, { useState, useEffect } from 'react';
import { CheckCircle, Lock, ChevronRight, ArrowLeft, BookOpen, Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { SECTIONS } from '../content/course';
import SubsectionView from '../components/learn/SubsectionView';
import { useProgress, getSectionCourses, getAllSubsections } from '../context/ProgressContext';
import ProgressBar from '../components/learn/ProgressBar';

export default function Learn({ initialTarget }) {
  const {
    isSectionUnlocked, isCourseUnlocked,
    isSubsectionCompleted, isSubsectionUnlocked,
    getSectionProgress, getCourseProgress,
  } = useProgress();

  const [activeSectionId, setActiveSectionId] = useState(
    initialTarget?.sectionId || SECTIONS[0].id
  );
  const [activeSubsectionId, setActiveSubsectionId] = useState(
    initialTarget?.subsectionId || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialTarget?.sectionId) setActiveSectionId(initialTarget.sectionId);
    if (initialTarget?.subsectionId) setActiveSubsectionId(initialTarget.subsectionId);
  }, [initialTarget]);

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];

  // Find the active subsection across all courses
  const activeSubsection = activeSubsectionId
    ? getAllSubsections(activeSection).find(s => s.id === activeSubsectionId)
    : null;

  const handleSelectSubsection = (sectionId, subsectionId) => {
    setActiveSectionId(sectionId);
    setActiveSubsectionId(subsectionId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // Navigate to the next UNLOCKED subsection across all courses (and into next section).
  // Skip any that are still locked so we never land on a lock-screen.
  const getNextSubsection = () => {
    if (!activeSubsectionId) return null;
    const allSubs = getAllSubsections(activeSection);
    const idx = allSubs.findIndex(s => s.id === activeSubsectionId);
    // Scan forward through remaining lessons in this section
    for (let i = idx + 1; i < allSubs.length; i++) {
      if (isSubsectionUnlocked(activeSection.id, allSubs[i].id)) {
        return { section: activeSection, subsection: allSubs[i] };
      }
    }
    // Try the next section's first unlocked subsection
    const sectionIdx = SECTIONS.findIndex(s => s.id === activeSectionId);
    if (sectionIdx < SECTIONS.length - 1) {
      const nextSection = SECTIONS[sectionIdx + 1];
      if (isSectionUnlocked(nextSection.id)) {
        const nextSubs = getAllSubsections(nextSection);
        const firstUnlocked = nextSubs.find(s => isSubsectionUnlocked(nextSection.id, s.id));
        if (firstUnlocked) return { section: nextSection, subsection: firstUnlocked };
      }
    }
    return null;
  };

  const next = getNextSubsection();

  const handleNext = () => {
    if (next) {
      setActiveSectionId(next.section.id);
      setActiveSubsectionId(next.subsection.id);
    }
  };

  const sectionProgress = getSectionProgress(activeSectionId);
  const courses = getSectionCourses(activeSection);

  // Level labels
  const levelLabels = { 1: '101', 2: '201', 3: '301', 4: '401' };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 min-w-[18rem]' : 'w-0 overflow-hidden'
        } transition-all duration-300 border-r border-white/10 bg-bg-card flex flex-col`}
      >
        {/* Section tabs */}
        <div className="p-4 border-b border-white/10">
          <div className="space-y-1">
            {SECTIONS.map(section => {
              const SectionIcon = LucideIcons[section.icon] || LucideIcons.BookOpen;
              const unlocked = isSectionUnlocked(section.id);
              const isActive = section.id === activeSectionId;
              const prog = getSectionProgress(section.id);

              return (
                <button
                  key={section.id}
                  onClick={() => { if (unlocked) { setActiveSectionId(section.id); setActiveSubsectionId(null); } }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-text-primary'
                      : unlocked
                      ? 'text-text-muted hover:text-text-primary hover:bg-white/5'
                      : 'text-text-muted/50 cursor-not-allowed'
                  }`}
                >
                  {unlocked
                    ? <SectionIcon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? section.color : undefined }} />
                    : <Lock className="w-4 h-4 flex-shrink-0" />
                  }
                  <span className="flex-1 text-left">{section.title}</span>
                  {unlocked && prog.completed > 0 && (
                    <span className="text-xs text-text-muted">{prog.completed}/{prog.total}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section progress bar */}
        <div className="px-4 py-3 border-b border-white/10">
          <ProgressBar percent={sectionProgress.percent} color={activeSection.color} size="sm" showLabel={false} />
          <p className="text-xs text-text-muted mt-1">{sectionProgress.completed}/{sectionProgress.total} complete</p>
        </div>

        {/* Search input */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search lessons…"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Course + subsection list */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* Search results — flat list across all sections */}
          {searchQuery.trim() ? (
            <div className="px-2 space-y-0.5">
              {(() => {
                const q = searchQuery.toLowerCase();
                const results = [];
                for (const section of SECTIONS) {
                  for (const course of getSectionCourses(section)) {
                    for (const sub of course.subsections) {
                      if (sub.title.toLowerCase().includes(q)) {
                        results.push({ section, sub });
                      }
                    }
                  }
                }
                if (results.length === 0) {
                  return <p className="px-3 py-4 text-xs text-text-muted/60 text-center">No lessons found</p>;
                }
                return results.map(({ section, sub }) => {
                  const completed = isSubsectionCompleted(sub.id);
                  const unlocked = isSubsectionUnlocked(section.id, sub.id);
                  const isActive = sub.id === activeSubsectionId;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => unlocked && handleSelectSubsection(section.id, sub.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : completed
                          ? 'text-success hover:bg-white/5 cursor-pointer'
                          : unlocked
                          ? 'text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer'
                          : 'text-text-muted/30 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                        {completed
                          ? <CheckCircle className="w-3.5 h-3.5 text-success" />
                          : unlocked
                          ? <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                          : <Lock className="w-3 h-3" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs">{sub.title}</div>
                        <div className="text-[10px] opacity-60 mt-0.5">{section.title} · {sub.estimatedMinutes} min</div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          ) : (
          courses.map((course, courseIdx) => {
            const courseUnlocked = isCourseUnlocked(activeSection.id, course.id);
            const courseProg = getCourseProgress(activeSection.id, course.id);
            const allDone = courseProg.total > 0 && courseProg.completed === courseProg.total;

            return (
              <div key={course.id} className="mb-1">
                {/* Course header */}
                <div className={`flex items-center gap-2 px-4 py-2 ${!courseUnlocked ? 'opacity-40' : ''}`}>
                  <div
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: courseUnlocked ? `${activeSection.color}20` : 'rgba(255,255,255,0.05)',
                      color: courseUnlocked ? activeSection.color : '#64748b',
                    }}
                  >
                    {levelLabels[course.level] || `C${courseIdx + 1}`}
                  </div>
                  <span className="text-xs font-semibold text-text-muted flex-1 truncate">
                    {course.title.replace(/^Course \d+: /, '')}
                  </span>
                  {courseUnlocked && allDone && <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />}
                  {!courseUnlocked && <Lock className="w-3 h-3 text-text-muted/40 flex-shrink-0" />}
                </div>

                {/* Subsections within course */}
                <div className="px-2 space-y-0.5">
                  {course.subsections.map((sub) => {
                    const completed = isSubsectionCompleted(sub.id);
                    const unlocked = isSubsectionUnlocked(activeSection.id, sub.id);
                    const isActive = sub.id === activeSubsectionId;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => unlocked && handleSelectSubsection(activeSection.id, sub.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : completed
                            ? 'text-success hover:bg-white/5 cursor-pointer'
                            : unlocked
                            ? 'text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer'
                            : 'text-text-muted/30 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                          {completed
                            ? <CheckCircle className="w-3.5 h-3.5 text-success" />
                            : unlocked
                            ? <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                            : <Lock className="w-3 h-3" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs flex items-center gap-1.5">
                            {sub.title}
                            {sub.optional && <span className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-text-muted/50 flex-shrink-0">Optional</span>}
                          </div>
                          <div className="text-[10px] opacity-60 mt-0.5">{sub.estimatedMinutes} min</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-bg-dark/90 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)} className="btn-ghost p-1.5 rounded-lg">
            {sidebarOpen
              ? <ChevronRight className="w-4 h-4 rotate-180" />
              : <ChevronRight className="w-4 h-4" />
            }
          </button>
          {activeSubsection && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setActiveSubsectionId(null)}
                className="text-text-muted hover:text-text-primary flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                {activeSection.title}
              </button>
              <ChevronRight className="w-3 h-3 text-text-muted/50" />
              <span className="text-text-primary truncate max-w-xs">{activeSubsection.title}</span>
            </div>
          )}
        </div>

        <div className="p-6 lg:p-10">
          {activeSubsection ? (
            <SubsectionView
              section={activeSection}
              subsection={activeSubsection}
              onNext={next ? handleNext : null}
              onBackToOverview={() => setActiveSubsectionId(null)}
            />
          ) : (
            /* Section overview — shows courses as cards */
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                {(() => {
                  const SectionIcon = LucideIcons[activeSection.icon] || LucideIcons.BookOpen;
                  return (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${activeSection.color}20` }}
                    >
                      <SectionIcon className="w-7 h-7" style={{ color: activeSection.color }} />
                    </div>
                  );
                })()}
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{activeSection.title}</h1>
                  <p className="text-text-muted mt-1">{activeSection.description}</p>
                </div>
              </div>

              <div className="mb-8">
                <ProgressBar percent={sectionProgress.percent} label="Overall Progress" color={activeSection.color} />
              </div>

              <div className="space-y-4">
                {courses.map((course, courseIdx) => {
                  const courseUnlocked = isCourseUnlocked(activeSection.id, course.id);
                  const courseProg = getCourseProgress(activeSection.id, course.id);
                  const allDone = courseProg.total > 0 && courseProg.completed === courseProg.total;
                  // Find first incomplete unlocked subsection to jump into
                  const firstSub = courseUnlocked
                    ? course.subsections.find(s => isSubsectionUnlocked(activeSection.id, s.id) && !isSubsectionCompleted(s.id))
                      || (allDone ? course.subsections[0] : null)
                    : null;

                  return (
                    <div
                      key={course.id}
                      onClick={() => firstSub && handleSelectSubsection(activeSection.id, firstSub.id)}
                      className={`card transition-all duration-200 ${
                        courseUnlocked && firstSub
                          ? 'cursor-pointer hover:border-white/20 hover:-translate-y-0.5'
                          : 'opacity-50 cursor-not-allowed'
                      } ${allDone ? 'border-success/20' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Level badge */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                          style={{
                            backgroundColor: courseUnlocked ? `${activeSection.color}20` : 'rgba(255,255,255,0.05)',
                            color: courseUnlocked ? activeSection.color : '#64748b',
                          }}
                        >
                          {allDone
                            ? <CheckCircle className="w-5 h-5 text-success" />
                            : !courseUnlocked
                            ? <Lock className="w-4 h-4" />
                            : <span>{levelLabels[course.level] || courseIdx + 1}</span>
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-text-primary">{course.title}</h3>
                          </div>
                          <p className="text-sm text-text-muted mb-3">{course.description}</p>

                          {courseUnlocked && (
                            <div className="space-y-1.5">
                              <ProgressBar
                                percent={courseProg.percent}
                                color={activeSection.color}
                                size="sm"
                                showLabel={false}
                              />
                              <p className="text-xs text-text-muted">
                                {courseProg.completed}/{courseProg.total} lessons
                                {' · '}
                                {course.subsections.reduce((t, s) => t + s.estimatedMinutes, 0)} min total
                              </p>
                            </div>
                          )}

                          {!courseUnlocked && (
                            <p className="text-xs text-text-muted/60">
                              Complete {courses[courseIdx - 1]?.title || 'previous course'} to unlock
                            </p>
                          )}
                        </div>

                        {courseUnlocked && firstSub && (
                          <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
