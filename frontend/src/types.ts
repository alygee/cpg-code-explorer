// Типы для узлов графа
export interface Node {
  id: string;
  kind: string;
  name: string;
  file: string | null;
  line: number | null;
  col: number | null;
  end_line: number | null;
  package: string | null;
  parent_function: string | null;
  type_info: string | null;
  properties: string | null;
}

// Функция с метриками
export interface FunctionWithMetrics extends Node {
  cyclomatic_complexity: number | null;
  fan_in: number | null;
  fan_out: number | null;
  loc: number | null;
}

// Neighborhood функции
export interface FunctionNeighborhood {
  callers: Node[];
  callees: Node[];
}

// Call chain
export interface CallChainNode {
  id: string;
  name: string;
  package: string | null;
  depth: number;
}

// Статистика
export interface Stats {
  total_nodes: number;
  total_edges: number;
  total_files: number;
  total_packages: number;
}

// Пакет
export interface Package {
  package: string;
  files: number;
  functions: number;
  types: number;
  loc: number;
}

// Результат поиска
export interface SearchResult {
  id: string;
  name: string;
  kind: string;
  package: string | null;
  file: string | null;
  line: number | null;
}

// Исходный код
export interface SourceCode {
  file: string;
  content: string;
  package: string | null;
}

// Переменная (parameter, local, result)
export interface Variable extends Node {
  // Наследует все поля Node
}

// DFG ребро
export interface DFGEdge {
  source: string;
  target: string;
  kind: string;
  properties: string | null;
}

// Результат data flow slice
export interface DataFlowSliceResult {
  nodes: Node[];
  edges: DFGEdge[];
}

