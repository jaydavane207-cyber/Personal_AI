/**
 * useStockData — Real-time stock data with technical indicators.
 *
 * Data source: Yahoo Finance (free, no API key, unofficial).
 * Refreshes every 30 seconds. Caches to localStorage.
 *
 * Technical indicators calculated client-side:
 * - SMA (Simple Moving Average) — 20, 50
 * - RSI (Relative Strength Index) — 14-period
 * - VWAP (Volume Weighted Average Price)
 * - Bollinger Bands (20, 2σ)
 */

import { useState, useEffect, useRef, useCallback } from "react";

const STOCK_CACHE_KEY = "jarvis_stock_cache";

// Yahoo Finance symbols for Indian indices
const SYMBOLS = {
  nifty50: "^NSEI",
  sensex: "^BSESN",
  bankNifty: "^NSEBANK",
  niftyIT: "^CNXIT",
};

// ── Technical Indicators ───────────────────────────────────

function calcSMA(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calcBollingerBands(closes, period = 20, multiplier = 2) {
  if (closes.length < period) return null;
  const sma = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: sma + multiplier * stdDev,
    middle: sma,
    lower: sma - multiplier * stdDev,
  };
}

function calcVWAP(candles) {
  if (!candles.length) return null;
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const volume = c.volume || 1;
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
  }
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
}

// ── Data Fetching ──────────────────────────────────────────

async function fetchQuote(symbol, range = "1d", interval = "15m") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Yahoo Finance error: ${response.status}`);
  const data = await response.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta;
  const quotes = result.indicators?.quote?.[0];
  const timestamps = result.timestamp || [];

  const candles = [];
  const closes = [];
  if (timestamps.length && quotes) {
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.open?.[i] != null) {
        const candle = {
          time: timestamps[i],
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume?.[i] || 0,
        };
        candles.push(candle);
        closes.push(candle.close);
      }
    }
  }

  // Calculate technical indicators
  const indicators = {
    sma20: calcSMA(closes, 20),
    sma50: calcSMA(closes, 50),
    rsi: calcRSI(closes, 14),
    bollinger: calcBollingerBands(closes, 20, 2),
    vwap: calcVWAP(candles),
  };

  return {
    symbol,
    name: meta.shortName || meta.symbol,
    price: meta.regularMarketPrice,
    previousClose: meta.chartPreviousClose || meta.previousClose,
    change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || 0),
    changePercent: ((meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || 0)) / (meta.chartPreviousClose || meta.previousClose || 1)) * 100,
    high: meta.regularMarketDayHigh,
    low: meta.regularMarketDayLow,
    open: meta.regularMarketOpen,
    volume: meta.regularMarketVolume,
    candles,
    closes,
    indicators,
    updatedAt: Date.now(),
  };
}

async function fetchAllQuotes() {
  const results = {};
  await Promise.allSettled(
    Object.entries(SYMBOLS).map(async ([key, symbol]) => {
      try {
        results[key] = await fetchQuote(symbol);
      } catch (err) {
        console.warn(`Failed to fetch ${key}:`, err.message);
        results[key] = null;
      }
    })
  );
  return results;
}

function loadCache() {
  try {
    const raw = localStorage.getItem(STOCK_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCache(data) {
  try { localStorage.setItem(STOCK_CACHE_KEY, JSON.stringify(data)); } catch {}
}

export function useStockData(refreshInterval = 30000) {
  const [data, setData] = useState(() => loadCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const quotes = await fetchAllQuotes();
      const hasData = Object.values(quotes).some(q => q !== null);
      if (hasData) {
        setData(quotes);
        saveCache(quotes);
        setLastFetch(Date.now());
      } else {
        setError("No data received");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, refreshInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh, refreshInterval]);

  return { data, loading, error, lastFetch, refresh };
}
