import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { rdfStore } from '../services/rdfStore';
import { ConnectionStatus } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(rdfStore.syncUrl);
  const [status, setStatus] = useState(rdfStore.connectionStatus);

  useEffect(() => {
    const unsub = rdfStore.subscribe(() => {
      setStatus(rdfStore.connectionStatus);
      // Only update local input if not currently typing? 
      // Actually simpler to just sync simple state for status.
      // We don't overwrite URL from store while modal is open to avoid input jumping.
    });
    return unsub;
  }, []);

  const handleConnect = () => {
    rdfStore.connect(url);
  };

  const handleDisconnect = () => {
    setUrl('');
    rdfStore.connect('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            Sync Configuration
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Enter the URL of your Yjs WebSocket server to enable real-time synchronization and backup.
            </p>
            <div className="relative">
              <input
                type="text"
                placeholder="ws://localhost:1234"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {status === ConnectionStatus.CONNECTED && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {status === ConnectionStatus.ERROR && (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                )}
                {status === ConnectionStatus.CONNECTING && (
                  <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
             <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
               Status: 
               <span className={`
                 ${status === ConnectionStatus.CONNECTED ? 'text-emerald-600' : ''}
                 ${status === ConnectionStatus.DISCONNECTED ? 'text-slate-400' : ''}
                 ${status === ConnectionStatus.ERROR ? 'text-rose-600' : ''}
                 ${status === ConnectionStatus.CONNECTING ? 'text-indigo-600' : ''}
               `}>
                 {status}
               </span>
             </div>
             
             <div className="flex gap-3">
               {status === ConnectionStatus.CONNECTED ? (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
               ) : (
                  <button
                    onClick={handleConnect}
                    disabled={status === ConnectionStatus.CONNECTING}
                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
                  >
                    {status === ConnectionStatus.CONNECTING ? 'Connecting...' : 'Connect'}
                  </button>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
