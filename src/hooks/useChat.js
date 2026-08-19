import { useState, useCallback, useRef, useEffect } from "react";
import { callLLM, getApiKey, getProvider } from "./useLLM";

const STORAGE_KEY = "jarvis_chat_history";
const MAX_HISTORY = 50;

function loadHistory() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveHistory(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s.slice(0, MAX_HISTORY))); } catch {}
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ═══════════════════════════════════════════════════════════
// RESPONSE ENGINE — handles real questions per mode
// ═══════════════════════════════════════════════════════════

function generateResponse(message, mode, history) {
  const lower = message.trim().toLowerCase();
  const words = lower.split(/\s+/);

  // ── Universal responses ─────────────────────────────────
  if (/^(hello|hi|hey|yo|sup)\b/.test(lower)) return "Hey Jay. What's on your mind?";
  if (lower === "help" || lower === "what can you do") return `Four modes, each with a specific job:\n\n🔵 **Stock** — Market analysis, shadow portfolio signals, risk assessment\n🟠 **Study** — Adaptive tutoring, flashcards, recall checks\n🔴 **Career** — Skill-gap analysis, phased roadmaps, progress tracking\n🟣 **Interview** — Mock interviews (behavioral/DSA/system design/pitch)\n\n🎤 **Voice** — Click the mic or press Space to talk\n⌨️ **Shortcuts** — Ctrl+1/2/3/4 to switch modes\n\nJust ask anything — mode is a suggestion, not a wall.`;
  if (/^thanks?|^thank you|^thx/.test(lower)) return "Anytime. What else?";
  if (/^(bye|goodbye|see you|later)/.test(lower)) return "Later, Jay. I'll be here when you need me.";

  // ── STOCK MODE ──────────────────────────────────────────
  if (mode === "stock") {
    // Chip responses
    if (lower.includes("market briefing")) return STOCK_RESPONSES.marketBriefing;
    if (lower.includes("nifty analysis") || lower.includes("nifty")) return STOCK_RESPONSES.niftyAnalysis;
    if (lower.includes("risk check") || lower.includes("risk")) return STOCK_RESPONSES.riskCheck;
    if (lower.includes("sector heatmap") || lower.includes("heatmap") || lower.includes("sector")) return STOCK_RESPONSES.sectorHeatmap;

    // Real questions
    if (/^what (should|do|is)|buy|sell|long|short|position|trade/.test(lower)) return STOCK_RESPONSES.tradeAdvice;
    if (/sensex|banknifty|bank nifty/.test(lower)) return STOCK_RESPONSES.indexRead;
    if (/option|call|put|ce|pe|strike/.test(lower)) return STOCK_RESPONSES.optionsRead;
    if (/vix|volatility|fear/.test(lower)) return STOCK_RESPONSES.vixRead;
    if (/fii|dii|institutional|flow/.test(lower)) return STOCK_RESPONSES.flowRead;
    if (/portfolio|holdings|p&l|pnl|profit|loss/.test(lower)) return STOCK_RESPONSES.portfolioCheck;
    if (/support|resistance|level/.test(lower)) return STOCK_RESPONSES.keyLevels;
    if (/stock|share|equity|which/.test(lower) && words.length <= 5) return STOCK_RESPONSES.stockPick;

    return STOCK_RESPONSES.default;
  }

  // ── STUDY MODE ──────────────────────────────────────────
  if (mode === "study") {
    if (lower.includes("explain concept") || lower.includes("explain")) return STUDY_RESPONSES.explainStart(message);
    if (lower.includes("quiz") || lower.includes("test me") || lower.includes("quiz me")) return STUDY_RESPONSES.quiz;
    if (lower.includes("flashcard") || lower.includes("flash card")) return STUDY_RESPONSES.flashcards;
    if (lower.includes("weak point") || lower.includes("weakness") || lower.includes("what should i revise")) return STUDY_RESPONSES.weakPoints;

    // Topic-specific explanations
    if (/algorithm/.test(lower)) return STUDY_RESPONSES.topic("algorithms", "An algorithm is a step-by-step procedure to solve a problem or perform a computation. Think of it as a recipe — inputs go in, a sequence of well-defined steps runs, and an output comes out.\n\n**Key properties of a good algorithm:**\n1. **Finiteness** — it must terminate\n2. **Definiteness** — each step is precisely defined\n3. **Input/Output** — has zero or more inputs, produces at least one output\n4. **Effectiveness** — each step is basic enough to be carried out\n\n**CS Analogy**: Sorting algorithms (quicksort, mergesort) all solve the same problem but with different tradeoffs in time, space, and stability. Choosing the right one depends on your constraints.");
    if (/data structure/.test(lower)) return STUDY_RESPONSES.topic("data structures", "A data structure is a way of organizing data so it can be used efficiently. Different structures have different strengths:\n\n| Structure | Access | Search | Insert | Delete |\n|-----------|--------|--------|--------|--------|\n| Array | O(1) | O(n) | O(n) | O(n) |\n| Linked List | O(n) | O(n) | O(1) | O(1) |\n| Hash Map | — | O(1) avg | O(1) | O(1) |\n| BST | O(log n) | O(log n) | O(log n) | O(log n) |\n\nThe choice depends on what operations you need most. Arrays for random access, hash maps for fast lookup, trees for ordered data.");
    if (/complexity|big ?o|time complexity|space complexity/.test(lower)) return STUDY_RESPONSES.topic("complexity", "Big O notation describes how an algorithm's performance scales with input size n.\n\n**Common complexities (fastest to slowest):**\n- **O(1)** — constant: hash map lookup\n- **O(log n)** — logarithmic: binary search\n- **O(n)** — linear: single pass through array\n- **O(n log n)** — linearithmic: efficient sorts (mergesort)\n- **O(n²)** — quadratic: nested loops, bubble sort\n- **O(2^n)** — exponential: brute force subsets\n\n**How to analyze:** Count the dominant operations. Nested loops multiply, sequential loops add. Ignore constants and lower-order terms.");
    if (/react|component|hook|state|jsx/.test(lower)) return STUDY_RESPONSES.topic("React", "React is a JavaScript library for building UIs with a component-based architecture.\n\n**Core concepts:**\n1. **Components** — reusable UI pieces (functions that return JSX)\n2. **State** — data that changes over time (useState)\n3. **Props** — data passed from parent to child\n4. **Effects** — side effects like API calls (useEffect)\n5. **Hooks** — functions that let you 'hook into' React features\n\n**Key pattern**: State flows down via props, events flow up via callbacks. Components re-render when their state or props change.\n\n**CS Analogy**: Think of components as pure functions — given the same props, they return the same JSX. State is like a variable that triggers a re-evaluation when it changes.");
    if (/javascript|js|closure|promise|async|await|var|let|const/.test(lower)) return STUDY_RESPONSES.topic("JavaScript", "JavaScript is a single-threaded, event-driven language with first-class functions.\n\n**Key concepts:**\n1. **Closures** — a function remembers its lexical scope even when executed outside it\n2. **Prototypes** — objects inherit from other objects (not classes, though class syntax exists)\n3. **Event loop** — synchronous code runs first, then microtasks (Promises), then macrotasks (setTimeout)\n4. **Hoisting** — `var` declarations are hoisted (moved to top), `let`/`const` are not\n5. **Coercion** — JS converts types automatically (`\"5\" + 1 = \"51\"`, `\"5\" - 1 = 4`)\n\n**Tricky part**: `this` depends on how a function is called, not where it's defined.");
    if (/python|list comprehension|decorator|generator/.test(lower)) return STUDY_RESPONSES.topic("Python", "Python is a dynamically-typed, interpreted language known for readability.\n\n**Key concepts:**\n1. **Indentation matters** — no braces, whitespace defines blocks\n2. **Everything is an object** — integers, functions, classes, modules\n3. **List comprehensions** — `[x**2 for x in range(10)]` is faster than a loop\n4. **Decorators** — functions that wrap other functions (`@decorator`)\n5. **Generators** — functions that yield values lazily (`yield` instead of `return`)\n\n**GIL** — Python's Global Interpreter Lock means only one thread runs Python bytecode at a time. Use multiprocessing for CPU-bound parallelism.");
    if (/machine learning|ml|neural|deep learning|ai|artificial intelligence/.test(lower)) return STUDY_RESPONSES.topic("ML/AI", "Machine learning is about learning patterns from data without being explicitly programmed.\n\n**Three main types:**\n1. **Supervised** — labeled data → learn mapping (classification, regression)\n2. **Unsupervised** — no labels → find structure (clustering, dimensionality reduction)\n3. **Reinforcement** — agent learns by trial and error with rewards\n\n**Neural networks** are function approximators: layers of neurons with weights that get adjusted via backpropagation. Deep learning = neural networks with many layers.\n\n**Key insight**: ML finds patterns humans can't see in high-dimensional data. But it needs quality data, and correlation ≠ causation.");
    if (/database|sql|mysql|postgres|mongo/.test(lower)) return STUDY_RESPONSES.topic("databases", "A database is an organized collection of structured data.\n\n**SQL vs NoSQL:**\n| | SQL | NoSQL |\n|--|-----|-------|\n| Schema | Fixed | Flexible |\n| Scaling | Vertical | Horizontal |\n| Consistency | ACID | Eventually consistent |\n| Best for | Structured, relational data | Document, key-value, graph |\n\n**SQL fundamentals**: SELECT, WHERE, JOIN, GROUP BY, HAVING, indexes.\n**When to index**: Columns used in WHERE, JOIN, ORDER BY. Don't over-index — slows writes.");
    if (/git|github|commit|branch|merge|pull request/.test(lower)) return STUDY_RESPONSES.topic("Git", "Git is a distributed version control system.\n\n**Core concepts:**\n1. **Repository** — project history stored as snapshots (commits)\n2. **Branch** — independent line of development\n3. **Merge** — combine branches\n4. **Rebase** — replay commits on a new base (cleaner history)\n5. **Staging area** — choose exactly what goes into a commit\n\n**Workflow**: `git add` → `git commit` → `git push`. Branch for features, merge via pull request.\n\n**Golden rule**: Never rebase commits that others have pulled.");
    if (/docker|container|kubernetes|k8s|deploy/.test(lower)) return STUDY_RESPONSES.topic("Docker", "Docker packages an application with all its dependencies into a container.\n\n**Key concepts:**\n1. **Image** — read-only template (like a class)\n2. **Container** — running instance of an image (like an object)\n3. **Dockerfile** — recipe to build an image\n4. **Volume** — persistent data that survives container restarts\n5. **Network** — containers communicate via virtual networks\n\n**Why containers?** \"It works on my machine\" → works everywhere. Consistent environment from dev to production.\n\n**CS Analogy**: A container is like a lightweight VM — shares the host kernel but has its own filesystem, network, and process space.");
    if (/design|explain|what is|how does|how do|tell me about/.test(lower)) return STUDY_RESPONSES.explainStart(message);
    if (/give|generate|create|make|write/.test(lower) && /example|code|program/.test(lower)) return STUDY_RESPONSES.codeExample(message);

    return STUDY_RESPONSES.default;
  }

  // ── CAREER MODE ─────────────────────────────────────────
  if (mode === "career") {
    if (lower.includes("build roadmap") || lower.includes("roadmap")) return CAREER_RESPONSES.roadmap;
    if (lower.includes("skill gap") || lower.includes("skills") || lower.includes("what am i missing")) return CAREER_RESPONSES.skillGap;
    if (lower.includes("find resources") || lower.includes("resources") || lower.includes("books") || lower.includes("courses")) return CAREER_RESPONSES.resources;
    if (lower.includes("progress") || lower.includes("check") || lower.includes("where am i")) return CAREER_RESPONSES.progressCheck;
    if (/project|portfolio|build|make|create/.test(lower)) return CAREER_RESPONSES.projectIdeas;
    if (/resume|cv|cover letter/.test(lower)) return CAREER_RESPONSES.resumeAdvice;
    if (/interview|prepare|ready/.test(lower)) return CAREER_RESPONSES.interviewPrep;
    if (/job|role|position|company|startup|apply/.test(lower)) return CAREER_RESPONSES.jobSearch;
    if (/certif|course|learn|study|bootcamp/.test(lower)) return CAREER_RESPONSES.certifications;
    if (/salary|negotiate|offer|package|ctc/.test(lower)) return CAREER_RESPONSES.salaryNegotiate;
    if (/full.?stack|frontend|backend|devops|data scien|ml engineer/.test(lower)) return CAREER_RESPONSES.roleBreakdown(lower);

    return CAREER_RESPONSES.default;
  }

  // ── INTERVIEW MODE ──────────────────────────────────────
  if (mode === "interview") {
    if (lower.includes("behavioral")) return INTERVIEW_RESPONSES.behavioral;
    if (lower.includes("dsa") || lower.includes("coding") || lower.includes("algorithm")) return INTERVIEW_RESPONSES.dsa;
    if (lower.includes("system design") || lower.includes("architecture")) return INTERVIEW_RESPONSES.systemDesign;
    if (lower.includes("pitch") || lower.includes("hackathon")) return INTERVIEW_RESPONSES.pitch;
    if (lower.includes("hr round") || lower.includes("hr question")) return INTERVIEW_RESPONSES.hrRound;

    // Handle follow-up answers
    if (history.length > 2) {
      const lastAssistant = [...history].reverse().find(m => m.role === "assistant");
      if (lastAssistant?.content?.includes("Question") || lastAssistant?.content?.includes("Problem")) {
        return INTERVIEW_RESPONSES.feedback(message);
      }
    }

    if (/tell me about yourself|introduce/.test(lower)) return INTERVIEW_RESPONSES.introPractice;
    if (/strength|weakness|weak|strong/.test(lower)) return INTERVIEW_RESPONSES.strengthWeakness;
    if (/why (this|your|should|do you)/.test(lower)) return INTERVIEW_RESPONSES.whyQuestions;

    return INTERVIEW_RESPONSES.default;
  }

  return `Got it. Let me think about that.\n\nTo get the most out of me, try a quick-action chip above the input, or ask about anything in **Stock**, **Study**, **Career**, or **Interview** context.`;
}

// ═══════════════════════════════════════════════════════════
// STOCK RESPONSES
// ═══════════════════════════════════════════════════════════

const STOCK_RESPONSES = {
  marketBriefing: `**📊 Market Briefing — Today**

**NIFTY 50**: 24,847.50 ▲ +0.32%
**SENSEX**: 81,203.15 ▲ +0.28%

**Signal**: BUY — High confidence (78%)
**Position**: 2% of shadow capital, ATR-sized at 1.5x

**Drivers**:
1. Broad-based buying across banking & IT
2. FII inflow sustained at ₹2,400cr+
3. VIX cooling below 13 — risk-on sentiment

**Risk Flags**:
- ⚠️ Sector correlation elevated — banking + financials moving in lockstep
- ⚠️ Options chain shows max pain at 24,700 — pin risk Friday

The chart on your right shows the 15-min breakout structure. Shadow Portfolio auto-entered at 24,820 with SL at 24,650.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  niftyAnalysis: `**NIFTY 50 — Index Read**

Current: 24,847 | Resistance: 25,000 | Support: 24,500

**Confluence**: 3/5 factors bullish
- ✅ Price above 20 EMA
- ✅ RSI at 58 — room to run
- ✅ Breadth positive (28 advances / 22 declines)
- ❌ VIX not confirming — needs sub-12
- ❌ Global cues mixed — US futures flat

**Read**: Consolidation with bullish bias. Not a high-conviction long yet — wait for a clean break above 24,900 with volume.

Check the chart panel — I've marked the key levels.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  riskCheck: `**🛡️ Shadow Portfolio Risk Check**

**Current Exposure**: 3 open positions
| Position | Entry | Current | P&L | Risk |
|----------|-------|---------|-----|------|
| NIFTY MAY 24800 CE | 142 | 168 | +18.3% | ATR SL: 120 |
| HDFC Bank | 1,645 | 1,672 | +1.6% | SL: 1,590 |
| Infosys | 1,420 | 1,398 | -1.5% | SL: 1,350 |

**Portfolio Metrics**:
- Max drawdown this week: -1.2%
- Correlation guard: HDFC + NIFTY at 0.82 — ⚠️ elevated
- Capital deployed: 35% of shadow allocation
- Volatility dampener: ACTIVE (VIX > 12)

**Action**: Reduce HDFC weight if correlation stays above 0.85. The Infosys position is within normal noise — hold.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  sectorHeatmap: `**🎨 Sector Heatmap — Relative Strength**

| Sector | Strength | Signal |
|--------|----------|--------|
| 🟢 Banking | Strong | Leading — HDFC, ICICI at highs |
| 🟢 IT | Moderate | Recovering — Infy, TCS bouncing |
| 🟢 Auto | Moderate | Tata Motors breakout |
| 🟡 Pharma | Neutral | Range-bound |
| 🟡 FMCG | Neutral | HUL dragging |
| 🟡 Energy | Neutral | ONGC strong, Reliance flat |
| 🔴 Metal | Weak | Profit booking after run |
| 🔴 Realty | Weak | Correction phase |
| 🔴 PSU Bank | Weak | Profit booking |
| 🟡 Infra | Neutral | Waiting for budget triggers |

**Play**: Banking + IT carry trade. Avoid metals until 20 EMA holds.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  tradeAdvice: `**Trade Read**

Based on the current confluence engine state:

**Action**: No high-conviction setup right now. The system requires at least 4/5 factors aligned before generating a signal.

**What to watch**:
1. NIFTY needs a clean break above 24,900 with volume for a long entry
2. Bank NIFTY is leading — if it sustains above 52,800, broad market follows
3. VIX below 12 would confirm risk-on

**Position sizing**: When a signal fires, ATR-based sizing caps risk at 2% of shadow capital per trade.

I'll notify you when the confluence engine triggers. Check the chart panel for live levels.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  indexRead: `**Index Overview**

| Index | Level | Change | Signal |
|-------|-------|--------|--------|
| NIFTY 50 | 24,847 | +0.32% | Neutral-bullish |
| SENSEX | 81,203 | +0.28% | Neutral-bullish |
| BANK NIFTY | 52,650 | +0.45% | Bullish |
| NIFTY IT | 35,200 | +0.15% | Neutral |

**Breadth**: 28 advances / 22 declines — healthy but not broad-based.
**F&O**: PCR at 1.15 — mildly bullish. Max pain at 24,700.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  optionsRead: `**Options Chain Read**

**NIFTY Options** (Monthly Expiry):
| Strike | CE OI | PE OI | Signal |
|--------|-------|-------|--------|
| 24,500 | 12L | 45L | Strong support |
| 24,700 | 25L | 38L | Max pain |
| 25,000 | 48L | 15L | Resistance |

**Read**: Heavy put writing at 24,500 — unlikely to break. Call writing at 25,000 caps upside near-term.

**F&O toggle**: OFF — no options trades in shadow portfolio until manually enabled.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  vixRead: `**VIX Analysis**

**India VIX**: 12.85 ▼ -2.3%

| VIX Level | Market Implication |
|-----------|-------------------|
| < 12 | Complacency — contrarian caution |
| 12-15 | Normal — trend-following works |
| 15-20 | Elevated — reduce position sizes |
| > 20 | Fear — potential buying opportunity |

**Current read**: VIX at 12.85 is in the normal range, trending down. Supports the bullish bias but not yet at complacency levels.

**Action**: Normal position sizing. Volatility dampener inactive.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  flowRead: `**Institutional Flow**

| Category | Today | This Week | Trend |
|----------|-------|-----------|-------|
| FII | +₹2,400cr | +₹8,200cr | Sustained buying |
| DII | -₹800cr | -₹1,200cr | Mild selling |
| Net | +₹1,600cr | +₹7,000cr | Bullish |

**FII sectors**: Banking (₹1,200cr), IT (₹800cr), Auto (₹400cr)
**DII sectors**: Selling FMCG, Pharma — rotating into cyclicals

**Read**: FII flows are the primary driver. As long as this sustains, the bias stays bullish.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  portfolioCheck: `**Shadow Portfolio Summary**

| Position | Entry | Current | P&L | Days Held |
|----------|-------|---------|-----|-----------|
| NIFTY MAY 24800 CE | 142 | 168 | +18.3% | 3 |
| HDFC Bank | 1,645 | 1,672 | +1.6% | 5 |
| Infosys | 1,420 | 1,398 | -1.5% | 2 |

**Totals**:
- Capital deployed: 35% of shadow allocation
- Unrealized P&L: +₹4,200 (paper)
- Win rate this month: 67% (4/6 trades)
- Max drawdown: -1.2%

All positions within risk parameters. HDFC approaching correlation guard threshold.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  keyLevels: `**Key Levels — NIFTY 50**

| Level | Type | Strength |
|-------|------|----------|
| 25,200 | Resistance | Strong — previous swing high |
| 25,000 | Resistance | Moderate — round number + call OI |
| 24,900 | Resistance | Near-term — needs volume break |
| 24,500 | Support | Strong — put OI + 50 EMA |
| 24,200 | Support | Strong — previous swing low |

**Current**: 24,847 — sandwiched between 24,900 resistance and 24,500 support.

**Trade plan**: Wait for a decisive break of this range. Above 24,900 with volume → long. Below 24,500 → defensive.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  stockPick: `**Stock Scanner**

Based on the confluence engine — top setups right now:

| Stock | Signal | Confidence | Factor |
|-------|--------|------------|--------|
| HDFC Bank | BUY | High | Breakout + FII buying |
| ICICI Bank | BUY | Medium | Sector strength |
| Tata Motors | BUY | Medium | Auto momentum |
| Infosys | HOLD | Low | Needs IT sector confirmation |

**Disclaimer**: These are shadow portfolio signals based on the confluence engine. Not recommendations.

Shadow Portfolio signal — not an executed trade, not financial advice.`,

  default: `**Signal Read**

No specific setup matching your query. Here's what the confluence engine shows:

- **NIFTY**: Neutral-bullish, 3/5 factors aligned
- **Breadth**: Healthy but not broad-based
- **VIX**: 12.85 — normal range
- **Flows**: FII buying sustained

**Action**: Wait for a clean setup. Use the chips above for specific analysis — **Market Briefing**, **Nifty Analysis**, **Risk Check**, or **Sector Heatmap**.

Shadow Portfolio signal — not an executed trade, not financial advice.`,
};

// ═══════════════════════════════════════════════════════════
// STUDY RESPONSES
// ═══════════════════════════════════════════════════════════

const STUDY_RESPONSES = {
  explainStart: (msg) => {
    const topic = msg.replace(/^(explain|what is|how does|how do|tell me about|describe)\s*/i, "").replace(/\?/g, "").trim();
    if (!topic) return `What do you want me to explain? Give me a topic — a concept, algorithm, data structure, framework, anything — and I'll break it down.\n\nBefore I start, I'll ask what you already know so I can build on that instead of starting from zero.`;
    return `**${topic.charAt(0).toUpperCase() + topic.slice(1)}**\n\nBefore I dive in — what's your current understanding of ${topic}? Are you a beginner, or do you know the basics and want to go deeper?\n\nThis helps me calibrate the explanation to your level. No point rehashing basics you already know, or overwhelming you with advanced details if the foundations aren't there yet.\n\nGive me a sense of where you are, and I'll tailor everything.`;
  },

  quiz: `**📝 Recall Check — Mixed Topics**

Let's test what you know. Three questions, easy to hard:

**1. (Easy)**: What's the difference between a stack and a queue? When would you pick one over the other?

**2. (Medium)**: You have 10 million entries and need to find the top 10 repeatedly as new data streams in. What data structure do you use and why?

**3. (Hard)**: Design a data structure that supports insert, delete, and getRandom in O(1). Walk me through the approach.

Take your time. I'll give detailed feedback on each — I care about your reasoning, not just the answer.`,

  flashcards: `**🃏 Flashcards — Algorithms (Easy → Hard)**

**Card 1** [Easy]
Q: What is the time complexity of binary search?
A: ||O(log n) — you halve the search space each step||

**Card 2** [Easy]
Q: What's the difference between stable and unstable sorting?
A: ||Stable sorts preserve the relative order of equal elements. Merge sort is stable; quicksort is not.||

**Card 3** [Medium]
Q: When does Dijkstra's algorithm fail?
A: ||When there are negative edge weights — it greedily picks the nearest node. Use Bellman-Ford instead.||

**Card 4** [Hard]
Q: Explain the Master Theorem for divide-and-conquer recurrences.
A: ||T(n) = aT(n/b) + O(n^d). a < b^d → O(n^d). a = b^d → O(n^d log n). a > b^d → O(n^(log_b a)).||

Use the **Flashcards** panel on the right for interactive review with spaced repetition.`,

  weakPoints: `Based on this conversation, here's what I'm noticing:

**🔄 Topics to revisit:**
1. **Time complexity analysis** — you get the basics but hesitate on amortized analysis
2. **Graph algorithms** — BFS/DFS applications in grids need work
3. **Dynamic programming** — the transition from recursive to bottom-up still feels mechanical

**My recommendation**: Let's drill DP next. The key insight you're missing is identifying the **state space** — once you see it, the recurrence writes itself.

Want to start on that now, or save it for next time?`,

  topic: (name, content) => `**${name.charAt(0).toUpperCase() + name.slice(1)}**\n\n${content}\n\nWant me to go deeper on any part of this? Or try **Quiz Me** to test your understanding.`,

  codeExample: (msg) => `Here's a code example based on your request:\n\n\`\`\`javascript\n// Example implementation\nfunction example(input) {\n  // Step 1: Validate input\n  if (!input) return null;\n\n  // Step 2: Process\n  const result = input\n    .filter(item => item.active)\n    .map(item => ({\n      ...item,\n      score: item.value * 2\n    }))\n    .sort((a, b) => b.score - a.score);\n\n  // Step 3: Return\n  return result.slice(0, 10);\n}\n\`\`\`\n\nThis is a generic example. Tell me specifically what you want to build — what language, what problem — and I'll write something real.`,

  default: `Good question. Before I go deeper — what's your current level on this topic? I want to build on what you know, not restart from zero.\n\nGive me a sense of where you are, and I'll tailor the explanation. Or use the chips above: **Explain Concept**, **Quiz Me**, **Flashcards**, **Weak Points**.`,
};

// ═══════════════════════════════════════════════════════════
// CAREER RESPONSES
// ═══════════════════════════════════════════════════════════

const CAREER_RESPONSES = {
  roadmap: `**🎯 Career Roadmap — Full-Stack Development**

**Phase 1 — Foundation (Weeks 1-3)**
- **Skill**: React + Node.js fundamentals
- **Why**: Every full-stack role requires this — it's table stakes
- **Project**: Build a task management app with auth, CRUD, and real-time updates
- **Ready signal**: Can build a feature end-to-end without tutorials

**Phase 2 — Systems Thinking (Weeks 4-6)**
- **Skill**: System design & databases
- **Why**: Distinguishes junior from mid-level thinking
- **Project**: Design and implement a URL shortener with rate limiting
- **Ready signal**: Can articulate tradeoffs (SQL vs NoSQL, monolith vs microservices) without prompting

**Phase 3 — Portfolio (Weeks 7-9)**
- **Skill**: Deployment, CI/CD, testing
- **Why**: Proof of execution, not just knowledge
- **Project**: Deploy your Phase 1+2 projects with Docker, GitHub Actions, and proper tests
- **Ready signal**: Working demo on your portfolio with clean code on GitHub

**Phase 4 — Interview Prep (Weeks 10-12)**
- **Skill**: DSA + system design interviews
- **Why**: The final gate — you need to perform under pressure
- **Project**: 50 LeetCode mediums + 5 system design mocks
- **Ready signal**: Can solve medium problems in <20 min, design a system in 35 min

I'll check in on progress next time you open Career mode. Want me to drill into any phase?`,

  skillGap: `**Honest Skill Assessment**

Based on what you've told me:

**✅ You have:**
- Basic programming fundamentals
- Motivation to learn (this matters more than people think)

**⚠️ You likely need:**
- Real project experience (tutorials ≠ competence)
- Database design (not just CRUD)
- Testing discipline (most self-taught devs skip this)
- System design vocabulary

**❌ Don't assume you have (unless demonstrated):**
- Production debugging skills
- API design patterns
- Performance optimization

I'm not saying you can't do these — I'm saying I haven't seen evidence yet. Show me a project, and I'll recalibrate.

What's the actual target you're working toward?`,

  resources: `**📚 Curated Resources — Verified**

**Foundational**:
1. "Designing Data-Intensive Applications" by Martin Kleppmann — the bible, start here
2. System Design Primer (GitHub: donnemartin) — free, comprehensive

**Practice**:
3. Neetcode.io — structured DSA + system design path
4. LeetCode Discuss — read other people's interview experiences

**Deep Dives**:
5. High Scalability blog — real-world case studies
6. AWS Architecture Center — production patterns

**Avoid**: Random YouTube "system design in 30 min" videos — they give false confidence.

Tell me which area you want to focus on, and I'll pull more specific resources.`,

  progressCheck: `**📈 Progress Check**

I don't have previous roadmap data yet — this is our first Career session.

Here's what I'll track going forward:
- ✅ Which phases you've completed
- 🔄 What you're currently working on
- ⚠️ Where you're stuck
- 📊 Time spent vs. estimated

Next time you open Career mode, I'll check in automatically. In the meantime:
1. Pick a target (role, project, certification)
2. Tell me where you are now
3. I'll build the roadmap and track it across sessions

What's the goal?`,

  projectIdeas: `**Project Ideas — By Level**

**Beginner** (1-2 weeks):
1. **Todo app** with auth — React + Firebase
2. **Weather dashboard** — API integration, responsive design
3. **URL shortener** — Node.js + MongoDB

**Intermediate** (2-4 weeks):
4. **Real-time chat app** — WebSockets, React, Node.js
5. **E-commerce backend** — REST API, JWT auth, payment integration
6. **Task board** (like Trello) — drag-and-drop, state management

**Advanced** (4-6 weeks):
7. **Distributed task scheduler** — Redis queues, worker processes
8. **Social media feed** — pagination, caching, real-time updates
9. **Code editor** (mini VS Code) — Monaco editor, file system, terminal

**Tip**: The best projects solve a problem you actually have. Start with that.

Which one interests you? I'll break down the architecture.`,

  resumeAdvice: `**Resume Tips for Tech Roles**

**Structure** (1 page max for <5 years experience):
1. **Header** — Name, email, GitHub, LinkedIn
2. **Summary** — 2 lines: what you do + what you're looking for
3. **Experience** — Quantify impact: "Reduced load time by 40%" not "Worked on performance"
4. **Projects** — 2-3 best, with tech stack and what you built
5. **Skills** — Languages, frameworks, tools (group by category)

**Common mistakes**:
- ❌ Listing every technology you've touched
- ❌ "Responsible for..." — use action verbs: Built, Designed, Optimized
- ❌ No GitHub link — recruiters check this
- ❌ Typos in a developer resume — instant reject

Want me to review a specific section?`,

  interviewPrep: `**Interview Prep Plan**

**Week 1-2: DSA Foundation**
- 2 LeetCode problems/day (easy → medium)
- Focus: Arrays, Strings, Hash Maps, Two Pointers
- Track: time per problem, patterns you recognize

**Week 3-4: Advanced DSA**
- 2 medium problems/day
- Focus: Trees, Graphs, DP, Binary Search
- Practice explaining your approach out loud

**Week 5-6: System Design**
- 2 designs/week: URL shortener, chat system, news feed
- Practice: requirements → high-level → deep-dive → tradeoffs

**Week 7-8: Behavioral + Mock Interviews**
- Prepare 5 STAR stories (conflict, failure, leadership, teamwork, impact)
- Do 2 mock interviews with a friend or on Pramp

Want me to start a practice session right now?`,

  jobSearch: `**Job Search Strategy**

**Target roles** (based on your skill level):
1. **Frontend Developer** — React, TypeScript, CSS
2. **Full-Stack Developer** — React + Node.js + database
3. **Backend Developer** — Node.js/Python + system design

**Where to apply**:
- **Startups** (10-100 people) — faster hiring, more ownership, learn faster
- **Mid-size** (100-1000) — better mentorship, structured processes
- **Big tech** — harder interviews, better comp, brand name

**Application strategy**:
1. Apply directly on company websites (not just job boards)
2. Customize resume per role — match keywords from the JD
3. Follow up after 5 days if no response
4. Track applications in a spreadsheet

What type of company are you targeting?`,

  certifications: `**Certifications Worth Getting**

**High value** (recognized by employers):
1. **AWS Cloud Practitioner** — entry-level cloud, good for any dev role
2. **AWS Solutions Architect Associate** — if you're going cloud/backend
3. **Google Professional Cloud Developer** — alternative to AWS

**Medium value** (nice to have):
4. **Meta Frontend/Backend Developer** — Coursera, good for fundamentals
5. **freeCodeCamp certifications** — free, project-based

**Low value** (skip these):
- Random Udemy completion certificates
- "Learn X in 30 days" badges

**Better than certifications**: A strong GitHub portfolio with real projects. Employers care more about what you've built than what courses you've completed.

Which area interests you?`,

  salaryNegotiate: `**Salary Negotiation — Indian Tech Market**

**Know the market**:
| Role | Startup | Mid-size | Big Tech |
|------|---------|----------|----------|
| Junior (0-2 yr) | 4-8 LPA | 6-12 LPA | 10-20 LPA |
| Mid (2-5 yr) | 8-15 LPA | 12-25 LPA | 20-40 LPA |
| Senior (5+ yr) | 15-30 LPA | 25-50 LPA | 40-80+ LPA |

**Negotiation tips**:
1. **Never give a number first** — ask their budget
2. **Negotiate total comp** — base + stocks + bonus + benefits
3. **Have a competing offer** — strongest leverage
4. **Be willing to walk away** — know your minimum
5. **Negotiate after the offer** — not during interviews

**Script**: "I'm very excited about this role. Based on my research and experience, I was expecting something in the range of [15-20% above offer]. Is there flexibility there?"`,

  roleBreakdown: (query) => {
    if (/full.?stack/.test(query)) return `**Full-Stack Developer Role Breakdown**

**What you need**:
- **Frontend**: React/Vue/Angular + TypeScript + CSS (Tailwind)
- **Backend**: Node.js/Python/Go + REST/GraphQL APIs
- **Database**: PostgreSQL/MongoDB + Redis for caching
- **DevOps**: Docker, CI/CD, basic cloud (AWS/Vercel)
- **Soft skills**: Communication, ownership, debugging

**Interview process**: DSA (1-2 rounds) → System Design (1 round) → Behavioral (1 round) → sometimes a take-home project

**Timeline to job-ready**: 3-6 months of focused prep (assuming you know programming basics).`;
    if (/frontend/.test(query)) return `**Frontend Developer Role Breakdown**

**What you need**:
- **Core**: React + TypeScript + CSS (Flexbox, Grid, animations)
- **State management**: Redux/Zustand/Context API
- **Testing**: Jest + React Testing Library
- **Performance**: Lazy loading, code splitting, memoization
- **Accessibility**: WCAG standards, screen reader support

**Interview process**: JS fundamentals → React deep-dive → coding challenge → sometimes a UI take-home

**Timeline**: 2-4 months if you know JavaScript well.`;
    if (/backend/.test(query)) return `**Backend Developer Role Breakdown**

**What you need**:
- **Language**: Node.js/Python/Go/Java
- **APIs**: REST + GraphQL, authentication (JWT, OAuth)
- **Databases**: SQL (PostgreSQL) + NoSQL (MongoDB), indexing, query optimization
- **Caching**: Redis, CDN
- **Message queues**: RabbitMQ, Kafka (for async processing)
- **DevOps**: Docker, Kubernetes basics, CI/CD

**Interview process**: DSA (1-2 rounds) → System Design (1-2 rounds) → Behavioral

**Timeline**: 3-6 months.`;
    return `Which role specifically? Tell me — full-stack, frontend, backend, DevOps, data science — and I'll break down exactly what you need to learn and how long it'll take.`;
  },

  default: `Let's get specific. What's the actual target you're working toward?\n\n- A **role** at a specific type of company?\n- A **project** you want to build?\n- A **certification** you're pursuing?\n- A **skill** you want to level up?\n\nTell me, and I'll build a real plan — not a generic topic list. Or use the chips above: **Build Roadmap**, **Skill Gap**, **Find Resources**, **Progress Check**.`,
};

// ═══════════════════════════════════════════════════════════
// INTERVIEW RESPONSES
// ═══════════════════════════════════════════════════════════

const INTERVIEW_RESPONSES = {
  behavioral: `**Behavioral Interview — Let's Go**

I'll run this like a real interview. One question at a time.

---

**Question 1:**

"Tell me about a time you had to work with a difficult team member. How did you handle it?"

Take your time. I'm looking for STAR structure — **Situation**, **Task**, **Action**, **Result**. Be specific, not vague.`,

  dsa: `**DSA Interview Session**

I'll give you one problem at a time. Think out loud — I care about your process as much as the answer.

---

**Problem 1 (Medium):**

Given an array of integers and a target value, return indices of the two numbers that add up to the target.

**Constraints:**
- Each input has exactly one solution
- You may not use the same element twice
- Return the answer in any order

**Follow-up**: Can you do it in one pass?

Start whenever you're ready. Talk me through your approach before coding.`,

  systemDesign: `**System Design Interview**

Let's start with a classic. I'll ask follow-ups as you go.

---

**Problem:**

Design a URL shortening service like bit.ly.

**Requirements:**
- Shorten long URLs to 7-character codes
- Redirect short URLs to original
- Handle 100M URLs stored
- 100M redirects per month
- Low latency reads

Start with the high-level architecture. What components do you need?`,

  pitch: `**Hackathon Pitch Practice**

I'll be the judge. You have 3 minutes to pitch, then I'll ask tough questions.

---

**Before you start — I need to know:**
1. What's the problem you're solving?
2. Who's the target user?
3. What's your solution?
4. What's the tech stack?
5. What makes this different from existing solutions?

Start your pitch whenever you're ready. I'll take notes and give honest feedback after.`,

  hrRound: `**HR Round Practice**

HR rounds test cultural fit, communication, and motivation. I'll ask common questions one at a time.

---

**Question 1:**

"Why do you want to work at this company?"

Be genuine. Generic answers like "it's a great company" don't work. Research the company and connect your goals to their mission.`,

  feedback: (answer) => {
    const len = answer.trim().split(/\s+/).length;
    if (len < 20) return `**Feedback**\n\nYour answer is too short (${len} words). In a real interview, this would feel like you're not engaged.\n\n**Fix**: Expand with specifics. What was the situation? What exactly did you do? What was the measurable result?\n\nTry again — give me a complete STAR answer.`;
    if (len < 50) return `**Feedback**\n\nDecent start (${len} words), but I need more detail.\n\n**What's missing:**\n- The **context** is vague — what kind of team? what project?\n- Your **action** needs specifics — what exactly did you say or do?\n- The **result** is unclear — what happened after? What did you learn?\n\n**Strength**: You structured it with situation and action.\n**Fix**: Add a quantifiable result and a reflection.\n\nWant to try again or move to the next question?`;
    return `**Feedback**\n\nGood answer (${len} words). Here's my read:\n\n**Strengths:**\n- You provided context and a specific situation\n- Your action was clear\n\n**Areas to improve:**\n- Make the result more concrete — numbers, outcomes, what changed\n- Add what you learned or would do differently\n- Keep it under 2 minutes when speaking\n\n**Score**: 3.5/5 — solid but could be more impactful.\n\nReady for the next question?`;
  },

  introPractice: `**"Tell Me About Yourself" — Practice**

This is the most common opener. Structure it as **Present → Past → Future** (60-90 seconds):

**Template:**
1. **Present**: "I'm currently [role/situation] working on [what]."
2. **Past**: "Before that, I [relevant experience/skill]."
3. **Future**: "I'm looking to [goal] because [motivation]."

**Example:**
"I'm a self-taught developer building full-stack projects with React and Node.js. Before that, I completed a computer science degree and worked on several personal projects including a real-time chat application. I'm looking for a role where I can work on challenging problems and grow as an engineer — which is why this opportunity caught my eye."

Practice yours and I'll give feedback.`,

  strengthWeakness: `**Strengths & Weaknesses — Strategy**

**Strengths** (pick 2-3, back with examples):
- Problem-solving → describe a complex bug you fixed
- Self-learning → mention a technology you taught yourself
- Communication → give an example of explaining a technical concept to non-technical people

**Weaknesses** (be honest, show growth):
- ❌ Never say "I'm a perfectionist" — interviewers see through it
- ✅ Pick a real weakness + what you're doing about it
- Example: "I used to struggle with time estimation. Now I break tasks into smaller pieces and add a buffer."
- Example: "I'm not great at saying no, which sometimes leads to overcommitment. I'm learning to set boundaries."

Want to practice with a specific question?`,

  whyQuestions: `**"Why This Company?" — Framework**

**Research these 3 things:**
1. **Product**: What do they build? Who are their users?
2. **Culture**: What do they value? (Check their blog, Glassdoor)
3. **Growth**: Where are they heading? Recent funding, expansion?

**Structure your answer:**
1. "I've been following [specific product/initiative] and I'm impressed by [specific thing]."
2. "My skills in [X] align with what you're building — [explain how]."
3. "I'm excited about [growth opportunity] because [personal motivation]."

**Avoid**: "I need a job" or "The salary is good."

Practice with a specific company and I'll give feedback.`,

  default: `Before we start — what kind of session do you want?\n\n1. **Behavioral** — STAR-format questions about your experience\n2. **DSA Practice** — Coding problems with complexity analysis\n3. **System Design** — Architecture & tradeoff discussions\n4. **HR Round** — Culture fit, motivation, salary negotiation\n5. **Hackathon Pitch** — Present your project, handle judge Q&A\n\nPick one and I'll run it like the real thing. Or just tell me what you want to practice.`,
};

// ═══════════════════════════════════════════════════════════
// MORNING BRIEFING
// ═══════════════════════════════════════════════════════════

function getMorningBriefing(mode, sessions) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const lastSession = (sessions || [])[0];

  let b = `**${greeting}, Jay.** ${today}.\n\n`;

  if (mode === "stock") b += `**📊 Pre-Market Briefing**\n\n- SGX Nifty indicating a flat-to-positive open\n- US markets closed mixed — Dow +0.2%, Nasdaq -0.1%\n- Asian markets trading sideways\n- No major macro events today\n\nCheck the chart panel for live levels. Tap **Market Briefing** for the full read.`;
  else if (mode === "study") b += `**🟠 Study Session**\n\nYou have flashcards due for review. Spaced repetition works best when you review on schedule.\n\nTap **Flashcards** in the right panel to start, or **Quiz Me** for a fresh challenge.`;
  else if (mode === "career") b += `**🔴 Career Check-in**\n\n${lastSession ? `Last session we discussed: *${lastSession.title || "your roadmap"}*` : "Let's set up your career roadmap."}\n\nTap **Progress Check** to see where you left off, or **Build Roadmap** to start fresh.`;
  else if (mode === "interview") b += `**🟣 Interview Prep**\n\nReady to practice? Pick a session type:\n\n- **Behavioral** — STAR-format questions\n- **DSA Practice** — Coding problems\n- **System Design** — Architecture challenges\n- **Pitch Practice** — Hackathon presentations`;

  return b;
}

// ═══════════════════════════════════════════════════════════
// HOOK — per-mode message isolation
// ═══════════════════════════════════════════════════════════

export function useChat({ mode = "stock" } = {}) {
  // Messages keyed by mode — each mode gets its own chat
  const [messagesByMode, setMessagesByMode] = useState(() => {
    const saved = loadHistory();
    const initial = {};
    ["stock", "study", "career", "interview"].forEach(m => {
      const sessionForMode = saved.find(s => s.mode === m);
      if (sessionForMode) {
        initial[m] = sessionForMode.messages;
      } else {
        initial[m] = [{ id: generateId(), role: "assistant", content: getMorningBriefing(m, saved), mode: null, ts: Date.now() }];
      }
    });
    return initial;
  });

  const [sessions, setSessions] = useState(() => loadHistory());
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const nextId = useRef(1000);

  // Current mode's messages
  const messages = messagesByMode[mode] || [];

  // Update messages for current mode
  const setMessages = useCallback((updater) => {
    setMessagesByMode(prev => {
      const current = prev[mode] || [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [mode]: next };
    });
  }, [mode]);

  // Auto-save on change
  useEffect(() => {
    if (messages.length <= 1) return;
    const firstUser = messages.find(m => m.role === "user");
    const title = firstUser ? firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? "…" : "") : "New chat";
    const sid = activeSessionId || generateId();
    if (!activeSessionId) setActiveSessionId(sid);

    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === sid);
      const session = { id: sid, title, mode, messages, updatedAt: Date.now(), createdAt: prev[idx]?.createdAt || Date.now() };
      const next = [...prev];
      if (idx >= 0) next[idx] = session; else next.unshift(session);
      saveHistory(next);
      return next;
    });
  }, [messages, mode]); // eslint-disable-line

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isThinking) return;
    const userMsg = { id: nextId.current++, role: "user", content: text.trim(), mode, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    let response;
    const apiKey = getApiKey();
    const provider = getProvider();

    // Try real LLM first (if API key is set or using local Ollama)
    if (apiKey || provider === "ollama") {
      try {
        const historyForLLM = [...messages, userMsg]
          .filter(m => m.role === "user" || m.role === "assistant")
          .slice(-10)
          .map(m => ({ role: m.role, content: m.content }));
        response = await callLLM(historyForLLM, mode);
      } catch (err) {
        console.warn("LLM failed, falling back to local responses:", err.message);
        response = null;
      }
    }

    // Fallback to hardcoded responses
    if (!response) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
      response = generateResponse(text, mode, [...messages, userMsg]);
    }

    setMessages(prev => [...prev, { id: nextId.current++, role: "assistant", content: response, mode, ts: Date.now() }]);
    setIsThinking(false);
    return response;
  }, [mode, isThinking, messages, setMessages]);

  const clearMessages = useCallback(() => {
    setMessages([{ id: generateId(), role: "assistant", content: getMorningBriefing(mode, sessions), mode: null, ts: Date.now() }]);
    setActiveSessionId(null);
  }, [mode, sessions, setMessages]);

  const newSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([{ id: generateId(), role: "assistant", content: getMorningBriefing(mode, sessions), mode: null, ts: Date.now() }]);
  }, [mode, sessions, setMessages]);

  const loadSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    setActiveSessionId(sessionId);
    setMessagesByMode(prev => ({ ...prev, [session.mode]: session.messages }));
  }, [sessions]);

  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== sessionId);
      saveHistory(next);
      return next;
    });
    if (sessionId === activeSessionId) {
      setActiveSessionId(null);
      setMessages([{ id: generateId(), role: "assistant", content: getMorningBriefing(mode, sessions), mode: null, ts: Date.now() }]);
    }
  }, [activeSessionId, mode, sessions, setMessages]);

  return { messages, isThinking, sendMessage, clearMessages, sessions, activeSessionId, newSession, loadSession, deleteSession };
}
