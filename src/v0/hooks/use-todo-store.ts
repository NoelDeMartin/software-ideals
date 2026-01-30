'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  initStore, 
  getAllTasks, 
  createTask, 
  toggleTaskCompletion,
  subscribe,
  connectToSyncServer,
  disconnectFromSyncServer,
  getSavedSyncUrl,
  autoReconnectSync,
  exportAsTurtle
} from '@/lib/crdt/store'
import type { Task } from '@/lib/rdf/vocabulary'

interface UseTodoStoreReturn {
  tasks: Task[]
  isLoading: boolean
  isOffline: boolean
  syncUrl: string | null
  addTask: (name: string) => void
  toggleTask: (id: string) => void
  connectSync: (url: string) => void
  disconnectSync: () => void
  exportGraph: () => string
}

export function useTodoStore(): UseTodoStoreReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [syncUrl, setSyncUrl] = useState<string | null>(null)

  // Initialize the store
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    async function init() {
      try {
        await initStore()
        setTasks(getAllTasks())
        
        // Subscribe to changes
        unsubscribe = subscribe(() => {
          setTasks(getAllTasks())
        })
        
        // Auto-reconnect to saved sync server
        autoReconnectSync()
        setSyncUrl(getSavedSyncUrl())
        
      } catch (error) {
        console.error('[v0] Failed to initialize store:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addTask = useCallback((name: string) => {
    if (!name.trim()) return
    createTask(name.trim())
  }, [])

  const toggleTask = useCallback((id: string) => {
    toggleTaskCompletion(id)
  }, [])

  const connectSync = useCallback((url: string) => {
    connectToSyncServer(url)
    setSyncUrl(url)
  }, [])

  const disconnectSync = useCallback(() => {
    disconnectFromSyncServer()
    setSyncUrl(null)
  }, [])

  const exportGraph = useCallback(() => {
    return exportAsTurtle()
  }, [])

  return {
    tasks,
    isLoading,
    isOffline,
    syncUrl,
    addTask,
    toggleTask,
    connectSync,
    disconnectSync,
    exportGraph
  }
}
