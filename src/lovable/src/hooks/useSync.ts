import { useState, useEffect, useCallback } from 'react';
import {
  connectToSyncServer,
  disconnectFromSyncServer,
  isSyncConnected,
} from '@/lib/crdt-store';

const SYNC_URL_KEY = 'todo-sync-url';

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useSync() {
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [status, setStatus] = useState<SyncStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Load saved sync URL on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(SYNC_URL_KEY);
    if (savedUrl) {
      setSyncUrl(savedUrl);
      // Auto-connect if URL was previously saved
      handleConnect(savedUrl);
    }
  }, []);

  const handleConnect = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a sync server URL');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const provider = connectToSyncServer(url);
      
      if (provider) {
        // Listen for connection status
        provider.on('status', (event: { status: string }) => {
          if (event.status === 'connected') {
            setStatus('connected');
            localStorage.setItem(SYNC_URL_KEY, url);
          } else if (event.status === 'disconnected') {
            setStatus('disconnected');
          }
        });

        // Check if already connected
        if (isSyncConnected()) {
          setStatus('connected');
          localStorage.setItem(SYNC_URL_KEY, url);
        }
      } else {
        setStatus('error');
        setError('Failed to connect to sync server');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, []);

  const connect = useCallback(() => {
    handleConnect(syncUrl);
  }, [syncUrl, handleConnect]);

  const disconnect = useCallback(() => {
    disconnectFromSyncServer();
    localStorage.removeItem(SYNC_URL_KEY);
    setStatus('disconnected');
    setError(null);
  }, []);

  return {
    syncUrl,
    setSyncUrl,
    status,
    error,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}
