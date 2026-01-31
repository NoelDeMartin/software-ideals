import { RDFTriple, Task } from './types';

export class RDFStore {
  private static readonly NAMESPACE = {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    todo: 'http://example.org/todo#',
    task: 'http://example.org/task/',
  };

  static taskToTriples(task: Task): RDFTriple[] {
    const subject = `${this.NAMESPACE.task}${task.id}`;
    const timestamp = task.updatedAt;
    const clientId = localStorage.getItem('clientId') || 'unknown';

    return [
      {
        subject,
        predicate: `${this.NAMESPACE.rdf}type`,
        object: `${this.NAMESPACE.todo}Task`,
        timestamp,
        clientId,
      },
      {
        subject,
        predicate: `${this.NAMESPACE.todo}id`,
        object: task.id,
        timestamp,
        clientId,
      },
      {
        subject,
        predicate: `${this.NAMESPACE.todo}title`,
        object: task.title,
        timestamp,
        clientId,
      },
      {
        subject,
        predicate: `${this.NAMESPACE.todo}completed`,
        object: task.completed,
        timestamp,
        clientId,
      },
      {
        subject,
        predicate: `${this.NAMESPACE.todo}createdAt`,
        object: task.createdAt,
        timestamp,
        clientId,
      },
      {
        subject,
        predicate: `${this.NAMESPACE.todo}updatedAt`,
        object: task.updatedAt,
        timestamp,
        clientId,
      },
    ];
  }

  static triplesToTasks(triples: RDFTriple[]): Task[] {
    const taskMap = new Map<string, Partial<Task>>();

    triples.forEach((triple) => {
      if (!triple.subject.startsWith(this.NAMESPACE.task)) {
        return;
      }

      const taskId = triple.subject.replace(this.NAMESPACE.task, '');

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, { id: taskId });
      }

      const task = taskMap.get(taskId)!;
      const predicate = triple.predicate.replace(this.NAMESPACE.todo, '');

      switch (predicate) {
        case 'title':
          task.title = triple.object as string;
          break;
        case 'completed':
          task.completed = triple.object as boolean;
          break;
        case 'createdAt':
          task.createdAt = triple.object as number;
          break;
        case 'updatedAt':
          task.updatedAt = triple.object as number;
          break;
      }
    });

    return Array.from(taskMap.values())
      .filter((task) => task.title && task.createdAt)
      .map((task) => task as Task);
  }

  static filterTaskTriples(triples: RDFTriple[], taskId: string): RDFTriple[] {
    const subject = `http://example.org/task/${taskId}`;
    return triples.filter((triple) => triple.subject === subject);
  }
}
