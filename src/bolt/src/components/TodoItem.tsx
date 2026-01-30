import { Task } from '../lib/types';
import { CheckCircle2, Circle } from 'lucide-react';

interface TodoItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export function TodoItem({ task, onToggle }: TodoItemProps) {
  return (
    <button
      onClick={() => onToggle(task.id)}
      className="w-full flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 text-left group"
    >
      {task.completed ? (
        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
      ) : (
        <Circle className="w-6 h-6 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
      )}
      <span
        className={`flex-1 text-lg transition-all ${
          task.completed
            ? 'text-gray-400 line-through'
            : 'text-gray-800'
        }`}
      >
        {task.title}
      </span>
    </button>
  );
}
