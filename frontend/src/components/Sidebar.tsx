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
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Навигация</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Пакеты</h3>
          {packagesLoading ? (
            <div className="text-sm text-gray-500">Загрузка...</div>
          ) : (
            <div className="space-y-1">
              {packages?.slice(0, 50).map((pkg) => (
                <button
                  key={pkg.package}
                  onClick={() => setSelectedPackage(
                    selectedPackage === pkg.package ? null : pkg.package
                  )}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedPackage === pkg.package
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium truncate">{pkg.package}</div>
                  <div className="text-xs text-gray-500">
                    {pkg.functions} функций
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPackage && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Функции ({selectedPackage})
            </h3>
            {functionsLoading ? (
              <div className="text-sm text-gray-500">Загрузка...</div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {functions?.map((func) => (
                  <button
                    key={func.id}
                    onClick={() => onSelectFunction(func.id)}
                    className="w-full text-left px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  >
                    <div className="font-medium truncate">{func.name}</div>
                    {func.file && (
                      <div className="text-xs text-gray-500 truncate">
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
    </div>
  );
}

