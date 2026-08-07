import React, { useState, useEffect } from 'react';
import { Key, Mic, Volume2, Globe, Zap, Palette, Save } from 'lucide-react';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    openaiKey: '',
    searchApiKey: '',
    voiceLang: 'en-US',
    voiceRate: '1.0',
    theme: 'dark',
    autoSpeak: true,
    shortcut: 'CommandOrControl+Shift+A',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('pa-settings');
      if (s) setSettings(prev => ({ ...prev, ...JSON.parse(s) }));
    } catch {}
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem('pa-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap size={20} className="text-blue-400" />
          Settings
        </h2>
        <p className="text-xs text-surface-500 mt-1">Configure your personal assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* API Keys */}
        <section>
          <h3 className="text-sm font-medium text-surface-300 flex items-center gap-2 mb-3">
            <Key size={16} className="text-yellow-400" />
            API Keys
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-surface-400 block mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={settings.openaiKey}
                onChange={(e) => updateSetting('openaiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full bg-surface-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-surface-600"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">Web Search API Key</label>
              <input
                type="password"
                value={settings.searchApiKey}
                onChange={(e) => updateSetting('searchApiKey', e.target.value)}
                placeholder="Your search API key..."
                className="w-full bg-surface-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-surface-600"
              />
            </div>
          </div>
        </section>

        {/* Voice Settings */}
        <section>
          <h3 className="text-sm font-medium text-surface-300 flex items-center gap-2 mb-3">
            <Mic size={16} className="text-blue-400" />
            Voice &amp; Speech
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-surface-400 block mb-1">Language</label>
              <select
                value={settings.voiceLang}
                onChange={(e) => updateSetting('voiceLang', e.target.value)}
                className="w-full bg-surface-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">Speech Rate: {settings.voiceRate}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voiceRate}
                onChange={(e) => updateSetting('voiceRate', e.target.value)}
                className="w-full accent-blue-500"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => updateSetting('autoSpeak', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-sm text-surface-300">Auto-speak responses</span>
            </label>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h3 className="text-sm font-medium text-surface-300 flex items-center gap-2 mb-3">
            <Palette size={16} className="text-purple-400" />
            Appearance
          </h3>
          <div>
            <label className="text-xs text-surface-400 block mb-1">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="w-full bg-surface-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="dark">Dark</option>
              <option value="darker">Darker</option>
              <option value="midnight">Midnight Blue</option>
            </select>
          </div>
        </section>

        {/* Shortcut */}
        <section>
          <h3 className="text-sm font-medium text-surface-300 flex items-center gap-2 mb-3">
            <Globe size={16} className="text-green-400" />
            Global Shortcut
          </h3>
          <div className="bg-surface-800 rounded-lg px-3 py-2 text-sm text-surface-300 font-mono">
            Ctrl + Shift + A
          </div>
          <p className="text-xs text-surface-500 mt-1">Press this shortcut anytime to show/hide the assistant</p>
        </section>
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-surface-800">
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? (
            <>
              <span className="text-green-400">✓</span> Saved!
            </>
          ) : (
            <>
              <Save size={16} /> Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
