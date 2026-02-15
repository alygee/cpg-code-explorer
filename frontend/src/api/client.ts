import axios from 'axios';
import type {
  SearchResult,
  FunctionWithMetrics,
  FunctionNeighborhood,
  CallChainNode,
  Node,
  Package,
  Stats,
  SourceCode
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Функции API
export const apiClient = {
  // Поиск функций
  searchFunctions: async (query: string, limit = 50): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/functions/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Получить функцию по ID
  getFunction: async (id: string): Promise<FunctionWithMetrics> => {
    const response = await api.get<FunctionWithMetrics>(`/functions/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Получить neighborhood функции
  getNeighborhood: async (id: string): Promise<FunctionNeighborhood> => {
    const response = await api.get<FunctionNeighborhood>(`/graph/${encodeURIComponent(id)}/neighborhood`);
    return response.data;
  },

  // Получить call chain
  getCallChain: async (id: string, depth = 5): Promise<CallChainNode[]> => {
    const response = await api.get<CallChainNode[]>(`/graph/${encodeURIComponent(id)}/call-chain`, {
      params: { depth }
    });
    return response.data;
  },

  // Получить callers
  getCallers: async (id: string, depth = 3): Promise<Node[]> => {
    const response = await api.get<Node[]>(`/graph/${encodeURIComponent(id)}/callers`, {
      params: { depth }
    });
    return response.data;
  },

  // Получить исходный код
  getSource: async (file: string): Promise<SourceCode> => {
    const encodedFile = encodeURIComponent(file);
    const response = await api.get<SourceCode>(`/sources/${encodedFile}`);
    return response.data;
  },

  // Получить список пакетов
  getPackages: async (): Promise<Package[]> => {
    const response = await api.get<Package[]>('/packages');
    return response.data;
  },

  // Получить функции пакета
  getPackageFunctions: async (packageName: string): Promise<Node[]> => {
    const encodedPackage = encodeURIComponent(packageName);
    const response = await api.get<Node[]>(`/packages/${encodedPackage}/functions`);
    return response.data;
  },

  // Получить статистику
  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/stats');
    return response.data;
  }
};

