import { useState, useCallback, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TaskInputProps {
  onAddTask: (title: string) => void;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (title.trim()) {
        onAddTask(title.trim());
        setTitle('');
      }
    },
    [title, onAddTask]
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="flex-1 bg-card border-border/50 placeholder:text-muted-foreground/60"
        autoFocus
      />
      <Button
        type="submit"
        size="icon"
        disabled={!title.trim()}
        className="shrink-0"
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Add task</span>
      </Button>
    </form>
  );
}
