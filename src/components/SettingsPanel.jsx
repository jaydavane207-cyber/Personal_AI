import React, { useState } from "react";
import { PROVIDERS, getProvider, getApiKey } from "../hooks/useLLM";

export function SettingsPanel({ onClose, voice, voiceOn, onToggleVoice, themeName, onToggleTheme }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-72 border-l border-gray-800/50 flex flex-col panel-enter" style={{ background: "#080d19" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
          <h2 className="text-xs font-bold text-gray-200">Settings</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {/* Voice */}
          <div>
            <h3 className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Voice</h3>
            <div className="flex items-center justify-between py-1.5">
              <div>
                <div className="text-xs text-gray-200">Voice Assistant</div>
                <div className="text-[10px] text-gray-600">Speech recognition & TTS</div>
              </div>
              <button onClick={onToggleVoice} className={`relative w-9 h-5 rounded-full transition-colors ${voiceOn ? "bg-cyan-500" : "bg-gray-700"}`}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: voiceOn ? "18px" : "2px" }} />
              </button>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-300">Speech Recognition</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${voice.supported.stt ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{voice.supported.stt ? "✓" : "✗"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-300">Text-to-Speech</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${voice.supported.tts ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{voice.supported.tts ? "✓" : "✗"}</span>
            </div>
            {voice.supported.tts && voice.voices.length > 0 && (
              <div className="py-1.5">
                <label className="text-xs text-gray-300 block mb-1">Voice</label>
                <select value={voice.selectedVoice?.name || ""} onChange={e => { const v = voice.voices.find(v => v.name === e.target.value); voice.setSelectedVoice(v); }} className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-cyan-500">
                  {voice.voices.filter(v => v.lang.startsWith("en")).map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                </select>
              </div>
            )}
            {voice.supported.tts && (
              <button onClick={() => voice.speak("Hello Jay, I'm JARVIS. Voice is working correctly.")} className="w-full mt-1 px-3 py-1.5 rounded-lg border border-gray-700/50 text-[11px] text-gray-400 hover:bg-white/[0.02] transition-colors">
                🔊 Test Voice
              </button>
            )}
          </div>

          {/* Theme */}
          <div>
            <h3 className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Theme</h3>
            <div className="flex items-center justify-between py-1.5">
              <div>
                <div className="text-xs text-gray-200">Appearance</div>
                <div className="text-[10px] text-gray-600">{themeName === "dark" ? "Dark mode" : "Light mode"}</div>
              </div>
              <button onClick={onToggleTheme} className={`relative w-9 h-5 rounded-full transition-colors ${themeName === "dark" ? "bg-gray-700" : "bg-amber-400"}`}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: themeName === "dark" ? "2px" : "18px" }}>
                  <span className="flex items-center justify-center w-full h-full text-[8px]">{themeName === "dark" ? "🌙" : "☀️"}</span>
                </span>
              </button>
            </div>
          </div>

          {/* LLM Configuration */}
          <div>
            <h3 className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2">AI Model</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Provider</label>
                <select
                  value={localStorage.getItem("jarvis_llm_provider") || "groq"}
                  onChange={e => localStorage.setItem("jarvis_llm_provider", e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-cyan-500"
                >
                  {Object.entries(PROVIDERS).map(([key, p]) => (
                    <option key={key} value={key}>{p.name} {p.free ? "(Free)" : ""} — {p.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-300 block mb-1">API Key</label>
                <input
                  type="password"
                  defaultValue={getApiKey()}
                  onChange={e => localStorage.setItem("jarvis_llm_api_key", e.target.value)}
                  placeholder="sk-... (get from provider)"
                  className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-2 py-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[9px] text-gray-600 mt-1">
                  Get a free key at <span className="text-cyan-400">console.groq.com</span> — no credit card needed.
                  Or use Ollama locally (no key required).
                </p>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
                <span className={`w-2 h-2 rounded-full ${getApiKey() || getProvider() === "ollama" ? "bg-green-400" : "bg-gray-600"}`} />
                <span className="text-[10px] text-gray-400">
                  {getApiKey() || getProvider() === "ollama"
                    ? `Connected to ${PROVIDERS[getProvider()]?.name || "Groq"}`
                    : "No API key — using built-in responses"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Data */}
          <div>
            <h3 className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Data & Privacy</h3>
            {/* NOTE: Chat history is stored unencrypted in localStorage by design.
                This is a personal-use app — all data stays on-device, never sent externally.
                No encryption is used because the key would have to live in JS anyway,
                which doesn't meaningfully protect against local device access. */}
            <div className="flex items-center justify-between py-1.5">
              <div>
                <div className="text-xs text-gray-200">Chat History</div>
                <div className="text-[10px] text-gray-600">Stored locally in your browser</div>
              </div>
              <span className="text-[10px] text-gray-500">localStorage</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Delete all chat history, settings, and flashcard data? This cannot be undone.")) {
                  localStorage.removeItem("jarvis_chat_history");
                  localStorage.removeItem("jarvis_mode");
                  localStorage.removeItem("jarvis_voice");
                  localStorage.removeItem("jarvis_theme");
                  window.location.reload();
                }
              }}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-red-500/20 text-[11px] text-red-400 hover:bg-red-500/5 transition-colors"
            >
              🗑️ Clear All Data
            </button>
            <p className="text-[9px] text-gray-600 mt-1.5">
              All data stays on your device. Nothing is sent to external servers.
            </p>
          </div>

          {/* Shortcuts */}
          <div>
            <h3 className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Shortcuts</h3>
            {[["Ctrl+1", "Stock mode"], ["Ctrl+2", "Study mode"], ["Ctrl+3", "Career mode"], ["Ctrl+4", "Interview mode"], ["Space", "Toggle voice"], ["Enter", "Send message"], ["Escape", "Stop speaking"]].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-[11px] text-gray-400">{desc}</span>
                <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700/50 text-[10px] text-gray-500 font-mono">{key}</kbd>
              </div>
            ))}
          </div>

          {/* About */}
          <div>
            <h3 className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2">About</h3>
            <p className="text-[11px] text-gray-500">JARVIS v2.0.0 · Mode-biased routing · Voice-enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
