import React, { useState, useEffect } from "react";

const CAREER_STORAGE_KEY = "jarvis_career_state";

function loadCareer() {
  try { const r = localStorage.getItem(CAREER_STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveCareer(state) {
  try { localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state)); } catch {}
}

const DEFAULT_STATE = {
  target: "Full-Stack Developer at a startup",
  phases: [
    { id: 1, name: "Foundation", weeks: "1-3", skills: ["React", "Node.js", "REST APIs"], status: "active", progress: 40, startedAt: Date.now() },
    { id: 2, name: "Systems Thinking", weeks: "4-6", skills: ["System Design", "Databases", "Caching"], status: "locked", progress: 0 },
    { id: 3, name: "Portfolio", weeks: "7-9", skills: ["Docker", "CI/CD", "Testing"], status: "locked", progress: 0 },
    { id: 4, name: "Interview Prep", weeks: "10-12", skills: ["DSA", "System Design Mocks", "Behavioral"], status: "locked", progress: 0 },
  ],
  resources: [
    { name: "React Docs", type: "docs", url: "https://react.dev", bookmarked: true },
    { name: "Node.js Guide", type: "docs", url: "https://nodejs.org/en/docs", bookmarked: true },
    { name: "DDIA Book", type: "book", url: "https://dataintensive.net", bookmarked: false },
    { name: "Neetcode.io", type: "practice", url: "https://neetcode.io", bookmarked: true },
    { name: "System Design Primer", type: "docs", url: "https://github.com/donnemartin/system-design-primer", bookmarked: false },
    { name: "LeetCode", type: "practice", url: "https://leetcode.com", bookmarked: true },
  ],
  weeklyLog: [],
};

const TYPE_COLORS = { docs: "#3b82f6", book: "#f97316", practice: "#22c55e", video: "#a855f7" };
const TYPE_ICONS = { docs: "📄", book: "📚", practice: "💻", video: "🎥" };

export function CareerPanel({ color = "#ef4444" }) {
  const [state, setState] = useState(() => loadCareer() || DEFAULT_STATE);
  const [showResources, setShowResources] = useState(false);

  useEffect(() => { saveCareer(state); }, [state]);

  const activePhase = state.phases.find(p => p.status === "active");
  const completedPhases = state.phases.filter(p => p.status === "done").length;
  const totalProgress = state.phases.length > 0 ? Math.round(state.phases.reduce((s, p) => s + p.progress, 0) / state.phases.length) : 0;

  return (
    <div className="space-y-3">
      {/* Target */}
      <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
        <div className="text-[10px] font-semibold text-gray-400 tracking-wider mb-1.5">TARGET</div>
        <div className="text-sm text-gray-200 font-medium">{state.target}</div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1">
            <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${totalProgress}%`, background: color }} />
            </div>
          </div>
          <span className="text-[10px] font-mono text-gray-400">{totalProgress}%</span>
        </div>
        <div className="text-[9px] text-gray-600 mt-1">
          {completedPhases}/{state.phases.length} phases complete
          {activePhase && ` · Current: ${activePhase.name}`}
        </div>
      </div>

      {/* Roadmap timeline */}
      <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
        <div className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2">ROADMAP</div>
        <div className="space-y-2">
          {state.phases.map((phase, i) => (
            <div key={phase.id} className="relative">
              {i < state.phases.length - 1 && (
                <div className="absolute left-[9px] top-5 w-0.5 h-full" style={{ background: phase.status === "active" ? `${color}40` : "#1e293b" }} />
              )}
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: phase.status === "active" ? color : phase.status === "done" ? "#22c55e" : "#1e293b", border: phase.status === "locked" ? "2px solid #374151" : "none" }}>
                  {phase.status === "done" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {phase.status === "active" && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium ${phase.status === "locked" ? "text-gray-600" : "text-gray-200"}`}>
                      Phase {phase.id}: {phase.name}
                    </span>
                    <span className="text-[9px] text-gray-600">Wk {phase.weeks}</span>
                  </div>
                  {phase.status === "active" && (
                    <div className="mt-1">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {phase.skills.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${color}15`, color }}>{s}</span>
                        ))}
                      </div>
                      <div className="w-full h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${phase.progress}%`, background: color }} />
                      </div>
                      <div className="text-[9px] text-gray-600 mt-0.5">{phase.progress}% complete</div>
                    </div>
                  )}
                  {phase.status === "done" && (
                    <div className="text-[9px] text-green-400 mt-0.5">✓ Completed</div>
                  )}
                  {phase.status === "locked" && (
                    <div className="text-[9px] text-gray-700 mt-0.5">{phase.skills.join(", ")}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-gray-400 tracking-wider">RESOURCES</span>
          <button onClick={() => setShowResources(!showResources)} className="text-[9px] text-gray-600 hover:text-gray-400">
            {showResources ? "Hide" : `Show (${state.resources.length})`}
          </button>
        </div>
        {showResources && (
          <div className="space-y-1">
            {state.resources.map((r, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.02] cursor-pointer transition-colors">
                <span className="text-[10px]">{TYPE_ICONS[r.type] || "📄"}</span>
                <span className="text-[11px] text-gray-300 flex-1">{r.name}</span>
                {r.bookmarked && <span className="text-[9px]">⭐</span>}
                <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${TYPE_COLORS[r.type]}15`, color: TYPE_COLORS[r.type] }}>{r.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
