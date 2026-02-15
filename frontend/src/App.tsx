import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './components/SearchBar';
import { Sidebar } from './components/Sidebar';
import { GraphView } from './components/GraphView';
import { SourcePanel } from './components/SourcePanel';
import { FunctionDetails } from './components/FunctionDetails';
import { useStats } from './hooks/useApi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000 // 5 минут
    }
  }
});

function AppContent() {
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { data: stats } = useStats();

  const handleSelectFunction = (functionId: string) => {
    setSelectedFunctionId(functionId);
    setSelectedNodeId(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">CPG Code Explorer</h1>
            <p className="text-sm text-gray-600">Исследование кодовой базы через Call Graph</p>
          </div>
          {stats && (
            <div className="text-right text-sm text-gray-600">
              <div>Узлов: {stats.total_nodes.toLocaleString()}</div>
              <div>Рёбер: {stats.total_edges.toLocaleString()}</div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <SearchBar onSelectFunction={handleSelectFunction} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar onSelectFunction={handleSelectFunction} />

        {/* Graph and source */}
        <div className="flex-1 flex flex-col">
          {selectedFunctionId && (
            <FunctionDetails functionId={selectedFunctionId} />
          )}
          <GraphView
            selectedFunctionId={selectedFunctionId}
            onNodeSelect={setSelectedNodeId}
          />
          <SourcePanel selectedNodeId={selectedNodeId || selectedFunctionId} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

