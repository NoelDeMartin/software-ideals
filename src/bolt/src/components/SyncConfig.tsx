import { useState, FormEvent } from 'react';
import { Cloud, CloudOff, Settings, X } from 'lucide-react';
import { SyncConfig as SyncConfigType } from '../lib/types';

interface SyncConfigProps {
  config: SyncConfigType | null;
  onSave: (config: SyncConfigType) => void;
  isConfigured: boolean;
}

export function SyncConfig({ config, onSave, isConfigured }: SyncConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(config?.supabaseUrl || '');
  const [key, setKey] = useState(config?.supabaseKey || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      supabaseUrl: url,
      supabaseKey: key,
      enabled: true,
    });
    setIsOpen(false);
  };

  const handleDisable = () => {
    onSave({
      supabaseUrl: '',
      supabaseKey: '',
      enabled: false,
    });
    setUrl('');
    setKey('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all ${
          isConfigured
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-700 hover:bg-gray-800 text-white'
        }`}
        aria-label="Sync settings"
      >
        {isConfigured ? <Cloud className="w-6 h-6" /> : <CloudOff className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-800">Sync Configuration</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Configure a self-hosted sync backend to backup and share your tasks across devices.
                Leave empty to use local-only mode.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                  Supabase URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  id="key"
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="your-anon-key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!url || !key}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Enable Sync
                </button>
                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleDisable}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Disable Sync
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
