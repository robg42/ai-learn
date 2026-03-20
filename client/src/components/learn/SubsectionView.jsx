import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, CheckCircle, Lock, ChevronRight, Trophy, RefreshCw, FileText, Save, Sparkles, FlaskConical } from 'lucide-react';
import KnowledgeCheck from './KnowledgeCheck';
import TutorPanel from './TutorPanel';
import { useProgress } from '../../context/ProgressContext';
import { useAuth } from '../../context/AuthContext';
import * as Visuals from '../visuals';
import * as Labs from '../labs';

function LessonNotes({ subsectionId, token }) {
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/notes/${subsectionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setContent(data.content || ''); setSavedContent(data.content || ''); })
      .catch(() => {});
  }, [subsectionId, token]);

  const save = useCallback(async (text) => {
    if (!token) return;
    setSaveStatus('saving');
    try {
      await fetch(`/api/notes/${subsectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });
      setSavedContent(text);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch { setSaveStatus(''); }
  }, [subsectionId, token]);

  const handleChange = (e) => {
    setContent(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(e.target.value), 800);
  };

  const isDirty = content !== savedContent;

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          My Notes
        </h3>
        {saveStatus === 'saving' && <span className="text-xs text-text-muted">Saving…</span>}
        {saveStatus === 'saved' && <span className="text-xs text-success flex items-center gap-1"><Save className="w-3 h-3" />Saved</span>}
      </div>
      <textarea
        className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-primary/50 transition-colors"
        placeholder="Add your own notes for this lesson…"
        value={content}
        onChange={handleChange}
      />
    </div>
  );
}

export default function SubsectionView({ section, subsection, onNext, onBackToOverview }) {
  const { isSubsectionCompleted, isSubsectionUnlocked, completeSubsection } = useProgress();
  const { token } = useAuth();
  const [quizPassed, setQuizPassed] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);

  const isCompleted = isSubsectionCompleted(subsection.id);
  const isUnlocked = isSubsectionUnlocked(section.id, subsection.id);
  const isLab = subsection.type === 'lab';

  const handlePass = async (score) => {
    setQuizPassed(true);
    setRetaking(false);
    await completeSubsection(section.id, subsection.id, score);
  };

  const handleLabComplete = async () => {
    await completeSubsection(section.id, subsection.id, 100);
  };

  const VisualComponent = subsection.visual ? Visuals[subsection.visual] : null;
  const LabComponent = subsection.labComponent ? Labs[subsection.labComponent] : null;

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">Locked</h3>
        <p className="text-text-muted max-w-sm">
          Complete the previous lesson to unlock this one.
        </p>
      </div>
    );
  }

  const showCompletionBar = (quizPassed && !retaking) || (isCompleted && !retaking);

  return (
    <div className="flex gap-0 h-full">
      {/* Main lesson content */}
      <div className={`transition-all duration-300 ${tutorOpen ? 'flex-1 min-w-0' : 'w-full'}`}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
              <span className="text-sm text-text-muted">{section.title}</span>
              {isLab && (
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                  <FlaskConical className="w-3 h-3" /> Lab
                </span>
              )}
              {isCompleted && !retaking && (
                <div className="ml-auto flex items-center gap-1.5 text-success text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{subsection.title}</h1>
              {/* Ask AI button — only for non-lab lessons */}
              {!isLab && (
                <button
                  onClick={() => setTutorOpen(v => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                    tutorOpen
                      ? 'text-primary border border-primary/40 bg-primary/10'
                      : 'text-text-muted border border-white/10 bg-white/5 hover:border-white/20 hover:text-text-primary'
                  }`}
                  style={tutorOpen ? {} : {}}
                >
                  <Sparkles className="w-4 h-4" style={{ color: tutorOpen ? section.color : undefined }} />
                  {tutorOpen ? 'Close Tutor' : 'Ask AI'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-text-muted text-sm">
              <Clock className="w-4 h-4" />
              <span>{subsection.estimatedMinutes} min {isLab ? 'lab' : 'read'}</span>
            </div>
          </div>

          {/* Lab content */}
          {isLab && LabComponent ? (
            <div>
              {subsection.intro && (
                <div className="prose prose-invert max-w-none mb-8">
                  {subsection.intro.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-text-primary/90 leading-relaxed mb-4 text-base">{paragraph}</p>
                  ))}
                </div>
              )}
              <LabComponent onComplete={handleLabComplete} />
              {isCompleted && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Lab complete!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onNext ? (
                        <button onClick={onNext} className="btn-primary flex items-center gap-2">
                          Next lesson <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-warning text-sm mr-2">
                            <Trophy className="w-4 h-4" />
                            <span>All lessons done!</span>
                          </div>
                          {onBackToOverview && (
                            <button onClick={onBackToOverview} className="btn-secondary flex items-center gap-2">
                              Course overview
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Standard lesson content */}
              <div className="prose prose-invert max-w-none mb-8">
                {subsection.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-text-primary/90 leading-relaxed mb-4 text-base">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Visual Component */}
              {VisualComponent && (
                <div className="mb-10">
                  <VisualComponent />
                </div>
              )}

              {/* Knowledge Check */}
              {subsection.quiz?.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    {quizPassed ? (
                      <span className="flex items-center gap-1.5 text-sm text-success">
                        <CheckCircle className="w-4 h-4" />
                        Knowledge check passed!
                      </span>
                    ) : isCompleted && !retaking ? (
                      <span className="flex items-center gap-1.5 text-sm text-success">
                        <CheckCircle className="w-4 h-4" />
                        Previously completed — you can retake anytime
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-text-primary">Knowledge Check</span>
                    )}
                    {isCompleted && !quizPassed && (
                      <button
                        onClick={() => { setRetaking(v => !v); }}
                        className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {retaking ? 'Cancel' : 'Retake'}
                      </button>
                    )}
                  </div>
                  <KnowledgeCheck key={retaking ? 'retake' : 'initial'} quiz={subsection.quiz} onPass={handlePass} />
                </div>
              )}

              {/* Completion bar */}
              {showCompletionBar && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Lesson complete!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onNext ? (
                        <button onClick={onNext} className="btn-primary flex items-center gap-2">
                          Next lesson
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-warning text-sm mr-2">
                            <Trophy className="w-4 h-4" />
                            <span>All lessons done!</span>
                          </div>
                          {onBackToOverview && (
                            <button onClick={onBackToOverview} className="btn-secondary flex items-center gap-2">
                              Course overview
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Per-lesson notes */}
              <LessonNotes subsectionId={subsection.id} token={token} />
            </>
          )}
        </div>
      </div>

      {/* Tutor Panel */}
      {tutorOpen && !isLab && (
        <div className="w-80 flex-shrink-0 ml-6 sticky top-0 h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-white/10">
          <TutorPanel
            subsection={subsection}
            section={section}
            onClose={() => setTutorOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
