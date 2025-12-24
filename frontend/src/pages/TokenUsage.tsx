import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, DollarSign, Zap } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Card, CardHeader, PageSpinner, EmptyState } from '@/components/Common'
import { executionService } from '@/services/executionService'

export default function TokenUsage() {
  // Get executions to calculate token usage
  const { data: executions, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionService.list(),
  })

  // Calculate stats
  const stats = executions?.reduce(
    (acc, exec) => {
      acc.totalTokens += exec.tokens_used || 0
      acc.totalCost += Number(exec.estimated_cost) || 0
      acc.totalExecutions += 1
      if (exec.status === 'completed') acc.successfulExecutions += 1
      return acc
    },
    { totalTokens: 0, totalCost: 0, totalExecutions: 0, successfulExecutions: 0 }
  ) || { totalTokens: 0, totalCost: 0, totalExecutions: 0, successfulExecutions: 0 }

  // Group by date for chart data
  const dailyUsage = executions?.reduce((acc, exec) => {
    const date = new Date(exec.created_at).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = { tokens: 0, cost: 0, count: 0 }
    }
    acc[date].tokens += exec.tokens_used || 0
    acc[date].cost += Number(exec.estimated_cost) || 0
    acc[date].count += 1
    return acc
  }, {} as Record<string, { tokens: number; cost: number; count: number }>) || {}

  const chartData = Object.entries(dailyUsage)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7) // Last 7 days

  return (
    <MainLayout title="Token Usage">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Token Usage</h1>
        <p className="text-gray-600">Monitor your AI model usage and costs</p>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tokens</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalTokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${stats.totalCost.toFixed(4)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Executions</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalExecutions}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Tokens/Exec</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalExecutions > 0
                      ? Math.round(stats.totalTokens / stats.totalExecutions).toLocaleString()
                      : '0'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Usage Chart (Placeholder - would use Recharts) */}
          <Card className="mb-6">
            <CardHeader
              title="Daily Usage (Last 7 Days)"
              subtitle="Token usage and cost breakdown"
            />
            {chartData.length > 0 ? (
              <div className="space-y-3">
                {chartData.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-24">{day.date}</span>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (day.tokens / Math.max(...chartData.map(d => d.tokens))) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">
                      {day.tokens.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 w-20 text-right">
                      ${day.cost.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No usage data"
                description="Execute some projects to see usage statistics"
              />
            )}
          </Card>

          {/* Recent Executions Table */}
          <Card>
            <CardHeader
              title="Recent Token Usage"
              subtitle="Detailed breakdown by execution"
            />
            {executions && executions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Tokens</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.slice(0, 10).map((exec) => (
                      <tr key={exec.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {new Date(exec.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            exec.status === 'completed' ? 'bg-green-100 text-green-700' :
                            exec.status === 'failed' ? 'bg-red-100 text-red-700' :
                            exec.status === 'running' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {exec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          {(exec.tokens_used || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          ${(Number(exec.estimated_cost) || 0).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No executions yet"
                description="Execute a project to track token usage"
              />
            )}
          </Card>
        </>
      )}
    </MainLayout>
  )
}
