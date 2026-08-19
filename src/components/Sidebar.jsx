import React from "react";

const ICONS = {
  stock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  study: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  career: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  interview: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function Sidebar({ modes, activeMode, onModeChange, isOpen, onToggle, onSettings, onClear, onExport, messageCount, sessions, activeSessionId, onNewSession, onLoadSession, onDeleteSession }) {
  return (
    <div className={`flex flex-col border-r border-gray-800/50 transition-all duration-300 ${isOpen ? "w-56" : "w-0 overflow-hidden"}`} style={{ background: "#080d19" }}>
      {/* Header */}
      <div className="p-3 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}>
              <span className="text-white text-[10px] font-bold">J</span>
            </div>
            <div>
              <h1 className="text-xs font-bold gradient-text leading-tight">JARVIS</h1>
              <p className="text-[9px] text-gray-600">Personal AI</p>
            </div>
          </div>
          <button onClick={onNewSession} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors" title="New chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        {/* History section */}
        {sessions.length > 0 && (
          <div className="py-2">
            <div className="px-3 mb-1 flex items-center justify-between">
              <span className="text-[9px] font-semibold tracking-widest text-gray-600 uppercase">History</span>
              <span className="text-[9px] text-gray-700">{sessions.length}</span>
            </div>
            {sessions.map(s => (
              <div key={s.id} className={`group flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md cursor-pointer transition-all ${activeSessionId === s.id ? "bg-white/5" : "hover:bg-white/[0.02]"}`} onClick={() => onLoadSession(s.id)}>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-300 truncate">{s.title}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: modes.find(m => m.key === s.mode)?.color || "#475569" }} />
                    <span className="text-[9px] text-gray-600">{s.messages?.length - 1 || 0} msgs · {timeAgo(s.updatedAt)}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all" title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mx-3 border-t border-gray-800/30" />

        {/* Modes */}
        <div className="py-2">
          <div className="px-3 mb-1">
            <span className="text-[9px] font-semibold tracking-widest text-gray-600 uppercase">Modes</span>
          </div>
          {modes.map(m => (
            <button key={m.key} onClick={() => onModeChange(m.key)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all ${activeMode === m.key ? "bg-white/5" : "hover:bg-white/[0.02]"}`} style={activeMode === m.key ? { borderRight: `2px solid ${m.color}` } : {}}>
              <span className="flex items-center justify-center w-7 h-7 rounded-md" style={{ color: activeMode === m.key ? m.color : "#475569", background: activeMode === m.key ? `${m.color}12` : "transparent" }}>
                {ICONS[m.key]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium" style={{ color: activeMode === m.key ? m.color : "#94a3b8" }}>{m.label}</div>
                <div className="text-[9px] text-gray-600 truncate">{m.description}</div>
              </div>
              {activeMode === m.key && <span className="w-1.5 h-1.5 rounded-full dot-glow" style={{ color: m.color, background: m.color }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-800/50 space-y-0.5">
        <button onClick={onClear} className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] rounded-md transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span className="text-[11px]">Clear Chat</span>
        </button>
        <button onClick={onExport} className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] rounded-md transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span className="text-[11px]">Export Chat</span>
        </button>
        <button onClick={onSettings} className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] rounded-md transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span className="text-[11px]">Settings</span>
        </button>
        <div className="px-3 py-1 text-[9px] text-gray-700">{messageCount - 1} messages · Ctrl+1/2/3/4</div>
      </div>
    </div>
  );
}
