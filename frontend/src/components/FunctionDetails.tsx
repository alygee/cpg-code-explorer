import { useFunction } from '../hooks/useApi';

interface FunctionDetailsProps {
  functionId: string | null;
}

export function FunctionDetails({ functionId }: FunctionDetailsProps) {
  const { data: functionData, isLoading } = useFunction(functionId);

  if (!functionId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-80 flex-shrink-0 h-full p-4 bg-white border-r border-gray-200">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!functionData) {
    return (
      <div className="w-80 flex-shrink-0 h-full p-4 bg-white border-r border-gray-200">
        <div className="text-red-500">Функция не найдена</div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 h-full p-4 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800 break-words">{functionData.name}</h3>
        {functionData.package && (
          <div className="text-sm text-gray-600 mt-1 break-words">{functionData.package}</div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        {functionData.cyclomatic_complexity !== null && (
          <div>
            <div className="text-xs text-gray-500">Сложность</div>
            <div className="text-lg font-semibold text-gray-800">
              {functionData.cyclomatic_complexity}
            </div>
          </div>
        )}
        {functionData.fan_in !== null && (
          <div>
            <div className="text-xs text-gray-500">Fan-in</div>
            <div className="text-lg font-semibold text-gray-800">
              {functionData.fan_in}
            </div>
          </div>
        )}
        {functionData.fan_out !== null && (
          <div>
            <div className="text-xs text-gray-500">Fan-out</div>
            <div className="text-lg font-semibold text-gray-800">
              {functionData.fan_out}
            </div>
          </div>
        )}
        {functionData.loc !== null && (
          <div>
            <div className="text-xs text-gray-500">LOC</div>
            <div className="text-lg font-semibold text-gray-800">
              {functionData.loc}
            </div>
          </div>
        )}
      </div>

      {functionData.type_info && (
        <div className="mt-4">
          <div className="text-xs text-gray-500">Тип</div>
          <div className="text-sm text-gray-700 font-mono mt-1">
            {functionData.type_info}
          </div>
        </div>
      )}
    </div>
  );
}

