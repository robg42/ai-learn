import React, { useState, useEffect } from 'react';
import {
  Users, Award, BarChart2, BookOpen, Search, Plus,
  CheckCircle, RefreshCw, X, ChevronDown, ChevronUp
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'badges', label: 'Badge Manager', icon: Award },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'content', label: 'Content', icon: BookOpen },
];

const ICON_OPTIONS = [
  'Award', 'Star', 'Heart', 'Zap', 'Flame', 'Crown', 'Diamond',
  'Target', 'Rocket', 'Sparkles', 'Globe', 'Shield', 'Lock',
  'Key', 'Lightbulb', 'Cpu', 'Code', 'Database', 'Terminal', 'Wifi'
];

const COLOR_PRESETS = [
  '#6B46C1', '#38BDF8', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#8B5CF6', '#0EA5E9'
];

export default function Admin() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  // Badge creator state
  const [badgeName, setBadgeName] = useState('');
  const [badgeDesc, setBadgeDesc] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('Award');
  const [badgeColor, setBadgeColor] = useState('#6B46C1');
  const [badgeSuccess, setBadgeSuccess] = useState('');
  const [badgeError, setBadgeError] = useState('');
  const [creating, setCreating] = useState(false);

  // Add user state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [addUserSuccess, setAddUserSuccess] = useState('');
  const [addUserError, setAddUserError] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // Award state
  const [awardUserId, setAwardUserId] = useState('');
  const [awardBadgeId, setAwardBadgeId] = useState('');
  const [awardSearch, setAwardSearch] = useState('');
  const [awardSuccess, setAwardSuccess] = useState('');
  const [awardError, setAwardError] = useState('');

  const api = async (path, options = {}) => {
    const res = await fetch(`/api/admin${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    return res.json();
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api('/users'),
      api('/badges'),
      api('/analytics'),
    ]).then(([u, b, a]) => {
      setUsers(Array.isArray(u) ? u : []);
      setBadges(Array.isArray(b) ? b : []);
      setAnalytics(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    setBadgeError('');
    setBadgeSuccess('');
    setCreating(true);
    try {
      const badge = await api('/badges', {
        method: 'POST',
        body: JSON.stringify({ name: badgeName, description: badgeDesc, icon: badgeIcon, color: badgeColor }),
      });
      if (badge.error) throw new Error(badge.error);
      setBadges(prev => [badge, ...prev]);
      setBadgeName('');
      setBadgeDesc('');
      setBadgeSuccess(`Badge "${badge.name}" created!`);
      setTimeout(() => setBadgeSuccess(''), 3000);
    } catch (err) {
      setBadgeError(err.message);
    }
    setCreating(false);
  };

  const handleAward = async (e) => {
    e.preventDefault();
    setAwardError('');
    setAwardSuccess('');
    try {
      const result = await api('/badges/award', {
        method: 'POST',
        body: JSON.stringify({ userId: Number(awardUserId), badgeId: Number(awardBadgeId) }),
      });
      if (result.error) throw new Error(result.error);
      // Update local state so badge appears immediately without a page refresh
      const awardedBadge = badges.find(b => String(b.id) === String(awardBadgeId));
      if (awardedBadge) {
        setUsers(prev => prev.map(u =>
          String(u.id) === String(awardUserId)
            ? {
                ...u,
                badges: [
                  // keep existing badges, prevent dupes
                  ...(u.badges || []).filter(b => b.slug !== awardedBadge.slug),
                  { ...awardedBadge, awarded_at: new Date().toISOString() },
                ],
              }
            : u
        ));
      }
      setAwardSuccess('Badge awarded successfully!');
      setTimeout(() => setAwardSuccess(''), 3000);
    } catch (err) {
      setAwardError(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserError('');
    setAddUserSuccess('');
    setAddingUser(true);
    try {
      const result = await api('/users', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail, name: newName, role: newRole }),
      });
      if (result.error) throw new Error(result.error);
      setUsers(prev => [{ ...result, badges: [], progressSummary: {}, totalCompleted: 0, last_login_at: null, login_count: 0 }, ...prev]);
      setAddUserSuccess(`Account created for ${result.name}`);
      setNewEmail('');
      setNewName('');
      setNewRole('user');
      setShowAddUser(false);
      setTimeout(() => setAddUserSuccess(''), 4000);
    } catch (err) {
      setAddUserError(err.message);
    }
    setAddingUser(false);
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const { SECTIONS: COURSE_SECTIONS } = require('../content/course');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-text-muted mt-1">Manage users, badges, and view platform analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === id
                ? 'bg-primary text-white shadow'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex gap-4 mb-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="badge-pill bg-white/10 text-text-muted">
                  {filteredUsers.length} users
                </div>
                <button
                  onClick={() => { setShowAddUser(v => !v); setAddUserError(''); setAddUserSuccess(''); }}
                  className="btn-primary flex items-center gap-2 ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              {addUserSuccess && (
                <div className="bg-success/10 border border-success/20 text-success rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {addUserSuccess}
                </div>
              )}

              {showAddUser && (
                <div className="card mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-text-primary">Add New User</h3>
                    <button onClick={() => setShowAddUser(false)} className="text-text-muted hover:text-text-primary">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {addUserError && (
                    <div className="bg-error/10 border border-error/20 text-error rounded-lg px-4 py-3 mb-4 text-sm">
                      {addUserError}
                    </div>
                  )}
                  <form onSubmit={handleAddUser} className="flex gap-3 flex-wrap">
                    <input
                      type="text"
                      className="input flex-1 min-w-40"
                      placeholder="Full name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                    />
                    <input
                      type="email"
                      className="input flex-1 min-w-48"
                      placeholder="Email address"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      required
                    />
                    <select
                      className="input w-32"
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" disabled={addingUser} className="btn-primary">
                      {addingUser ? 'Adding...' : 'Add'}
                    </button>
                  </form>
                </div>
              )}

              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Name', 'Email', 'LLM', 'Agentic', 'Security', 'Badges', 'Last Login', 'Logins'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <React.Fragment key={u.id}>
                          <tr
                            className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                            onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-text-primary">{u.name}</p>
                                  {u.role === 'admin' && (
                                    <span className="text-xs text-primary">admin</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-text-muted">{u.email}</td>
                            {['llm-basics', 'agentic-ai', 'ai-security'].map(sid => {
                              const prog = u.progressSummary?.[sid];
                              const pct = prog ? Math.round((prog.completed / prog.total) * 100) : 0;
                              return (
                                <td key={sid} className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-text-muted">{pct}%</span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3">
                              <span className="badge-pill bg-warning/20 text-warning text-xs">
                                {u.badges?.length || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-text-muted">
                              {u.last_login_at
                                ? new Date(u.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'Never'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="badge-pill bg-primary/20 text-primary text-xs">
                                {u.login_count || 0}
                              </span>
                            </td>
                          </tr>
                          {expandedUser === u.id && (
                            <tr className="bg-white/5 border-b border-white/10">
                              <td colSpan={9} className="px-6 py-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                                  <div>
                                    <p className="text-text-muted text-xs mb-1">Member Since</p>
                                    <p className="text-text-primary font-medium">{u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-text-muted text-xs mb-1">Last Login</p>
                                    <p className="text-text-primary font-medium">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</p>
                                  </div>
                                  <div>
                                    <p className="text-text-muted text-xs mb-1">Total Logins</p>
                                    <p className="text-text-primary font-medium">{u.login_count || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-text-muted text-xs mb-1">Lessons Complete</p>
                                    <p className="text-text-primary font-medium">{u.totalCompleted || 0}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <strong className="text-sm text-text-muted w-full mb-1">Badges:</strong>
                                  {u.badges?.length === 0
                                    ? <span className="text-text-muted text-sm">None yet</span>
                                    : u.badges?.map(b => {
                                      const Icon = LucideIcons[b.icon] || LucideIcons.Award;
                                      return (
                                        <span
                                          key={b.slug}
                                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                          style={{ backgroundColor: `${b.color}20`, color: b.color }}
                                        >
                                          <Icon className="w-3 h-3" />
                                          {b.name}
                                        </span>
                                      );
                                    })
                                  }
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Badge Manager Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create badge */}
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Create Custom Badge
                </h3>

                {badgeSuccess && (
                  <div className="bg-success/10 border border-success/20 text-success rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {badgeSuccess}
                  </div>
                )}
                {badgeError && (
                  <div className="bg-error/10 border border-error/20 text-error rounded-lg px-4 py-3 mb-4 text-sm">
                    {badgeError}
                  </div>
                )}

                <form onSubmit={handleCreateBadge} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Badge Name</label>
                    <input type="text" className="input" placeholder="e.g. Security Champion" value={badgeName} onChange={e => setBadgeName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
                    <input type="text" className="input" placeholder="What did they do to earn this?" value={badgeDesc} onChange={e => setBadgeDesc(e.target.value)} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Icon</label>
                    <div className="grid grid-cols-5 gap-2">
                      {ICON_OPTIONS.map(icon => {
                        const Icon = LucideIcons[icon];
                        return (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setBadgeIcon(icon)}
                            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                              badgeIcon === icon
                                ? 'border-primary bg-primary/20'
                                : 'border-white/10 hover:border-white/30 bg-white/5'
                            }`}
                            title={icon}
                          >
                            {Icon && <Icon className="w-4 h-4 text-text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Color</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBadgeColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${badgeColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={badgeColor}
                        onChange={e => setBadgeColor(e.target.value)}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${badgeColor}25` }}
                    >
                      {(() => {
                        const Icon = LucideIcons[badgeIcon] || LucideIcons.Award;
                        return <Icon className="w-6 h-6" style={{ color: badgeColor }} />;
                      })()}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{badgeName || 'Badge Name'}</p>
                      <p className="text-xs text-text-muted">{badgeDesc || 'Badge description'}</p>
                    </div>
                  </div>

                  <button type="submit" disabled={creating} className="btn-primary w-full">
                    {creating ? 'Creating...' : 'Create Badge'}
                  </button>
                </form>
              </div>

              {/* Award badge */}
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-6">Award Badge to User</h3>

                  {awardSuccess && (
                    <div className="bg-success/10 border border-success/20 text-success rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {awardSuccess}
                    </div>
                  )}
                  {awardError && (
                    <div className="bg-error/10 border border-error/20 text-error rounded-lg px-4 py-3 mb-4 text-sm">
                      {awardError}
                    </div>
                  )}

                  <form onSubmit={handleAward} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1.5">Search User</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          className="input pl-10"
                          placeholder="Search by name or email..."
                          value={awardSearch}
                          onChange={e => { setAwardSearch(e.target.value); setAwardUserId(''); }}
                        />
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {users
                          .filter(u => !awardSearch || u.name.toLowerCase().includes(awardSearch.toLowerCase()) || u.email.toLowerCase().includes(awardSearch.toLowerCase()))
                          .slice(0, 10)
                          .map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => { setAwardUserId(String(u.id)); setAwardSearch(u.name); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                                awardUserId === String(u.id)
                                  ? 'bg-primary/20 text-primary'
                                  : 'hover:bg-white/5 text-text-muted hover:text-text-primary'
                              }`}
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-white">
                                {u.name.charAt(0)}
                              </div>
                              <span>{u.name}</span>
                              <span className="text-text-muted text-xs ml-auto">{u.email}</span>
                            </button>
                          ))
                        }
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1.5">Select Badge</label>
                      <select
                        className="input"
                        value={awardBadgeId}
                        onChange={e => setAwardBadgeId(e.target.value)}
                        required
                      >
                        <option value="">Choose a badge...</option>
                        {badges.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!awardUserId || !awardBadgeId}
                      className="btn-primary w-full"
                    >
                      Award Badge
                    </button>
                  </form>
                </div>

                {/* All badges list */}
                <div className="card">
                  <h3 className="text-base font-semibold text-text-primary mb-4">All Badges ({badges.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {badges.map(badge => {
                      const Icon = LucideIcons[badge.icon] || LucideIcons.Award;
                      return (
                        <div
                          key={badge.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${badge.color}20` }}>
                            <Icon className="w-4 h-4" style={{ color: badge.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{badge.name}</p>
                            <p className="text-xs text-text-muted truncate">{badge.description}</p>
                          </div>
                          <span className={`text-xs badge-pill ${badge.type === 'auto' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                            {badge.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Badge Holders */}
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Badge Holders
              </h3>
              <div className="space-y-3">
                {badges.map(badge => {
                  const Icon = LucideIcons[badge.icon] || LucideIcons.Award;
                  const holders = users.filter(u => u.badges?.some(b => b.slug === badge.slug));
                  return (
                    <div key={badge.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${badge.color}20` }}>
                          <Icon className="w-4 h-4" style={{ color: badge.color }} />
                        </div>
                        <p className="text-sm font-medium text-text-primary flex-1">{badge.name}</p>
                        <span className="badge-pill bg-white/10 text-text-muted text-xs">
                          {holders.length} holder{holders.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {holders.length === 0 ? (
                        <p className="text-xs text-text-muted pl-11">No one has this badge yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pl-11">
                          {holders.map(u => (
                            <span
                              key={u.id}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-xs text-text-muted"
                            >
                              <span className="w-4 h-4 rounded-full bg-primary/40 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                {u.name.charAt(0)}
                              </span>
                              {u.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8">
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Users', value: analytics.totalUsers, color: '#6B46C1' },
                  { label: 'Avg Completion', value: `${analytics.avgCompletionPercent}%`, color: '#38BDF8' },
                  { label: 'Badges Awarded', value: users.reduce((sum, u) => sum + (u.badges?.length || 0), 0), color: '#F59E0B' },
                ].map(stat => (
                  <div key={stat.label} className="card text-center">
                    <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className="text-text-muted text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Completion chart */}
              <div className="card">
                <h3 className="text-base font-semibold text-text-primary mb-4">Completion by Subsection</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.subsectionCompletion} margin={{ left: 0, right: 0, top: 0, bottom: 40 }}>
                    <XAxis
                      dataKey="subsection_id"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#F1F5F9' }}
                      itemStyle={{ color: '#6B46C1' }}
                    />
                    <Bar dataKey="completed_count" fill="#6B46C1" radius={[4, 4, 0, 0]} name="Completions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Signups over time */}
              <div className="card">
                <h3 className="text-base font-semibold text-text-primary mb-4">Signups (last 30 days)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={analytics.signupsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#F1F5F9' }}
                      itemStyle={{ color: '#38BDF8' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#38BDF8" strokeWidth={2} dot={false} name="Signups" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {COURSE_SECTIONS.map(section => (
                <div key={section.id} className="card">
                  <h3 className="text-base font-semibold text-text-primary mb-3" style={{ color: section.color }}>
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.subsections.map(sub => (
                      <div key={sub.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{sub.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {sub.estimatedMinutes} min · {sub.quiz.length} questions ·{' '}
                              {sub.quiz.map(q => q.type).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {sub.quiz.map((q, qi) => (
                            <p key={q.id} className="text-xs text-text-muted pl-3 border-l border-white/10">
                              Q{qi + 1}: {q.question}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
