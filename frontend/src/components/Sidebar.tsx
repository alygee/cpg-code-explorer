import { useState } from 'react';
import { usePackages, usePackageFunctions } from '../hooks/useApi';

interface SidebarProps {
  onSelectFunction: (functionId: string) => void;
}

export function Sidebar({ onSelectFunction }: SidebarProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { data: packages, isLoading: packagesLoading } = usePackages();
  const { data: functions, isLoading: functionsLoading } = usePackageFunctions(selectedPackage);

  return (
    <div className="w-full h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Navigation</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Packages</h3>
          {packagesLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-1">
              {packages?.map((pkg) => {
                const isExpanded = selectedPackage === pkg.package;
                return (
                  <div key={pkg.package}>
                    <button
                      onClick={() => setSelectedPackage(
                        isExpanded ? null : pkg.package
                      )}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        isExpanded
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        <div className="flex-1">
                          <div className="font-medium break-words">{pkg.package}</div>
                          <div className="text-xs text-gray-500">
                            {pkg.functions} functions
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="pl-4 pr-2 py-2">
                        {functionsLoading ? (
                          <div className="text-sm text-gray-500 pl-6">Loading...</div>
                        ) : (
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {functions?.map((func) => (
                              <button
                                key={func.id}
                                onClick={() => onSelectFunction(func.id)}
                                className="w-full text-left px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                              >
                                <div className="font-medium break-words">{func.name}</div>
                                {func.file && (
                                  <div className="text-xs text-gray-500 break-words">
                                    {func.file}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

