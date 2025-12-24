import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, DollarSign, Zap } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Card, CardHeader, PageSpinner, EmptyState, Select } from '@/components/Common'
import { TokenUsageChart, ExecutionStats, BarChartComponent } from '@/components/Charts'
import { executionService } from '@/services/executionService'
import { projectService } from '@/services/projectService'

type TimeRange = '7d' | '30d' | '90d' | 'all'

export default function TokenUsage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [selectedProject, setSelectedProject] = useState<string>('')

  // Get executions
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionService.list(),
  })

  // Get projects for filter
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list(),
  })

  // Filter executions by time range and project
  const filteredExecutions = useMemo(() => {
    if (!executions) return []

    let filtered = [...executions]

    // Filter by project
    if (selectedProject) {
      filtered = filtered.filter(e => e.project_id === selectedProject)
    }

    // Filter by time range
    const now = new Date()
    const ranges: Record<TimeRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': Infinity,
    }
    const days = ranges[timeRange]
    
    if (days !== Infinity) {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(e => new Date(e.created_at) >= cutoff)
    }

    return filtered
  }, [executions, timeRange, selectedProject])

  // Calculate stats
  const stats = useMemo(() => {
    return filteredExecutions.reduce(
      (acc, exec) => {
        acc.totalTokens += exec.tokens_used || 0
        acc.totalCost += Number(exec.estimated_cost) || 0
        acc.totalExecutions += 1
        if (exec.status === 'completed') acc.successfulExecutions += 1
        return acc
      },
      { totalTokens: 0, totalCost: 0, totalExecutions: 0, successfulExecutions: 0 }
    )
  }, [filteredExecutions])

  // Prepare daily usage data for chart
  const dailyUsageData = useMemo(() => {
    const usageByDate: Record<string, { tokens: number; cost: number; count: number }> = {}

    filteredExecutions.forEach(exec => {
      const date = new Date(exec.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      if (!usageByDate[date]) {
        usageByDate[date] = { tokens: 0, cost: 0, count: 0 }
      }
      usageByDate[date].tokens += exec.tokens_used || 0
      usageByDate[date].cost += Number(exec.estimated_cost) || 0
      usageByDate[date].count += 1
    })

    return Object.entries(usageByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredExecutions])

  // Prepare status data for pie chart
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {}
    
    filteredExecutions.forEach(exec => {
      statusCounts[exec.status] = (statusCounts[exec.status] || 0) + 1
    })

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }))
  }, [filteredExecutions])

  // Prepare project usage data for bar chart
  const projectUsageData = useMemo(() => {
    if (!projects) return []

    const usageByProject: Record<string, { name: string; tokens: number; cost: number }> = {}

    filteredExecutions.forEach(exec => {
      const project = projects.find(p => p.id === exec.project_id)
      const projectName = project?.name || 'Unknown'
      
      if (!usageByProject[exec.project_id]) {
        usageByProject[exec.project_id] = { name: projectName, tokens: 0, cost: 0 }
      }
      usageByProject[exec.project_id].tokens += exec.tokens_used || 0
      usageByProject[exec.project_id].cost += Number(exec.estimated_cost) || 0
    })

    return Object.values(usageByProject)
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10)
  }, [filteredExecutions, projects])

  const isLoading = executionsLoading

  return (
    <MainLayout title="Token Usage">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Token Usage</h1>
          <p className="text-gray-600">Monitor your AI model usage and costs</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={[
              { value: '', label: 'All Projects' },
              ...(projects?.map(p => ({ value: p.id, label: p.name })) || []),
            ]}
          />
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'all', label: 'All time' },
            ]}
          />
        </div>
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

          {filteredExecutions.length > 0 ? (
            <>
              {/* Usage Over Time Chart */}
              <Card className="mb-6">
                <CardHeader
                  title="Usage Over Time"
                  subtitle="Token usage and cost trends"
                />
                {dailyUsageData.length > 0 ? (
                  <TokenUsageChart data={dailyUsageData} height={300} />
                ) : (
                  <EmptyState title="No data for selected period" />
                )}
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Execution Status */}
                <Card>
                  <CardHeader
                    title="Execution Status"
                    subtitle="Distribution by status"
                  />
                  {statusData.length > 0 ? (
                    <ExecutionStats data={statusData} height={250} />
                  ) : (
                    <EmptyState title="No executions" />
                  )}
                </Card>

                {/* Usage by Project */}
                <Card>
                  <CardHeader
                    title="Usage by Project"
                    subtitle="Top projects by token usage"
                  />
                  {projectUsageData.length > 0 ? (
                    <BarChartComponent data={projectUsageData} height={250} />
                  ) : (
                    <EmptyState title="No project data" />
                  )}
                </Card>
              </div>

              {/* Recent Executions Table */}
              <Card>
                <CardHeader
                  title="Recent Token Usage"
                  subtitle="Detailed breakdown by execution"
                />
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Project</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Tokens</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExecutions.slice(0, 10).map((exec) => {
                        const project = projects?.find(p => p.id === exec.project_id)
                        return (
                          <tr key={exec.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {new Date(exec.created_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {project?.name || 'Unknown'}
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
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                title="No usage data"
                description="Execute some projects to see usage statistics"
              />
            </Card>
          )}
        </>
      )}
    </MainLayout>
  )
}
