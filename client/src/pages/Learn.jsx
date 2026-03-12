import React, { useState, useEffect } from 'react';
import { CheckCircle, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { SECTIONS } from '../content/course';
import SubsectionView from '../components/learn/SubsectionView';
import { useProgress } from '../context/ProgressContext';
import ProgressBar from '../components/learn/ProgressBar';

export default function Learn({ initialTarget }) {
  const { isSectionUnlocked, isSubsectionCompleted, isSubsectionUnlocked, getSectionProgress } = useProgress();

  const [activeSectionId, setActiveSectionId] = useState(
    initialTarget?.sectionId || SECTIONS[0].id
  );
  const [activeSubsectionId, setActiveSubsectionId] = useState(
    initialTarget?.subsectionId || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (initialTarget?.sectionId) setActiveSectionId(initialTarget.sectionId);
    if (initialTarget?.subsectionId) setActiveSubsectionId(initialTarget.subsectionId);
  }, [initialTarget]);

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];
  const activeSubsection = activeSubsectionId
    ? activeSection.subsections.find(s => s.id === activeSubsectionId)
    : null;

  const handleSelectSubsection = (sectionId, subsectionId) => {
    setActiveSectionId(sectionId);
    setActiveSubsectionId(subsectionId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const getNextSubsection = () => {
    if (!activeSubsectionId) return null;
    const subs = activeSection.subsections;
    const idx = subs.findIndex(s => s.id === activeSubsectionId);
    if (idx < subs.length - 1) {
      return { section: activeSection, subsection: subs[idx + 1] };
    }
    // Try next section
    const sectionIdx = SECTIONS.findIndex(s => s.id === activeSectionId);
    if (sectionIdx < SECTIONS.length - 1) {
      const nextSection = SECTIONS[sectionIdx + 1];
      if (isSectionUnlocked(nextSection.id)) {
        return { section: nextSection, subsection: nextSection.subsections[0] };
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

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 min-w-[18rem]' : 'w-0 overflow-hidden'
        } transition-all duration-300 border-r border-white/10 bg-bg-card flex flex-col`}
      >
        <div className="p-4 border-b border-white/10">
          {/* Section tabs */}
          <div className="space-y-1">
            {SECTIONS.map(section => {
              const SectionIcon = LucideIcons[section.icon] || LucideIcons.BookOpen;
              const unlocked = isSectionUnlocked(section.id);
              const isActive = section.id === activeSectionId;
              const prog = getSectionProgress(section.id);

              return (
                <button
                  key={section.id}
                  onClick={() => unlocked && setActiveSectionId(section.id)}
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

        {/* Active section progress */}
        <div className="px-4 py-3 border-b border-white/10">
          <ProgressBar
            percent={sectionProgress.percent}
            color={activeSection.color}
            size="sm"
            showLabel={false}
          />
          <p className="text-xs text-text-muted mt-1">
            {sectionProgress.completed}/{sectionProgress.total} complete
          </p>
        </div>

        {/* Subsection list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {activeSection.subsections.map((sub, idx) => {
            const completed = isSubsectionCompleted(sub.id);
            const unlocked = isSubsectionUnlocked(activeSection.id, sub.id);
            const isActive = sub.id === activeSubsectionId;

            return (
              <button
                key={sub.id}
                onClick={() => unlocked && handleSelectSubsection(activeSection.id, sub.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : completed
                    ? 'text-success hover:bg-white/5 cursor-pointer'
                    : unlocked
                    ? 'text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer'
                    : 'text-text-muted/40 cursor-not-allowed'
                }`}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {completed
                    ? <CheckCircle className="w-4 h-4 text-success" />
                    : unlocked
                    ? <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                    : <Lock className="w-3 h-3" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">{sub.title}</div>
                  <div className="text-xs opacity-70 mt-0.5">{sub.estimatedMinutes} min</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar with sidebar toggle */}
        <div className="sticky top-0 z-10 bg-bg-dark/90 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="btn-ghost p-1.5 rounded-lg"
          >
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
              <span className="text-text-primary">{activeSubsection.title}</span>
            </div>
          )}
        </div>

        <div className="p-6 lg:p-10">
          {activeSubsection ? (
            <SubsectionView
              section={activeSection}
              subsection={activeSubsection}
              onNext={next ? handleNext : null}
            />
          ) : (
            /* Section overview */
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                {(() => {
                  const SectionIcon = LucideIcons[activeSection.icon] || LucideIcons.BookOpen;
                  return (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
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

              <div className="mb-6">
                <ProgressBar
                  percent={sectionProgress.percent}
                  label="Section Progress"
                  color={activeSection.color}
                />
              </div>

              <div className="space-y-3">
                {activeSection.subsections.map((sub, idx) => {
                  const completed = isSubsectionCompleted(sub.id);
                  const unlocked = isSubsectionUnlocked(activeSection.id, sub.id);

                  return (
                    <div
                      key={sub.id}
                      onClick={() => unlocked && handleSelectSubsection(activeSection.id, sub.id)}
                      className={`card flex items-center gap-4 transition-all duration-200 ${
                        unlocked
                          ? 'cursor-pointer hover:border-white/20 hover:-translate-y-0.5'
                          : 'opacity-50 cursor-not-allowed'
                      } ${completed ? 'border-success/20' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        completed ? 'bg-success/20' : unlocked ? 'bg-white/5' : 'bg-white/5'
                      }`}>
                        {completed
                          ? <CheckCircle className="w-5 h-5 text-success" />
                          : unlocked
                          ? <span className="text-sm font-bold text-text-muted">{idx + 1}</span>
                          : <Lock className="w-4 h-4 text-text-muted/50" />
                        }
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">{sub.title}</h3>
                        <p className="text-sm text-text-muted">{sub.estimatedMinutes} min · {sub.quiz.length} questions</p>
                      </div>
                      {unlocked && <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />}
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
