import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useExecutionWebSocket } from '@/hooks/useExecutionWebSocket';
import { executionService } from '@/services/executionService';

export default function ExecutionDetail() {
  const { executionId } = useParams<{ executionId: string }>();

  const { data: execution, isLoading } = useQuery({
    queryKey: ['execution', executionId],
    queryFn: () => executionService.get(executionId!),
    enabled: !!executionId,
  });

  const { logs, status, result, error, isConnected } =
    useExecutionWebSocket(executionId || null);

  const handleExport = async (format: 'excel' | 'word' | 'pdf') => {
    if (!executionId) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/executions/${executionId}/export/${format}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `execution_${executionId}.${format === 'excel' ? 'xlsx' : format === 'word' ? 'docx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p>Loading execution details...</p>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p>Execution not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Execution Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export Excel
          </button>
          <button
            onClick={() => handleExport('word')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export Word
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Execution Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Execution ID</p>
            <p className="font-mono text-sm">{execution.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                execution.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : execution.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : execution.status === 'running'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status || execution.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="text-sm">
              {new Date(execution.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">WebSocket</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Logs */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Execution Logs</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{' '}
              <span
                className={
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'task'
                      ? 'text-green-400'
                      : 'text-gray-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-500">No logs available yet...</p>
          )}
        </div>
      </div>

      {/* Result */}
      {(result || execution.result) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Result</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(result || execution.result, null, 2)}
          </pre>
        </div>
      )}

      {/* Error */}
      {(error || execution.error_message) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-4">Error</h2>
          <p className="text-red-700">{error || execution.error_message}</p>
        </div>
      )}
    </div>
  );
}
