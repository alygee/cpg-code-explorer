import { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { Node as CPGNode, FunctionNeighborhood } from '../types';

export interface GraphNode {
  id: string;
  label: string;
  kind: string;
  package: string | null;
  file: string | null;
  line: number | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
}

// Функция для вычисления layout с помощью dagre
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'BT' | 'LR' | 'RL' = 'LR'
): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: 50, 
    edgesep: 20, 
    ranksep: 100 
  });

  // Добавляем узлы в dagre граф
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.type === 'center' ? 200 : 180, 
      height: node.type === 'center' ? 60 : 50 
    });
  });

  // Добавляем рёбра в dagre граф
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Вычисляем layout
  dagre.layout(dagreGraph);

  // Обновляем позиции узлов
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === 'center' ? 200 : 180;
    const height = node.type === 'center' ? 60 : 50;
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });
}

export function useGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Загрузка neighborhood в граф
  const loadNeighborhood = useCallback(
    (centerNode: CPGNode, neighborhood: FunctionNeighborhood) => {
      const reactFlowNodes: Node[] = [];
      const reactFlowEdges: Edge[] = [];

      // Центральный узел
      reactFlowNodes.push({
        id: centerNode.id,
        type: 'center',
        data: {
          label: centerNode.name,
          kind: centerNode.kind,
          package: centerNode.package,
          file: centerNode.file,
          line: centerNode.line,
        },
        position: { x: 0, y: 0 }, // Временная позиция, будет пересчитана
      });

      // Callers (слева)
      neighborhood.callers.forEach((caller) => {
        reactFlowNodes.push({
          id: caller.id,
          type: 'caller',
          data: {
            label: caller.name,
            kind: caller.kind,
            package: caller.package,
            file: caller.file,
            line: caller.line,
          },
          position: { x: 0, y: 0 }, // Временная позиция
        });
        reactFlowEdges.push({
          id: `edge-${caller.id}-${centerNode.id}`,
          source: caller.id,
          target: centerNode.id,
          type: 'smoothstep',
          animated: false,
        });
      });

      // Callees (справа)
      neighborhood.callees.forEach((callee) => {
        reactFlowNodes.push({
          id: callee.id,
          type: 'callee',
          data: {
            label: callee.name,
            kind: callee.kind,
            package: callee.package,
            file: callee.file,
            line: callee.line,
          },
          position: { x: 0, y: 0 }, // Временная позиция
        });
        reactFlowEdges.push({
          id: `edge-${centerNode.id}-${callee.id}`,
          source: centerNode.id,
          target: callee.id,
          type: 'smoothstep',
          animated: false,
        });
      });

      // Применяем layout
      const layoutedNodes = getLayoutedElements(reactFlowNodes, reactFlowEdges, 'LR');
      setNodes(layoutedNodes);
      setEdges(reactFlowEdges);
      setSelectedNodeId(centerNode.id);
    },
    [setNodes, setEdges]
  );

  // Очистить граф
  const clearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  // Обработчик клика по узлу
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    selectedNodeId,
    setSelectedNodeId,
    loadNeighborhood,
    clearGraph,
  };
}
