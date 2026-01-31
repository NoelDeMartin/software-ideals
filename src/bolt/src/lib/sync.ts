import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RDFTriple, CRDTOperation, SyncConfig } from './types';
import { TodoStore } from './store';

export class SyncEngine {
  private supabase: SupabaseClient | null = null;
  private config: SyncConfig | null = null;
  private syncInterval: number | null = null;
  private lastSyncTimestamp: number = 0;

  constructor(private store: TodoStore) {}

  configure(config: SyncConfig): void {
    this.config = config;

    if (config.enabled && config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
      this.startSync();
    } else {
      this.stopSync();
      this.supabase = null;
    }

    localStorage.setItem('syncConfig', JSON.stringify(config));
  }

  loadConfig(): SyncConfig | null {
    const stored = localStorage.getItem('syncConfig');
    if (!stored) return null;

    try {
      const config = JSON.parse(stored);
      if (config.enabled) {
        this.configure(config);
      }
      return config;
    } catch {
      return null;
    }
  }

  private startSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.sync();

    this.syncInterval = window.setInterval(() => {
      this.sync();
    }, 30000);
  }

  private stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<void> {
    if (!this.supabase || !this.config?.enabled) {
      return;
    }

    try {
      await this.pushLocalChanges();
      await this.pullRemoteChanges();
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  private async pushLocalChanges(): Promise<void> {
    if (!this.supabase) return;

    const operations = await this.store.getOperationsSince(this.lastSyncTimestamp);

    if (operations.length === 0) return;

    const { error: opError } = await this.supabase
      .from('operations')
      .upsert(operations.map(op => ({
        id: op.id,
        type: op.type,
        triples: op.triples,
        timestamp: op.timestamp,
        client_id: op.clientId,
      })));

    if (opError) {
      console.error('Error pushing operations:', opError);
      return;
    }

    const allTriples = this.store.getTriples();

    const { error: tripleError } = await this.supabase
      .from('triples')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (tripleError) {
      console.error('Error clearing remote triples:', tripleError);
      return;
    }

    if (allTriples.length > 0) {
      const { error: insertError } = await this.supabase
        .from('triples')
        .insert(allTriples.map(triple => ({
          subject: triple.subject,
          predicate: triple.predicate,
          object: String(triple.object),
          timestamp: triple.timestamp,
          client_id: triple.clientId,
        })));

      if (insertError) {
        console.error('Error pushing triples:', insertError);
      }
    }
  }

  private async pullRemoteChanges(): Promise<void> {
    if (!this.supabase) return;

    const { data: remoteTriples, error } = await this.supabase
      .from('triples')
      .select('*')
      .neq('client_id', this.store.getClientId());

    if (error) {
      console.error('Error pulling triples:', error);
      return;
    }

    if (remoteTriples && remoteTriples.length > 0) {
      const triples: RDFTriple[] = remoteTriples.map(rt => ({
        subject: rt.subject,
        predicate: rt.predicate,
        object: this.parseObject(rt.object),
        timestamp: rt.timestamp,
        clientId: rt.client_id,
      }));

      await this.store.mergeRemoteTriples(triples);
    }

    this.lastSyncTimestamp = Date.now();
  }

  private parseObject(value: string): string | boolean | number {
    if (value === 'true') return true;
    if (value === 'false') return false;

    const num = Number(value);
    if (!isNaN(num) && value === String(num)) {
      return num;
    }

    return value;
  }

  isConfigured(): boolean {
    return this.config?.enabled === true && this.supabase !== null;
  }

  getConfig(): SyncConfig | null {
    return this.config;
  }
}
