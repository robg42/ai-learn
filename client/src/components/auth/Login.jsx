import React, { useState, useEffect } from 'react';
import { Brain, Mail, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { requestMagicLink, verifyMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState('request'); // 'request' | 'sent'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState('');
  const [devOpen, setDevOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Auto-verify if ?token= is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setVerifying(true);
      verifyMagicLink(urlToken)
        .then(() => {
          window.history.replaceState({}, '', '/');
        })
        .catch(err => {
          setError(err.message);
          setVerifying(false);
        });
    }
  }, [verifyMagicLink]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestMagicLink(email);
      setStage('sent');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDevVerify = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      await verifyMagicLink(devToken.trim());
    } catch (err) {
      setError(err.message);
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">AI Learn</h1>
          <p className="text-text-muted mt-1">Master LLMs, Agentic AI & AI Security</p>
        </div>

        <div className="card">
          {stage === 'request' ? (
            <>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Sign in</h2>
              <p className="text-sm text-text-muted mb-6">
                Enter your email and we'll send you a magic link — no password needed.
              </p>

              {error && (
                <div className="bg-error/10 border border-error/20 text-error rounded-lg px-4 py-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : (
                    <>
                      Send magic link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">Check your inbox</h2>
                <p className="text-sm text-text-muted">
                  A magic link has been sent to{' '}
                  <span className="text-text-primary font-medium">{email}</span>.
                  Click it to sign in.
                </p>
                <p className="text-xs text-text-muted/70 mt-2">Link expires in 15 minutes.</p>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 text-error rounded-lg px-4 py-3 mt-4 text-sm">
                  {error}
                </div>
              )}

              {/* Dev shortcut: paste token from server console */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => setDevOpen(v => !v)}
                  className="flex items-center gap-2 text-xs text-text-muted/60 hover:text-text-muted transition-colors mx-auto"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${devOpen ? 'rotate-180' : ''}`} />
                  Dev: paste token directly
                </button>
                {devOpen && (
                  <form onSubmit={handleDevVerify} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      className="input flex-1 text-sm font-mono"
                      placeholder="Paste token from server console"
                      value={devToken}
                      onChange={e => setDevToken(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={verifying}
                      className="btn-primary px-3 text-sm"
                    >
                      Go
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setStage('request'); setError(''); }}
                  className="text-xs text-text-muted/60 hover:text-text-muted underline transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
