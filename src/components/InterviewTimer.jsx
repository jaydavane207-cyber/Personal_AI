import React, { useState, useEffect, useRef, useCallback } from "react";

const TIMER_PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
];

const SCORE_STORAGE_KEY = "jarvis_interview_scores";

function loadScores() {
  try { const r = localStorage.getItem(SCORE_STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveScores(scores) {
  try { localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores.slice(-50))); } catch {}
}

// ── Timer Component ────────────────────────────────────────

export function InterviewTimer({ isRunning, onTimeUp, color = "#a855f7" }) {
  const [preset, setPreset] = useState(1);
  const [remaining, setRemaining] = useState(TIMER_PRESETS[1].seconds);
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  const total = TIMER_PRESETS[preset].seconds;
  const pct = (remaining / total) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const start = useCallback(() => { setActive(true); setFinished(false); setRemaining(TIMER_PRESETS[preset].seconds); }, [preset]);
  const stop = useCallback(() => { setActive(false); if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  const reset = useCallback(() => { stop(); setRemaining(TIMER_PRESETS[preset].seconds); setFinished(false); }, [preset, stop]);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setActive(false);
          setFinished(true);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active, onTimeUp]);

  useEffect(() => { setRemaining(TIMER_PRESETS[preset].seconds); setFinished(false); setActive(false); }, [preset]);

  return (
    <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-400 tracking-wider">TIMER</span>
        {finished && <span className="text-[9px] font-bold text-red-400 animate-pulse">TIME'S UP</span>}
      </div>

      {/* Circular timer */}
      <div className="flex items-center justify-center py-3">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="2" />
            <circle cx="18" cy="18" r="16" fill="none" stroke={finished ? "#ef4444" : color} strokeWidth="2"
              strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="0"
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-mono font-bold" style={{ color: finished ? "#ef4444" : "#e2e8f0" }}>
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex items-center justify-center gap-1 mb-2">
        {TIMER_PRESETS.map((p, i) => (
          <button key={p.label} onClick={() => setPreset(i)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${preset === i ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
            style={preset === i ? { background: `${color}30`, color } : {}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {!active ? (
          <button onClick={start} className="px-3 py-1 rounded-md text-[11px] font-medium text-white transition-colors" style={{ background: color }}>
            {finished ? "Restart" : "Start"}
          </button>
        ) : (
          <button onClick={stop} className="px-3 py-1 rounded-md text-[11px] font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">
            Pause
          </button>
        )}
        <button onClick={reset} className="px-3 py-1 rounded-md text-[11px] font-medium bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Scorecard Component ────────────────────────────────────

export function Scorecard({ color = "#a855f7" }) {
  const [scores, setScores] = useState(() => loadScores());
  const [showAdd, setShowAdd] = useState(false);
  const [newScore, setNewScore] = useState({ clarity: 3, structure: 3, correctness: 3 });

  useEffect(() => { saveScores(scores); }, [scores]);

  const addScore = useCallback(() => {
    const total = ((newScore.clarity + newScore.structure + newScore.correctness) / 3).toFixed(1);
    const entry = { ...newScore, total: parseFloat(total), ts: Date.now(), questionNum: scores.length + 1 };
    setScores(prev => [...prev, entry]);
    setShowAdd(false);
    setNewScore({ clarity: 3, structure: 3, correctness: 3 });
  }, [newScore, scores.length]);

  const avg = scores.length > 0 ? (scores.reduce((a, s) => a + s.total, 0) / scores.length).toFixed(1) : "—";
  const categories = ["clarity", "structure", "correctness"];

  return (
    <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-400 tracking-wider">SCORECARD</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600">{scores.length} answers</span>
          <button onClick={() => setShowAdd(!showAdd)} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 hover:text-gray-200">
            {showAdd ? "Cancel" : "+ Score"}
          </button>
        </div>
      </div>

      {/* Add score form */}
      {showAdd && (
        <div className="mb-3 p-2 rounded-lg border border-gray-800/30" style={{ background: "#060d1a" }}>
          {categories.map(cat => (
            <div key={cat} className="flex items-center justify-between py-1">
              <span className="text-[10px] text-gray-400 capitalize">{cat}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setNewScore(prev => ({ ...prev, [cat]: v }))}
                    className={`w-5 h-5 rounded text-[9px] font-bold ${newScore[cat] >= v ? "text-white" : "text-gray-700"}`}
                    style={newScore[cat] >= v ? { background: color } : { background: "#1e293b" }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={addScore} className="w-full mt-2 py-1 rounded-md text-[10px] font-medium text-white" style={{ background: color }}>
            Save Score
          </button>
        </div>
      )}

      {/* Average */}
      <div className="flex items-center justify-between px-2 py-2 rounded-md mb-2" style={{ background: `${color}08` }}>
        <span className="text-[11px] text-gray-400">Average</span>
        <span className="text-lg font-bold font-mono" style={{ color }}>{avg}<span className="text-[10px] text-gray-600">/5</span></span>
      </div>

      {/* Category breakdown */}
      {scores.length > 0 && (
        <div className="space-y-1.5">
          {categories.map(cat => {
            const values = scores.map(s => s[cat]).filter(Boolean);
            const catAvg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "—";
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-20 capitalize">{cat}</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(catAvg / 5) * 100}%`, background: color }} />
                </div>
                <span className="text-[10px] font-mono text-gray-400 w-6 text-right">{catAvg}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent scores */}
      {scores.length > 0 && (
        <div className="mt-2 space-y-1">
          {scores.slice(-3).reverse().map((s, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1 rounded text-[10px]">
              <span className="text-gray-500">Q{s.questionNum || scores.length - i}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-mono">{s.total}/5</span>
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${s.total >= 4 ? "bg-green-500/15 text-green-400" : s.total >= 3 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                  {s.total >= 4 ? "Good" : s.total >= 3 ? "OK" : "Weak"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {scores.length === 0 && (
        <div className="text-[10px] text-gray-600 text-center py-2">Start an interview to track scores</div>
      )}
    </div>
  );
}
