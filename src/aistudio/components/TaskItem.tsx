import React from 'react';
import { Task } from '../types';
import { rdfStore } from '../services/rdfStore';
import { Check, Circle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const handleToggle = () => {
    rdfStore.toggleTaskCompletion(task.id, task.completed);
  };

  return (
    <div 
      className={`group flex items-center gap-4 p-4 bg-white rounded-xl border transition-all duration-200 hover:shadow-md
        ${task.completed ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200'}
      `}
    >
      <button
        onClick={handleToggle}
        className={`
          relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200
          ${task.completed 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'border-slate-300 text-transparent hover:border-indigo-400'
          }
        `}
      >
        <Check className={`w-3.5 h-3.5 transition-transform duration-200 ${task.completed ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
      </button>

      <span 
        className={`flex-grow text-base transition-all duration-200 
          ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}
        `}
      >
        {task.title}
      </span>
      
      {/* Visual flair: Minimal RDF ID badge on hover for geeky debugging/visibility */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-300 font-mono select-none">
        {task.id.slice(-8)}
      </span>
    </div>
  );
};

export default TaskItem;
