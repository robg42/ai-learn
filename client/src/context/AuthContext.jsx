import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    // Clear the HttpOnly cookie by calling a logout endpoint or letting it expire
    // Also clear legacy localStorage token if present
    localStorage.removeItem('ai_learn_token');
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/me', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Invalid token');
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Check session via HttpOnly cookie (sent automatically)
    fetchMe().then(data => {
      if (data) {
        setUser(data.user);
      }
      // Clean up legacy localStorage token
      localStorage.removeItem('ai_learn_token');
      setLoading(false);
    });
  }, [fetchMe]);

  const requestMagicLink = useCallback(async (email, name) => {
    const res = await fetch('/api/auth/magic-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send magic link');
    return data;
  }, []);

  const updateName = useCallback(async (name) => {
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update name');
    setUser(u => ({ ...u, name }));
    return data;
  }, []);

  const verifyMagicLink = useCallback(async (magicToken) => {
    const res = await fetch('/api/auth/magic-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: magicToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid or expired magic link');
    // Cookie is set by the server — no need to store token client-side
    setUser(data.user);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, requestMagicLink, verifyMagicLink, updateName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
