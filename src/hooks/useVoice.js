/**
 * useVoice — Speech recognition + synthesis with voice commands.
 *
 * Features:
 * - STT via Web Speech API (Chrome/Edge/Safari)
 * - TTS with voice selection and rate/pitch control
 * - Voice commands ("clear chat", "switch to stock", "stop speaking")
 * - Interim transcript display
 * - Graceful permission handling
 * - Continuous listening mode
 */

import { useState, useRef, useCallback, useEffect } from "react";

// Voice commands that can be spoken instead of typed
const VOICE_COMMANDS = {
  "clear chat": { action: "clear" },
  "clear history": { action: "clear" },
  "new chat": { action: "new" },
  "switch to stock": { action: "mode", mode: "stock" },
  "switch to study": { action: "mode", mode: "study" },
  "switch to career": { action: "mode", mode: "career" },
  "switch to interview": { action: "mode", mode: "interview" },
  "stop speaking": { action: "stop_speaking" },
  "stop listening": { action: "stop_listening" },
  "repeat that": { action: "repeat" },
  "read that": { action: "repeat" },
};

export function useVoice({ onResult, onCommand, lang = "en-US" } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [supported, setSupported] = useState({ stt: false, tts: false });
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");

  const recRef = useRef(null);
  const synthRef = useRef(null);

  // ── Detect support ──────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported({ stt: !!SR, tts: !!window.speechSynthesis });
  }, []);

  // ── Load TTS voices ─────────────────────────────────────
  useEffect(() => {
    if (!window.speechSynthesis) return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const v = synthRef.current.getVoices();
      setVoices(v);
      if (!selectedVoice && v.length) {
        const preferred = v.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            (voice.name.includes("Google") ||
              voice.name.includes("Samantha") ||
              voice.name.includes("Daniel") ||
              voice.name.includes("Natural") ||
              voice.name.includes("Aria"))
        );
        setSelectedVoice(preferred || v[0]);
      }
    };

    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;
  }, [selectedVoice]);

  // ── Check for voice command ─────────────────────────────
  const checkVoiceCommand = useCallback((text) => {
    const lower = text.toLowerCase().trim();
    for (const [phrase, command] of Object.entries(VOICE_COMMANDS)) {
      if (lower.includes(phrase)) {
        return command;
      }
    }
    return null;
  }, []);

  // ── Start listening ─────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // Stop any ongoing speech first
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    try {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterim("");
        setPermissionDenied(false);
      };

      recognition.onresult = (event) => {
        let interimText = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += t;
          } else {
            interimText += t;
          }
        }
        if (finalText) {
          setTranscript("");
          setInterim("");
          setLastTranscript(finalText);

          // Check for voice commands
          const command = checkVoiceCommand(finalText);
          if (command) {
            onCommand?.(command);
          } else {
            onResult?.(finalText);
          }
        } else {
          setInterim(interimText);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setPermissionDenied(true);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setPermissionDenied(true);
    }
  }, [lang, onResult, onCommand, checkVoiceCommand]);

  // ── Stop listening ──────────────────────────────────────
  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── Toggle listening ────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ── Speak text (TTS) ────────────────────────────────────
  const speak = useCallback(
    (text) => {
      if (!synthRef.current || !text) return;

      // Cancel any ongoing speech
      synthRef.current.cancel();

      // Strip markdown for speech
      const plain = text
        .replace(/\*\*/g, "")
        .replace(/[#*_`~|]/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/\n+/g, ". ")
        .replace(/\s+/g, " ")
        .trim();

      if (!plain) return;

      const utterance = new SpeechSynthesisUtterance(plain);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = lang;
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [selectedVoice, lang, speechRate]
  );

  // ── Stop speaking ───────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // ── Repeat last response ────────────────────────────────
  const repeatLast = useCallback(() => {
    if (lastTranscript) {
      speak(lastTranscript);
    }
  }, [lastTranscript, speak]);

  // ── Cleanup on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      recRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  return {
    // State
    isListening,
    isSpeaking,
    interim,
    voices,
    selectedVoice,
    speechRate,
    supported,
    permissionDenied,
    lastTranscript,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    repeatLast,
    setSelectedVoice,
    setSpeechRate,
  };
}
