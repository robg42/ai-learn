import React, { useState } from 'react';
import { Clock, CheckCircle, Lock, ChevronRight } from 'lucide-react';
import KnowledgeCheck from './KnowledgeCheck';
import { useProgress } from '../../context/ProgressContext';
import * as Visuals from '../visuals';

export default function SubsectionView({ section, subsection, onNext }) {
  const { isSubsectionCompleted, isSubsectionUnlocked, completeSubsection } = useProgress();
  const [quizPassed, setQuizPassed] = useState(false);

  const isCompleted = isSubsectionCompleted(subsection.id);
  const isUnlocked = isSubsectionUnlocked(section.id, subsection.id);

  const handlePass = async (score) => {
    setQuizPassed(true);
    await completeSubsection(section.id, subsection.id, score);
  };

  const VisualComponent = subsection.visual ? Visuals[subsection.visual] : null;

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">Locked</h3>
        <p className="text-text-muted max-w-sm">
          Complete the previous subsection to unlock this content.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: section.color }}
          />
          <span className="text-sm text-text-muted">{section.title}</span>
          {isCompleted && (
            <div className="ml-auto flex items-center gap-1.5 text-success text-sm">
              <CheckCircle className="w-4 h-4" />
              Completed
            </div>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{subsection.title}</h1>
        <div className="flex items-center gap-2 mt-2 text-text-muted text-sm">
          <Clock className="w-4 h-4" />
          <span>{subsection.estimatedMinutes} min read</span>
        </div>
      </div>

      {/* Content */}
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
      {!isCompleted && !quizPassed && (
        <div className="mt-8 pt-8 border-t border-white/10">
          <KnowledgeCheck quiz={subsection.quiz} onPass={handlePass} />
        </div>
      )}

      {(isCompleted || quizPassed) && (
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-5 h-5 animate-check-pulse" />
              <span className="font-semibold">Subsection complete!</span>
            </div>
            {onNext && (
              <button onClick={onNext} className="btn-primary flex items-center gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
