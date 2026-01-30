export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RDFTriple {
  subject: string;
  predicate: string;
  object: string | boolean | number;
  timestamp: number;
  clientId: string;
}

export interface CRDTOperation {
  id: string;
  type: 'add' | 'update' | 'delete';
  triples: RDFTriple[];
  timestamp: number;
  clientId: string;
}

export interface SyncConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  enabled: boolean;
}
