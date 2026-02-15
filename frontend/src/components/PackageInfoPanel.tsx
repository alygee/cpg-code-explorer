import { usePackageTreemap, usePackageDetails } from '../hooks/useApi';

interface PackageInfoPanelProps {
  packageName: string | null;
  onSelectFunction: (functionId: string) => void;
}

export function PackageInfoPanel({ packageName, onSelectFunction }: PackageInfoPanelProps) {
  const { data: treemapData } = usePackageTreemap();
  const { data: functions, isLoading: functionsLoading } = usePackageDetails(packageName);

  // Find metrics for selected package
  const packageMetrics = packageName 
    ? treemapData?.find(pkg => pkg.package === packageName)
    : null;

  if (!packageName) {
    return (
      <div className="w-full h-full bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Package Information</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <div>Select a package on the graph</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 break-words">{packageName}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Package metrics */}
        {packageMetrics && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Package Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Files</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.file_count.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Functions</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.function_count.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">LOC</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.total_loc.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Complexity</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.total_complexity.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Complexity</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.avg_complexity.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Max Complexity</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.max_complexity}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Types</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.type_count}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Interfaces</div>
                <div className="text-lg font-semibold text-gray-800">
                  {packageMetrics.interface_count}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Function list */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Functions</h3>
          {functionsLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : functions && functions.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {functions.map((func) => (
                <button
                  key={func.function_id}
                  onClick={() => onSelectFunction(func.function_id)}
                  className="w-full text-left px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border border-transparent hover:border-gray-300"
                >
                  <div className="font-medium break-words">{func.name}</div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {func.complexity !== null && (
                      <span>Complexity: {func.complexity}</span>
                    )}
                    {func.loc !== null && (
                      <span>LOC: {func.loc}</span>
                    )}
                    {func.fan_in !== null && (
                      <span>Fan-in: {func.fan_in}</span>
                    )}
                    {func.fan_out !== null && (
                      <span>Fan-out: {func.fan_out}</span>
                    )}
                  </div>
                  {func.file && (
                    <div className="text-xs text-gray-400 mt-1 break-words">
                      {func.file}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No functions</div>
          )}
        </div>
      </div>
    </div>
  );
}

