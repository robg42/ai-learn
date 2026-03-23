import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import Login from './components/auth/Login';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';
import Labs from './pages/Labs';
import BadgeModal from './components/badges/BadgeModal';

function NamePrompt() {
  const { updateName } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateName(name.trim());
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-2">One last thing</h2>
          <p className="text-sm text-text-muted mb-6">What should we call you?</p>
          {error && (
            <div className="bg-error/10 border border-error/20 text-error rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              className="input w-full"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? 'Saving...' : (<>Get started <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [learnTarget, setLearnTarget] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  if (!user.name) return <NamePrompt />;

  const handleSetPage = (page) => {
    setCurrentPage(page);
    if (page !== 'learn') setLearnTarget(null);
  };

  return (
    <ProgressProvider>
      <AppWithPreview
        currentPage={currentPage}
        handleSetPage={handleSetPage}
        learnTarget={learnTarget}
        setLearnTarget={setLearnTarget}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
      />
    </ProgressProvider>
  );
}

function AppWithPreview({ currentPage, handleSetPage, learnTarget, setLearnTarget, darkMode, setDarkMode, user }) {
  const { previewAll, setPreviewAll } = useProgress();

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      {previewAll && user?.role === 'admin' && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
            <Eye className="w-3.5 h-3.5" />
            All-Seeing Eye active — all content unlocked for admin preview
          </div>
          <button
            onClick={() => setPreviewAll(false)}
            className="text-xs text-amber-400 hover:text-amber-200 flex items-center gap-1 transition-colors"
          >
            <EyeOff className="w-3 h-3" /> Disable
          </button>
        </div>
      )}
      <div className={previewAll && user?.role === 'admin' ? '' : ''}>
        <Navbar
          currentPage={currentPage}
          setCurrentPage={handleSetPage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main>
          {currentPage === 'dashboard' && (
            <Dashboard setCurrentPage={handleSetPage} setLearnTarget={setLearnTarget} />
          )}
          {currentPage === 'learn' && (
            <Learn initialTarget={learnTarget} />
          )}
          {currentPage === 'profile' && <Profile />}
          {currentPage === 'leaderboard' && <Leaderboard />}
          {currentPage === 'labs' && <Labs />}
          {currentPage === 'admin' && user.role === 'admin' && <Admin />}
        </main>

        <BadgeModal />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
