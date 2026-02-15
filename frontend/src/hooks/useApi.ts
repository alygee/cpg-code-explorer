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
  DataFlowSliceResult
} from '../types';

// Поиск функций
export function useSearchFunctions(query: string, limit = 50) {
  return useQuery<SearchResult[]>({
    queryKey: ['search', query, limit],
    queryFn: () => apiClient.searchFunctions(query, limit),
    enabled: query.length > 0
  });
}

// Получить функцию
export function useFunction(id: string | null) {
  return useQuery<FunctionWithMetrics>({
    queryKey: ['function', id],
    queryFn: () => apiClient.getFunction(id!),
    enabled: id !== null
  });
}

// Получить neighborhood
export function useNeighborhood(id: string | null) {
  return useQuery<FunctionNeighborhood>({
    queryKey: ['neighborhood', id],
    queryFn: () => apiClient.getNeighborhood(id!),
    enabled: id !== null
  });
}

// Получить call chain
export function useCallChain(id: string | null, depth = 5) {
  return useQuery<CallChainNode[]>({
    queryKey: ['call-chain', id, depth],
    queryFn: () => apiClient.getCallChain(id!, depth),
    enabled: id !== null
  });
}

// Получить callers
export function useCallers(id: string | null, depth = 3) {
  return useQuery<Node[]>({
    queryKey: ['callers', id, depth],
    queryFn: () => apiClient.getCallers(id!, depth),
    enabled: id !== null
  });
}

// Получить исходный код
export function useSource(file: string | null) {
  return useQuery<SourceCode>({
    queryKey: ['source', file],
    queryFn: () => apiClient.getSource(file!),
    enabled: file !== null && file.length > 0
  });
}

// Получить пакеты
export function usePackages() {
  return useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: () => apiClient.getPackages()
  });
}

// Получить функции пакета
export function usePackageFunctions(packageName: string | null) {
  return useQuery<Node[]>({
    queryKey: ['package-functions', packageName],
    queryFn: () => apiClient.getPackageFunctions(packageName!),
    enabled: packageName !== null
  });
}

// Получить статистику
export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => apiClient.getStats()
  });
}

// Получить переменные функции
export function useVariables(functionId: string | null) {
  return useQuery<Variable[]>({
    queryKey: ['variables', functionId],
    queryFn: () => apiClient.getVariables(functionId!),
    enabled: functionId !== null
  });
}

// Получить backward slice
export function useBackwardSlice(nodeId: string | null) {
  return useQuery<DataFlowSliceResult>({
    queryKey: ['backward-slice', nodeId],
    queryFn: () => apiClient.getBackwardSlice(nodeId!),
    enabled: nodeId !== null
  });
}

// Получить forward slice
export function useForwardSlice(nodeId: string | null) {
  return useQuery<DataFlowSliceResult>({
    queryKey: ['forward-slice', nodeId],
    queryFn: () => apiClient.getForwardSlice(nodeId!),
    enabled: nodeId !== null
  });
}

