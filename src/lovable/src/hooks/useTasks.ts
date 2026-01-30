import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@/types/task';
import {
  initCRDTStore,
  getAllTasks,
  addTask as addTaskToStore,
  toggleTask as toggleTaskInStore,
  subscribeToTasks,
} from '@/lib/crdt-store';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize CRDT store
    initCRDTStore();
    
    // Get initial tasks
    setTasks(getAllTasks());
    setIsLoading(false);

    // Subscribe to changes
    const unsubscribe = subscribeToTasks((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return unsubscribe;
  }, []);

  const addTask = useCallback((title: string) => {
    if (title.trim()) {
      addTaskToStore(title.trim());
    }
  }, []);

  const toggleTask = useCallback((id: string) => {
    toggleTaskInStore(id);
  }, []);

  // Sort tasks: incomplete first, then by creation date (newest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    tasks: sortedTasks,
    isLoading,
    addTask,
    toggleTask,
  };
}
