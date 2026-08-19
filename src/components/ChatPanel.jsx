import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MODE_META } from "../agents";

// ── Custom markdown components (safe — no raw HTML) ────────
// react-markdown renders markdown as React elements, not raw HTML.
// This eliminates the XSS vector entirely — no dangerouslySetInnerHTML.

const markdownComponents = {
  // Style tables
  table: ({ children }) => (
    <table className="w-full text-[11px] my-2 border-collapse">{children}</table>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
  th: ({ children }) => (
    <th className="text-left px-2 py-1.5 border-b border-gray-700/50 text-gray-300 font-semibold bg-white/[0.02]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-2 py-1 border-b border-gray-800/30 text-gray-400">{children}</td>
  ),
  // Style code blocks
  code: ({ inline, className, children }) => {
    if (inline) {
      return (
        <code className="px-1 py-0.5 rounded bg-gray-800 text-cyan-300 text-[10px] font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block px-3 py-2 rounded-lg bg-gray-900 border border-gray-800/50 text-[11px] font-mono text-gray-300 overflow-x-auto my-2">
        {children}
      </code>
    );
  },
  // Style horizontal rules
  hr: () => <hr className="border-gray-800/50 my-3" />,
  // Style lists
  ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  // Style strong/em
  strong: ({ children }) => <strong className="text-gray-100 font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-gray-300 italic">{children}</em>,
  // Style paragraphs
  p: ({ children }) => <p className="my-0.5">{children}</p>,
  // Style headings
  h1: ({ children }) => <h1 className="text-base font-bold text-gray-100 mt-2 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-gray-100 mt-2 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[13px] font-bold text-gray-100 mt-1 mb-0.5">{children}</h3>,
  // Block links — open in new tab, nofollow
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
      {children}
    </a>
  ),
};

export function ChatPanel({ messages, isThinking, activeMode, modeMeta, onSend, voice, voiceOn, onToggleVoice, onToggleSidebar, onToggleRight, rightPanelOpen }) {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const chips = MODE_META[activeMode]?.chips || [];
  const [copiedId, setCopiedId] = useState(null);
  const [copyError, setCopyError] = useState(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => { textareaRef.current?.focus(); }, [activeMode]);

  const handleSubmit = (text) => {
    const t = text || input.trim();
    if (!t || isThinking) return;
    onSend(t);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  // Copy with proper error handling
  const handleCopy = async (msg) => {
    const plain = msg.content.replace(/\*\*/g, "").replace(/[#*_`~|]/g, "");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plain);
        setCopiedId(msg.id);
        setCopyError(null);
        setTimeout(() => setCopiedId(null), 1500);
      } else {
        // Fallback for insecure contexts / older browsers
        const textarea = document.createElement("textarea");
        textarea.value = plain;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedId(msg.id);
        setCopyError(null);
        setTimeout(() => setCopiedId(null), 1500);
      }
    } catch (err) {
      setCopyError("Copy failed — try selecting and copying manually");
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  const handleSpeak = (msg) => {
    const plain = msg.content.replace(/\*\*/g, "").replace(/[#*_`~|]/g, "").replace(/\n+/g, ". ").replace(/\s+/g, " ").trim();
    voice.speak(plain);
  };

  const handleRegenerate = (msg) => {
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx > 0) {
      const prevUser = messages.slice(0, idx).reverse().find(m => m.role === "user");
      if (prevUser) handleSubmit(prevUser.content);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50" style={{ background: "#080d19" }}>
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className="p-1 rounded hover:bg-white/5 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="w-2 h-2 rounded-full" style={{ background: modeMeta?.color }} />
          <span className="text-xs font-semibold text-gray-200">{modeMeta?.label} Mode</span>
          <span className="text-[10px] text-gray-600 hidden sm:inline">— {modeMeta?.description}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {voiceOn && voice.isListening && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] font-medium text-cyan-400">LISTENING</span>
            </span>
          )}
          {voiceOn && voice.isSpeaking && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-medium text-green-400">SPEAKING</span>
            </span>
          )}
          <button onClick={onToggleVoice} className={`p-1 rounded transition-colors ${voiceOn ? "bg-cyan-500/10 text-cyan-400" : "text-gray-600 hover:bg-white/5"}`} title={voiceOn ? "Voice ON" : "Voice OFF"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </button>
          <button onClick={onToggleRight} className={`p-1 rounded transition-colors ${rightPanelOpen ? "bg-white/5 text-gray-300" : "text-gray-600 hover:bg-white/5"}`} title="Toggle right panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </button>
        </div>
      </div>

      {/* Copy error toast */}
      {copyError && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 text-center">
          {copyError}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map(msg => {
            const isUser = msg.role === "user";
            const m = MODE_META[msg.mode];
            const color = m?.color || "#475569";
            return (
              <div key={msg.id} className={`msg-enter group flex ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="flex-shrink-0 mr-2 mt-0.5">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}>J</div>
                  </div>
                )}
                <div className={`max-w-[80%]`}>
                  {!isUser && msg.mode && <div className="text-[9px] font-bold tracking-widest mb-1 ml-1" style={{ color }}>{msg.mode.toUpperCase()}</div>}
                  <div className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${isUser ? "text-gray-100" : "text-gray-300 border"}`} style={isUser ? { background: "linear-gradient(135deg, #1e3a5f, #1a2332)", borderBottomRightRadius: 4 } : { background: "#0c1222", borderColor: `${color}18`, borderBottomLeftRadius: 4 }}>
                    {/* SAFE: react-markdown renders as React elements, not raw HTML.
                        No dangerouslySetInnerHTML. No injection vector. */}
                    <ReactMarkdown components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className={`text-[9px] text-gray-700 mt-0.5 flex items-center gap-2 ${isUser ? "text-right justify-end mr-1" : "ml-1"}`}>
                    <span>{new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {!isUser && (
                      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleCopy(msg)} className="p-0.5 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300" title="Copy">
                          {copiedId === msg.id ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          )}
                        </button>
                        {voice.supported.tts && (
                          <button onClick={() => handleSpeak(msg)} className="p-0.5 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300" title="Speak">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                          </button>
                        )}
                        <button onClick={() => handleRegenerate(msg)} className="p-0.5 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300" title="Regenerate">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isThinking && (
            <div className="msg-enter flex justify-start">
              <div className="flex-shrink-0 mr-2 mt-0.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ background: `${modeMeta?.color}18`, color: modeMeta?.color, border: `1px solid ${modeMeta?.color}25` }}>J</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-widest mb-1 ml-1" style={{ color: modeMeta?.color }}>{activeMode.toUpperCase()}</div>
                <div className="rounded-xl px-3 py-2 border" style={{ background: "#0c1222", borderColor: `${modeMeta?.color}18`, borderBottomLeftRadius: 4 }}>
                  <div className="flex items-center gap-1"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick-action chips */}
      <div className="px-4 pt-2">
        <div className="max-w-2xl mx-auto flex flex-wrap gap-1.5">
          {chips.map(chip => (
            <button key={chip} onClick={() => handleSubmit(chip)} disabled={isThinking} className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-white/[0.03] transition-all disabled:opacity-30">
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800/50" style={{ background: "#080d19" }}>
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          {voiceOn && voice.supported.stt && (
            <button onClick={() => voice.isSpeaking ? voice.stopSpeaking() : voice.toggleListening()} className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${voice.isListening ? "bg-cyan-500/20 text-cyan-400" : voice.isSpeaking ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          )}
          <div className="flex-1 relative">
            {voiceOn && voice.isListening && voice.interim && (
              <div className="absolute bottom-full left-0 right-0 mb-1 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                <span className="text-[11px] text-gray-400 italic">{voice.interim}</span>
              </div>
            )}
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={voiceOn && voice.isListening ? "Listening..." : `Message JARVIS (${modeMeta?.label} mode)...`} rows={1} className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 resize-none input-glow focus:outline-none transition-all" disabled={isThinking} style={{ maxHeight: 120 }} onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} />
          </div>
          <button onClick={() => handleSubmit()} disabled={!input.trim() || isThinking} className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-20" style={{ background: input.trim() ? "linear-gradient(135deg, #06b6d4, #3b82f6)" : "#1f2937", color: input.trim() ? "white" : "#4b5563" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div className="max-w-2xl mx-auto flex items-center justify-between mt-1 px-1">
          <span className="text-[9px] text-gray-700">{voiceOn && voice.supported.stt ? "Space to talk · Enter to send · Ctrl+1/2/3/4 modes" : "Enter to send · Shift+Enter new line · Ctrl+1/2/3/4 modes"}</span>
          {voiceOn && voice.supported.tts && <span className="text-[9px] text-gray-700">🔊 Voice ON</span>}
        </div>
      </div>
    </div>
  );
}
