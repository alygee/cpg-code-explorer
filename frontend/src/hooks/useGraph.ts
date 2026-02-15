import { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { Node as CPGNode, FunctionNeighborhood, DataFlowSliceResult } from '../types';

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

// Function to calculate layout using dagre
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

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    let width = 180;
    let height = 50;
    if (node.type === 'center' || node.type === 'origin') {
      width = 200;
      height = 60;
    }
    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Update node positions
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    let width = 180;
    let height = 50;
    if (node.type === 'center' || node.type === 'origin') {
      width = 200;
      height = 60;
    }
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

  // Load neighborhood into graph
  const loadNeighborhood = useCallback(
    (centerNode: CPGNode, neighborhood: FunctionNeighborhood) => {
      const reactFlowNodes: Node[] = [];
      const reactFlowEdges: Edge[] = [];

      // Center node
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
        position: { x: 0, y: 0 }, // Temporary position, will be recalculated
      });

      // Callers (left)
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
          position: { x: 0, y: 0 }, // Temporary position
        });
        reactFlowEdges.push({
          id: `edge-${caller.id}-${centerNode.id}`,
          source: caller.id,
          target: centerNode.id,
          type: 'smoothstep',
          animated: false,
        });
      });

      // Callees (right)
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
          position: { x: 0, y: 0 }, // Temporary position
        });
        reactFlowEdges.push({
          id: `edge-${centerNode.id}-${callee.id}`,
          source: centerNode.id,
          target: callee.id,
          type: 'smoothstep',
          animated: false,
        });
      });

      // Apply layout
      const layoutedNodes = getLayoutedElements(reactFlowNodes, reactFlowEdges, 'LR');
      setNodes(layoutedNodes);
      setEdges(reactFlowEdges);
      setSelectedNodeId(centerNode.id);
    },
    [setNodes, setEdges]
  );

  // Load data flow slice into graph
  const loadDataFlowSlice = useCallback(
    (originNode: CPGNode, slice: DataFlowSliceResult) => {
      const reactFlowNodes: Node[] = [];
      const reactFlowEdges: Edge[] = [];

      // Create node map for quick access
      const nodeMap = new Map<string, CPGNode>();
      slice.nodes.forEach(node => nodeMap.set(node.id, node));

      // Center node (origin - selected variable)
      reactFlowNodes.push({
        id: originNode.id,
        type: 'origin',
        data: {
          label: originNode.name,
          kind: originNode.kind,
          package: originNode.package,
          file: originNode.file,
          line: originNode.line,
        },
        position: { x: 0, y: 0 }, // Temporary position
      });

      // Add remaining slice nodes
      slice.nodes.forEach(node => {
        if (node.id === originNode.id) return; // Already added as origin

        // Determine node type: definition (def) or use
        // If there's an incoming DFG edge - it's use, if only outgoing - def
        const hasIncoming = slice.edges.some(e => e.target === node.id);
        const hasOutgoing = slice.edges.some(e => e.source === node.id);
        
        let nodeType: 'def' | 'use' = 'use';
        if (!hasIncoming && hasOutgoing) {
          nodeType = 'def';
        }

        reactFlowNodes.push({
          id: node.id,
          type: nodeType,
          data: {
            label: node.name || node.kind,
            kind: node.kind,
            package: node.package,
            file: node.file,
            line: node.line,
          },
          position: { x: 0, y: 0 }, // Temporary position
        });
      });

      // Add DFG edges
      slice.edges.forEach((edge, index) => {
        reactFlowEdges.push({
          id: `dfg-edge-${index}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          markerEnd: {
            type: 'arrowclosed',
            color: '#3b82f6',
          },
        });
      });

      // Apply layout (TB - top to bottom for data flow)
      const layoutedNodes = getLayoutedElements(reactFlowNodes, reactFlowEdges, 'TB');
      setNodes(layoutedNodes);
      setEdges(reactFlowEdges);
      setSelectedNodeId(originNode.id);
    },
    [setNodes, setEdges]
  );

  // Clear graph
  const clearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  // Node click handler (select node to view code)
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  // Node double-click handler (navigate to function)
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    onNodeDoubleClick,
    selectedNodeId,
    setSelectedNodeId,
    loadNeighborhood,
    loadDataFlowSlice,
    clearGraph,
  };
}
