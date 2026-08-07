import { useCallback } from 'react';

// Simple local AI response generator with command parsing
export function useAI() {
  const generateResponse = useCallback(async (input, conversationHistory = []) => {
    const lower = input.toLowerCase().trim();

    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    // Command detection
    if (lower.includes('time') || lower.includes("what time")) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.`;
    }

    if (lower.includes('date') || lower.includes('today') || lower.includes("what day")) {
      const now = new Date();
      return `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
    }

    if (lower.includes('weather')) {
      return "I'd love to check the weather for you! For real-time weather data, you can connect me to a weather API in Settings.";
    }

    if (lower.includes('hello') || lower.includes('hi ') || lower === 'hi') {
      return "Hello! How can I help you today?";
    }

    if (lower.includes('how are you')) {
      return "I'm doing great, thank you for asking! I'm here and ready to help you with whatever you need.";
    }

    if (lower.includes('thank')) {
      return "You're welcome! Happy to help. Is there anything else you need?";
    }

    if (lower.includes('joke') || lower.includes('funny')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fake noodle? An impasta!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "What do you call a bear with no teeth? A gummy bear!",
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (lower.includes('remind') || lower.includes('task') || lower.includes('add task')) {
      return "I can help you create a task! Head over to the Tasks tab and I'll help you stay organized. What task would you like me to add?";
    }

    if (lower.includes('search') || lower.includes('find') || lower.includes('look up')) {
      const query = input.replace(/search|find|look up|for|google/gi, '').trim();
      if (query) {
        return `I'd search for "${query}" online. In the full version, I can connect to web search APIs to fetch real-time results. You can configure search in Settings.`;
      }
    }

    if (lower.includes('file') || lower.includes('folder') || lower.includes('document')) {
      return "You can browse and manage your files in the Files tab. I can help you open, read, and organize files on your computer.";
    }

    if (lower.includes('help') || lower.includes('what can you do')) {
      return `Here's what I can do:
• Answer questions and chat with you
• Tell you the current time and date
• Help manage tasks and reminders
• Browse and manage files
• Accept voice commands (click the mic button!)
• Search the web (with API key configured)
• Read responses aloud

Use the sidebar to switch between Chat, Tasks, Files, and Settings.`;
    }

    // General response with conversational tone
    const responses = [
      `That's interesting! Let me think about "${input}". While I can handle many tasks right now, I can be connected to more powerful AI APIs for deeper conversations. Check Settings to configure API keys.`,
      `I understand you're asking about "${input}". I'm here to help! For more complex queries, you can integrate me with AI services like OpenAI or Claude.`,
      `Great question about "${input}"! I can help with basic tasks right now, and I'm designed to be extensible with external AI services for more advanced capabilities.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  return { generateResponse };
}
