import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import Login from './components/auth/Login';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import BadgeModal from './components/badges/BadgeModal';

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

  if (!user) {
    return <Login />;
  }

  const handleSetPage = (page) => {
    setCurrentPage(page);
    if (page !== 'learn') setLearnTarget(null);
  };

  return (
    <ProgressProvider>
      <div className="min-h-screen bg-bg-dark text-text-primary">
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
          {currentPage === 'admin' && user.role === 'admin' && <Admin />}
        </main>

        <BadgeModal />
      </div>
    </ProgressProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
