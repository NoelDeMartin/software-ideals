import type { Task } from '@/types/task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
}

export function TaskList({ tasks, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No tasks yet</p>
        <p className="text-xs mt-1">Add one above to get started</p>
      </div>
    );
  }

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-1">
      {incompleteTasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} />
      ))}
      
      {completedTasks.length > 0 && incompleteTasks.length > 0 && (
        <div className="border-t border-border/30 my-3" />
      )}
      
      {completedTasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} />
      ))}
    </div>
  );
}
