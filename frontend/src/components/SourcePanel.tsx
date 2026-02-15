import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-go';
import 'prismjs/themes/prism.css';
import { useSource, useFunction } from '../hooks/useApi';

interface SourcePanelProps {
  selectedNodeId: string | null;
  highlightedLines?: Set<number>; // Line numbers to highlight (1-based)
}

export function SourcePanel({ selectedNodeId, highlightedLines = new Set() }: SourcePanelProps) {
  const { data: functionData } = useFunction(selectedNodeId);
  const { data: sourceCode, isLoading } = useSource(
    functionData?.file || null
  );

  if (!selectedNodeId) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center text-gray-400">
        Select a function to view source code
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading source code...</div>
      </div>
    );
  }

  if (!sourceCode) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center text-gray-400">
        Source code not found
      </div>
    );
  }

  // Highlight function line
  // functionLine from SQL - 1-based, slice - 0-based
  const lines = sourceCode.content.split('\n');
  const functionLine = functionData?.line || 1;
  const startLine = Math.max(0, functionLine - 1 - 10); // convert 1-based to 0-based
  const endLine = Math.min(lines.length, functionLine - 1 + 20);
  const visibleLines = lines.slice(startLine, endLine);
  const startLineNumber = startLine + 1; // for display (1-based)

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          {functionData?.file || 'Source Code'}
        </div>
        {functionData?.line && (
          <div className="text-xs text-gray-500">
            Line {functionData.line}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex">
          <div className="px-2 py-2 bg-gray-50 text-xs text-gray-500 font-mono border-r border-gray-200">
            {visibleLines.map((_, idx) => (
              <div key={idx} className="h-5 leading-5">
                {startLineNumber + idx}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="p-2" style={{ fontFamily: '"Fira code", "Fira Mono", monospace', fontSize: 14 }}>
              {visibleLines.map((line, idx) => {
                const lineNumber = startLineNumber + idx;
                const isHighlighted = highlightedLines.has(lineNumber);
                return (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 ${isHighlighted ? 'bg-yellow-200' : ''}`}
                    style={{ minHeight: '20px', lineHeight: '20px' }}
                  >
                    <pre
                      className="m-0"
                      dangerouslySetInnerHTML={{
                        __html: highlight(line, languages.go, 'go')
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

