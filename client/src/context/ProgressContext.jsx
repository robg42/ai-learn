import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { SECTIONS } from '../content/course';

const ProgressContext = createContext(null);

// Unlock rules
const UNLOCK_RULES = {
  'llm-basics': () => true,
  'agentic-ai': (completed) => completed.has('what-are-llms'),
  'ai-security': (completed) => completed.has('what-is-agentic-ai'),
};

export function ProgressProvider({ children }) {
  const { token, user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
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
  }, [token]);

  useEffect(() => {
    if (user) fetchProgress();
  }, [user, fetchProgress]);

  const completedSet = new Set(progress.map(p => p.subsection_id));

  const isSectionUnlocked = useCallback((sectionId) => {
    const rule = UNLOCK_RULES[sectionId];
    return rule ? rule(completedSet) : false;
  }, [completedSet]);

  const isSubsectionUnlocked = useCallback((sectionId, subsectionId) => {
    if (!isSectionUnlocked(sectionId)) return false;
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return false;
    const idx = section.subsections.findIndex(s => s.id === subsectionId);
    if (idx === 0) return true;
    const prevSub = section.subsections[idx - 1];
    return completedSet.has(prevSub.id);
  }, [isSectionUnlocked, completedSet]);

  const isSubsectionCompleted = useCallback((subsectionId) => {
    return completedSet.has(subsectionId);
  }, [completedSet]);

  const completeSubsection = useCallback(async (sectionId, subsectionId, quizScore) => {
    if (!token) return;
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sectionId, subsectionId, quizScore })
      });

      // Check for new badges
      const badgeRes = await fetch('/api/badges/auto-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subsectionId })
      });
      const badgeData = await badgeRes.json();

      // Refresh progress
      await fetchProgress();

      // Show new badges
      if (badgeData.newBadges?.length > 0) {
        setNewBadges(badgeData.newBadges);
      }
    } catch (err) {
      console.error('Failed to complete subsection:', err);
    }
  }, [token, fetchProgress]);

  const clearNewBadges = useCallback(() => setNewBadges([]), []);

  const getSectionProgress = useCallback((sectionId) => {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return { completed: 0, total: 0, percent: 0 };
    const total = section.subsections.length;
    const completed = section.subsections.filter(s => completedSet.has(s.id)).length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [completedSet]);

  const getOverallProgress = useCallback(() => {
    const total = SECTIONS.reduce((sum, s) => sum + s.subsections.length, 0);
    const completed = completedSet.size;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [completedSet]);

  return (
    <ProgressContext.Provider value={{
      progress,
      badges,
      newBadges,
      loading,
      isSectionUnlocked,
      isSubsectionUnlocked,
      isSubsectionCompleted,
      completeSubsection,
      clearNewBadges,
      getSectionProgress,
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
