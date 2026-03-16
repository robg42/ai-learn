import React, { useState, useEffect } from 'react';
import { Trophy, BookOpen, Award, Clock, RefreshCw, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TOTAL_LESSONS = 18;

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load leaderboard'); setLoading(false); });
  }, []);

  // Leaderboard access gated by can_view_leaderboard
  if (user && user.can_view_leaderboard === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <EyeOff className="w-12 h-12 text-text-muted/40 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Leaderboard not available</h2>
        <p className="text-text-muted">The leaderboard is not enabled for your account.</p>
      </div>
    );
  }

  const medal = (i) => {
    if (i === 0) return { emoji: '🥇', color: '#F59E0B' };
    if (i === 1) return { emoji: '🥈', color: '#94A3B8' };
    if (i === 2) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: `${i + 1}`, color: '#64748B' };
  };

  // Find current user's rank
  const myRank = user ? rows.findIndex(r => r.id === user.id) : -1;
  const myRow = myRank >= 0 ? rows[myRank] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
          <p className="text-text-muted text-sm mt-0.5">Top learners ranked by lessons completed</p>
        </div>
      </div>

      {/* Your rank card (if logged in and on board) */}
      {myRow && (
        <div className="card mb-6 border-primary/30 bg-primary/5">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Your rank</p>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold" style={{ color: medal(myRank).color }}>
              {medal(myRank).emoji}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{myRow.name} <span className="text-xs text-primary">(you)</span></p>
              <div className="flex gap-4 mt-1 text-xs text-text-muted">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{myRow.lessonsCompleted}/{TOTAL_LESSONS} lessons</span>
                <span className="flex items-center gap-1"><Award className="w-3 h-3" />{myRow.badgesEarned} badges</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{Math.round((myRow.lessonsCompleted / TOTAL_LESSONS) * 100)}%</div>
              <div className="text-xs text-text-muted">complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center py-12 text-text-muted">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-12 text-text-muted">No entries yet — be the first!</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide w-12">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Badges</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide hidden sm:table-cell">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const m = medal(i);
                const pct = Math.round((row.lessonsCompleted / TOTAL_LESSONS) * 100);
                const isMe = user && row.id === user.id;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-white/5 transition-colors ${
                      isMe ? 'bg-primary/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: m.color }}>{m.emoji}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: isMe ? '#6B46C1' : '#334155' }}
                        >
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {row.name}
                          {isMe && <span className="ml-1.5 text-xs text-primary">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-primary">{row.lessonsCompleted}</span>
                        <span className="text-xs text-text-muted">/{TOTAL_LESSONS}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-pill bg-warning/20 text-warning text-xs">{row.badgesEarned}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-text-muted">
                        {row.lastActive
                          ? new Date(row.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {user && user.show_on_leaderboard === 0 && (
        <p className="text-center text-xs text-text-muted mt-4">
          Your name is currently hidden from this leaderboard. Contact an admin to appear here.
        </p>
      )}
    </div>
  );
}
