import { useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, NodeTypes, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraph } from '../hooks/useGraph';
import { useFunction, useNeighborhood } from '../hooks/useApi';

interface GraphViewProps {
  selectedFunctionId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

// Кастомный компонент узла для caller
function CallerNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 bg-red-50 border-2 border-red-400 rounded-lg text-center min-w-[120px]">
      <Handle type="target" position={Position.Left} />
      <div className="text-sm font-medium text-gray-800">{data.label}</div>
      {data.package && (
        <div className="text-xs text-gray-500 mt-1 truncate">{data.package}</div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// Кастомный компонент узла для callee
function CalleeNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 bg-green-50 border-2 border-green-400 rounded-lg text-center min-w-[120px]">
      <Handle type="target" position={Position.Left} />
      <div className="text-sm font-medium text-gray-800">{data.label}</div>
      {data.package && (
        <div className="text-xs text-gray-500 mt-1 truncate">{data.package}</div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// Кастомный компонент узла для center
function CenterNode({ data }: { data: any }) {
  return (
    <div className="px-5 py-3 bg-yellow-50 border-3 border-yellow-500 rounded-lg text-center min-w-[160px] shadow-md">
      <Handle type="target" position={Position.Left} />
      <div className="text-base font-bold text-gray-900">{data.label}</div>
      {data.package && (
        <div className="text-xs text-gray-600 mt-1 truncate">{data.package}</div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// Типы узлов для React Flow
const nodeTypes: NodeTypes = {
  caller: CallerNode,
  callee: CalleeNode,
  center: CenterNode,
};

export function GraphView({ selectedFunctionId, onNodeSelect }: GraphViewProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    selectedNodeId,
    loadNeighborhood,
    clearGraph,
  } = useGraph();

  const { data: functionData } = useFunction(selectedFunctionId);
  const { data: neighborhood, isLoading } = useNeighborhood(selectedFunctionId);

  // Загрузка neighborhood при изменении выбранной функции
  useEffect(() => {
    if (selectedFunctionId && functionData && neighborhood) {
      loadNeighborhood(functionData, neighborhood);
    } else if (!selectedFunctionId) {
      clearGraph();
    }
  }, [selectedFunctionId, functionData, neighborhood, loadNeighborhood, clearGraph]);

  // Передача выбранного узла наверх
  useEffect(() => {
    onNodeSelect(selectedNodeId);
  }, [selectedNodeId, onNodeSelect]);

  return (
    <div className="flex-1 relative bg-white" style={{ minHeight: '400px' }}>
      {isLoading && selectedFunctionId && (
        <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          Загрузка графа...
        </div>
      )}
      {!selectedFunctionId && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div>Выберите функцию для отображения графа вызовов</div>
            <div className="text-sm mt-2">Используйте поиск или выберите функцию из списка пакетов</div>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
