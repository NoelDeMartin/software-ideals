import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { Triple, Task, ConnectionStatus } from '../types';
import { ONTOLOGY, RDF_TYPE, DEFAULT_ROOM_NAME } from '../constants';

// Singleton instance to manage the Yjs Doc
class RdfStore {
  doc: Y.Doc;
  triples: Y.Array<Triple>;
  persistence: IndexeddbPersistence;
  provider: WebsocketProvider | null = null;
  listeners: Set<() => void> = new Set();
  
  // State
  connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  syncUrl: string = '';

  constructor() {
    this.doc = new Y.Doc();
    // main storage structure: a linear list of triples
    this.triples = this.doc.getArray<Triple>('knowledge-graph');

    // Local-first persistence
    this.persistence = new IndexeddbPersistence('semantic-todo-local', this.doc);
    
    this.persistence.on('synced', () => {
      this.notify();
    });

    this.triples.observe(() => {
      this.notify();
    });
  }

  // --- React Integration Helpers ---

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb());
  }

  // --- Sync Logic ---

  connect(url: string) {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    if (!url) {
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.syncUrl = '';
      this.notify();
      return;
    }

    this.syncUrl = url;
    this.connectionStatus = ConnectionStatus.CONNECTING;
    this.notify();

    try {
      // Create a new provider
      this.provider = new WebsocketProvider(url, DEFAULT_ROOM_NAME, this.doc);

      this.provider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
            this.connectionStatus = ConnectionStatus.CONNECTED;
        } else {
            this.connectionStatus = ConnectionStatus.DISCONNECTED;
        }
        this.notify();
      });

      this.provider.on('sync', (isSynced: boolean) => {
         // optional: handle sync completion
      });

    } catch (e) {
      console.error("Failed to connect", e);
      this.connectionStatus = ConnectionStatus.ERROR;
      this.notify();
    }
  }

  // --- Graph Operations ---

  getTriples(): Triple[] {
    return this.triples.toArray();
  }

  // Derived query: Get all tasks
  getTasks(): Task[] {
    const allTriples = this.getTriples();
    
    // 1. Identify all Subjects that are of type Action
    const actionSubjects = new Set<string>();
    allTriples.forEach(t => {
      if (t.predicate === RDF_TYPE && t.object === ONTOLOGY.Action) {
        actionSubjects.add(t.subject);
      }
    });

    // 2. Build task objects from triples associated with those subjects
    const tasks: Record<string, Partial<Task>> = {};
    
    // Initialize derived objects
    actionSubjects.forEach(s => {
      tasks[s] = { id: s, completed: false, title: 'Untitled' };
    });

    // Populate properties
    allTriples.forEach(t => {
      if (tasks[t.subject]) {
        if (t.predicate === ONTOLOGY.name) {
          tasks[t.subject].title = t.object;
        } else if (t.predicate === ONTOLOGY.actionStatus) {
          tasks[t.subject].completed = t.object === ONTOLOGY.CompletedActionStatus;
        }
      }
    });

    // Convert to array and sort by something (e.g., creation time? 
    // Since we don't track creation time explicitly in this simple model, 
    // we return them in ID order or unsorted. 
    // Y.Array order is insertion order compliant, but graph queries lose that naturally.
    // We'll reverse them to show newest "created" if we assume the type triple was added last? 
    // Actually, simple array reverse is fine for UI).
    return Object.values(tasks) as Task[];
  }

  addTriple(s: string, p: string, o: string) {
    this.doc.transact(() => {
      this.triples.push([{ subject: s, predicate: p, object: o }]);
    });
  }

  removeTriples(predicate: (t: Triple) => boolean) {
    this.doc.transact(() => {
      // Y.Array requires index-based deletion. 
      // We iterate backwards to delete safely.
      let i = this.triples.length;
      while (i > 0) {
        i--;
        const t = this.triples.get(i);
        if (predicate(t)) {
          this.triples.delete(i, 1);
        }
      }
    });
  }

  // --- Domain Specific Actions ---

  createTask(title: string) {
    const id = `urn:uuid:${crypto.randomUUID()}`;
    
    this.doc.transact(() => {
      // Define Type
      this.triples.push([{ subject: id, predicate: RDF_TYPE, object: ONTOLOGY.Action }]);
      // Define Name
      this.triples.push([{ subject: id, predicate: ONTOLOGY.name, object: title }]);
      // Define Status (Active)
      this.triples.push([{ subject: id, predicate: ONTOLOGY.actionStatus, object: ONTOLOGY.PotentialActionStatus }]);
    });
  }

  toggleTaskCompletion(id: string, currentStatusIsCompleted: boolean) {
    const newStatus = currentStatusIsCompleted 
      ? ONTOLOGY.PotentialActionStatus 
      : ONTOLOGY.CompletedActionStatus;

    this.doc.transact(() => {
      // 1. Remove existing status triple
      // We search for the index of the triple (id, actionStatus, *)
      let i = this.triples.length;
      while (i > 0) {
        i--;
        const t = this.triples.get(i);
        if (t.subject === id && t.predicate === ONTOLOGY.actionStatus) {
          this.triples.delete(i, 1);
        }
      }
      // 2. Add new status triple
      this.triples.push([{ subject: id, predicate: ONTOLOGY.actionStatus, object: newStatus }]);
    });
  }
}

export const rdfStore = new RdfStore();
