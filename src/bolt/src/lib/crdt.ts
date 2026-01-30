import { RDFTriple, CRDTOperation } from './types';

export class CRDT {
  private clientId: string;
  private clock: number = 0;

  constructor() {
    let stored = localStorage.getItem('clientId');
    if (!stored) {
      stored = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('clientId', stored);
    }
    this.clientId = stored;
  }

  getClientId(): string {
    return this.clientId;
  }

  private getTimestamp(): number {
    const now = Date.now();
    this.clock = Math.max(this.clock + 1, now);
    return this.clock;
  }

  createOperation(type: 'add' | 'update' | 'delete', triples: RDFTriple[]): CRDTOperation {
    const timestamp = this.getTimestamp();
    const operation: CRDTOperation = {
      id: `op-${timestamp}-${this.clientId}`,
      type,
      triples,
      timestamp,
      clientId: this.clientId,
    };
    return operation;
  }

  mergeTriples(local: RDFTriple[], remote: RDFTriple[]): RDFTriple[] {
    const combined = [...local, ...remote];
    const merged = new Map<string, RDFTriple>();

    combined.forEach((triple) => {
      const key = `${triple.subject}#${triple.predicate}`;
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, triple);
      } else {
        if (triple.timestamp > existing.timestamp) {
          merged.set(key, triple);
        } else if (triple.timestamp === existing.timestamp) {
          if (triple.clientId > existing.clientId) {
            merged.set(key, triple);
          }
        }
      }
    });

    return Array.from(merged.values());
  }
}
