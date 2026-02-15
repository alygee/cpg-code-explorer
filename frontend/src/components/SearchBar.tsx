import { useState, useRef, useEffect } from 'react';
import { useSearchFunctions } from '../hooks/useApi';
import type { SearchResult } from '../types';

interface SearchBarProps {
  onSelectFunction: (functionId: string) => void;
}

export function SearchBar({ onSelectFunction }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: results, isLoading } = useSearchFunctions(query, 20);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (result: SearchResult) => {
    onSelectFunction(result.id);
    setQuery(result.name);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search functions..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {isOpen && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500">Loading...</div>
          ) : !results || results.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">No results found</div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium">{result.name}</div>
                {result.package && (
                  <div className="text-sm text-gray-500">{result.package}</div>
                )}
                {result.file && (
                  <div className="text-xs text-gray-400">{result.file}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

