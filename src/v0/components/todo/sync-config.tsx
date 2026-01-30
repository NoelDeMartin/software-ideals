'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Cloud, CloudOff, Settings } from 'lucide-react'

interface SyncConfigProps {
  syncUrl: string | null
  onConnect: (url: string) => void
  onDisconnect: () => void
  isOffline: boolean
}

export function SyncConfig({ syncUrl, onConnect, onDisconnect, isOffline }: SyncConfigProps) {
  const [inputUrl, setInputUrl] = useState(syncUrl || '')
  const [open, setOpen] = useState(false)

  const handleConnect = useCallback((e: FormEvent) => {
    e.preventDefault()
    if (inputUrl.trim()) {
      onConnect(inputUrl.trim())
      setOpen(false)
    }
  }, [inputUrl, onConnect])

  const handleDisconnect = useCallback(() => {
    onDisconnect()
    setInputUrl('')
    setOpen(false)
  }, [onDisconnect])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          aria-label="Sync settings"
        >
          {syncUrl ? (
            <>
              <Cloud className="h-4 w-4" />
              {isOffline && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </>
          ) : (
            <Settings className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Configuration</DialogTitle>
          <DialogDescription>
            Connect to a self-hosted sync server to back up your tasks and sync across devices.
            Your data is always stored locally first.
          </DialogDescription>
        </DialogHeader>
        
        {syncUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
              {isOffline ? (
                <CloudOff className="h-4 w-4 text-destructive" />
              ) : (
                <Cloud className="h-4 w-4 text-green-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {isOffline ? 'Offline' : 'Connected'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {syncUrl}
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button 
                variant="destructive" 
                onClick={handleDisconnect}
                className="w-full"
              >
                Disconnect
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sync-url" className="text-sm font-medium text-foreground">
                Sync Server URL
              </label>
              <Input
                id="sync-url"
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="wss://your-sync-server.com/ws"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Enter the WebSocket URL of your Yjs-compatible sync server (e.g., y-websocket).
              </p>
            </div>
            
            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button 
                type="submit" 
                disabled={!inputUrl.trim()}
                className="w-full"
              >
                Connect
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
