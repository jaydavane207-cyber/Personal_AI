import React, { useState, useCallback, useEffect } from "react";

const FLASHCARD_STORAGE_KEY = "jarvis_flashcards";
const SESSION_KEY = "jarvis_flashcard_session";

function loadDecks() {
  try {
    const raw = localStorage.getItem(FLASHCARD_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveDecks(decks) {
  try { localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(decks)); } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { correct: 0, total: 0, streak: 0, bestStreak: 0, history: [] };
}

function saveSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}

// ── Default Decks ──────────────────────────────────────────

const DEFAULT_DECKS = {
  algorithms: {
    name: "Algorithms",
    icon: "⚡",
    cards: [
      { id: "a1", q: "Time complexity of binary search?", a: "O(log n) — halve search space each step", difficulty: "easy", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "a2", q: "Stable vs unstable sorting?", a: "Stable preserves relative order of equal elements. Merge sort = stable, quicksort = not.", difficulty: "easy", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "a3", q: "When does Dijkstra's fail?", a: "Negative edge weights — greedily picks nearest. Use Bellman-Ford instead.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "a4", q: "Master Theorem for D&C recurrences?", a: "T(n) = aT(n/b) + O(n^d). a < b^d → O(n^d). a = b^d → O(n^d log n). a > b^d → O(n^(log_b a)).", difficulty: "hard", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "formula" },
      { id: "a5", q: "BFS vs DFS — when to use which?", a: "BFS: shortest path in unweighted graph, level-order. DFS: topological sort, cycle detection, maze solving. BFS uses more memory (queue), DFS uses less (stack).", difficulty: "easy", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "a6", q: "What is amortized analysis?", a: "Average cost per operation over a sequence. E.g., dynamic array resize: O(1) amortized even though resize is O(n).", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
    ],
  },
  "data-structures": {
    name: "Data Structures",
    icon: "🏗️",
    cards: [
      { id: "d1", q: "Hash map vs BST — when to use which?", a: "Hash map: O(1) avg lookup, no ordering. BST: O(log n) lookup, maintains sorted order. Use BST for range queries.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "d2", q: "Stack vs Queue — key difference?", a: "Stack = LIFO (last in, first out). Queue = FIFO (first in, first out). Stack for recursion/undo, queue for BFS/scheduling.", difficulty: "easy", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "d3", q: "When to use a heap vs sorted array?", a: "Heap: O(1) peek, O(log n) insert/delete. Sorted array: O(1) access by index, O(log n) search, O(n) insert. Heap for priority queues.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "d4", q: "What is a trie and when to use it?", a: "A trie (prefix tree) stores strings character-by-character. O(m) lookup where m = string length. Use for autocomplete, spell checkers, IP routing.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
    ],
  },
  javascript: {
    name: "JavaScript",
    icon: "🟨",
    cards: [
      { id: "j1", q: "What is a closure?", a: "A function that remembers its lexical scope even when executed outside it. Inner function has access to outer function's variables.", difficulty: "easy", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "j2", q: "var vs let vs const?", a: "var: function-scoped, hoisted. let: block-scoped, not hoisted. const: block-scoped, not hoisted, can't reassign. Use const by default, let when needed.", difficulty: "easy", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "j3", q: "Event loop execution order?", a: "Call stack → microtasks (Promise.then, queueMicrotask) → macrotasks (setTimeout, setInterval, I/O). Microtasks always run before macrotasks.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "j4", q: "What is prototypal inheritance?", a: "Objects inherit from other objects via prototype chain. When you access a property, JS looks up the chain until it finds it or reaches null.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "j5", q: "Promise.all vs Promise.allSettled?", a: "Promise.all: fails fast — rejects on first error. Promise.allSettled: waits for all, returns array of {status, value/reason}. Use allSettled when you need all results.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
    ],
  },
  react: {
    name: "React",
    icon: "⚛️",
    cards: [
      { id: "r1", q: "When does a component re-render?", a: "When its state changes, parent re-renders (unless memoized), or context value changes. useMemo/useCallback prevent unnecessary re-renders.", difficulty: "easy", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "r2", q: "useEffect dependency array — common mistake?", a: "Missing dependencies cause stale closures. ESLint exhaustive-deps rule catches this. Empty array = run once on mount. No array = run every render.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
      { id: "r3", q: "useState vs useReducer?", a: "useState: simple state, independent updates. useReducer: complex state logic, related updates, easier testing. Use reducer when next state depends on previous.", difficulty: "medium", nextReview: Date.now(), interval: 1, ease: 2.5, reps: 0, type: "concept" },
    ],
  },
};

// ── SM-2 Spaced Repetition ─────────────────────────────────

function sm2(card, quality) {
  let { ease, interval, reps } = card;
  if (quality >= 3) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps += 1;
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    reps = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  }
  return { ...card, ease, interval, reps, nextReview: Date.now() + interval * 86400000 };
}

// ── Component ──────────────────────────────────────────────

export function FlashcardPanel({ color = "#f97316" }) {
  const [decks, setDecks] = useState(() => loadDecks() || DEFAULT_DECKS);
  const [activeDeck, setActiveDeck] = useState("algorithms");
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [session, setSession] = useState(() => loadSession());
  const [showStats, setShowStats] = useState(false);

  useEffect(() => { saveDecks(decks); }, [decks]);
  useEffect(() => { saveSession(session); }, [session]);

  const deck = decks[activeDeck];
  const cards = deck?.cards || [];
  const card = cards[cardIdx];
  const dueCards = cards.filter(c => c.nextReview <= Date.now());
  const mastery = cards.length > 0 ? Math.round((cards.filter(c => c.reps >= 3).length / cards.length) * 100) : 0;
  const avgEase = cards.length > 0 ? (cards.reduce((s, c) => s + c.ease, 0) / cards.length).toFixed(2) : "2.50";

  const handleFlip = useCallback(() => setFlipped(f => !f), []);

  const handleRate = useCallback((quality) => {
    if (!card) return;
    const updated = sm2(card, quality);
    const isCorrect = quality >= 3;

    setDecks(prev => {
      const next = { ...prev };
      const d = { ...next[activeDeck] };
      d.cards = d.cards.map(c => c.id === card.id ? updated : c);
      next[activeDeck] = d;
      return next;
    });

    setSession(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        history: [...prev.history.slice(-49), { cardId: card.id, quality, ts: Date.now() }],
      };
    });

    setFlipped(false);
    setCardIdx(i => (i + 1) % cards.length);
  }, [card, activeDeck, cards.length]);

  const DIFF_COLORS = { easy: "#22c55e", medium: "#eab308", hard: "#ef4444" };
  const TYPE_ICONS = { concept: "💡", formula: "📐", code: "💻" };

  return (
    <div className="space-y-3">
      {/* Deck selector */}
      <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-gray-400 tracking-wider">DECKS</span>
          <button onClick={() => setShowStats(!showStats)} className="text-[9px] text-gray-600 hover:text-gray-400">
            {showStats ? "Cards" : "Stats"}
          </button>
        </div>
        <div className="space-y-1">
          {Object.entries(decks).map(([key, d]) => {
            const m = d.cards.length > 0 ? Math.round((d.cards.filter(c => c.reps >= 3).length / d.cards.length) * 100) : 0;
            const due = d.cards.filter(c => c.nextReview <= Date.now()).length;
            return (
              <button key={key} onClick={() => { setActiveDeck(key); setCardIdx(0); setFlipped(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors ${activeDeck === key ? "bg-white/5" : "hover:bg-white/[0.02]"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{d.icon || "📚"}</span>
                  <span className="text-[11px] text-gray-300">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {due > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400">{due} due</span>}
                  <div className="w-10 h-1 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m}%`, background: color }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats view */}
      {showStats ? (
        <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
          <div className="text-[10px] font-semibold text-gray-400 tracking-wider mb-2">STATISTICS</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold font-mono" style={{ color }}>{session.correct}</div>
              <div className="text-[9px] text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono text-gray-300">{session.total}</div>
              <div className="text-[9px] text-gray-600">Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono" style={{ color: "#22c55e" }}>{session.streak}</div>
              <div className="text-[9px] text-gray-600">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold font-mono" style={{ color: "#f59e0b" }}>{session.bestStreak}</div>
              <div className="text-[9px] text-gray-600">Best Streak</div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-800/30">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Accuracy</span>
              <span className="text-gray-300">{session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-gray-500">Mastery</span>
              <span className="text-gray-300">{mastery}%</span>
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-gray-500">Avg Ease</span>
              <span className="text-gray-300">{avgEase}</span>
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-gray-500">Due Now</span>
              <span className="text-orange-400">{dueCards.length}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Card viewer */
        card && (
          <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider">CARD {cardIdx + 1}/{cards.length}</span>
                {card.type && <span className="text-[10px]">{TYPE_ICONS[card.type] || "💡"}</span>}
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${DIFF_COLORS[card.difficulty]}15`, color: DIFF_COLORS[card.difficulty] }}>{card.difficulty}</span>
            </div>

            {/* Card face */}
            <div className="min-h-[80px] flex items-center justify-center py-4 px-2 rounded-lg border border-gray-800/30 mb-3 cursor-pointer select-none" style={{ background: "#060d1a" }} onClick={handleFlip}>
              <div className="text-center">
                {!flipped ? (
                  <div>
                    <div className="text-[9px] text-gray-600 mb-1">QUESTION</div>
                    <div className="text-sm text-gray-200 font-medium">{card.q}</div>
                    <div className="text-[10px] text-gray-600 mt-2">Click to reveal</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[9px] mb-1" style={{ color }}>ANSWER</div>
                    <div className="text-sm text-gray-300">{card.a}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Rating buttons */}
            {flipped && (
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "Again", q: 1, color: "#ef4444", desc: "Forgot" },
                  { label: "Hard", q: 3, color: "#eab308", desc: "Struggled" },
                  { label: "Good", q: 4, color: "#22c55e", desc: "Recalled" },
                  { label: "Easy", q: 5, color: "#06b6d4", desc: "Instant" },
                ].map(r => (
                  <button key={r.label} onClick={() => handleRate(r.q)}
                    className="py-1.5 rounded-md text-[10px] font-medium border transition-colors hover:brightness-110"
                    style={{ borderColor: `${r.color}30`, background: `${r.color}10`, color: r.color }}>
                    <div>{r.label}</div>
                    <div className="text-[8px] opacity-60">{r.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Session mini-stats */}
      {!showStats && (
        <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-sm font-bold font-mono" style={{ color }}>{session.correct}</div>
              <div className="text-[9px] text-gray-600">Correct</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-gray-300">{session.total}</div>
              <div className="text-[9px] text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono" style={{ color: "#22c55e" }}>{session.streak}</div>
              <div className="text-[9px] text-gray-600">Streak</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono" style={{ color }}>{mastery}%</div>
              <div className="text-[9px] text-gray-600">Mastery</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
