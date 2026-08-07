import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react';

export default function TasksView({ tasks, onAdd, onToggle, onRemove }) {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAdd(newTask);
    setNewTask('');
  };

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar size={20} className="text-blue-400" />
          Tasks &amp; Reminders
        </h2>
        <p className="text-xs text-surface-500 mt-1">
          {pending.length} pending &middot; {completed.length} completed
        </p>
      </div>

      {/* Add task */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-surface-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-surface-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-surface-500"
          />
          <button
            type="submit"
            disabled={!newTask.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 transition-colors"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </form>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {tasks.length === 0 && (
          <div className="text-center text-surface-500 py-12">
            <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks yet. Add one above!</p>
          </div>
        )}

        {/* Pending tasks */}
        {pending.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800/50 group transition-colors"
          >
            <button onClick={() => onToggle(task.id)} className="shrink-0">
              <Circle size={20} className="text-surface-500 hover:text-blue-400 transition-colors" />
            </button>
            <span className="flex-1 text-sm text-surface-200">{task.text}</span>
            <button
              onClick={() => onRemove(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-all"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        ))}

        {/* Completed tasks */}
        {completed.length > 0 && (
          <>
            <div className="pt-4 pb-1">
              <span className="text-xs text-surface-500 font-medium">COMPLETED</span>
            </div>
            {completed.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800/30 group transition-colors"
              >
                <button onClick={() => onToggle(task.id)} className="shrink-0">
                  <CheckCircle size={20} className="text-green-500" />
                </button>
                <span className="flex-1 text-sm text-surface-500 line-through">{task.text}</span>
                <button
                  onClick={() => onRemove(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-all"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
