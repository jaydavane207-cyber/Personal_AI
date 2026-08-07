import React from 'react';
import { MessageCircle, CheckSquare, FolderOpen, Settings, Bot } from 'lucide-react';

const navItems = [
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ activeView, onViewChange }) {
  return (
    <aside className="w-16 bg-surface-900 border-r border-surface-800 flex flex-col items-center py-4 gap-2 shrink-0">
      <div className="mb-6 p-2 bg-blue-600 rounded-xl">
        <Bot size={20} className="text-white" />
      </div>
      {navItems.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={`p-3 rounded-xl transition-all duration-200 relative group ${
            activeView === id
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'
          }`}
          title={label}
        >
          <Icon size={20} />
          {/* Tooltip */}
          <span className="absolute left-14 bg-surface-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {label}
          </span>
        </button>
      ))}
    </aside>
  );
}
