import { Writer, Parser, Store, DataFactory } from 'n3';
import type { Task } from '@/types/task';
import { RDF_PREFIXES, TASK_PREDICATES, TASK_TYPE } from '@/types/task';

const { namedNode, literal } = DataFactory;

// Convert a Task to RDF Turtle format
export function taskToTurtle(task: Task): string {
  const writer = new Writer({
    prefixes: {
      rdf: RDF_PREFIXES.rdf,
      schema: RDF_PREFIXES.schema,
      todo: RDF_PREFIXES.todo,
      xsd: RDF_PREFIXES.xsd,
    },
  });

  const subject = namedNode(`${RDF_PREFIXES.todo}task/${task.id}`);

  writer.addQuad(subject, namedNode(TASK_PREDICATES.type), namedNode(TASK_TYPE));
  writer.addQuad(subject, namedNode(TASK_PREDICATES.title), literal(task.title));
  writer.addQuad(
    subject,
    namedNode(TASK_PREDICATES.completed),
    literal(String(task.completed), namedNode(`${RDF_PREFIXES.xsd}boolean`))
  );
  writer.addQuad(
    subject,
    namedNode(TASK_PREDICATES.createdAt),
    literal(task.createdAt, namedNode(`${RDF_PREFIXES.xsd}dateTime`))
  );
  writer.addQuad(
    subject,
    namedNode(TASK_PREDICATES.updatedAt),
    literal(task.updatedAt, namedNode(`${RDF_PREFIXES.xsd}dateTime`))
  );

  let result = '';
  writer.end((error, output) => {
    if (!error) result = output;
  });

  return result;
}

// Convert a Task to JSON-LD format
export function taskToJsonLd(task: Task): object {
  return {
    '@context': {
      schema: RDF_PREFIXES.schema,
      todo: RDF_PREFIXES.todo,
      xsd: RDF_PREFIXES.xsd,
    },
    '@id': `${RDF_PREFIXES.todo}task/${task.id}`,
    '@type': 'todo:Task',
    'schema:name': task.title,
    'todo:completed': {
      '@value': String(task.completed),
      '@type': 'xsd:boolean',
    },
    'schema:dateCreated': {
      '@value': task.createdAt,
      '@type': 'xsd:dateTime',
    },
    'schema:dateModified': {
      '@value': task.updatedAt,
      '@type': 'xsd:dateTime',
    },
  };
}

// Parse Turtle to Tasks
export function turtleToTasks(turtle: string): Task[] {
  const parser = new Parser();
  const store = new Store();
  
  try {
    const quads = parser.parse(turtle);
    store.addQuads(quads);
  } catch {
    return [];
  }

  const tasks: Task[] = [];
  const taskSubjects = store.getSubjects(
    namedNode(TASK_PREDICATES.type),
    namedNode(TASK_TYPE),
    null
  );

  for (const subject of taskSubjects) {
    const id = subject.value.split('/').pop() || '';
    const titleQuad = store.getQuads(subject, namedNode(TASK_PREDICATES.title), null, null)[0];
    const completedQuad = store.getQuads(subject, namedNode(TASK_PREDICATES.completed), null, null)[0];
    const createdQuad = store.getQuads(subject, namedNode(TASK_PREDICATES.createdAt), null, null)[0];
    const updatedQuad = store.getQuads(subject, namedNode(TASK_PREDICATES.updatedAt), null, null)[0];

    if (titleQuad) {
      tasks.push({
        id,
        title: titleQuad.object.value,
        completed: completedQuad?.object.value === 'true',
        createdAt: createdQuad?.object.value || new Date().toISOString(),
        updatedAt: updatedQuad?.object.value || new Date().toISOString(),
      });
    }
  }

  return tasks;
}

// Export all tasks as a combined Turtle document
export function tasksToTurtle(tasks: Task[]): string {
  const writer = new Writer({
    prefixes: {
      rdf: RDF_PREFIXES.rdf,
      schema: RDF_PREFIXES.schema,
      todo: RDF_PREFIXES.todo,
      xsd: RDF_PREFIXES.xsd,
    },
  });

  for (const task of tasks) {
    const subject = namedNode(`${RDF_PREFIXES.todo}task/${task.id}`);

    writer.addQuad(subject, namedNode(TASK_PREDICATES.type), namedNode(TASK_TYPE));
    writer.addQuad(subject, namedNode(TASK_PREDICATES.title), literal(task.title));
    writer.addQuad(
      subject,
      namedNode(TASK_PREDICATES.completed),
      literal(String(task.completed), namedNode(`${RDF_PREFIXES.xsd}boolean`))
    );
    writer.addQuad(
      subject,
      namedNode(TASK_PREDICATES.createdAt),
      literal(task.createdAt, namedNode(`${RDF_PREFIXES.xsd}dateTime`))
    );
    writer.addQuad(
      subject,
      namedNode(TASK_PREDICATES.updatedAt),
      literal(task.updatedAt, namedNode(`${RDF_PREFIXES.xsd}dateTime`))
    );
  }

  let result = '';
  writer.end((error, output) => {
    if (!error) result = output;
  });

  return result;
}
