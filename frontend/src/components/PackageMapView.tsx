import { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { type Core, type NodeSingular, type EventObject } from 'cytoscape';
import { usePackageGraph, usePackageTreemap } from '../hooks/useApi';
import type { PackageTreemap } from '../types';

interface PackageMapViewProps {
  selectedPackage: string | null;
  onPackageSelect: (packageName: string) => void;
}

// Function to determine module from package name
function getModuleFromPackage(packageName: string): string {
  const firstSegment = packageName.split('/')[0].split('::')[0];
  
  if (firstSegment === 'prometheus' || firstSegment.startsWith('prometheus')) {
    return 'prometheus';
  }
  if (firstSegment === 'client_golang' || firstSegment.includes('client_golang')) {
    return 'client_golang';
  }
  if (firstSegment === 'adapter' || firstSegment.includes('adapter') || firstSegment.includes('sigs.k8s.io')) {
    return 'adapter';
  }
  if (firstSegment === 'alertmanager' || firstSegment.includes('alertmanager')) {
    return 'alertmanager';
  }
  return 'other';
}

// Function to get module color (for Cytoscape)
function getModuleColorHex(module: string): string {
  const colors: Record<string, string> = {
    prometheus: '#3b82f6', // blue-500
    client_golang: '#10b981', // green-500
    adapter: '#a855f7', // purple-500
    alertmanager: '#f97316', // orange-500
    other: '#9ca3af' // gray-400
  };
  return colors[module] || colors.other;
}

// Function to get module background color (for Cytoscape)
function getModuleBgColorHex(module: string): string {
  const colors: Record<string, string> = {
    prometheus: '#dbeafe', // blue-50
    client_golang: '#d1fae5', // green-50
    adapter: '#f3e8ff', // purple-50
    alertmanager: '#ffedd5', // orange-50
    other: '#f9fafb' // gray-50
  };
  return colors[module] || colors.other;
}

export function PackageMapView({ selectedPackage, onPackageSelect }: PackageMapViewProps) {
  const [maxEdges, setMaxEdges] = useState(50);
  const [minWeight, setMinWeight] = useState(3);
  const [layoutType, setLayoutType] = useState<'cose' | 'dagre' | 'breadthfirst'>('cose');
  const { data: graphData, isLoading: graphLoading } = usePackageGraph(maxEdges, minWeight);
  const { data: treemapData, isLoading: treemapLoading } = usePackageTreemap();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Calculate node sizes based on total_complexity
  const complexityMap = useMemo(() => {
    const map = new Map<string, number>();
    if (treemapData) {
      treemapData.forEach(pkg => {
        map.set(pkg.package, pkg.total_complexity);
      });
    }
    return map;
  }, [treemapData]);

  // Find min and max complexity values for normalization
  const { minComplexity, maxComplexity } = useMemo(() => {
    if (complexityMap.size === 0) {
      return { minComplexity: 0, maxComplexity: 1 };
    }
    const values = Array.from(complexityMap.values());
    return {
      minComplexity: Math.min(...values),
      maxComplexity: Math.max(...values)
    };
  }, [complexityMap]);

  // Function to normalize node size (from 40 to 120 pixels)
  const getNodeSize = (complexity: number): number => {
    if (maxComplexity === minComplexity) return 60;
    const normalized = (complexity - minComplexity) / (maxComplexity - minComplexity);
    return 40 + normalized * 80; // From 40 to 120
  };

  // Create set of unique packages from graph
  const packageSet = useMemo(() => {
    const set = new Set<string>();
    if (graphData) {
      graphData.forEach(edge => {
        set.add(edge.source);
        set.add(edge.target);
      });
    }
    return set;
  }, [graphData]);

  // Initialize and update Cytoscape graph
  useEffect(() => {
    if (!containerRef.current) return;

    // Create map for quick access to package metrics
    const treemapMap = new Map<string, PackageTreemap>();
    if (treemapData) {
      treemapData.forEach(pkg => {
        treemapMap.set(pkg.package, pkg);
      });
    }

    // Convert data to Cytoscape format
    const elements: Array<{ data: any }> = [];

    // Create nodes
    packageSet.forEach(packageName => {
      const treemap = treemapMap.get(packageName);
      const complexity = treemap?.total_complexity || 0;
      const size = getNodeSize(complexity);
      const module = getModuleFromPackage(packageName);
      
      elements.push({
        data: {
          id: packageName,
          label: packageName,
          package: packageName,
          complexity: complexity,
          functions: treemap?.function_count || 0,
          size: size,
          module: module
        }
      });
    });

    // Calculate min/max weights for edge thickness normalization
    if (graphData && graphData.length > 0) {
      const weights = graphData.map(e => e.weight);
      const maxWeight = Math.max(...weights);
      const minEdgeWeight = Math.min(...weights);

      // Create edges
      graphData.forEach((edge, index) => {
        const normalizedWeight = maxWeight > minEdgeWeight 
          ? 1 + ((edge.weight - minEdgeWeight) / (maxWeight - minEdgeWeight)) * 4
          : 2;
        
        elements.push({
          data: {
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            weight: edge.weight,
            width: normalizedWeight
          }
        });
      });
    }

    // Destroy previous instance if exists
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    // Create new Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        // Node styles
        {
          selector: 'node',
          style: {
            'width': 'mapData(size, 40, 120, 40, 120)',
            'height': 'mapData(size, 40, 120, 40, 120)',
            'shape': 'round-rectangle',
            'background-color': (ele: NodeSingular) => {
              const module = ele.data('module') as string;
              return getModuleBgColorHex(module);
            },
            'border-width': 3,
            'border-color': (ele: NodeSingular) => {
              const module = ele.data('module') as string;
              return getModuleColorHex(module);
            },
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            'font-size': '11px',
            'font-weight': 'bold',
            'color': '#1f2937',
            'text-outline-width': 1,
            'text-outline-color': '#ffffff',
            'overlay-padding': '4px'
          }
        },
        // Edge styles
        {
          selector: 'edge',
          style: {
            'width': 'mapData(width, 1, 5, 1, 5)',
            'line-color': '#6b7280',
            'target-arrow-color': '#6b7280',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.2,
            'curve-style': 'bezier',
            'opacity': 0.6
          }
        },
        // Style for selected node
        {
          selector: 'node:selected',
          style: {
            'border-width': 5,
            'border-color': '#2563eb',
            'background-color': '#dbeafe'
          }
        }
      ],
      layout: {
        name: layoutType,
        ...(layoutType === 'cose' ? {
          idealEdgeLength: 100,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 30,
          randomize: false,
          componentSpacing: 100,
          nodeRepulsion: 4500,
          edgeElasticity: 100,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 2500,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0
        } : layoutType === 'dagre' ? {
          rankDir: 'LR',
          nodeSep: 80,
          edgeSep: 30,
          rankSep: 150,
          fit: true,
          padding: 30
        } : {
          directed: true,
          roots: undefined,
          padding: 30,
          fit: true
        })
      }
    });

    // Node click handler
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      const packageName = node.data('package') as string;
      if (packageName) {
        onPackageSelect(packageName);
      }
    });

    // Highlight selected package
    if (selectedPackage) {
      const selectedNode = cy.getElementById(selectedPackage);
      if (selectedNode.length > 0) {
        selectedNode.select();
        cy.center(selectedNode);
      }
    }

    cyRef.current = cy;

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graphData, treemapData, packageSet, selectedPackage, layoutType, onPackageSelect]);

  const isLoading = graphLoading || treemapLoading;
  const nodeCount = packageSet.size;
  const edgeCount = graphData?.length || 0;

  return (
    <div className="flex-1 relative bg-white" style={{ minHeight: '400px' }}>
      {/* Filter control panel */}
      <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-lg shadow-lg p-3 flex gap-3 items-center text-xs border border-gray-200">
        <label className="text-gray-700 font-medium flex items-center gap-1">
          Min weight:
          <select 
            value={minWeight} 
            onChange={e => setMinWeight(Number(e.target.value))}
            className="ml-1 border rounded px-2 py-1 text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
        <label className="text-gray-700 font-medium flex items-center gap-1">
          Max edges:
          <select 
            value={maxEdges} 
            onChange={e => setMaxEdges(Number(e.target.value))}
            className="ml-1 border rounded px-2 py-1 text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </label>
        <label className="text-gray-700 font-medium flex items-center gap-1">
          Layout:
          <select 
            value={layoutType} 
            onChange={e => setLayoutType(e.target.value as 'cose' | 'dagre' | 'breadthfirst')}
            className="ml-1 border rounded px-2 py-1 text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cose">COSE</option>
            <option value="breadthfirst">Breadthfirst</option>
          </select>
        </label>
        <span className="text-gray-500 text-xs">
          {nodeCount} nodes, {edgeCount} edges
        </span>
      </div>

      {isLoading && (
        <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          Loading package graph...
        </div>
      )}
      {!isLoading && (!graphData || graphData.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10">
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <div>No package data</div>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
