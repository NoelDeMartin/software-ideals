import { useEffect, useState } from 'react';
import { todoStore } from './lib/store';
import { SyncEngine } from './lib/sync';
import { Task, SyncConfig as SyncConfigType } from './lib/types';
import { TodoItem } from './components/TodoItem';
import { AddTodo } from './components/AddTodo';
import { SyncConfig } from './components/SyncConfig';
import { Database } from 'lucide-react';

const syncEngine = new SyncEngine(todoStore);

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncConfig, setSyncConfig] = useState<SyncConfigType | null>(null);

  useEffect(() => {
    const initApp = async () => {
      await todoStore.init();
      const config = syncEngine.loadConfig();
      setSyncConfig(config);
      setTasks(todoStore.getTasks());
      setIsLoading(false);
    };

    initApp();

    const unsubscribe = todoStore.subscribe(() => {
      setTasks(todoStore.getTasks());
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = async (title: string) => {
    await todoStore.addTask(title);
    if (syncEngine.isConfigured()) {
      syncEngine.sync();
    }
  };

  const handleToggleTask = async (id: string) => {
    await todoStore.toggleTask(id);
    if (syncEngine.isConfigured()) {
      syncEngine.sync();
    }
  };

  const handleSyncConfig = (config: SyncConfigType) => {
    syncEngine.configure(config);
    setSyncConfig(config);
    if (config.enabled) {
      syncEngine.sync();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Local-First Todo</h1>
          </div>
          <p className="text-gray-600 ml-11">
            Built with CRDTs and RDF. Works offline, syncs when you want.
          </p>
        </div>

        <AddTodo onAdd={handleAddTask} />

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No tasks yet. Add one to get started!
            </div>
          ) : (
            tasks.map((task) => (
              <TodoItem key={task.id} task={task} onToggle={handleToggleTask} />
            ))
          )}
        </div>
      </div>

      <SyncConfig
        config={syncConfig}
        onSave={handleSyncConfig}
        isConfigured={syncEngine.isConfigured()}
      />
    </div>
  );
}

export default App;
