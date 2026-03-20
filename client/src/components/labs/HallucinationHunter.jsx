import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, Trophy } from 'lucide-react';

const ROUNDS = [
  {
    question: 'Who invented the transformer architecture?',
    answer: `The transformer architecture was invented by a team at Google Brain and Google Research. The key paper "Attention is All You Need" was published in 2017 by Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, and Polosukhin. Notably, Yann LeCun and Geoffrey Hinton were also co-authors on the paper.`,
    hallucinations: [
      { text: 'Yann LeCun and Geoffrey Hinton were also co-authors on the paper', correct: true, explanation: 'False. LeCun and Hinton were NOT co-authors. The actual authors were Vaswani et al. from Google. This is a classic LLM hallucination — mixing up famous AI researchers.' },
    ],
    truths: [
      { text: 'The paper was titled "Attention is All You Need"', explanation: 'Correct — published at NeurIPS 2017.' },
      { text: 'Published in 2017 by a Google team', explanation: 'Correct.' },
    ],
  },
  {
    question: 'What is GPT-4\'s context window size?',
    answer: `GPT-4 was released by OpenAI in March 2023. It supports a context window of 128,000 tokens in its standard version. The model was trained on data up to September 2021. GPT-4 has roughly 1.8 trillion parameters according to official OpenAI documentation.`,
    hallucinations: [
      { text: '128,000 tokens in its standard version', correct: true, explanation: 'Misleading. The base GPT-4 had an 8K context window; 128K was introduced in GPT-4 Turbo later. Presenting 128K as the standard is inaccurate.' },
      { text: '1.8 trillion parameters according to official OpenAI documentation', correct: true, explanation: 'Hallucination. OpenAI has never officially disclosed GPT-4\'s parameter count. The 1.8T figure is speculation from leaks — presenting it as "official documentation" is false.' },
    ],
    truths: [
      { text: 'Released in March 2023', explanation: 'Correct.' },
      { text: 'Training data cutoff September 2021', explanation: 'Approximately correct for the base model.' },
    ],
  },
  {
    question: 'How does RLHF work?',
    answer: `RLHF (Reinforcement Learning from Human Feedback) was first introduced by OpenAI in 2022 with InstructGPT. The process has three stages: first, supervised fine-tuning on demonstrations; second, training a reward model from human preference comparisons; third, using PPO to optimize the policy against the reward model. The reward model is trained to output a single scalar score for any (prompt, response) pair.`,
    hallucinations: [
      { text: 'first introduced by OpenAI in 2022 with InstructGPT', correct: true, explanation: 'Misleading. RLHF as a technique predates OpenAI\'s work — it was introduced by Christiano et al. in 2017 ("Deep Reinforcement Learning from Human Preferences"). OpenAI applied it to LLMs with InstructGPT, but did not invent RLHF.' },
    ],
    truths: [
      { text: 'Three stages: SFT → reward model → PPO', explanation: 'Correct description of the InstructGPT pipeline.' },
      { text: 'Reward model outputs a scalar score for (prompt, response) pairs', explanation: 'Correct.' },
    ],
  },
  {
    question: 'What is retrieval-augmented generation (RAG)?',
    answer: `RAG was introduced in the paper "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" by Lewis et al. at Facebook AI in 2020. In RAG, at inference time the model first retrieves relevant documents from an external corpus using a neural retriever (typically DPR), then conditions its generation on both the query and retrieved documents. RAG completely eliminates hallucinations because it grounds the model in factual documents.`,
    hallucinations: [
      { text: 'RAG completely eliminates hallucinations because it grounds the model in factual documents', correct: true, explanation: 'False. RAG significantly reduces but does NOT eliminate hallucinations. The model can still hallucinate, misinterpret retrieved documents, or generate content not supported by them. "Completely eliminates" is an overclaim.' },
    ],
    truths: [
      { text: 'Introduced by Lewis et al. at Facebook AI in 2020', explanation: 'Correct.' },
      { text: 'Uses a neural retriever like DPR to fetch documents', explanation: 'Correct for the original paper.' },
    ],
  },
  {
    question: 'What is a "token" in the context of LLMs?',
    answer: `A token is the basic unit of text that LLMs process. Tokens are not words — they can be parts of words, whole words, or punctuation. On average, one token equals about 0.75 words in English, or roughly 4 characters. GPT-2 uses byte-pair encoding (BPE) with a vocabulary of exactly 100,000 tokens. The word "unbelievable" would typically be split into 3-4 tokens.`,
    hallucinations: [
      { text: 'GPT-2 uses byte-pair encoding (BPE) with a vocabulary of exactly 100,000 tokens', correct: true, explanation: 'Partially wrong. GPT-2 does use BPE, but its vocabulary size is 50,257 — not 100,000. GPT-4 uses ~100K tokens (cl100k_base), not GPT-2.' },
    ],
    truths: [
      { text: 'Tokens are not necessarily whole words', explanation: 'Correct.' },
      { text: '~0.75 words or ~4 characters per token on average in English', explanation: 'Approximately correct rule of thumb.' },
    ],
  },
];

export default function HallucinationHunter({ onComplete }) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [selected, setSelected] = useState(null);  // index of selected sentence
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  const round = ROUNDS[roundIdx];

  // Split answer into sentences for clickable spans
  const sentences = round.answer.match(/[^.!?]+[.!?]+/g) || [round.answer];

  const isHallucination = (sentence) =>
    round.hallucinations.some(h => sentence.includes(h.text.slice(0, 30)));

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleReveal = () => {
    if (selected === null) return;
    const sentence = sentences[selected];
    const isHall = isHallucination(sentence);
    setRevealed(true);
    const correct = isHall;
    setAnswers(prev => [...prev, { correct, sentence }]);
    if (correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (roundIdx + 1 >= ROUNDS.length) {
      setFinished(true);
      onComplete?.();
    } else {
      setRoundIdx(roundIdx + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  if (finished) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-yellow-400" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">Hallucination Hunter Complete!</h3>
        <p className="text-text-muted">You caught {score} out of {ROUNDS.length} hallucinations.</p>
        <div className="max-w-md mx-auto space-y-2 mt-4">
          {answers.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${a.correct ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {a.correct ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
              <span>Round {i + 1}: {a.correct ? 'Found it!' : 'Missed — the hallucination was elsewhere.'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4 max-w-md mx-auto">
          LLMs hallucinate by mixing real facts with plausible-sounding fiction. The best defense: always verify surprising claims, especially specific numbers, dates, and attributed quotes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-300 mb-1">Hunt the Hallucination</p>
            <p className="text-xs text-text-muted">Below is an AI-generated answer. One or more sentences contain hallucinations — factual errors that sound completely plausible. Click the sentence you think is wrong, then reveal the answer.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">Round {roundIdx + 1} / {ROUNDS.length}</p>
        <p className="text-xs text-text-muted">Score: {score}</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Question</p>
        <p className="text-sm font-medium text-text-primary mb-4">{round.question}</p>
        <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">AI Answer — click the hallucinated sentence</p>
        <div className="space-y-1">
          {sentences.map((sentence, idx) => {
            let bg = 'hover:bg-white/5 cursor-pointer';
            let border = 'border-transparent';
            if (selected === idx && !revealed) { bg = 'bg-primary/15'; border = 'border-primary/40'; }
            if (revealed) {
              if (isHallucination(sentence)) { bg = 'bg-red-500/15'; border = 'border-red-500/40'; }
              else { bg = 'bg-green-500/5'; border = 'border-green-500/20'; }
            }
            return (
              <p key={idx} onClick={() => handleSelect(idx)}
                className={`text-sm text-text-primary leading-relaxed px-2 py-1 rounded-lg border transition-all ${bg} ${border} ${revealed ? 'cursor-default' : ''}`}>
                {sentence.trim()}
                {revealed && isHallucination(sentence) && (
                  <span className="ml-2 text-xs text-red-400 font-medium">← HALLUCINATION</span>
                )}
              </p>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {revealed && (
        <div className="space-y-2">
          {round.hallucinations.map((h, i) => (
            <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-300 mb-1">Why this is a hallucination:</p>
                  <p className="text-xs text-text-muted leading-relaxed">{h.explanation}</p>
                </div>
              </div>
            </div>
          ))}
          {selected !== null && !isHallucination(sentences[selected]) && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
              That sentence was actually accurate — the hallucination was elsewhere. Check the highlighted sentence above.
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!revealed && (
          <button onClick={handleReveal} disabled={selected === null}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Reveal Answer
          </button>
        )}
        {revealed && (
          <button onClick={handleNext}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-medium px-4 py-2 rounded-xl transition-all">
            {roundIdx + 1 >= ROUNDS.length ? 'Finish' : 'Next Round →'}
          </button>
        )}
      </div>
    </div>
  );
}
