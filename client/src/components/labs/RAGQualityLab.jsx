import React, { useState } from 'react';
import { Search, FileText, CheckCircle, XCircle, TrendingUp, BookOpen } from 'lucide-react';

const QUERY = 'What are the main risks of deploying large language models in production?';

const CHUNKS = [
  {
    id: 'A',
    source: 'AI Safety Handbook, Ch. 4',
    text: 'Production LLM deployments face several key risks: hallucination (generating plausible but false information), prompt injection attacks where malicious inputs hijack the model\'s behavior, data leakage from training data memorization, and unpredictable failure modes in out-of-distribution inputs. Robust monitoring, output filtering, and rate limiting are essential mitigations.',
    relevanceScore: 0.94,
    isRelevant: true,
    explanation: 'Directly answers the query — covers hallucination, injection, data leakage, and mitigation strategies.',
  },
  {
    id: 'B',
    source: 'Transformer Architecture Overview',
    text: 'The transformer architecture uses self-attention mechanisms to process sequences in parallel. Each attention head computes queries, keys, and values from the input embeddings. The attention scores are computed as the dot product of queries and keys, scaled by the square root of the key dimension.',
    relevanceScore: 0.12,
    isRelevant: false,
    explanation: 'Irrelevant — describes transformer internals, not production risks. High-quality retrieval should not return this.',
  },
  {
    id: 'C',
    source: 'MLOps Best Practices Guide',
    text: 'When serving LLMs in production, latency spikes during high load can degrade user experience. Cost management is critical — token costs scale linearly with usage. Infrastructure risks include single points of failure in the inference pipeline, lack of fallback models, and inadequate load testing before launch.',
    relevanceScore: 0.78,
    isRelevant: true,
    explanation: 'Relevant — covers operational/infrastructure risks (latency, cost, SPOF) that are legitimate production concerns.',
  },
  {
    id: 'D',
    source: 'History of Natural Language Processing',
    text: 'Early NLP systems relied on hand-crafted rules and statistical n-gram models. Hidden Markov Models were widely used for speech recognition in the 1980s and 1990s. The introduction of recurrent neural networks in the 2010s marked a turning point before transformers became dominant.',
    relevanceScore: 0.08,
    isRelevant: false,
    explanation: 'Irrelevant — historical background on NLP has no bearing on production LLM risks.',
  },
  {
    id: 'E',
    source: 'Enterprise AI Governance Report 2024',
    text: 'Regulatory and compliance risks are increasingly important for production LLMs. GDPR implications of storing conversation data, IP risks from training data provenance, and liability when AI outputs cause harm are areas companies must address. A 2024 survey found 67% of enterprises lack formal AI incident response plans.',
    relevanceScore: 0.85,
    isRelevant: true,
    explanation: 'Highly relevant — covers regulatory, compliance, and liability risks often overlooked in technical discussions.',
  },
  {
    id: 'F',
    source: 'Prompt Engineering for Developers',
    text: 'Few-shot prompting improves task performance by providing examples in the context window. Chain-of-thought prompting encourages step-by-step reasoning. System prompts define the model\'s behavior and persona. Good prompts are specific, structured, and include clear output format instructions.',
    relevanceScore: 0.22,
    isRelevant: false,
    explanation: 'Marginally relevant at best — prompt engineering is a risk mitigation tool, but this chunk doesn\'t discuss risks. A naive retriever might return this due to keyword overlap.',
  },
];

const BAD_RETRIEVAL_IDS = ['B', 'D', 'F', 'A', 'C']; // noisy retrieval
const GOOD_RETRIEVAL_IDS = ['A', 'E', 'C', 'B', 'D']; // good retrieval (sorted by score)

const RESPONSES = {
  bad: `Based on the provided documents, LLMs in production use self-attention mechanisms to process sequences in parallel. The transformer architecture computes queries, keys, and values from input embeddings. Historical NLP systems used HMMs and statistical models before transformers. Prompt engineering techniques like few-shot prompting can improve reliability. Therefore, the main risk is poorly engineered prompts that don't provide enough examples to the model.`,
  good: `Deploying LLMs in production involves several categories of risk. Technical risks include hallucinations (generating false but plausible information), prompt injection attacks, and training data memorization leading to data leakage. Operational risks include latency under load, cost scaling, and lack of failover infrastructure. Regulatory risks are increasingly significant — GDPR compliance for conversation data, IP liability from training data, and the absence of AI incident response plans in most enterprises. Robust monitoring, output filtering, load testing, and governance frameworks are key mitigations.`,
};

export default function RAGQualityLab({ onComplete }) {
  const [phase, setPhase] = useState('select'); // select → compare → done
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [showScores, setShowScores] = useState(false);
  const [completed, setCompleted] = useState(false);

  const toggleChunk = (id) => {
    if (phase !== 'select') return;
    setSelectedChunks(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleCompare = () => {
    setPhase('compare');
    if (!completed) {
      setCompleted(true);
      onComplete?.();
    }
  };

  const userRelevant = selectedChunks.map(id => CHUNKS.find(c => c.id === id)).filter(Boolean);
  const badChunks = BAD_RETRIEVAL_IDS.slice(0, 3).map(id => CHUNKS.find(c => c.id === id));
  const goodChunks = GOOD_RETRIEVAL_IDS.slice(0, 3).map(id => CHUNKS.find(c => c.id === id));

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Search className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-300 mb-1">RAG Quality Matters</p>
            <p className="text-xs text-text-muted leading-relaxed">
              RAG (Retrieval-Augmented Generation) is only as good as what gets retrieved. Irrelevant chunks confuse the model
              and produce wrong answers — a phenomenon called "context pollution." In this lab, you'll curate the retrieved
              context yourself, then compare your choices against a bad retriever and a good retriever.
            </p>
          </div>
        </div>
      </div>

      {/* Query */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">User Query</p>
        <p className="text-sm font-medium text-text-primary">{QUERY}</p>
      </div>

      {phase === 'select' && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text-primary">
                Retrieved chunks — pick the 3 most relevant:
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowScores(!showScores)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors">
                  {showScores ? 'Hide' : 'Show'} relevance scores
                </button>
                <span className="text-xs text-text-muted">{selectedChunks.length}/3 selected</span>
              </div>
            </div>
            <div className="space-y-3">
              {CHUNKS.map(chunk => {
                const isSelected = selectedChunks.includes(chunk.id);
                return (
                  <div key={chunk.id} onClick={() => toggleChunk(chunk.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-all ${isSelected
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-white/3 border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-white/20 text-text-muted'}`}>
                          {isSelected ? '✓' : chunk.id}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-text-muted" />
                          <span className="text-[10px] text-text-muted">{chunk.source}</span>
                        </div>
                      </div>
                      {showScores && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${chunk.relevanceScore * 100}%`, backgroundColor: chunk.relevanceScore > 0.7 ? '#22c55e' : chunk.relevanceScore > 0.4 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span className="text-[10px] text-text-muted w-8 text-right">{(chunk.relevanceScore * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{chunk.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={handleCompare} disabled={selectedChunks.length !== 3}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Compare retrieval strategies
          </button>
        </>
      )}

      {phase === 'compare' && (
        <div className="space-y-6">
          {/* Three columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: 'Your Selection', chunks: userRelevant, color: '#6366f1', desc: 'What you chose' },
              { label: 'Bad Retriever', chunks: badChunks, color: '#ef4444', desc: 'Top-3 by keyword overlap (noisy)' },
              { label: 'Good Retriever', chunks: goodChunks, color: '#22c55e', desc: 'Top-3 by semantic similarity' },
            ].map(({ label, chunks, color, desc }) => (
              <div key={label} className="rounded-xl border bg-white/3 overflow-hidden" style={{ borderColor: `${color}30` }}>
                <div className="px-3 py-2.5 border-b" style={{ borderColor: `${color}20`, backgroundColor: `${color}10` }}>
                  <p className="text-sm font-semibold" style={{ color }}>{label}</p>
                  <p className="text-[10px] text-text-muted">{desc}</p>
                </div>
                <div className="p-3 space-y-2">
                  {chunks.map(chunk => (
                    <div key={chunk.id} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${chunk.isRelevant ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {chunk.isRelevant
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className={`font-medium mb-0.5 ${chunk.isRelevant ? 'text-green-300' : 'text-red-300'}`}>{chunk.source}</p>
                        <p className="text-text-muted">{chunk.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Response comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Response with bad retrieval', text: RESPONSES.bad, color: '#ef4444' },
              { label: 'Response with good retrieval', text: RESPONSES.good, color: '#22c55e' },
            ].map(({ label, text, color }) => (
              <div key={label} className="rounded-xl border bg-white/3 overflow-hidden" style={{ borderColor: `${color}30` }}>
                <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: `${color}20`, backgroundColor: `${color}10` }}>
                  <BookOpen className="w-3.5 h-3.5" style={{ color }} />
                  <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                </div>
                <p className="p-3 text-xs text-text-primary leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-text-muted leading-relaxed space-y-2">
            <p className="text-text-primary font-medium">Key takeaways:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Irrelevant chunks mislead the model — it uses them even when they're unhelpful.</li>
              <li>Semantic retrieval (embeddings) outperforms keyword matching for nuanced queries.</li>
              <li>Chunk quality ≫ chunk quantity — 3 great chunks beats 10 mediocre ones.</li>
              <li>In production: use reranking, relevance thresholds, and metadata filtering.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
