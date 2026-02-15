import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type {
  SearchResult,
  FunctionWithMetrics,
  FunctionNeighborhood,
  CallChainNode,
  Node,
  Package,
  Stats,
  SourceCode,
  Variable,
  DataFlowSliceResult,
  PackageDependency,
  PackageTreemap,
  FunctionDetail
} from '../types';

// Search functions
export function useSearchFunctions(query: string, limit = 50) {
  return useQuery<SearchResult[]>({
    queryKey: ['search', query, limit],
    queryFn: () => apiClient.searchFunctions(query, limit),
    enabled: query.length > 0
  });
}

// Get function
export function useFunction(id: string | null) {
  return useQuery<FunctionWithMetrics>({
    queryKey: ['function', id],
    queryFn: () => apiClient.getFunction(id!),
    enabled: id !== null
  });
}

// Get neighborhood
export function useNeighborhood(id: string | null) {
  return useQuery<FunctionNeighborhood>({
    queryKey: ['neighborhood', id],
    queryFn: () => apiClient.getNeighborhood(id!),
    enabled: id !== null
  });
}

// Get call chain
export function useCallChain(id: string | null, depth = 5) {
  return useQuery<CallChainNode[]>({
    queryKey: ['call-chain', id, depth],
    queryFn: () => apiClient.getCallChain(id!, depth),
    enabled: id !== null
  });
}

// Get callers
export function useCallers(id: string | null, depth = 3) {
  return useQuery<Node[]>({
    queryKey: ['callers', id, depth],
    queryFn: () => apiClient.getCallers(id!, depth),
    enabled: id !== null
  });
}

// Get source code
export function useSource(file: string | null) {
  return useQuery<SourceCode>({
    queryKey: ['source', file],
    queryFn: () => apiClient.getSource(file!),
    enabled: file !== null && file.length > 0
  });
}

// Get packages
export function usePackages() {
  return useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: () => apiClient.getPackages()
  });
}

// Get package functions
export function usePackageFunctions(packageName: string | null) {
  return useQuery<Node[]>({
    queryKey: ['package-functions', packageName],
    queryFn: () => apiClient.getPackageFunctions(packageName!),
    enabled: packageName !== null
  });
}

// Get statistics
export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => apiClient.getStats()
  });
}

// Get function variables
export function useVariables(functionId: string | null) {
  return useQuery<Variable[]>({
    queryKey: ['variables', functionId],
    queryFn: () => apiClient.getVariables(functionId!),
    enabled: functionId !== null
  });
}

// Get backward slice
export function useBackwardSlice(nodeId: string | null) {
  return useQuery<DataFlowSliceResult>({
    queryKey: ['backward-slice', nodeId],
    queryFn: () => apiClient.getBackwardSlice(nodeId!),
    enabled: nodeId !== null
  });
}

// Get forward slice
export function useForwardSlice(nodeId: string | null) {
  return useQuery<DataFlowSliceResult>({
    queryKey: ['forward-slice', nodeId],
    queryFn: () => apiClient.getForwardSlice(nodeId!),
    enabled: nodeId !== null
  });
}

// Get package dependency graph
export function usePackageGraph(limit = 200, minWeight = 3) {
  return useQuery<PackageDependency[]>({
    queryKey: ['package-graph', limit, minWeight],
    queryFn: () => apiClient.getPackageGraph(limit, minWeight)
  });
}

// Get package metrics for treemap
export function usePackageTreemap() {
  return useQuery<PackageTreemap[]>({
    queryKey: ['package-treemap'],
    queryFn: () => apiClient.getPackageTreemap()
  });
}

// Get package function details
export function usePackageDetails(packageName: string | null) {
  return useQuery<FunctionDetail[]>({
    queryKey: ['package-details', packageName],
    queryFn: () => apiClient.getPackageDetails(packageName!),
    enabled: packageName !== null
  });
}

