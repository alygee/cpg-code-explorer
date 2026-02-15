import { useState } from 'react';
import { useVariables } from '../hooks/useApi';
import type { Variable } from '../types';

interface DataFlowPanelProps {
  functionId: string | null;
  onSelectVariable: (variableId: string, direction: 'backward' | 'forward') => void;
}

export function DataFlowPanel({ functionId, onSelectVariable }: DataFlowPanelProps) {
  const { data: variables, isLoading } = useVariables(functionId);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [direction, setDirection] = useState<'backward' | 'forward'>('backward');

  if (!functionId) {
    return (
      <div className="w-full bg-gray-50 border-r border-gray-200 p-4 text-gray-400 text-sm">
        Select a function to view variables
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 border-r border-gray-200 p-4">
        <div className="text-gray-500">Loading variables...</div>
      </div>
    );
  }

  if (!variables || variables.length === 0) {
    return (
      <div className="w-full bg-gray-50 border-r border-gray-200 p-4 text-gray-400 text-sm">
        Variables not found
      </div>
    );
  }

  const handleVariableClick = (variable: Variable) => {
    setSelectedVariableId(variable.id);
    onSelectVariable(variable.id, direction);
  };

  const handleDirectionChange = (newDirection: 'backward' | 'forward') => {
    setDirection(newDirection);
    if (selectedVariableId) {
      onSelectVariable(selectedVariableId, newDirection);
    }
  };

  // Group variables by type
  const parameters = variables.filter(v => v.kind === 'parameter');
  const locals = variables.filter(v => v.kind === 'local');
  const results = variables.filter(v => v.kind === 'result');

  return (
    <div className="w-full bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Slice Direction</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleDirectionChange('backward')}
            className={`flex-1 px-3 py-2 text-sm rounded ${
              direction === 'backward'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Backward
          </button>
          <button
            onClick={() => handleDirectionChange('forward')}
            className={`flex-1 px-3 py-2 text-sm rounded ${
              direction === 'forward'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Forward
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {direction === 'backward' 
            ? 'Find all definitions influencing the variable'
            : 'Find all uses of the variable'}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {parameters.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Parameters</h4>
            <div className="space-y-1">
              {parameters.map(variable => (
                <button
                  key={variable.id}
                  onClick={() => handleVariableClick(variable)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedVariableId === variable.id
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium break-words">{variable.name}</div>
                  {variable.type_info && (
                    <div className="text-xs text-gray-500 mt-1 break-words">{variable.type_info}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {locals.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Local Variables</h4>
            <div className="space-y-1">
              {locals.map(variable => (
                <button
                  key={variable.id}
                  onClick={() => handleVariableClick(variable)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedVariableId === variable.id
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium break-words">{variable.name}</div>
                  {variable.type_info && (
                    <div className="text-xs text-gray-500 mt-1 break-words">{variable.type_info}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Return Values</h4>
            <div className="space-y-1">
              {results.map(variable => (
                <button
                  key={variable.id}
                  onClick={() => handleVariableClick(variable)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedVariableId === variable.id
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium break-words">{variable.name}</div>
                  {variable.type_info && (
                    <div className="text-xs text-gray-500 mt-1 break-words">{variable.type_info}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

