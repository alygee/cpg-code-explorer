import axios from 'axios';
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

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API functions
export const apiClient = {
  // Search functions
  searchFunctions: async (query: string, limit = 50): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/functions/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Get function by ID
  getFunction: async (id: string): Promise<FunctionWithMetrics> => {
    const response = await api.get<FunctionWithMetrics>(`/functions/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Get function neighborhood
  getNeighborhood: async (id: string): Promise<FunctionNeighborhood> => {
    const response = await api.get<FunctionNeighborhood>(`/graph/${encodeURIComponent(id)}/neighborhood`);
    return response.data;
  },

  // Get call chain
  getCallChain: async (id: string, depth = 5): Promise<CallChainNode[]> => {
    const response = await api.get<CallChainNode[]>(`/graph/${encodeURIComponent(id)}/call-chain`, {
      params: { depth }
    });
    return response.data;
  },

  // Get callers
  getCallers: async (id: string, depth = 3): Promise<Node[]> => {
    const response = await api.get<Node[]>(`/graph/${encodeURIComponent(id)}/callers`, {
      params: { depth }
    });
    return response.data;
  },

  // Get source code
  getSource: async (file: string): Promise<SourceCode> => {
    const encodedFile = encodeURIComponent(file);
    const response = await api.get<SourceCode>(`/sources/${encodedFile}`);
    return response.data;
  },

  // Get package list
  getPackages: async (): Promise<Package[]> => {
    const response = await api.get<Package[]>('/packages');
    return response.data;
  },

  // Get package functions
  getPackageFunctions: async (packageName: string): Promise<Node[]> => {
    const encodedPackage = encodeURIComponent(packageName);
    const response = await api.get<Node[]>(`/packages/${encodedPackage}/functions`);
    return response.data;
  },

  // Get statistics
  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/stats');
    return response.data;
  },

  // Get function variables
  getVariables: async (functionId: string): Promise<Variable[]> => {
    const response = await api.get<Variable[]>(`/dataflow/${encodeURIComponent(functionId)}/variables`);
    return response.data;
  },

  // Get backward slice
  getBackwardSlice: async (nodeId: string): Promise<DataFlowSliceResult> => {
    const response = await api.get<DataFlowSliceResult>(`/dataflow/${encodeURIComponent(nodeId)}/backward-slice`);
    return response.data;
  },

  // Get forward slice
  getForwardSlice: async (nodeId: string): Promise<DataFlowSliceResult> => {
    const response = await api.get<DataFlowSliceResult>(`/dataflow/${encodeURIComponent(nodeId)}/forward-slice`);
    return response.data;
  },

  // Get package dependency graph
  getPackageGraph: async (limit = 200, minWeight = 3): Promise<PackageDependency[]> => {
    const response = await api.get<PackageDependency[]>('/packages/graph', {
      params: { limit, minWeight }
    });
    return response.data;
  },

  // Get package metrics for treemap
  getPackageTreemap: async (): Promise<PackageTreemap[]> => {
    const response = await api.get<PackageTreemap[]>('/packages/treemap');
    return response.data;
  },

  // Get package function details
  getPackageDetails: async (packageName: string): Promise<FunctionDetail[]> => {
    const encodedPackage = encodeURIComponent(packageName);
    const response = await api.get<FunctionDetail[]>(`/packages/${encodedPackage}/details`);
    return response.data;
  }
};

