import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { v4 as uuidv4 } from 'uuid';
import type { Task } from '@/types/task';

// Singleton CRDT document
let ydoc: Y.Doc | null = null;
let indexeddbProvider: IndexeddbPersistence | null = null;
let websocketProvider: WebsocketProvider | null = null;

// Initialize the Yjs document with IndexedDB persistence
export function initCRDTStore(): Y.Doc {
  if (ydoc) return ydoc;

  ydoc = new Y.Doc();
  
  // Persist to IndexedDB for local-first storage
  indexeddbProvider = new IndexeddbPersistence('todo-crdt-store', ydoc);
  
  indexeddbProvider.on('synced', () => {
    console.log('CRDT store synced with IndexedDB');
  });

  return ydoc;
}

// Get the Yjs document (initialize if needed)
export function getYDoc(): Y.Doc {
  if (!ydoc) {
    return initCRDTStore();
  }
  return ydoc;
}

// Get the tasks Y.Map
export function getTasksMap(): Y.Map<Task> {
  const doc = getYDoc();
  return doc.getMap<Task>('tasks');
}

// Add a new task
export function addTask(title: string): Task {
  const tasksMap = getTasksMap();
  const now = new Date().toISOString();
  
  const task: Task = {
    id: uuidv4(),
    title,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  tasksMap.set(task.id, task);
  return task;
}

// Toggle task completion status
export function toggleTask(id: string): Task | null {
  const tasksMap = getTasksMap();
  const task = tasksMap.get(id);
  
  if (!task) return null;

  const updatedTask: Task = {
    ...task,
    completed: !task.completed,
    updatedAt: new Date().toISOString(),
  };

  tasksMap.set(id, updatedTask);
  return updatedTask;
}

// Get all tasks as an array
export function getAllTasks(): Task[] {
  const tasksMap = getTasksMap();
  return Array.from(tasksMap.values());
}

// Connect to a remote sync server
export function connectToSyncServer(serverUrl: string): WebsocketProvider | null {
  if (websocketProvider) {
    websocketProvider.destroy();
    websocketProvider = null;
  }

  try {
    const doc = getYDoc();
    
    // Parse URL to extract host and room
    const url = new URL(serverUrl);
    const wsUrl = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`;
    const room = url.pathname.slice(1) || 'todo-sync';

    websocketProvider = new WebsocketProvider(wsUrl, room, doc);

    websocketProvider.on('status', (event: { status: string }) => {
      console.log('WebSocket status:', event.status);
    });

    websocketProvider.on('sync', (isSynced: boolean) => {
      console.log('Remote sync status:', isSynced);
    });

    return websocketProvider;
  } catch (error) {
    console.error('Failed to connect to sync server:', error);
    return null;
  }
}

// Disconnect from sync server
export function disconnectFromSyncServer(): void {
  if (websocketProvider) {
    websocketProvider.destroy();
    websocketProvider = null;
  }
}

// Check if connected to sync server
export function isSyncConnected(): boolean {
  return websocketProvider?.wsconnected ?? false;
}

// Get sync server URL if connected
export function getSyncServerUrl(): string | null {
  if (!websocketProvider) return null;
  return websocketProvider.url;
}

// Subscribe to task changes
export function subscribeToTasks(callback: (tasks: Task[]) => void): () => void {
  const tasksMap = getTasksMap();
  
  const observer = () => {
    callback(getAllTasks());
  };

  tasksMap.observe(observer);
  
  // Return unsubscribe function
  return () => {
    tasksMap.unobserve(observer);
  };
}
