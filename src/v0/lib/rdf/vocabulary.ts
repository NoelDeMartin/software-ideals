// RDF Vocabulary definitions for the Todo knowledge graph
// Using standard RDF/Schema.org patterns

export const NAMESPACES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  schema: 'http://schema.org/',
  todo: 'http://purl.org/todo#',
} as const

// RDF predicates
export const RDF = {
  type: `${NAMESPACES.rdf}type`,
} as const

// Schema.org predicates
export const SCHEMA = {
  name: `${NAMESPACES.schema}name`,
  dateCreated: `${NAMESPACES.schema}dateCreated`,
  dateModified: `${NAMESPACES.schema}dateModified`,
} as const

// Todo-specific vocabulary
export const TODO = {
  // Classes
  Task: `${NAMESPACES.todo}Task`,
  TaskList: `${NAMESPACES.todo}TaskList`,
  
  // Properties
  isCompleted: `${NAMESPACES.todo}isCompleted`,
  belongsToList: `${NAMESPACES.todo}belongsToList`,
  position: `${NAMESPACES.todo}position`,
} as const

// Type definitions for RDF triples
export interface Triple {
  subject: string
  predicate: string
  object: string | number | boolean
  datatype?: string
}

export interface Task {
  id: string
  name: string
  isCompleted: boolean
  dateCreated: string
  dateModified: string
}

// Helper to create a task URI
export function createTaskUri(id: string): string {
  return `${NAMESPACES.todo}task/${id}`
}

// Convert a Task object to RDF triples
export function taskToTriples(task: Task): Triple[] {
  const subject = createTaskUri(task.id)
  
  return [
    { subject, predicate: RDF.type, object: TODO.Task },
    { subject, predicate: SCHEMA.name, object: task.name, datatype: `${NAMESPACES.xsd}string` },
    { subject, predicate: TODO.isCompleted, object: task.isCompleted, datatype: `${NAMESPACES.xsd}boolean` },
    { subject, predicate: SCHEMA.dateCreated, object: task.dateCreated, datatype: `${NAMESPACES.xsd}dateTime` },
    { subject, predicate: SCHEMA.dateModified, object: task.dateModified, datatype: `${NAMESPACES.xsd}dateTime` },
  ]
}

// Convert RDF triples back to a Task object
export function triplesToTask(triples: Triple[]): Task | null {
  if (triples.length === 0) return null
  
  const subject = triples[0].subject
  const id = subject.replace(`${NAMESPACES.todo}task/`, '')
  
  const tripleMap = new Map<string, string | number | boolean>()
  for (const triple of triples) {
    tripleMap.set(triple.predicate, triple.object)
  }
  
  return {
    id,
    name: String(tripleMap.get(SCHEMA.name) || ''),
    isCompleted: Boolean(tripleMap.get(TODO.isCompleted)),
    dateCreated: String(tripleMap.get(SCHEMA.dateCreated) || new Date().toISOString()),
    dateModified: String(tripleMap.get(SCHEMA.dateModified) || new Date().toISOString()),
  }
}

// Serialize the knowledge graph to Turtle format (for export/display)
export function graphToTurtle(triples: Triple[]): string {
  const prefixes = Object.entries(NAMESPACES)
    .map(([prefix, uri]) => `@prefix ${prefix}: <${uri}> .`)
    .join('\n')
  
  // Group triples by subject
  const bySubject = new Map<string, Triple[]>()
  for (const triple of triples) {
    const existing = bySubject.get(triple.subject) || []
    existing.push(triple)
    bySubject.set(triple.subject, existing)
  }
  
  const statements: string[] = []
  for (const [subject, subjectTriples] of bySubject) {
    const predicateObjects = subjectTriples.map(t => {
      const value = typeof t.object === 'string' && !t.object.startsWith('http') 
        ? `"${t.object}"` 
        : typeof t.object === 'boolean'
        ? t.object.toString()
        : t.object
      return `  ${shortenUri(t.predicate)} ${value}`
    }).join(' ;\n')
    
    statements.push(`<${subject}>\n${predicateObjects} .`)
  }
  
  return `${prefixes}\n\n${statements.join('\n\n')}`
}

function shortenUri(uri: string): string {
  for (const [prefix, namespace] of Object.entries(NAMESPACES)) {
    if (uri.startsWith(namespace)) {
      return `${prefix}:${uri.replace(namespace, '')}`
    }
  }
  return `<${uri}>`
}
