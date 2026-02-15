// Types for graph nodes
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

// Function with metrics
export interface FunctionWithMetrics extends Node {
  cyclomatic_complexity: number | null;
  fan_in: number | null;
  fan_out: number | null;
  loc: number | null;
}

// Function neighborhood
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

// Statistics
export interface Stats {
  total_nodes: number;
  total_edges: number;
  total_files: number;
  total_packages: number;
}

// Package
export interface Package {
  package: string;
  files: number;
  functions: number;
  types: number;
  loc: number;
}

// Search result
export interface SearchResult {
  id: string;
  name: string;
  kind: string;
  package: string | null;
  file: string | null;
  line: number | null;
}

// Source code
export interface SourceCode {
  file: string;
  content: string;
  package: string | null;
}

// Variable (parameter, local, result)
export interface Variable extends Node {
  // Inherits all Node fields
}

// DFG edge
export interface DFGEdge {
  source: string;
  target: string;
  kind: string;
  properties: string | null;
}

// Data flow slice result
export interface DataFlowSliceResult {
  nodes: Node[];
  edges: DFGEdge[];
}

// Package dependency
export interface PackageDependency {
  source: string;
  target: string;
  weight: number;
}

// Package metrics for treemap
export interface PackageTreemap {
  package: string;
  file_count: number;
  function_count: number;
  total_loc: number;
  total_complexity: number;
  avg_complexity: number;
  max_complexity: number;
  type_count: number;
  interface_count: number;
}

// Function details from dashboard_function_detail
export interface FunctionDetail {
  function_id: string;
  name: string;
  package: string | null;
  file: string | null;
  line: number | null;
  end_line: number | null;
  signature: string | null;
  complexity: number;
  loc: number;
  fan_in: number;
  fan_out: number;
  num_params: number;
  num_locals: number;
  num_calls: number;
  num_branches: number;
  num_returns: number;
  finding_count: number;
  callers: string | null;
  callees: string | null;
}

