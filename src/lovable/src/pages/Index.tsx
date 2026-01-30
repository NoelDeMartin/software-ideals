import { useTasks } from '@/hooks/useTasks';
import { TaskInput } from '@/components/TaskInput';
import { TaskList } from '@/components/TaskList';
import { SyncSettings } from '@/components/SyncSettings';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Index = () => {
  const { tasks, isLoading, addTask, toggleTask } = useTasks();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Todo
          </h1>
          <SyncSettings />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-xl mx-auto px-4 py-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <TaskInput onAddTask={addTask} />
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">Loading tasks...</p>
              </div>
            ) : (
              <TaskList tasks={tasks} onToggle={toggleTask} />
            )}
          </CardContent>
        </Card>

        {/* Task count */}
        {!isLoading && tasks.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            {tasks.filter((t) => !t.completed).length} of {tasks.length} tasks remaining
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4">
        <p className="text-xs text-muted-foreground text-center">
          Local-first • Data stored in your browser
        </p>
      </footer>
    </div>
  );
};

export default Index;
