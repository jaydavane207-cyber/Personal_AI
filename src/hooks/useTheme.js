import { useState, useEffect, useCallback } from "react";

const THEMES = {
  dark: {
    bg: "#030712",
    bgSecondary: "#080d19",
    bgTertiary: "#0c1222",
    bgPanel: "#0a1020",
    borderColor: "#1e293b",
    textPrimary: "#e2e8f0",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textFaint: "#475569",
    inputBg: "#111827",
    surfaceHover: "rgba(255,255,255,0.02)",
    surfaceActive: "rgba(255,255,255,0.05)",
  },
  light: {
    bg: "#f8fafc",
    bgSecondary: "#ffffff",
    bgTertiary: "#f1f5f9",
    bgPanel: "#ffffff",
    borderColor: "#e2e8f0",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    textFaint: "#cbd5e1",
    inputBg: "#ffffff",
    surfaceHover: "rgba(0,0,0,0.02)",
    surfaceActive: "rgba(0,0,0,0.05)",
  },
};

export function useTheme() {
  const [themeName, setThemeName] = useState(() => localStorage.getItem("jarvis_theme") || "dark");
  const theme = THEMES[themeName] || THEMES.dark;

  useEffect(() => {
    localStorage.setItem("jarvis_theme", themeName);
    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, val]) => {
      root.style.setProperty(`--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`, val);
    });
  }, [themeName, theme]);

  const toggleTheme = useCallback(() => {
    setThemeName(prev => prev === "dark" ? "light" : "dark");
  }, []);

  return { themeName, theme, toggleTheme, setThemeName };
}
