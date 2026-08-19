/**
 * useLLM — Real LLM integration with streaming, memory, and multi-provider support.
 *
 * Providers:
 * - Groq (free, fast): https://console.groq.com — 30 req/min, Llama 3 70B
 * - OpenAI (paid): https://platform.openai.com — GPT-4o
 * - Ollama (local, free): http://localhost:11434 — any local model
 * - Google Gemini (free tier): https://aistudio.google.com — 15 req/min
 *
 * All providers use OpenAI-compatible chat completions format.
 */

import { MODE_AGENTS, ORCHESTRATOR_PROMPT, RESEARCHER_CONTRACT, CODER_AGENT_PROMPT } from "../agents";

const PROVIDERS = {
  groq: {
    name: "Groq (Free)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    free: true,
    maxTokens: 4096,
  },
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    free: false,
    maxTokens: 4096,
  },
  gemini: {
    name: "Google Gemini (Free)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
    free: true,
    maxTokens: 4096,
  },
  ollama: {
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3",
    free: true,
    maxTokens: 2048,
  },
};

function getProvider() {
  return localStorage.getItem("jarvis_llm_provider") || "groq";
}

function getApiKey() {
  return localStorage.getItem("jarvis_llm_api_key") || "";
}

function getModel() {
  return localStorage.getItem("jarvis_llm_model") || "";
}

/**
 * Build the system prompt for a given mode.
 */
function buildSystemPrompt(mode) {
  const base = ORCHESTRATOR_PROMPT.replace("{{active_mode}}", mode.toUpperCase());
  const modePrompt = MODE_AGENTS[mode] || "";
  return `${base}\n\n${modePrompt}\n\n${RESEARCHER_CONTRACT}\n\n${CODER_AGENT_PROMPT}`;
}

/**
 * Build the messages array with conversation context.
 * Includes system prompt + last N messages for context window management.
 */
function buildMessages(history, mode, maxContext = 12) {
  const systemPrompt = buildSystemPrompt(mode);
  const recentHistory = history.slice(-maxContext);

  return [
    { role: "system", content: systemPrompt },
    ...recentHistory.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];
}

/**
 * Call the LLM API (non-streaming).
 */
export async function callLLM(history, mode = "stock", options = {}) {
  const providerKey = options.provider || getProvider();
  const provider = PROVIDERS[providerKey] || PROVIDERS.groq;
  const apiKey = options.apiKey || getApiKey();
  const model = options.model || getModel() || provider.model;

  if (!apiKey && providerKey !== "ollama") {
    throw new Error(`No API key for ${provider.name}. Add one in Settings → AI Model.`);
  }

  const messages = buildMessages(history, mode);
  const body = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: provider.maxTokens,
    stream: false,
  };

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    if (response.status === 401) throw new Error("Invalid API key. Check Settings → AI Model.");
    if (response.status === 429) throw new Error("Rate limited. Wait a minute or switch provider.");
    if (response.status === 503) throw new Error(`${provider.name} is temporarily unavailable.`);
    throw new Error(`API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response from LLM.";
}

/**
 * Stream a response from the LLM (real-time typing effect).
 */
export async function streamLLM(history, mode, { onChunk, onDone, onError, provider: prov, apiKey: key }) {
  const providerKey = prov || getProvider();
  const provider = PROVIDERS[providerKey] || PROVIDERS.groq;
  const apiKey = key || getApiKey();
  const model = getModel() || provider.model;

  if (!apiKey && providerKey !== "ollama") {
    onError?.(`No API key for ${provider.name}. Add one in Settings → AI Model.`);
    return;
  }

  const messages = buildMessages(history, mode);
  const body = { model, messages, temperature: 0.7, max_tokens: provider.maxTokens, stream: true };
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      onError?.(`API error (${response.status}): ${errText.slice(0, 200)}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk?.(delta, fullText);
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    onDone?.(fullText);
  } catch (err) {
    onError?.(err.message);
  }
}

/**
 * Check if LLM is configured and available.
 */
export function isLLMConfigured() {
  const provider = getProvider();
  const apiKey = getApiKey();
  return !!(apiKey || provider === "ollama");
}

/**
 * Get connection status for the UI.
 */
export function getLLMStatus() {
  const provider = getProvider();
  const apiKey = getApiKey();
  const providerInfo = PROVIDERS[provider] || PROVIDERS.groq;

  if (provider === "ollama") {
    return { connected: true, provider: providerInfo.name, model: providerInfo.model, free: true };
  }
  if (apiKey) {
    return { connected: true, provider: providerInfo.name, model: getModel() || providerInfo.model, free: providerInfo.free };
  }
  return { connected: false, provider: providerInfo.name, model: null, free: providerInfo.free };
}

export { PROVIDERS, getProvider, getApiKey, getModel, buildSystemPrompt };
