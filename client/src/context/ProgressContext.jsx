import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { SECTIONS } from '../content/course';

const ProgressContext = createContext(null);

// Returns all courses for a section (Course 1 = existing subsections, + additionalCourses)
export function getSectionCourses(section) {
  const c1 = {
    id: `${section.id}-c1`,
    title: 'Course 1: The Essentials',
    level: 1,
    description: section.description,
    subsections: section.subsections,
  };
  return [c1, ...(section.additionalCourses || [])];
}

// Returns all subsections across all courses in a section
export function getAllSubsections(section) {
  return getSectionCourses(section).flatMap(c => c.subsections);
}

// Unlock rules (by first subsection of each section)
const UNLOCK_RULES = {
  'llm-basics':   () => true,
  'agentic-ai':   (completed) => completed.has('what-are-llms'),
  'ai-security':  (completed) => completed.has('what-is-agentic-ai'),
};

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewAll, setPreviewAllState] = useState(() => {
    try { return localStorage.getItem('admin_preview_all') === 'true'; } catch { return false; }
  });

  const setPreviewAll = (val) => {
    setPreviewAllState(val);
    try { localStorage.setItem('admin_preview_all', val ? 'true' : 'false'); } catch {}
  };

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress || []);
        setBadges(data.badges || []);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchProgress();
  }, [user, fetchProgress]);

  const completedSet = new Set(progress.map(p => p.subsection_id));

  const isSectionUnlocked = useCallback((sectionId) => {
    if (previewAll && user?.role === 'admin') return true;
    const rule = UNLOCK_RULES[sectionId];
    return rule ? rule(completedSet) : false;
  }, [completedSet, previewAll, user]);

  // A course unlocks when the previous course is fully completed (or it's the first course)
  const isCourseUnlocked = useCallback((sectionId, courseId) => {
    if (previewAll && user?.role === 'admin') return true;
    if (!isSectionUnlocked(sectionId)) return false;
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return false;
    const courses = getSectionCourses(section);
    const idx = courses.findIndex(c => c.id === courseId);
    if (idx === 0) return true;
    const prevCourse = courses[idx - 1];
    return prevCourse.subsections.filter(s => !s.optional).every(s => completedSet.has(s.id));
  }, [isSectionUnlocked, completedSet, previewAll, user]);

  // Sequential unlocking: within each course, lesson N unlocks only when lesson N-1 is complete.
  // The first lesson of each course unlocks when the course itself unlocks.
  // IMPORTANT: if a lesson is already in completedSet it is ALWAYS accessible regardless of
  // whether earlier lessons are present in the DB (guards against inconsistent data edge cases).
  const isSubsectionUnlocked = useCallback((sectionId, subsectionId) => {
    if (previewAll && user?.role === 'admin') return true;
    // Already completed → always accessible (prevents lock-screen on previously-done lessons)
    if (completedSet.has(subsectionId)) return true;
    if (!isSectionUnlocked(sectionId)) return false;
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return false;
    const courses = getSectionCourses(section);
    for (let ci = 0; ci < courses.length; ci++) {
      const course = courses[ci];
      const idx = course.subsections.findIndex(s => s.id === subsectionId);
      if (idx === -1) continue;
      if (!isCourseUnlocked(sectionId, course.id)) return false;
      if (idx === 0) return true; // first lesson in course: always accessible when course unlocks
      // Optional labs don't block progress — find the previous required lesson
      const sub = course.subsections[idx];
      if (sub.optional) {
        // Optional labs unlock when the most recent required lesson before them is done
        for (let k = idx - 1; k >= 0; k--) {
          if (!course.subsections[k].optional) {
            return completedSet.has(course.subsections[k].id);
          }
        }
        return true; // no required lesson before it
      }
      // Required lesson: previous required lesson must be done (skip optional ones)
      for (let k = idx - 1; k >= 0; k--) {
        if (!course.subsections[k].optional) {
          return completedSet.has(course.subsections[k].id);
        }
      }
      return true;
    }
    return false;
  }, [isSectionUnlocked, isCourseUnlocked, completedSet, previewAll, user]);

  const isSubsectionCompleted = useCallback((subsectionId) => {
    return completedSet.has(subsectionId);
  }, [completedSet]);

  const completeSubsection = useCallback(async (sectionId, subsectionId, quizScore) => {
    if (!user) return;
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sectionId, subsectionId, quizScore })
      });

      const badgeRes = await fetch('/api/badges/auto-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subsectionId })
      });
      const badgeData = await badgeRes.json();

      await fetchProgress();

      if (badgeData.newBadges?.length > 0) {
        setNewBadges(badgeData.newBadges);
      }
    } catch (err) {
      console.error('Failed to complete subsection:', err);
    }
  }, [user, fetchProgress]);

  const clearNewBadges = useCallback(() => setNewBadges([]), []);

  const getSectionProgress = useCallback((sectionId) => {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return { completed: 0, total: 0, percent: 0 };
    const all = getAllSubsections(section);
    const required = all.filter(s => !s.optional);
    const total = required.length;
    const completed = required.filter(s => completedSet.has(s.id)).length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [completedSet]);

  const getCourseProgress = useCallback((sectionId, courseId) => {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return { completed: 0, total: 0, percent: 0 };
    const courses = getSectionCourses(section);
    const course = courses.find(c => c.id === courseId);
    if (!course) return { completed: 0, total: 0, percent: 0 };
    const required = course.subsections.filter(s => !s.optional);
    const total = required.length;
    const completed = required.filter(s => completedSet.has(s.id)).length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [completedSet]);

  const getOverallProgress = useCallback(() => {
    const allRequired = SECTIONS.flatMap(s => getAllSubsections(s).filter(sub => !sub.optional));
    const total = allRequired.length;
    const completed = allRequired.filter(s => completedSet.has(s.id)).length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [completedSet]);

  return (
    <ProgressContext.Provider value={{
      progress,
      badges,
      newBadges,
      loading,
      previewAll,
      setPreviewAll,
      isSectionUnlocked,
      isCourseUnlocked,
      isSubsectionUnlocked,
      isSubsectionCompleted,
      completeSubsection,
      clearNewBadges,
      getSectionProgress,
      getCourseProgress,
      getOverallProgress,
      fetchProgress
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
