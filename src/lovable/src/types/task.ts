// Task type definition with RDF-compatible structure
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// RDF Namespaces for semantic representation
export const RDF_PREFIXES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  schema: 'http://schema.org/',
  todo: 'http://example.org/todo#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
} as const;

// Task RDF predicates
export const TASK_PREDICATES = {
  type: `${RDF_PREFIXES.rdf}type`,
  title: `${RDF_PREFIXES.schema}name`,
  completed: `${RDF_PREFIXES.todo}completed`,
  createdAt: `${RDF_PREFIXES.schema}dateCreated`,
  updatedAt: `${RDF_PREFIXES.schema}dateModified`,
} as const;

export const TASK_TYPE = `${RDF_PREFIXES.todo}Task`;
