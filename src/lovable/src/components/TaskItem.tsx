import { Checkbox } from '@/components/ui/checkbox';
import type { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-md transition-colors',
        'hover:bg-accent/50',
        task.completed && 'opacity-60'
      )}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={cn(
          'flex-1 cursor-pointer text-foreground transition-all',
          task.completed && 'line-through text-muted-foreground'
        )}
      >
        {task.title}
      </label>
    </div>
  );
}
