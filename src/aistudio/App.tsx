import React, { useEffect, useState } from 'react';
import { rdfStore } from './services/rdfStore';
import { Task, ConnectionStatus } from './types';
import TaskItem from './components/TaskItem';
import SyncModal from './components/SyncModal';
import { Plus, Network, Database, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(ConnectionStatus.DISCONNECTED);

  useEffect(() => {
    // Initial load
    setTasks(rdfStore.getTasks());
    setSyncStatus(rdfStore.connectionStatus);

    // Subscribe to store updates
    const unsubscribe = rdfStore.subscribe(() => {
      setTasks(rdfStore.getTasks());
      setSyncStatus(rdfStore.connectionStatus);
    });

    return unsubscribe;
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    rdfStore.createTask(newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const activeTasks = tasks.filter(t => !t.completed).reverse(); // Show newest active first
  const completedTasks = tasks.filter(t => t.completed).reverse();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">GraphDo</h1>
              <p className="text-xs text-slate-500 font-medium">Local-first Semantic Data</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${syncStatus === ConnectionStatus.CONNECTED 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }
            `}
          >
            {syncStatus === ConnectionStatus.CONNECTED ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Network className="w-3.5 h-3.5" />
            )}
            {syncStatus === ConnectionStatus.CONNECTED ? 'Synced' : 'Offline'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Input Area */}
        <section className="relative group z-30">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <form onSubmit={handleAddTask} className="relative flex bg-white rounded-xl shadow-sm">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new node to the graph..."
              className="flex-grow bg-transparent px-5 py-4 text-lg outline-none placeholder:text-slate-400 text-slate-800"
            />
            <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="pr-4 pl-2 text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-8 h-8" />
            </button>
          </form>
        </section>

        {/* Tasks List */}
        <div className="space-y-6">
          {tasks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Knowledge Graph Empty</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">
                Your local semantic graph is waiting for data. Add a task to create your first triple.
              </p>
            </div>
          ) : (
            <>
              {/* Active Tasks */}
              <section className="space-y-3">
                {activeTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </section>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <section className="space-y-3 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Completed ({completedTasks.length})
                  </h3>
                  <div className="opacity-60 hover:opacity-100 transition-opacity duration-300 space-y-3">
                    {completedTasks.map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
      />
    </div>
  );
};

export default App;
