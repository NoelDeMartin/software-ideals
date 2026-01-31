import { Task, RDFTriple, CRDTOperation } from './types';
import { CRDT } from './crdt';
import { RDFStore } from './rdf';
import { LocalStorage } from './storage';

export class TodoStore {
  private crdt: CRDT;
  private storage: LocalStorage;
  private triples: RDFTriple[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.crdt = new CRDT();
    this.storage = new LocalStorage();
  }

  async init(): Promise<void> {
    await this.storage.init();
    this.triples = await this.storage.loadTriples();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  getTasks(): Task[] {
    return RDFStore.triplesToTasks(this.triples).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  async addTask(title: string): Promise<Task> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newTriples = RDFStore.taskToTriples(task);
    const operation = this.crdt.createOperation('add', newTriples);

    this.triples = [...this.triples, ...newTriples];

    await this.storage.saveTriples(this.triples);
    await this.storage.saveOperation(operation);

    this.notify();
    return task;
  }

  async toggleTask(taskId: string): Promise<void> {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;

    task.completed = !task.completed;
    task.updatedAt = Date.now();

    const updatedTriples = RDFStore.taskToTriples(task);
    const operation = this.crdt.createOperation('update', updatedTriples);

    const filteredTriples = this.triples.filter(
      (t) => !t.subject.includes(taskId)
    );
    this.triples = [...filteredTriples, ...updatedTriples];

    await this.storage.saveTriples(this.triples);
    await this.storage.saveOperation(operation);

    this.notify();
  }

  async mergeRemoteTriples(remoteTriples: RDFTriple[]): Promise<void> {
    this.triples = this.crdt.mergeTriples(this.triples, remoteTriples);
    await this.storage.saveTriples(this.triples);
    this.notify();
  }

  getTriples(): RDFTriple[] {
    return this.triples;
  }

  async getOperationsSince(timestamp: number): Promise<CRDTOperation[]> {
    return this.storage.loadOperations(timestamp);
  }

  getClientId(): string {
    return this.crdt.getClientId();
  }
}

export const todoStore = new TodoStore();
