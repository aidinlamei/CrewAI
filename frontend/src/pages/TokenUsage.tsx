import { useQuery } from '@tanstack/react-query'

export default function TokenUsage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Token Usage</h1>

        <div className="card">
          <p className="text-gray-600">
            Token usage dashboard - Track your LLM token consumption and costs.
          </p>
          {/* TODO: Implement token usage tracking and visualization */}
        </div>
      </div>
    </div>
  )
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { tokenService } from '@/services/tokenService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TokenUsage() {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ['token-usage'],
    queryFn: () => tokenService.getUsage(),
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Token Usage Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Tokens</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {usageData?.total_tokens?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            ${usageData?.total_cost?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Executions</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {usageData?.execution_count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Cost/Exec</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            $
            {(
              (usageData?.total_cost || 0) / (usageData?.execution_count || 1)
            ).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Usage Over Time */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Token Usage Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={usageData?.usage_by_date || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="tokens"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Usage by Agent */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Usage by Agent</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usageData?.usage_by_agent || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agent_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tokens" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Model */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Cost by Model</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={usageData?.cost_by_model || []}
                dataKey="cost"
                nameKey="model"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(usageData?.cost_by_model || []).map(
                  (entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  )
                )}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
