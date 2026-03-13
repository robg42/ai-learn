import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('ai_learn_token');
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async (t) => {
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!res.ok) throw new Error('Invalid token');
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('ai_learn_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    setToken(storedToken);
    fetchMe(storedToken).then(data => {
      if (data) {
        setUser(data.user);
      } else {
        logout();
      }
      setLoading(false);
    });
  }, [fetchMe, logout]);

  const requestMagicLink = useCallback(async (email, name) => {
    const res = await fetch('/api/auth/magic-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send magic link');
    return data;
  }, []);

  const updateName = useCallback(async (name) => {
    const t = localStorage.getItem('ai_learn_token');
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
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
      body: JSON.stringify({ token: magicToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid or expired magic link');
    localStorage.setItem('ai_learn_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, requestMagicLink, verifyMagicLink, updateName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
