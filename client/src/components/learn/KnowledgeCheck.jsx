import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, RefreshCw, Trophy } from 'lucide-react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function KnowledgeCheck({ quiz, onPass }) {
  const shuffledQuiz = useMemo(() => {
    return quiz.map(q => {
      const optionObjects = q.options.map((text, originalIdx) => ({
        text,
        isCorrect: q.correct.includes(originalIdx),
      }));
      const shuffledOptions = shuffle(optionObjects);
      const newCorrect = shuffledOptions
        .map((o, newIdx) => (o.isCorrect ? newIdx : -1))
        .filter(i => i !== -1);
      return { ...q, options: shuffledOptions.map(o => o.text), correct: newCorrect };
    });
  }, [quiz]);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleSelect = (questionId, optionIndex, isMulti) => {
    if (submitted) return;
    setAnswers(prev => {
      if (isMulti) {
        const current = prev[questionId] || [];
        const updated = current.includes(optionIndex)
          ? current.filter(i => i !== optionIndex)
          : [...current, optionIndex];
        return { ...prev, [questionId]: updated };
      } else {
        return { ...prev, [questionId]: [optionIndex] };
      }
    });
  };

  const handleSubmit = () => {
    if (!submitted) {
      const qResults = shuffledQuiz.map(q => {
        const selected = answers[q.id] || [];
        const correct = q.correct;
        const isCorrect =
          selected.length === correct.length &&
          correct.every(c => selected.includes(c));
        return { id: q.id, isCorrect, selected };
      });
      const score = Math.round((qResults.filter(r => r.isCorrect).length / shuffledQuiz.length) * 100);
      const passed = score >= 60;
      setResults({ qResults, score, passed });
      setSubmitted(true);
      if (passed) {
        setShowCelebration(true);
        setTimeout(() => { setShowCelebration(false); onPass(score); }, 2000);
      }
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setShowCelebration(false);
  };

  const allAnswered = shuffledQuiz.every(q => (answers[q.id] || []).length > 0);

  if (showCelebration) {
    return (
      <div className="card text-center py-12">
        <div className="animate-badge-earn inline-block">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
            <Trophy className="w-10 h-10 text-success" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">Excellent!</h3>
        <p className="text-text-muted">You scored {results?.score}% — subsection complete!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Knowledge Check</h3>
        {results && (
          <div className={`badge-pill ${results.passed ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            {results.score}% {results.passed ? '— Passed!' : '— Need 60%'}
          </div>
        )}
      </div>

      {submitted && !results?.passed && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <p className="text-error text-sm font-medium">
            You scored {results?.score}%. You need at least 60% to complete this subsection.
            Review the explanations below and try again.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {shuffledQuiz.map((question, qi) => {
          const qResult = results?.qResults.find(r => r.id === question.id);
          const selected = answers[question.id] || [];
          return (
            <div
              key={question.id}
              className={`card transition-all duration-300 ${
                submitted && qResult?.isCorrect ? 'border-success/30 bg-success/5'
                : submitted && !qResult?.isCorrect ? 'border-error/30 bg-error/5'
                : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {qi + 1}
                </span>
                <div>
                  <p className="text-text-primary font-medium">{question.question}</p>
                  {question.type === 'multi' && (
                    <p className="text-xs text-text-muted mt-1">Select all that apply</p>
                  )}
                </div>
                {submitted && (
                  <div className="ml-auto flex-shrink-0">
                    {qResult?.isCorrect
                      ? <CheckCircle className="w-5 h-5 text-success animate-check-pulse" />
                      : <XCircle className="w-5 h-5 text-error" />}
                  </div>
                )}
              </div>
              <div className="space-y-2 ml-9">
                {question.options.map((option, oi) => {
                  const isSelected = selected.includes(oi);
                  const isCorrect = question.correct.includes(oi);
                  let optionClass = 'border-white/10 hover:border-primary/50 hover:bg-primary/5 cursor-pointer';
                  if (submitted) {
                    if (isCorrect) optionClass = 'border-success/50 bg-success/10 cursor-default';
                    else if (isSelected && !isCorrect) optionClass = 'border-error/50 bg-error/10 cursor-default';
                    else optionClass = 'border-white/5 opacity-60 cursor-default';
                  } else if (isSelected) {
                    optionClass = 'border-primary/60 bg-primary/10 cursor-pointer';
                  }
                  return (
                    <div
                      key={oi}
                      onClick={() => handleSelect(question.id, oi, question.type === 'multi')}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${optionClass}`}
                    >
                      <div className={`flex-shrink-0 w-4 h-4 rounded-${question.type === 'multi' ? 'sm' : 'full'} border-2 transition-all ${
                        submitted
                          ? isCorrect ? 'border-success bg-success' : isSelected ? 'border-error bg-error' : 'border-white/20'
                          : isSelected ? 'border-primary bg-primary' : 'border-white/30'
                      }`}>
                        {(submitted ? isCorrect || (isSelected && !isCorrect) : isSelected) && (
                          <svg className="w-full h-full text-white p-0.5" viewBox="0 0 12 12" fill="none">
                            {isCorrect || (!submitted && isSelected)
                              ? <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              : <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            }
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-text-primary">{option}</span>
                    </div>
                  );
                })}
              </div>
              {submitted && (
                <div className="mt-4 ml-9 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Explanation</p>
                  <p className="text-sm text-text-primary">{question.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-end">
        {submitted && !results?.passed && (
          <button onClick={handleRetry} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
        {!submitted && (
          <button onClick={handleSubmit} disabled={!allAnswered} className="btn-primary">
            Submit answers
          </button>
        )}
      </div>
    </div>
  );
}
