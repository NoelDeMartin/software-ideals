import { RDFTriple, CRDTOperation } from './types';

const DB_NAME = 'TodoCRDT';
const DB_VERSION = 1;
const TRIPLES_STORE = 'triples';
const OPERATIONS_STORE = 'operations';

export class LocalStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(TRIPLES_STORE)) {
          const tripleStore = db.createObjectStore(TRIPLES_STORE, { autoIncrement: true });
          tripleStore.createIndex('subject', 'subject', { unique: false });
          tripleStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
          const opStore = db.createObjectStore(OPERATIONS_STORE, { keyPath: 'id' });
          opStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveTriples(triples: RDFTriple[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([TRIPLES_STORE], 'readwrite');
    const store = transaction.objectStore(TRIPLES_STORE);

    await store.clear();

    for (const triple of triples) {
      store.add(triple);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async loadTriples(): Promise<RDFTriple[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([TRIPLES_STORE], 'readonly');
    const store = transaction.objectStore(TRIPLES_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveOperation(operation: CRDTOperation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(OPERATIONS_STORE);

    store.add(operation);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async loadOperations(since?: number): Promise<CRDTOperation[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([OPERATIONS_STORE], 'readonly');
    const store = transaction.objectStore(OPERATIONS_STORE);
    const index = store.index('timestamp');

    const range = since ? IDBKeyRange.lowerBound(since, true) : undefined;
    const request = range ? index.getAll(range) : store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([TRIPLES_STORE, OPERATIONS_STORE], 'readwrite');

    transaction.objectStore(TRIPLES_STORE).clear();
    transaction.objectStore(OPERATIONS_STORE).clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
