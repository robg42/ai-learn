import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react';

export default function TutorPanel({ subsection, section, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || streaming) return;

    const userMsg = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setStreaming(true);

    // Add a placeholder assistant message
    const assistantPlaceholder = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: updatedMessages,
          lessonTitle: subsection?.title || '',
          lessonContent: subsection?.content || '',
          mode: 'tutor',
        }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

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
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: next[next.length - 1].content + parsed.text,
                };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: '⚠️ Sorry, something went wrong. Please try again.',
          error: true,
        };
        return next;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, streaming, subsection]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const suggestedQuestions = [
    `Can you explain the key concept in this lesson?`,
    `Give me a real-world example of this.`,
    `What's the most important thing to remember?`,
    `How does this relate to what I might build?`,
  ];

  return (
    <div className="flex flex-col h-full bg-bg-card border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${section?.color || '#6366f1'}20` }}>
            <Sparkles className="w-4 h-4" style={{ color: section?.color || '#6366f1' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">AI Tutor</p>
            <p className="text-[10px] text-text-muted truncate max-w-[160px]">{subsection?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={handleReset}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              title="Clear chat">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center pt-4">
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: `${section?.color || '#6366f1'}15` }}>
                <Bot className="w-5 h-5" style={{ color: section?.color || '#6366f1' }} />
              </div>
              <p className="text-sm text-text-primary font-medium mb-1">Ask me anything about this lesson</p>
              <p className="text-xs text-text-muted">I'm grounded in the content you're reading.</p>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs text-text-muted hover:text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-all duration-150">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                msg.role === 'user' ? 'bg-primary/20' : 'bg-white/5'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-primary" />
                  : <Bot className="w-3.5 h-3.5 text-text-muted" />
                }
              </div>
              <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/15 text-text-primary'
                  : msg.error
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-white/5 text-text-primary/90'
              }`}>
                {msg.content
                  ? msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                  ))
                  : <span className="inline-flex gap-1 items-center text-text-muted">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                    </span>
                }
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this lesson…"
            rows={1}
            disabled={streaming}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors resize-none disabled:opacity-50"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="p-2.5 rounded-xl transition-all duration-150 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: `${section?.color || '#6366f1'}20` }}>
            <Send className="w-4 h-4" style={{ color: section?.color || '#6366f1' }} />
          </button>
        </div>
        <p className="text-[10px] text-text-muted/40 mt-1.5 text-center">Powered by Claude Haiku · Enter to send</p>
      </div>
    </div>
  );
}
