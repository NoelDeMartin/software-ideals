import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { v4 as uuidv4 } from 'uuid'
import { 
  Triple, 
  Task, 
  taskToTriples, 
  triplesToTask, 
  createTaskUri,
  RDF,
  TODO,
  SCHEMA,
  graphToTurtle
} from '@/lib/rdf/vocabulary'

// The CRDT document that holds our RDF knowledge graph
let ydoc: Y.Doc | null = null
let persistence: IndexeddbPersistence | null = null
let syncProvider: WebSocketSyncProvider | null = null

// Yjs shared types for the RDF graph
// We store triples as a Y.Map where keys are "subject|predicate" and values are the object
type TripleStore = Y.Map<string>

function getTripleKey(subject: string, predicate: string): string {
  return `${subject}|${predicate}`
}

function parseTripleKey(key: string): { subject: string; predicate: string } {
  const [subject, predicate] = key.split('|')
  return { subject, predicate }
}

// Initialize the CRDT store with IndexedDB persistence
export async function initStore(): Promise<Y.Doc> {
  if (ydoc) return ydoc
  
  ydoc = new Y.Doc()
  
  // Persist to IndexedDB for offline-first support
  persistence = new IndexeddbPersistence('todo-rdf-graph', ydoc)
  
  await new Promise<void>((resolve) => {
    persistence!.once('synced', () => {
      console.log('[v0] IndexedDB persistence synced')
      resolve()
    })
  })
  
  return ydoc
}

export function getDoc(): Y.Doc {
  if (!ydoc) {
    throw new Error('Store not initialized. Call initStore() first.')
  }
  return ydoc
}

function getTripleStore(): TripleStore {
  return getDoc().getMap('triples')
}

// Add a triple to the CRDT graph
export function addTriple(triple: Triple): void {
  const store = getTripleStore()
  const key = getTripleKey(triple.subject, triple.predicate)
  
  // Serialize the value with type info
  const value = JSON.stringify({
    object: triple.object,
    datatype: triple.datatype
  })
  
  store.set(key, value)
}

// Remove all triples for a subject
export function removeSubject(subject: string): void {
  const store = getTripleStore()
  const keysToDelete: string[] = []
  
  store.forEach((_, key) => {
    const parsed = parseTripleKey(key)
    if (parsed.subject === subject) {
      keysToDelete.push(key)
    }
  })
  
  for (const key of keysToDelete) {
    store.delete(key)
  }
}

// Get all triples for a subject
export function getTriplesForSubject(subject: string): Triple[] {
  const store = getTripleStore()
  const triples: Triple[] = []
  
  store.forEach((value, key) => {
    const parsed = parseTripleKey(key)
    if (parsed.subject === subject) {
      const { object, datatype } = JSON.parse(value)
      triples.push({
        subject: parsed.subject,
        predicate: parsed.predicate,
        object,
        datatype
      })
    }
  })
  
  return triples
}

// Get all triples in the graph
export function getAllTriples(): Triple[] {
  const store = getTripleStore()
  const triples: Triple[] = []
  
  store.forEach((value, key) => {
    const { subject, predicate } = parseTripleKey(key)
    const { object, datatype } = JSON.parse(value)
    triples.push({ subject, predicate, object, datatype })
  })
  
  return triples
}

// Query tasks (subjects of type Task)
export function getAllTasks(): Task[] {
  const store = getTripleStore()
  const taskSubjects = new Set<string>()
  
  // Find all subjects that have rdf:type todo:Task
  store.forEach((value, key) => {
    const { subject, predicate } = parseTripleKey(key)
    if (predicate === RDF.type) {
      const { object } = JSON.parse(value)
      if (object === TODO.Task) {
        taskSubjects.add(subject)
      }
    }
  })
  
  // Convert each task subject to a Task object
  const tasks: Task[] = []
  for (const subject of taskSubjects) {
    const triples = getTriplesForSubject(subject)
    const task = triplesToTask(triples)
    if (task) {
      tasks.push(task)
    }
  }
  
  // Sort by dateCreated
  return tasks.sort((a, b) => 
    new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
  )
}

// Create a new task
export function createTask(name: string): Task {
  const now = new Date().toISOString()
  const task: Task = {
    id: uuidv4(),
    name,
    isCompleted: false,
    dateCreated: now,
    dateModified: now,
  }
  
  // Convert to triples and add to the graph
  const triples = taskToTriples(task)
  for (const triple of triples) {
    addTriple(triple)
  }
  
  return task
}

// Toggle task completion
export function toggleTaskCompletion(taskId: string): Task | null {
  const subject = createTaskUri(taskId)
  const triples = getTriplesForSubject(subject)
  const task = triplesToTask(triples)
  
  if (!task) return null
  
  // Update the completion status
  const newCompleted = !task.isCompleted
  const now = new Date().toISOString()
  
  // Update triples
  addTriple({
    subject,
    predicate: TODO.isCompleted,
    object: newCompleted,
    datatype: 'http://www.w3.org/2001/XMLSchema#boolean'
  })
  
  addTriple({
    subject,
    predicate: SCHEMA.dateModified,
    object: now,
    datatype: 'http://www.w3.org/2001/XMLSchema#dateTime'
  })
  
  return { ...task, isCompleted: newCompleted, dateModified: now }
}

// Export the graph as Turtle
export function exportAsTurtle(): string {
  return graphToTurtle(getAllTriples())
}

// Subscribe to changes
export function subscribe(callback: () => void): () => void {
  const store = getTripleStore()
  store.observe(callback)
  return () => store.unobserve(callback)
}

// WebSocket sync provider for optional server synchronization
class WebSocketSyncProvider {
  private ws: WebSocket | null = null
  private url: string
  private doc: Y.Doc
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isDestroyed = false
  
  constructor(url: string, doc: Y.Doc) {
    this.url = url
    this.doc = doc
    this.connect()
  }
  
  private connect() {
    if (this.isDestroyed) return
    
    try {
      // Convert http(s) to ws(s)
      const wsUrl = this.url.replace(/^http/, 'ws')
      this.ws = new WebSocket(wsUrl)
      
      this.ws.binaryType = 'arraybuffer'
      
      this.ws.onopen = () => {
        console.log('[v0] WebSocket connected to sync server')
        // Send the full state on connect
        const state = Y.encodeStateAsUpdate(this.doc)
        this.ws?.send(state)
      }
      
      this.ws.onmessage = (event) => {
        const update = new Uint8Array(event.data)
        Y.applyUpdate(this.doc, update)
      }
      
      this.ws.onclose = () => {
        console.log('[v0] WebSocket disconnected')
        this.scheduleReconnect()
      }
      
      this.ws.onerror = (error) => {
        console.error('[v0] WebSocket error:', error)
      }
      
      // Send local updates to server
      this.doc.on('update', this.handleUpdate)
      
    } catch (error) {
      console.error('[v0] Failed to connect:', error)
      this.scheduleReconnect()
    }
  }
  
  private handleUpdate = (update: Uint8Array, origin: unknown) => {
    // Don't echo back updates from the server
    if (origin === 'remote') return
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(update)
    }
  }
  
  private scheduleReconnect() {
    if (this.isDestroyed) return
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, 3000)
  }
  
  destroy() {
    this.isDestroyed = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    this.doc.off('update', this.handleUpdate)
    this.ws?.close()
  }
  
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Connect to a sync server
export function connectToSyncServer(url: string): void {
  if (syncProvider) {
    syncProvider.destroy()
  }
  
  const doc = getDoc()
  syncProvider = new WebSocketSyncProvider(url, doc)
  
  // Persist the sync URL
  if (typeof window !== 'undefined') {
    localStorage.setItem('todo-sync-url', url)
  }
}

// Disconnect from sync server
export function disconnectFromSyncServer(): void {
  if (syncProvider) {
    syncProvider.destroy()
    syncProvider = null
  }
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('todo-sync-url')
  }
}

// Check if connected to sync server
export function isSyncConnected(): boolean {
  return syncProvider?.connected ?? false
}

// Get stored sync URL
export function getSavedSyncUrl(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('todo-sync-url')
}

// Auto-reconnect to saved sync server on init
export function autoReconnectSync(): void {
  const url = getSavedSyncUrl()
  if (url) {
    connectToSyncServer(url)
  }
}
