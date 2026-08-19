import React, { useState, useEffect, useRef, useCallback } from "react";

const BUILTIN_COMMANDS = [
  { id: "new-chat", label: "New Chat", shortcut: "", category: "Actions", icon: "💬" },
  { id: "clear-chat", label: "Clear Chat", shortcut: "", category: "Actions", icon: "🗑️" },
  { id: "toggle-voice", label: "Toggle Voice", shortcut: "Space", category: "Actions", icon: "🎤" },
  { id: "toggle-sidebar", label: "Toggle Sidebar", shortcut: "", category: "Actions", icon: "📋" },
  { id: "toggle-right", label: "Toggle Right Panel", shortcut: "", category: "Actions", icon: "📊" },
  { id: "settings", label: "Open Settings", shortcut: "", category: "Actions", icon: "⚙️" },
  { id: "mode-stock", label: "Switch to Stock Mode", shortcut: "Ctrl+1", category: "Modes", icon: "🔵" },
  { id: "mode-study", label: "Switch to Study Mode", shortcut: "Ctrl+2", category: "Modes", icon: "🟠" },
  { id: "mode-career", label: "Switch to Career Mode", shortcut: "Ctrl+3", category: "Modes", icon: "🔴" },
  { id: "mode-interview", label: "Switch to Interview Mode", shortcut: "Ctrl+4", category: "Modes", icon: "🟣" },
];

const MODE_CHIPS = {
  stock: [
    { id: "chip-market-briefing", label: "Market Briefing", category: "Stock Chips", icon: "📊" },
    { id: "chip-nifty-analysis", label: "Nifty Analysis", category: "Stock Chips", icon: "📈" },
    { id: "chip-risk-check", label: "Risk Check", category: "Stock Chips", icon: "🛡️" },
    { id: "chip-sector-heatmap", label: "Sector Heatmap", category: "Stock Chips", icon: "🎨" },
  ],
  study: [
    { id: "chip-explain-concept", label: "Explain Concept", category: "Study Chips", icon: "💡" },
    { id: "chip-quiz-me", label: "Quiz Me", category: "Study Chips", icon: "📝" },
    { id: "chip-flashcards", label: "Flashcards", category: "Study Chips", icon: "🃏" },
    { id: "chip-weak-points", label: "Weak Points", category: "Study Chips", icon: "🔄" },
  ],
  career: [
    { id: "chip-build-roadmap", label: "Build Roadmap", category: "Career Chips", icon: "🎯" },
    { id: "chip-skill-gap", label: "Skill Gap", category: "Career Chips", icon: "⚠️" },
    { id: "chip-find-resources", label: "Find Resources", category: "Career Chips", icon: "📚" },
    { id: "chip-progress-check", label: "Progress Check", category: "Career Chips", icon: "📈" },
  ],
  interview: [
    { id: "chip-behavioral", label: "Behavioral", category: "Interview Chips", icon: "🗣️" },
    { id: "chip-dsa-practice", label: "DSA Practice", category: "Interview Chips", icon: "💻" },
    { id: "chip-system-design", label: "System Design", category: "Interview Chips", icon: "🏗️" },
    { id: "chip-pitch-practice", label: "Pitch Practice", category: "Interview Chips", icon: "🎤" },
  ],
};

export function CommandPalette({ isOpen, onClose, onExecute, activeMode, sessions }) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Build command list: builtins + mode chips + recent sessions
  const allCommands = React.useMemo(() => {
    const chips = (MODE_CHIPS[activeMode] || []).map(c => ({ ...c, action: "chip" }));
    const history = (sessions || []).slice(0, 8).map(s => ({
      id: `session-${s.id}`,
      label: s.title || "Untitled",
      category: "Recent Chats",
      icon: "💬",
      action: "session",
      sessionId: s.id,
      meta: `${s.messages?.length - 1 || 0} msgs`,
    }));
    return [...BUILTIN_COMMANDS, ...chips, ...history];
  }, [activeMode, sessions]);

  // Filter by query
  const filtered = React.useMemo(() => {
    if (!query) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [query, allCommands]);

  // Group by category
  const grouped = React.useMemo(() => {
    const groups = {};
    filtered.forEach(c => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return groups;
  }, [filtered]);

  // Flat list for keyboard nav
  const flatItems = React.useMemo(() => {
    const items = [];
    Object.values(grouped).forEach(group => group.forEach(item => items.push(item)));
    return items;
  }, [grouped]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selectedIdx in range
  useEffect(() => {
    if (selectedIdx >= flatItems.length) setSelectedIdx(Math.max(0, flatItems.length - 1));
  }, [flatItems.length, selectedIdx]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && flatItems[selectedIdx]) { e.preventDefault(); onExecute(flatItems[selectedIdx]); onClose(); }
    else if (e.key === "Escape") { onClose(); }
  }, [flatItems, selectedIdx, onExecute, onClose]);

  if (!isOpen) return null;

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Palette */}
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden panel-enter" style={{ background: "#0c1222" }} onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }} onKeyDown={handleKeyDown} placeholder="Type a command or search..." className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none" />
          <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700/50 text-[10px] text-gray-500 font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[9px] font-semibold tracking-widest text-gray-600 uppercase">{category}</div>
              {items.map(item => {
                globalIdx++;
                const idx = globalIdx;
                const isSelected = idx === selectedIdx;
                return (
                  <div key={item.id} data-idx={idx} className={`flex items-center gap-3 px-4 py-2 mx-1 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-white/5" : "hover:bg-white/[0.02]"}`} onClick={() => { onExecute(item); onClose(); }} onMouseEnter={() => setSelectedIdx(idx)}>
                    <span className="text-sm">{item.icon}</span>
                    <span className="flex-1 text-[13px] text-gray-200">{item.label}</span>
                    {item.shortcut && <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700/50 text-[10px] text-gray-500 font-mono">{item.shortcut}</kbd>}
                    {item.meta && <span className="text-[10px] text-gray-600">{item.meta}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {flatItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No results</div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-800/50 flex items-center gap-3 text-[9px] text-gray-600">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
