'use client'

import { TaskItem } from './task-item'
import type { Task } from '@/lib/rdf/vocabulary'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
}

export function TaskList({ tasks, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-muted-foreground text-sm">
          No tasks yet. Add your first task above.
        </p>
      </div>
    )
  }

  const incompleteTasks = tasks.filter(t => !t.isCompleted)
  const completedTasks = tasks.filter(t => t.isCompleted)

  return (
    <div className="space-y-2" role="list" aria-label="Task list">
      {incompleteTasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onToggle={onToggle} 
        />
      ))}
      {completedTasks.length > 0 && incompleteTasks.length > 0 && (
        <div className="py-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Completed ({completedTasks.length})
          </p>
        </div>
      )}
      {completedTasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onToggle={onToggle} 
        />
      ))}
    </div>
  )
}
