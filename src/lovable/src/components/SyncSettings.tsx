import { useState } from 'react';
import { Settings, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSync, type SyncStatus } from '@/hooks/useSync';
import { cn } from '@/lib/utils';

const statusConfig: Record<SyncStatus, { icon: typeof Wifi; label: string; color: string }> = {
  disconnected: { icon: WifiOff, label: 'Not synced', color: 'text-muted-foreground' },
  connecting: { icon: Loader2, label: 'Connecting...', color: 'text-warning' },
  connected: { icon: Wifi, label: 'Synced', color: 'text-success' },
  error: { icon: WifiOff, label: 'Error', color: 'text-destructive' },
};

export function SyncSettings() {
  const [open, setOpen] = useState(false);
  const { syncUrl, setSyncUrl, status, error, connect, disconnect, isConnected } = useSync();

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-4 w-4" />
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full',
              isConnected ? 'bg-success' : 'bg-muted-foreground/50'
            )}
          />
          <span className="sr-only">Sync settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Settings</DialogTitle>
          <DialogDescription>
            Connect to a self-hosted sync server to back up your tasks and access them across devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm">
            <StatusIcon
              className={cn(
                'h-4 w-4',
                config.color,
                status === 'connecting' && 'animate-spin'
              )}
            />
            <span className={config.color}>{config.label}</span>
          </div>

          {/* URL input */}
          <div className="space-y-2">
            <label htmlFor="sync-url" className="text-sm font-medium">
              Sync Server URL
            </label>
            <Input
              id="sync-url"
              type="url"
              placeholder="wss://your-sync-server.com/room"
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
              disabled={status === 'connecting'}
            />
            <p className="text-xs text-muted-foreground">
              Enter the WebSocket URL of your y-websocket compatible server
            </p>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {isConnected ? (
              <Button variant="outline" onClick={disconnect} className="flex-1">
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={connect}
                disabled={status === 'connecting' || !syncUrl.trim()}
                className="flex-1"
              >
                {status === 'connecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </div>

          {/* Info about local-first */}
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>Local-first:</strong> Your tasks are always stored locally first.
              Connecting to a sync server is optional and only enables backup and multi-device access.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
