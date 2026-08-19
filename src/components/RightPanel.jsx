import React, { useState } from "react";
import { InterviewTimer, Scorecard } from "./InterviewTimer";
import { FlashcardPanel } from "./FlashcardPanel";
import { CareerPanel } from "./CareerPanel";
import { BackgroundMode } from "./BackgroundMode";
import { StockChart } from "./StockChart";

// ── Live Chart with Technical Indicators ────────────────────

function LiveChart({ nifty, color, candles }) {
  const indicators = nifty?.indicators;
  return (
    <div className="rounded-lg border border-gray-800/50 p-3" style={{ background: "#0a1020" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-400">NIFTY 50 — Live</span>
        <span className="text-[9px] text-gray-600">15min</span>
      </div>
      {candles.length > 0 ? (
        <StockChart candles={candles} color={color} height={130} />
      ) : (
        <div className="h-[130px] flex items-center justify-center text-[11px] text-gray-600">Loading chart...</div>
      )}
      {/* Price + Change */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-200">{nifty ? nifty.price?.toFixed(2) : "—"}</span>
          {nifty && (
            <span className={`text-[10px] font-medium ${nifty.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {nifty.change >= 0 ? "▲" : "▼"} {Math.abs(nifty.change).toFixed(2)} ({nifty.changePercent?.toFixed(2)}%)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-500">O {nifty?.open?.toFixed(0) || "—"}</span>
          <span className="text-[9px] text-gray-500">H {nifty?.high?.toFixed(0) || "—"}</span>
          <span className="text-[9px] text-gray-500">L {nifty?.low?.toFixed(0) || "—"}</span>
        </div>
      </div>
      {/* Technical Indicators */}
      {indicators && (
        <div className="mt-2 pt-2 border-t border-gray-800/30 grid grid-cols-2 gap-x-3 gap-y-1">
          {indicators.sma20 && (
            <div className="flex justify-between">
              <span className="text-[9px] text-gray-600">SMA 20</span>
              <span className="text-[9px] font-mono text-gray-400">{indicators.sma20.toFixed(0)}</span>
            </div>
          )}
          {indicators.sma50 && (
            <div className="flex justify-between">
              <span className="text-[9px] text-gray-600">SMA 50</span>
              <span className="text-[9px] font-mono text-gray-400">{indicators.sma50.toFixed(0)}</span>
            </div>
          )}
          {indicators.rsi != null && (
            <div className="flex justify-between">
              <span className="text-[9px] text-gray-600">RSI 14</span>
              <span className={`text-[9px] font-mono ${indicators.rsi > 70 ? "text-red-400" : indicators.rsi < 30 ? "text-green-400" : "text-gray-400"}`}>
                {indicators.rsi.toFixed(1)}
              </span>
            </div>
          )}
          {indicators.vwap && (
            <div className="flex justify-between">
              <span className="text-[9px] text-gray-600">VWAP</span>
              <span className="text-[9px] font-mono text-gray-400">{indicators.vwap.toFixed(0)}</span>
            </div>
          )}
          {indicators.bollinger && (
            <div className="flex justify-between col-span-2">
              <span className="text-[9px] text-gray-600">BB (20,2)</span>
              <span className="text-[9px] font-mono text-gray-400">
                {indicators.bollinger.upper.toFixed(0)} / {indicators.bollinger.middle.toFixed(0)} / {indicators.bollinger.lower.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Signal Cards ───────────────────────────────────────────

const FALLBACK_SIGNALS = [
  { id: 1, stock: "NIFTY 50", dir: "—", conf: "—", price: "—", change: "—", ts: "—" },
];

function SignalCard({ signal }) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-gray-800/30" style={{ background: "#0c1222" }}>
      <div>
        <div className="text-[11px] font-medium text-gray-200">{signal.stock}</div>
        <div className="text-[9px] text-gray-600">{signal.ts}</div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${signal.dir === "BUY" ? "bg-green-500/15 text-green-400" : signal.dir === "SELL" ? "bg-red-500/15 text-red-400" : "bg-gray-700/50 text-gray-400"}`}>{signal.dir}</span>
          <span className="text-[10px] font-mono text-gray-300">{signal.price}</span>
        </div>
        <span className={`text-[9px] ${signal.change?.startsWith("+") ? "text-green-400" : signal.change?.startsWith("-") ? "text-red-400" : "text-gray-500"}`}>{signal.change}</span>
      </div>
    </div>
  );
}

// ── Shadow Portfolio ───────────────────────────────────────

const PORTFOLIO = [
  { id: 1, name: "NIFTY MAY 24800 CE", entry: 142, current: 168, pnl: "+18.3%", status: "open" },
  { id: 2, name: "HDFC Bank", entry: 1645, current: 1672, pnl: "+1.6%", status: "open" },
  { id: 3, name: "Infosys", entry: 1420, current: 1398, pnl: "-1.5%", status: "open" },
];

// ── Main Right Panel ───────────────────────────────────────

const STOCK_BG_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4";

export function RightPanel({ activeMode, modeMeta, messages, stockData }) {
  const color = modeMeta?.color || "#475569";

  // Build live signals from real data
  const liveSignals = stockData?.data ? [
    stockData.data.nifty50 && {
      id: 1, stock: "NIFTY 50", dir: (stockData.data.nifty50.change >= 0 ? "BUY" : "SELL"),
      conf: Math.abs(stockData.data.nifty50.changePercent) > 1 ? "High" : Math.abs(stockData.data.nifty50.changePercent) > 0.3 ? "Medium" : "Low",
      price: stockData.data.nifty50.price?.toFixed(2),
      change: `${stockData.data.nifty50.change >= 0 ? "+" : ""}${stockData.data.nifty50.changePercent?.toFixed(2)}%`,
      ts: new Date(stockData.data.nifty50.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    stockData.data.bankNifty && {
      id: 2, stock: "BANK NIFTY", dir: (stockData.data.bankNifty.change >= 0 ? "BUY" : "SELL"),
      conf: Math.abs(stockData.data.bankNifty.changePercent) > 1 ? "High" : "Medium",
      price: stockData.data.bankNifty.price?.toFixed(2),
      change: `${stockData.data.bankNifty.change >= 0 ? "+" : ""}${stockData.data.bankNifty.changePercent?.toFixed(2)}%`,
      ts: new Date(stockData.data.bankNifty.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    stockData.data.sensex && {
      id: 3, stock: "SENSEX", dir: (stockData.data.sensex.change >= 0 ? "BUY" : "SELL"),
      conf: "Medium",
      price: stockData.data.sensex.price?.toFixed(2),
      change: `${stockData.data.sensex.change >= 0 ? "+" : ""}${stockData.data.sensex.changePercent?.toFixed(2)}%`,
      ts: new Date(stockData.data.sensex.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ].filter(Boolean) : FALLBACK_SIGNALS;

  const nifty = stockData?.data?.nifty50;

  return (
    <div className="w-72 border-l border-gray-800/50 flex flex-col overflow-hidden relative" style={{ background: "#080d19" }}>
      {/* Video bg — Stock only */}
      {activeMode === "stock" && (
        <>
          <video key="stock-bg" src={STOCK_BG_VIDEO} autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 0 }} />
          <div className="absolute inset-0" style={{ background: "rgba(3,7,18,0.82)", zIndex: 1 }} />
        </>
      )}

      {/* Content */}
      <div className="relative flex flex-col flex-1 overflow-hidden" style={{ zIndex: 2 }}>
        {/* STOCK MODE */}
        {activeMode === "stock" && (
          <>
            <div className="p-3 border-b border-gray-800/50">
              <LiveChart nifty={nifty} color={color} candles={nifty?.candles || []} />
            </div>
            <div className="p-3 border-b border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider">LIVE SIGNALS</span>
                {stockData?.lastFetch && (
                  <span className="flex items-center gap-1 text-[9px] text-gray-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${stockData.loading ? "bg-yellow-400 animate-pulse" : stockData.error ? "bg-red-400" : "bg-green-400"}`} />
                    {stockData.loading ? "Updating..." : stockData.error ? "Offline" : "Live"}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {liveSignals.map(s => <SignalCard key={s.id} signal={s} />)}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-[10px] font-semibold text-gray-400 mb-2 tracking-wider">SHADOW PORTFOLIO</div>
              <div className="space-y-1.5">
                {PORTFOLIO.map(p => (
                  <div key={p.id} className="px-2.5 py-1.5 rounded-lg border border-gray-800/30" style={{ background: "#0c1222" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-gray-200">{p.name}</span>
                      <span className={`text-[10px] font-mono ${p.pnl.startsWith("+") ? "text-green-400" : "text-red-400"}`}>{p.pnl}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] text-gray-600">Entry: {p.entry}</span>
                      <span className="text-[9px] text-gray-600">Current: {p.current}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-3 px-2.5 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                  <div className="text-[9px] text-cyan-400 font-medium">PAPER TRADING ONLY</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Shadow Portfolio auto-trades on signals. Not real capital.</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STUDY MODE */}
        {activeMode === "study" && (
          <div className="flex-1 overflow-y-auto p-3">
            <FlashcardPanel color={color} />
          </div>
        )}

        {/* INTERVIEW MODE */}
        {activeMode === "interview" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <InterviewTimer color={color} />
            <Scorecard color={color} />
          </div>
        )}

        {/* CAREER MODE */}
        {activeMode === "career" && (
          <div className="flex-1 overflow-y-auto p-3">
            <CareerPanel color={color} />
          </div>
        )}
      </div>

      {/* Footer — background mode always visible */}
      <div className="relative p-2 border-t border-gray-800/50 space-y-2" style={{ zIndex: 2 }}>
        <BackgroundMode color={color} />
        <div className="text-[8px] text-gray-700 text-center">Shadow Portfolio — not an executed trade, not financial advice.</div>
      </div>
    </div>
  );
}
