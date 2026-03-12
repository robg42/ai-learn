import React, { useState } from 'react';
import {
  Brain, LayoutDashboard, BookOpen, Shield, User,
  Settings, LogOut, Menu, X, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ currentPage, setCurrentPage, darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-bg-card border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setCurrentPage('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary hidden sm:block">AI Learn</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(v => !v)}
              className="btn-ghost p-2 rounded-lg"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(v => !v); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-text-primary hidden sm:block">{user?.name?.split(' ')[0]}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-white/10 rounded-xl shadow-xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setCurrentPage('profile'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => { logout(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => { setMenuOpen(v => !v); setProfileOpen(false); }}
              className="md:hidden btn-ghost p-2"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-2 pb-3">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setCurrentPage(id); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                  currentPage === id
                    ? 'text-primary bg-primary/10'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(profileOpen || menuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setProfileOpen(false); setMenuOpen(false); }}
        />
      )}
    </nav>
  );
}
