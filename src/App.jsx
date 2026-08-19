// Before adding features: check SECURITY.md — sanitize rendered content,
// minimize data leaving the browser, and handle permission/API failures gracefully.

import React, { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatPanel } from "./components/ChatPanel";
import { RightPanel } from "./components/RightPanel";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsPanel } from "./components/SettingsPanel";
import { useChat } from "./hooks/useChat";
import { useVoice } from "./hooks/useVoice";
import { useTheme } from "./hooks/useTheme";
import { useStockData } from "./hooks/useStockData";
import { MODE_META } from "./agents";

const MODES = Object.entries(MODE_META).map(([key, meta]) => ({ key, ...meta }));

export default function App() {
  const [activeMode, setActiveMode] = useState(() => localStorage.getItem("jarvis_mode") || "stock");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem("jarvis_voice") === "true");
  const { themeName, toggleTheme } = useTheme();
  const stockData = useStockData(30000); // Refresh every 30 seconds

  const {
    messages, isThinking, sendMessage, clearMessages,
    sessions, activeSessionId, newSession, loadSession, deleteSession,
  } = useChat({ mode: activeMode });

  const voice = useVoice({ onResult: (text) => sendMessage(text) });

  useEffect(() => { localStorage.setItem("jarvis_mode", activeMode); }, [activeMode]);
  useEffect(() => { localStorage.setItem("jarvis_voice", String(voiceOn)); }, [voiceOn]);

  // Auto-speak assistant responses
  useEffect(() => {
    if (!voiceOn || !voice.supported.tts) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.content) {
      const plain = last.content.replace(/\*\*/g, "").replace(/[#*_`~|]/g, "").replace(/\n+/g, ". ").replace(/\s+/g, " ").trim();
      voice.speak(plain);
    }
  }, [messages, voiceOn]); // eslint-disable-line

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        setActiveMode(["stock", "study", "career", "interview"][parseInt(e.key) - 1]);
      }
      if (e.code === "Space" && !e.target.closest("textarea, input") && voice.supported.stt) {
        e.preventDefault();
        voice.toggleListening();
      }
      if (e.code === "Escape" && voice.isSpeaking) voice.stopSpeaking();
      // Ctrl+K for command palette
      if (e.ctrlKey && e.key === "k") { e.preventDefault(); setCmdOpen(prev => !prev); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [voice]);

  const currentMode = MODES.find(m => m.key === activeMode);

  // Command palette execution
  const handleCmdExecute = useCallback((item) => {
    if (item.id === "new-chat") newSession();
    else if (item.id === "clear-chat") clearMessages();
    else if (item.id === "toggle-voice") setVoiceOn(v => !v);
    else if (item.id === "toggle-sidebar") setSidebarOpen(v => !v);
    else if (item.id === "toggle-right") setRightPanelOpen(v => !v);
    else if (item.id === "settings") setSettingsOpen(true);
    else if (item.id === "mode-stock") setActiveMode("stock");
    else if (item.id === "mode-study") setActiveMode("study");
    else if (item.id === "mode-career") setActiveMode("career");
    else if (item.id === "mode-interview") setActiveMode("interview");
    else if (item.action === "chip") sendMessage(item.label);
    else if (item.action === "session") loadSession(item.sessionId);
  }, [newSession, clearMessages, sendMessage, loadSession]);

  return (
    <div className="flex h-screen" style={{ background: "#030712" }}>
      <Sidebar
        modes={MODES}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSettings={() => setSettingsOpen(true)}
        onClear={clearMessages}
        onExport={() => {
          const md = messages.filter(m => m.role !== "assistant" || m.id !== 1).map(m => {
            const role = m.role === "user" ? "**You**" : `**JARVIS**${m.mode ? ` (${m.mode.toUpperCase()})` : ""}`;
            return `### ${role}\n\n${m.content}\n`;
          }).join("\n---\n\n");
          const blob = new Blob([`# JARVIS Chat Export\n\n*Exported: ${new Date().toLocaleString()}*\n\n---\n\n${md}`], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `jarvis-chat-${Date.now()}.md`; a.click();
          URL.revokeObjectURL(url);
        }}
        messageCount={messages.length}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={newSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
      />

      <ChatPanel
        messages={messages}
        isThinking={isThinking}
        activeMode={activeMode}
        modeMeta={currentMode}
        onSend={sendMessage}
        voice={voice}
        voiceOn={voiceOn}
        onToggleVoice={() => setVoiceOn(!voiceOn)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleRight={() => setRightPanelOpen(!rightPanelOpen)}
        rightPanelOpen={rightPanelOpen}
      />

      {rightPanelOpen && (
        <RightPanel activeMode={activeMode} modeMeta={currentMode} messages={messages} stockData={stockData} />
      )}

      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} voice={voice} voiceOn={voiceOn} onToggleVoice={() => setVoiceOn(!voiceOn)} themeName={themeName} onToggleTheme={toggleTheme} />
      )}

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onExecute={handleCmdExecute} activeMode={activeMode} sessions={sessions} />
    </div>
  );
}
