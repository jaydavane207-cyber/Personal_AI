import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'personal-assistant-tasks';

export function useTasks() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((text) => {
    if (!text.trim()) return;
    setTasks(prev => [
      { id: Date.now(), text: text.trim(), completed: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const removeTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  return { tasks, addTask, toggleTask, removeTask };
}
