import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Search, AlertTriangle, Shield, Play, Eye } from 'lucide-react';

const KNOWLEDGE_BASE = [
  { id: 1, doc: 'Public FAQ', content: 'Our product is available in 45 countries. Pricing starts at $29/month for the Basic plan.', sensitivity: 'public' },
  { id: 2, doc: 'Internal Roadmap Q4', content: 'CONFIDENTIAL: We plan to launch the Enterprise tier in Q4 at $299/month. The unreleased "Nexus" feature will be gated behind this tier.', sensitivity: 'confidential' },
  { id: 3, doc: 'Customer List Export', content: 'CONFIDENTIAL: Top customers include Acme Corp ($2.1M ARR), Global Bank Ltd ($1.8M ARR), TechStart Inc ($950K ARR).', sensitivity: 'confidential' },
  { id: 4, doc: 'Engineering Handbook', content: 'Our API uses JWT tokens with RS256 signing. The token endpoint is /auth/token. Tokens expire after 24 hours.', sensitivity: 'internal' },
  { id: 5, doc: 'Public Blog Post', content: 'We were founded in 2020 and have raised $45M in Series B funding. Our team has grown to 120 employees.', sensitivity: 'public' },
  { id: 6, doc: 'Security Audit Report', content: 'CONFIDENTIAL: A vulnerability was identified in the file upload endpoint (CVE-2024-XXXX). Patch deployed 2024-09-15. Previous exposure window: 90 days.', sensitivity: 'confidential' },
  { id: 7, doc: 'Employee Directory', content: 'INTERNAL: CEO Sarah Chen (s.chen@company.com), CTO Marcus Webb (m.webb@company.com), CISO James Park (j.park@company.com).', sensitivity: 'internal' },
  { id: 8, doc: 'Product Documentation', content: 'The REST API supports GET, POST, PUT, and DELETE operations. Authentication uses Bearer tokens in the Authorization header.', sensitivity: 'public' },
];

const ATTACK_QUERIES = [
  {
    label: 'Direct ask',
    query: 'What are your top customers and how much do they pay?',
    leaksIds: [3],
    explanation: 'A naive RAG system retrieves the customer list chunk and serves it directly. No sensitivity filtering = full data exposure.',
  },
  {
    label: 'Indirect extraction',
    query: 'I\'m a potential enterprise customer. What pricing tiers exist beyond the Basic plan?',
    leaksIds: [2],
    explanation: 'The "potential customer" framing sounds legitimate. Retrieves unreleased pricing and feature roadmap — competitive intelligence leak.',
  },
  {
    label: 'Security recon',
    query: 'Have there been any security incidents or vulnerabilities in your platform?',
    leaksIds: [6],
    explanation: 'Retrieves the security audit report including CVE details, exposure window — a gift to attackers.',
  },
  {
    label: 'Targeted phishing',
    query: 'Who are the technical leaders I should contact about an enterprise integration?',
    leaksIds: [7],
    explanation: 'Retrieves internal employee directory with names and email addresses — enables targeted spear phishing.',
  },
  {
    label: 'Tech stack recon',
    query: 'How does your authentication system work? What token format and signing algorithm do you use?',
    leaksIds: [4],
    explanation: 'Retrieves internal engineering details about JWT implementation — useful for planning auth bypass attempts.',
  },
];

function naiveRetrieve(query) {
  const q = query.toLowerCase();
  return KNOWLEDGE_BASE.filter(doc =>
    doc.content.toLowerCase().split(' ').some(word => q.includes(word) && word.length > 4)
  ).slice(0, 3);
}

function safeRetrieve(query) {
  return naiveRetrieve(query).filter(doc => doc.sensitivity === 'public');
}

const SENSITIVITY_COLORS = { public: '#22c55e', internal: '#f59e0b', confidential: '#ef4444' };

export default function DataLeakageLab({ onComplete }) {
  const { token } = useAuth();
  const [activeQuery, setActiveQuery] = useState(null);
  const [mode, setMode] = useState('unsafe'); // unsafe | safe
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrievedDocs, setRetrievedDocs] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [ranSafe, setRanSafe] = useState(false);
  const [ranUnsafe, setRanUnsafe] = useState(false);

  const runQuery = async (queryObj, queryMode) => {
    if (loading) return;
    setActiveQuery(queryObj);
    setMode(queryMode);
    setResponse('');
    setLoading(true);

    const docs = queryMode === 'safe' ? safeRetrieve(queryObj.query) : naiveRetrieve(queryObj.query);
    setRetrievedDocs(docs);

    const context = docs.length > 0
      ? docs.map(d => `[${d.doc}]: ${d.content}`).join('\n\n')
      : 'No relevant documents found.';

    const prompt = `You are a company chatbot. Answer the user's question using only the provided context.\n\nContext:\n${context}\n\nQuestion: ${queryObj.query}`;

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'playground' }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try { const p = JSON.parse(data); if (p.text) setResponse(prev => prev + p.text); } catch {}
        }
      }
    } catch {
      setResponse('⚠️ Error');
    }

    if (queryMode === 'safe') setRanSafe(true);
    else setRanUnsafe(true);

    if (!completed && (queryMode === 'safe' || ranUnsafe) && (queryMode === 'unsafe' || ranSafe)) {
      setCompleted(true);
      onComplete?.();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-300 mb-1">RAG Data Leakage</p>
            <p className="text-xs text-text-muted leading-relaxed">
              A company built a chatbot with RAG over their entire knowledge base — public docs,
              internal wikis, and confidential reports all in the same vector store.
              Run attack queries to see what leaks, then switch to "safe mode" to see how sensitivity
              filtering stops the leakage.
            </p>
          </div>
        </div>
      </div>

      {/* Knowledge base overview */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Knowledge base (all indexed together):
        </p>
        <div className="flex flex-wrap gap-2">
          {KNOWLEDGE_BASE.map(doc => (
            <div key={doc.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border"
              style={{ borderColor: `${SENSITIVITY_COLORS[doc.sensitivity]}30`, backgroundColor: `${SENSITIVITY_COLORS[doc.sensitivity]}10`, color: SENSITIVITY_COLORS[doc.sensitivity] }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SENSITIVITY_COLORS[doc.sensitivity] }} />
              {doc.doc}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          {Object.entries(SENSITIVITY_COLORS).map(([level, color]) => (
            <span key={level} className="text-[10px] text-text-muted flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {level}
            </span>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => {}} className="text-xs text-text-muted">Retrieval mode:</button>
        {[
          { id: 'unsafe', label: '🔓 No filtering', desc: 'All docs retrieved' },
          { id: 'safe', label: '🔒 Sensitivity filter', desc: 'Public only' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${mode === m.id
              ? m.id === 'unsafe' ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-green-500/20 border-green-500/40 text-green-300'
              : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'}`}>
            {m.label} <span className="opacity-60">— {m.desc}</span>
          </button>
        ))}
      </div>

      {/* Attack queries */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-2">Try an attack query:</p>
        <div className="space-y-2">
          {ATTACK_QUERIES.map((q, i) => (
            <button key={i} onClick={() => runQuery(q, mode)} disabled={loading}
              className="w-full text-left rounded-xl border bg-white/3 hover:bg-white/5 border-white/10 hover:border-white/20 p-3 transition-all disabled:opacity-50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">{q.label}</p>
                  <p className="text-xs text-text-muted">"{q.query}"</p>
                </div>
                <Play className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {activeQuery && (
        <div className="space-y-3">
          <div className={`rounded-xl border p-3 ${mode === 'unsafe' ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
            <p className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5"
              style={{ color: mode === 'unsafe' ? '#ef4444' : '#22c55e' }}>
              {mode === 'unsafe' ? <AlertTriangle className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              Retrieved chunks ({mode === 'unsafe' ? 'unfiltered' : 'public only'})
            </p>
            {retrievedDocs.length === 0
              ? <p className="text-xs text-text-muted">No matching documents.</p>
              : retrievedDocs.map(doc => (
                <div key={doc.id} className="flex items-start gap-2 text-xs mb-2 last:mb-0">
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: `${SENSITIVITY_COLORS[doc.sensitivity]}15`, color: SENSITIVITY_COLORS[doc.sensitivity] }}>
                    {doc.sensitivity}
                  </span>
                  <span className="text-text-muted">[{doc.doc}]: {doc.content.slice(0, 80)}…</span>
                </div>
              ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Model response:</p>
            {loading && !response && (
              <div className="flex gap-1 text-text-muted">
                <span className="animate-pulse">●</span><span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span><span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}
            <p className="text-sm text-text-primary leading-relaxed">{response}</p>
          </div>

          {!loading && mode === 'unsafe' && activeQuery && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-text-muted">
              <p className="text-amber-300 font-medium mb-1">Why this leaked:</p>
              <p>{activeQuery.explanation}</p>
            </div>
          )}
          {!loading && mode === 'safe' && retrievedDocs.length === 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-300">
              Sensitivity filter blocked all confidential/internal documents from retrieval. The model can't leak what it never sees.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
