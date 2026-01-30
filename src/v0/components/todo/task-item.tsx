'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { Task } from '@/lib/rdf/vocabulary'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div 
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all",
        "hover:border-muted-foreground/30",
        task.isCompleted && "opacity-60"
      )}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.isCompleted}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5"
        aria-label={`Mark "${task.name}" as ${task.isCompleted ? 'incomplete' : 'complete'}`}
      />
      <label
        htmlFor={`task-${task.id}`}
        className={cn(
          "flex-1 cursor-pointer text-sm font-medium leading-relaxed text-foreground",
          task.isCompleted && "line-through text-muted-foreground"
        )}
      >
        {task.name}
      </label>
    </div>
  )
}
