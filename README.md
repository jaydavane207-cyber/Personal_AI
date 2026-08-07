# 🧠 Personal Assistant

A full-featured, AI-powered personal assistant desktop app built with **Electron + React**. Features voice interaction, intelligent chat, task management, and file browsing — all in a sleek dark-themed interface.

## ✨ Features

- **🎤 Voice Assistant** — Speak to the assistant with built-in speech recognition. It listens, understands, and responds aloud with speech synthesis.
- **💬 Smart Chat** — Natural language chat with command parsing (time, date, jokes, reminders, file management, and more).
- **✅ Task Manager** — Create, complete, and delete tasks with persistent local storage.
- **📁 File Browser** — Navigate your file system directly within the app.
- **⚙️ Settings** — Configure API keys (OpenAI, search), voice language/rate, theme, and global shortcuts.
- **🖥️ Frameless Window** — Custom title bar with minimize/maximize/close, system tray support.
- **⌨️ Global Shortcut** — `Ctrl+Shift+A` to toggle the assistant from anywhere.
- **🔌 Extensible** — Designed to integrate with OpenAI, Claude, web search APIs, and more.

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd personal-assistant

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build for Production

```bash
npm run build
```

The packaged app will be in the `dist/` folder.

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Electron** | Desktop app shell |
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **Lucide React** | Icons |
| **Web Speech API** | Voice recognition & synthesis |

## 📁 Project Structure

```
personal-assistant/
├── src/
│   ├── main/
│   │   ├── main.js          # Electron main process
│   │   └── preload.js       # Context bridge for IPC
│   └── renderer/
│       ├── index.html        # Entry HTML
│       └── src/
│           ├── main.jsx      # React entry point
│           ├── App.jsx       # Root component
│           ├── index.css     # Global styles
│           ├── components/
│           │   ├── TitleBar.jsx
│           │   ├── Sidebar.jsx
│           │   ├── ChatView.jsx
│           │   ├── VoiceButton.jsx
│           │   ├── TasksView.jsx
│           │   ├── FilesView.jsx
│           │   └── SettingsView.jsx
│           └── hooks/
│               ├── useVoice.js
│               ├── useAI.js
│               └── useTasks.js
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🔧 Configuration

In **Settings**, you can configure:

- **OpenAI API Key** — For advanced AI responses
- **Web Search API Key** — For real-time web search
- **Voice Language** — English (US/UK/India), Hindi, Spanish, French
- **Speech Rate** — 0.5x to 2.0x
- **Auto-speak** — Toggle automatic response reading
- **Theme** — Dark, Darker, Midnight Blue

## 🎯 Voice Commands

Click the microphone button or say:
- "What time is it?"
- "What's today's date?"
- "Tell me a joke"
- "Add a task..."
- "Open files..."
- "Help"

## 📄 License

ISC
