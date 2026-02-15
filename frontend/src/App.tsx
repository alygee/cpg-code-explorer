import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './components/SearchBar';
import { Sidebar } from './components/Sidebar';
import { GraphView } from './components/GraphView';
import { SourcePanel } from './components/SourcePanel';
import { FunctionDetails } from './components/FunctionDetails';
import { DataFlowPanel } from './components/DataFlowPanel';
import { useStats, useBackwardSlice, useForwardSlice, useVariables } from './hooks/useApi';

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
  const [mode, setMode] = useState<'call-graph' | 'data-flow'>('call-graph');
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [sliceDirection, setSliceDirection] = useState<'backward' | 'forward'>('backward');
  const [sidebarWidth, setSidebarWidth] = useState(256); // Начальная ширина 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(256); // Начальная высота 256px
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);
  const { data: stats } = useStats();

  // Получаем переменные для выбранной функции
  const { data: variables } = useVariables(mode === 'data-flow' ? selectedFunctionId : null);
  
  // Получаем выбранную переменную
  const selectedVariable = useMemo(() => {
    return variables?.find(v => v.id === selectedVariableId) || null;
  }, [variables, selectedVariableId]);

  // Получаем slice в зависимости от направления
  const { data: backwardSlice } = useBackwardSlice(
    mode === 'data-flow' && selectedVariableId && sliceDirection === 'backward' ? selectedVariableId : null
  );
  const { data: forwardSlice } = useForwardSlice(
    mode === 'data-flow' && selectedVariableId && sliceDirection === 'forward' ? selectedVariableId : null
  );

  const currentSlice = sliceDirection === 'backward' ? backwardSlice : forwardSlice;

  // Вычисляем подсвеченные строки из slice
  const highlightedLines = useMemo(() => {
    const lines = new Set<number>();
    if (currentSlice?.nodes) {
      currentSlice.nodes.forEach(node => {
        if (node.line !== null) {
          lines.add(node.line);
        }
      });
    }
    return lines;
  }, [currentSlice]);

  const handleSelectFunction = (functionId: string) => {
    setSelectedFunctionId(functionId);
    setSelectedNodeId(null);
    setSelectedVariableId(null);
  };

  const handleSelectVariable = (variableId: string, direction: 'backward' | 'forward') => {
    setSelectedVariableId(variableId);
    setSliceDirection(direction);
  };

  const handleModeChange = (newMode: 'call-graph' | 'data-flow') => {
    setMode(newMode);
    setSelectedVariableId(null);
    setSelectedNodeId(null);
  };

  // Обработчики для изменения размера sidebar
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      // Ограничиваем ширину: минимум 200px, максимум 800px
      const clampedWidth = Math.max(200, Math.min(800, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Обработчики для изменения размера нижней панели
  const handleBottomPanelMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartRef.current = {
      y: e.clientY,
      height: bottomPanelHeight
    };
    setIsResizingBottom(true);
  }, [bottomPanelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingBottom || !resizeStartRef.current) return;
      
      // Вычисляем изменение высоты относительно начальной позиции
      const deltaY = resizeStartRef.current.y - e.clientY; // Положительное значение = мышь вверх = увеличиваем высоту
      const newHeight = resizeStartRef.current.height + deltaY;
      // Ограничиваем высоту: минимум 100px, максимум 600px
      const clampedHeight = Math.max(100, Math.min(600, newHeight));
      setBottomPanelHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsResizingBottom(false);
      resizeStartRef.current = null;
    };

    if (isResizingBottom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingBottom]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">CPG Code Explorer</h1>
            <p className="text-sm text-gray-600">Исследование кодовой базы через Call Graph</p>
          </div>
          <div className="flex-1 mx-8">
            <SearchBar onSelectFunction={handleSelectFunction} />
          </div>
          {stats && (
            <div className="text-right text-sm text-gray-600">
              <div>Узлов: {stats.total_nodes.toLocaleString()}</div>
              <div>Рёбер: {stats.total_edges.toLocaleString()}</div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar с возможностью изменения размера */}
        <div ref={sidebarRef} style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 relative">
          {mode === 'call-graph' && (
            <Sidebar onSelectFunction={handleSelectFunction} />
          )}
          {mode === 'data-flow' && (
            <DataFlowPanel
              functionId={selectedFunctionId}
              onSelectVariable={handleSelectVariable}
            />
          )}
          {/* Drag handle для изменения размера */}
          <div
            onMouseDown={handleMouseDown}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors ${
              isResizing ? 'bg-blue-500' : 'bg-transparent'
            }`}
            style={{ zIndex: 10 }}
          />
        </div>

        {/* Graph and source */}
        <div className="flex-1 flex flex-col">
          {/* Tabs для переключения режимов */}
          <div className="bg-white border-b border-gray-200 px-4">
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange('call-graph')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  mode === 'call-graph'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Граф вызовов
              </button>
              <button
                onClick={() => handleModeChange('data-flow')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  mode === 'data-flow'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Поток данных
              </button>
            </div>
          </div>

          <GraphView
            selectedFunctionId={selectedFunctionId}
            onNodeSelect={setSelectedNodeId}
            mode={mode}
            dataFlowSlice={
              mode === 'data-flow' && selectedVariable && currentSlice
                ? { originNode: selectedVariable, slice: currentSlice }
                : null
            }
          />
          
          {/* Drag handle для изменения размера нижней панели */}
          <div className="relative border-t border-gray-200 bg-gray-100">
            <div
              onMouseDown={handleBottomPanelMouseDown}
              className={`h-2 cursor-row-resize hover:bg-blue-400 transition-colors ${
                isResizingBottom ? 'bg-blue-500' : 'bg-transparent'
              }`}
            />
            {/* Кнопка сворачивания/разворачивания */}
            <button
              onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title={isBottomPanelCollapsed ? 'Развернуть' : 'Свернуть'}
            >
              {isBottomPanelCollapsed ? '▲' : '▼'}
            </button>
          </div>
          
          {/* Нижняя секция: FunctionDetails слева, SourcePanel справа */}
          {!isBottomPanelCollapsed && (
            <div 
              className="flex border-t border-gray-200"
              style={{ height: `${bottomPanelHeight}px` }}
            >
              {selectedFunctionId && mode === 'call-graph' && (
                <FunctionDetails functionId={selectedFunctionId} />
              )}
              <div className="flex-1 h-full overflow-hidden">
                <SourcePanel
                  selectedNodeId={selectedNodeId || selectedFunctionId}
                  highlightedLines={mode === 'data-flow' ? highlightedLines : undefined}
                />
              </div>
            </div>
          )}
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

