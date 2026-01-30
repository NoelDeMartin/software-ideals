export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  // Simple literal vs URI distinction could be added here, 
  // but for this MVP we treat object as string value or URI string.
}

export interface Task {
  id: string; // The Subject URI
  title: string;
  completed: boolean;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}
