import React, { useState, useCallback, useRef, useEffect } from "react";

/**
 * Background Mode — elevated trust toggle for autonomous research.
 *
 * When enabled, the agent can browse and research in the background
 * without asking for approval on every read-only action.
 *
 * SECURITY: This only lifts approval for read-only actions.
 * Reversible and irreversible actions still require explicit approval.
 * Domain block-list enforced at code level (banking, social, email).
 */

const EXPLANATION = `The agent can browse and research in the background without asking each time.

**What it CAN do:**
• Search, read, and summarize publicly accessible pages
• Navigate read-only content for research and fact-finding

**What it CANNOT do (still requires your approval):**
• Log into any account
• Make purchases or payments
• Send messages, emails, or form submissions
• Access banking, social media, or email sites
• Delete, cancel, or modify anything

**Limits:** 100 page visits per session. Manual stop only.`;

// ── Background session state (simulated — real implementation
//    would connect to the agent backend via WebSocket/API) ───

const INITIAL_LOG = [
  // Empty — populated as agent browses
];

export function BackgroundMode({ color = "#06b6d4" }) {
  const [enabled, setEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [activityLog, setActivityLog] = useState(INITIAL_LOG);
  const [pagesVisited, setPagesVisited] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const maxPages = 100;
  const isActive = enabled && !paused;

  // Timer for elapsed time
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const handleToggle = useCallback(() => {
    if (!enabled) {
      // Turning ON — show explanation first
      setShowExplanation(true);
    } else {
      // Turning OFF
      setEnabled(false);
      setPaused(false);
      setElapsed(0);
    }
  }, [enabled]);

  const handleConfirmEnable = useCallback(() => {
    setEnabled(true);
    setPaused(false);
    setShowExplanation(false);
    setElapsed(0);
    // In production: notify backend to enable background mode
  }, []);

  const handlePause = useCallback(() => {
    setPaused(p => !p);
    // In production: notify backend to pause/resume
  }, []);

  const handleStop = useCallback(() => {
    setEnabled(false);
    setPaused(false);
    // In production: notify backend to disable background mode
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Main toggle card */}
      <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider">BACKGROUND RESEARCH</span>
            {isActive && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-medium text-green-400">ACTIVE</span>
              </span>
            )}
            {enabled && paused && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-[9px] font-medium text-yellow-400">PAUSED</span>
              </span>
            )}
          </div>
          <button
            onClick={handleToggle}
            className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-gray-700"}`}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{ left: enabled ? "18px" : "2px" }}
            />
          </button>
        </div>

        <p className="text-[10px] text-gray-500 mb-2">
          Let the agent research in the background without asking each step.
        </p>

        {/* Stats when active */}
        {enabled && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <div className="text-sm font-mono font-bold" style={{ color }}>{pagesVisited}</div>
              <div className="text-[9px] text-gray-600">/{maxPages} pages</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-gray-200">{formatTime(elapsed)}</div>
              <div className="text-[9px] text-gray-600">elapsed</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-gray-200">{maxPages - pagesVisited}</div>
              <div className="text-[9px] text-gray-600">remaining</div>
            </div>
          </div>
        )}

        {/* Controls when active */}
        {enabled && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handlePause}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                paused
                  ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/15"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/15"
              }`}
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              onClick={handleStop}
              className="flex-1 py-1.5 rounded-md text-[11px] font-medium border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15 transition-colors"
            >
              ⏹ Stop
            </button>
            <button
              onClick={() => setShowLog(!showLog)}
              className="px-3 py-1.5 rounded-md text-[11px] font-medium border border-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
            >
              📋
            </button>
          </div>
        )}
      </div>

      {/* Explanation modal — shown when enabling */}
      {showExplanation && (
        <div className="rounded-lg border border-yellow-500/20 p-3" style={{ background: "#0a1020" }}>
          <div className="text-[10px] font-semibold text-yellow-400 mb-2">⚠️ WHAT THIS GRANTS</div>
          <div className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-line">
            {EXPLAIN_TEXT}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleConfirmEnable}
              className="flex-1 py-1.5 rounded-md text-[11px] font-medium bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
            >
              Enable Background Mode
            </button>
            <button
              onClick={() => setShowExplanation(false)}
              className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activity log */}
      {showLog && enabled && (
        <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
          <div className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2">BACKGROUND ACTIVITY LOG</div>
          {activityLog.length === 0 ? (
            <div className="text-[10px] text-gray-600 text-center py-3">
              No activity yet. The agent will log pages it visits here.
            </div>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {activityLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded text-[10px]">
                  <span className={entry.allowed ? "text-green-400" : "text-red-400"}>
                    {entry.allowed ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-400 flex-1 truncate">{entry.url}</span>
                  <span className="text-gray-600">{entry.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blocked domains info */}
      <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
        <div className="text-[10px] font-semibold text-gray-400 tracking-wider mb-1.5">BLOCKED DOMAINS</div>
        <div className="flex flex-wrap gap-1">
          {["Banking", "Financial", "Social Media", "Email", "Messaging", "Government"].map(cat => (
            <span key={cat} className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/15">
              {cat}
            </span>
          ))}
        </div>
        <p className="text-[9px] text-gray-600 mt-1.5">
          These sites are blocked at code level — even in background mode.
        </p>
      </div>
    </div>
  );
}

const EXPLAIN_TEXT = `The agent can browse and research in the background without asking each time.

What it CAN do autonomously:
• Search, read, and summarize publicly accessible pages
• Navigate read-only content for research and fact-finding

What it CANNOT do (still requires your approval):
• Log into any account — even if credentials are available
• Make purchases or payments of any kind
• Send messages, emails, or form submissions
• Access banking, social media, or email sites (hard-blocked)
• Delete, cancel, or modify anything

Limits: 100 page visits per session. Manual stop only.
You'll see a persistent "ACTIVE" indicator whenever background mode is running.
One-click pause/stop is always available.`;
