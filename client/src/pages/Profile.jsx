import React, { useState, useEffect } from 'react';
import {
  Trophy, CheckCircle, BookOpen, Calendar, Share2, Download,
  Lock, Copy, Check, X, Star
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress, getSectionCourses, getAllSubsections } from '../context/ProgressContext';
import { SECTIONS } from '../content/course';
import BadgeGrid from '../components/badges/BadgeGrid';
import ProgressBar from '../components/learn/ProgressBar';

function scoreColor(score) {
  if (score == null) return 'text-text-muted';
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-error';
}

function scoreBg(score) {
  if (score == null) return 'bg-white/10';
  if (score >= 80) return 'bg-success/20';
  if (score >= 60) return 'bg-warning/20';
  return 'bg-error/20';
}

function generateCertificate(userName, sectionTitle, completionDate) {
  // Dynamic import so jsPDF is code-split
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, H = 210;

    // Background
    doc.setFillColor(15, 15, 19);
    doc.rect(0, 0, W, H, 'F');

    // Border
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(2);
    doc.rect(10, 10, W - 20, H - 20);
    doc.setLineWidth(0.5);
    doc.setDrawColor(100, 40, 200);
    doc.rect(13, 13, W - 26, H - 26);

    // Title
    doc.setTextColor(248, 250, 252);
    doc.setFontSize(11);
    doc.text('CERTIFICATE OF COMPLETION', W / 2, 35, { align: 'center' });

    doc.setFontSize(26);
    doc.setTextColor(124, 58, 237);
    doc.text('AI Learn', W / 2, 55, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('This certifies that', W / 2, 75, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(248, 250, 252);
    doc.text(userName, W / 2, 92, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('has successfully completed all lessons in', W / 2, 108, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237);
    doc.text(sectionTitle, W / 2, 124, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Completed on ${completionDate}`, W / 2, 145, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('learn.robgregg.com', W / 2, 190, { align: 'center' });

    doc.save(`AI-Learn-${sectionTitle.replace(/\s+/g, '-')}-Certificate.pdf`);
  });
}

export default function Profile() {
  const { user } = useAuth();
  const { badges, progress, getSectionProgress, getOverallProgress, isSubsectionCompleted } = useProgress();
  const overall = getOverallProgress();
  const [allBadgeDefs, setAllBadgeDefs] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/badges')
      .then(r => r.json())
      .then(data => setAllBadgeDefs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const earnedSlugs = new Set(badges.map(b => b.slug));

  const initials = user?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const handleCopy = () => {
    const text = `I've completed ${overall.completed}/${overall.total} lessons on AI Learn 🧠 — ${overall.percent}% complete with ${badges.length} badge${badges.length !== 1 ? 's' : ''} earned! learn.robgregg.com`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Quiz scores map: subsectionId → score
  const scoreMap = Object.fromEntries(
    (progress || []).map(p => [p.subsection_id, p.quiz_score])
  );

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
                <span className="badge-pill bg-primary/20 text-primary border border-primary/30 text-xs">Admin</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{overall.percent}%</div>
              <div className="text-xs text-text-muted mt-1">Overall complete</div>
              <div className="text-sm text-text-muted mt-0.5">{overall.completed}/{overall.total} lessons</div>
            </div>
            <button
              onClick={() => setShowShare(v => !v)}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share progress
            </button>
          </div>
        </div>

        {/* Share card */}
        {showShare && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 p-5 text-center mb-4">
              <div className="text-3xl font-bold text-primary mb-1">{overall.percent}%</div>
              <p className="text-text-primary font-semibold">{user?.name}</p>
              <p className="text-text-muted text-sm mt-1">
                {overall.completed}/{overall.total} lessons complete · {badges.length} badge{badges.length !== 1 ? 's' : ''}
              </p>
              <p className="text-text-muted/60 text-xs mt-2">AI Learn — learn.robgregg.com</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleCopy}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy text'}
              </button>
              <button onClick={() => setShowShare(false)} className="btn-ghost text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </div>
        )}
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
            const isComplete = prog.completed === prog.total && prog.total > 0;
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
                        const score = scoreMap[sub.id];
                        return (
                          <div key={sub.id} className="flex items-center gap-1.5 text-xs py-0.5">
                            <CheckCircle
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: done ? '#10B981' : undefined, opacity: done ? 1 : 0.25 }}
                            />
                            <span className={`flex-1 truncate ${done ? 'text-text-primary' : 'text-text-muted/60'}`}>
                              {sub.title}
                            </span>
                            {done && score != null && (
                              <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${scoreBg(score)} ${scoreColor(score)}`}>
                                {score}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Certificate button */}
                {isComplete && (
                  <button
                    onClick={() => generateCertificate(
                      user?.name || 'Learner',
                      section.title,
                      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    )}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-success/10 text-success border border-success/20 text-xs font-semibold hover:bg-success/20 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Certificate
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Earned Badges */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Badges Earned ({badges.length})
        </h2>
        <div className="card">
          <BadgeGrid badges={badges} emptyMessage="Complete lessons to earn badges!" />
        </div>
      </div>

      {/* Badge Catalog */}
      {allBadgeDefs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Badge Catalog ({allBadgeDefs.length} total)
          </h2>
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allBadgeDefs.map(badge => {
                const earned = earnedSlugs.has(badge.slug);
                const Icon = LucideIcons[badge.icon] || LucideIcons.Award;
                const earnedBadge = badges.find(b => b.slug === badge.slug);
                return (
                  <div
                    key={badge.slug}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      earned
                        ? 'border-white/10 bg-white/5'
                        : 'border-white/5 bg-white/2 opacity-50'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
                      style={{ backgroundColor: earned ? `${badge.color}25` : 'rgba(255,255,255,0.05)' }}
                    >
                      {earned
                        ? <Icon className="w-5 h-5" style={{ color: badge.color }} />
                        : <Lock className="w-4 h-4 text-text-muted/40" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{badge.name}</p>
                      <p className="text-xs text-text-muted leading-snug mt-0.5">{badge.description}</p>
                      {earned && earnedBadge?.awarded_at && (
                        <p className="text-[10px] text-success mt-1">
                          Earned {new Date(earnedBadge.awarded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
