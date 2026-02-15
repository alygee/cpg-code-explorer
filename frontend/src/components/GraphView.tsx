import { useEffect, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, NodeTypes, Handle, Position } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraph } from '../hooks/useGraph';
import { useFunction, useNeighborhood } from '../hooks/useApi';

interface GraphViewProps {
  selectedFunctionId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeNavigate?: (nodeId: string) => void;
  mode?: 'call-graph' | 'data-flow';
  dataFlowSlice?: { originNode: any; slice: any } | null;
}

// Custom node component for caller
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

// Custom node component for callee
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

// Custom node component for center
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

// Custom node component for definition (def) in data flow
function DefNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 bg-purple-50 border-2 border-purple-400 rounded-lg text-center min-w-[120px]">
      <Handle type="target" position={Position.Top} />
      <div className="text-sm font-medium text-gray-800">{data.label}</div>
      {data.kind && (
        <div className="text-xs text-gray-500 mt-1">{data.kind}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Custom node component for use in data flow
function UseNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 bg-orange-50 border-2 border-orange-400 rounded-lg text-center min-w-[120px]">
      <Handle type="target" position={Position.Top} />
      <div className="text-sm font-medium text-gray-800">{data.label}</div>
      {data.kind && (
        <div className="text-xs text-gray-500 mt-1">{data.kind}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Custom node component for origin (selected variable) in data flow
function OriginNode({ data }: { data: any }) {
  return (
    <div className="px-5 py-3 bg-blue-50 border-3 border-blue-500 rounded-lg text-center min-w-[160px] shadow-md">
      <Handle type="target" position={Position.Top} />
      <div className="text-base font-bold text-gray-900">{data.label}</div>
      {data.kind && (
        <div className="text-xs text-gray-600 mt-1">{data.kind}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Node types for React Flow
const nodeTypes: NodeTypes = {
  caller: CallerNode,
  callee: CalleeNode,
  center: CenterNode,
  def: DefNode,
  use: UseNode,
  origin: OriginNode,
};

export function GraphView({ selectedFunctionId, onNodeSelect, onNodeNavigate, mode = 'call-graph', dataFlowSlice }: GraphViewProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    onNodeDoubleClick,
    selectedNodeId,
    loadNeighborhood,
    loadDataFlowSlice,
    clearGraph,
  } = useGraph();

  // Double-click handler — navigate to function
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    onNodeDoubleClick(_event, node);
    if (onNodeNavigate) {
      onNodeNavigate(node.id);
    }
  }, [onNodeDoubleClick, onNodeNavigate]);

  const { data: functionData } = useFunction(selectedFunctionId);
  const { data: neighborhood, isLoading } = useNeighborhood(selectedFunctionId);

  // Load neighborhood when selected function changes (call-graph mode)
  useEffect(() => {
    if (mode === 'call-graph') {
      if (selectedFunctionId && functionData && neighborhood) {
        loadNeighborhood(functionData, neighborhood);
      } else if (!selectedFunctionId) {
        clearGraph();
      }
    }
  }, [mode, selectedFunctionId, functionData, neighborhood, loadNeighborhood, clearGraph]);

  // Load data flow slice (data-flow mode)
  useEffect(() => {
    if (mode === 'data-flow' && dataFlowSlice) {
      loadDataFlowSlice(dataFlowSlice.originNode, dataFlowSlice.slice);
    } else if (mode === 'data-flow' && !dataFlowSlice) {
      clearGraph();
    }
  }, [mode, dataFlowSlice, loadDataFlowSlice, clearGraph]);

  // Pass selected node up
  useEffect(() => {
    onNodeSelect(selectedNodeId);
  }, [selectedNodeId, onNodeSelect]);

  return (
    <div className="flex-1 relative bg-white" style={{ minHeight: '400px' }}>
      {isLoading && selectedFunctionId && (
        <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          Loading graph...
        </div>
      )}
      {!selectedFunctionId && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div>Select a function to display call graph</div>
            <div className="text-sm mt-2">Use search or select a function from package list</div>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
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
