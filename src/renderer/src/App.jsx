import React, { useState, useCallback, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import TasksView from './components/TasksView';
import FilesView from './components/FilesView';
import SettingsView from './components/SettingsView';
import VoiceButton from './components/VoiceButton';
import { useVoice } from './hooks/useVoice';
import { useAI } from './hooks/useAI';
import { useTasks } from './hooks/useTasks';

export default function App() {
  const [activeView, setActiveView] = useState('chat');
  const [messages, setMessages] = useState([
    { id: 0, role: 'assistant', content: "Hello! I'm your personal assistant. I can help you with tasks, answer questions, manage files, and more. Try clicking the microphone to speak with me, or type below!", timestamp: Date.now() },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef(null);

  const { isListening, transcript, startListening, stopListening, speak, isSpeaking, error: voiceError } = useVoice();
  const { generateResponse } = useAI();
  const { tasks, addTask, toggleTask, removeTask } = useTasks();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isProcessing) return;

    const userMsg = { id: Date.now(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await generateResponse(text, messages);
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);

      // Auto-speak the response
      if (response.length < 500) {
        speak(response);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, messages, generateResponse, speak]);

  const handleVoiceCommand = useCallback(async (text) => {
    if (!text.trim()) return;
    await handleSendMessage(text);
  }, [handleSendMessage]);

  // When voice transcript is final, send it
  useEffect(() => {
    if (transcript && !isListening) {
      handleVoiceCommand(transcript);
    }
  }, [transcript, isListening]);

  const renderView = () => {
    switch (activeView) {
      case 'chat': return <ChatView messages={messages} isProcessing={isProcessing} onSend={handleSendMessage} chatEndRef={chatEndRef} />;
      case 'tasks': return <TasksView tasks={tasks} onAdd={addTask} onToggle={toggleTask} onRemove={removeTask} />;
      case 'files': return <FilesView />;
      case 'settings': return <SettingsView />;
      default: return <ChatView messages={messages} isProcessing={isProcessing} onSend={handleSendMessage} chatEndRef={chatEndRef} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-surface-950 text-white">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderView()}
        </main>
      </div>
      {/* Floating Voice Button */}
      <VoiceButton
        isListening={isListening}
        isSpeaking={isSpeaking}
        onStartListening={startListening}
        onStopListening={stopListening}
        error={voiceError}
      />
    </div>
  );
}
