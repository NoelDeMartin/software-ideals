'use client'

import { useTodoStore } from '@/hooks/use-todo-store'
import { TaskInput } from './task-input'
import { TaskList } from './task-list'
import { SyncConfig } from './sync-config'
import { WifiOff, Database } from 'lucide-react'

export function TodoContainer() {
  const { 
    tasks, 
    isLoading, 
    isOffline,
    syncUrl,
    addTask, 
    toggleTask,
    connectSync,
    disconnectSync
  } = useTodoStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Semantic Todo</h1>
            <p className="text-xs text-muted-foreground">Local-first with RDF</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isOffline && (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </div>
          )}
          <SyncConfig
            syncUrl={syncUrl}
            onConnect={connectSync}
            onDisconnect={disconnectSync}
            isOffline={isOffline}
          />
        </div>
      </header>

      {/* Task Input */}
      <div className="mb-6">
        <TaskInput onAddTask={addTask} />
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        <TaskList tasks={tasks} onToggle={toggleTask} />
      </div>

      {/* Footer */}
      <footer className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} stored locally as RDF triples
        </p>
      </footer>
    </div>
  )
}
