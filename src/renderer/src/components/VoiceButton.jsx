import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function VoiceButton({ isListening, isSpeaking, onStartListening, onStopListening, error }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Error toast */}
      {error && (
        <div className="bg-red-600/90 text-white text-xs px-3 py-2 rounded-lg animate-fade-in max-w-[200px]">
          {error}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="bg-surface-800/90 backdrop-blur text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2 animate-slide-up">
          <div className="flex items-center gap-[2px]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="voice-bar w-[3px] bg-blue-400 rounded-full" />
            ))}
          </div>
          <span>Listening...</span>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="bg-green-600/90 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2 animate-slide-up">
          <Volume2 size={14} />
          <span>Speaking...</span>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 glow-ring scale-110'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {isListening ? (
          <MicOff size={22} className="text-white" />
        ) : (
          <Mic size={22} className="text-white" />
        )}

        {/* Pulse ring when listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-40" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !isListening && (
        <div className="absolute bottom-16 right-0 bg-surface-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap animate-fade-in">
          Click to speak &mdash; Ctrl+Shift+A to toggle
        </div>
      )}
    </div>
  );
}
