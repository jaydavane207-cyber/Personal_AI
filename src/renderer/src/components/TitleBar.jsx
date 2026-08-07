import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  return (
    <div className="drag-region h-10 bg-surface-900 border-b border-surface-800 flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-2 no-drag">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="text-sm font-medium text-surface-300">Personal Assistant</span>
      </div>
      <div className="flex items-center no-drag">
        <button onClick={handleMinimize} className="p-2 hover:bg-surface-800 rounded transition-colors">
          <Minus size={14} className="text-surface-400" />
        </button>
        <button onClick={handleMaximize} className="p-2 hover:bg-surface-800 rounded transition-colors">
          <Square size={12} className="text-surface-400" />
        </button>
        <button onClick={handleClose} className="p-2 hover:bg-red-600 rounded transition-colors group">
          <X size={14} className="text-surface-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
