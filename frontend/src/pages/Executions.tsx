import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Clock, DollarSign, Zap } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Card, Select, EmptyState, PageSpinner, StatusBadge } from '@/components/Common'
import { executionService } from '@/services/executionService'
import { projectService } from '@/services/projectService'

export default function Executions() {
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProject, setFilterProject] = useState('')

  // Queries
  const { data: executions, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionService.list(),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list(),
  })

  // Filter executions
  const filteredExecutions = executions?.filter(execution => {
    const matchesStatus = !filterStatus || execution.status === filterStatus
    const matchesProject = !filterProject || execution.project_id === filterProject
    return matchesStatus && matchesProject
  })

  const getProjectName = (projectId: string) => {
    return projects?.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return '-'
    const start = new Date(startedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  }

  return (
    <MainLayout title="Executions">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executions</h1>
          <p className="text-gray-600">View all project executions and their results</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: '', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'running', label: 'Running' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
        <Select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          options={[
            { value: '', label: 'All Projects' },
            ...(projects?.map(p => ({ value: p.id, label: p.name })) || []),
          ]}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : filteredExecutions && filteredExecutions.length > 0 ? (
        <div className="space-y-4">
          {filteredExecutions.map((execution) => (
            <Card key={execution.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/executions/${execution.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary"
                    >
                      {getProjectName(execution.project_id)}
                    </Link>
                    <StatusBadge status={execution.status} />
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(execution.started_at, execution.completed_at)}
                    </span>
                    {execution.tokens_used && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {execution.tokens_used.toLocaleString()} tokens
                      </span>
                    )}
                    {execution.estimated_cost && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${Number(execution.estimated_cost).toFixed(4)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(execution.created_at).toLocaleString()}
                  </p>
                </div>
                <Link
                  to={`/executions/${execution.id}`}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-5 h-5 text-gray-500" />
                </Link>
              </div>

              {/* Error message if failed */}
              {execution.status === 'failed' && execution.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{execution.error_message}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No executions found"
          description={filterStatus || filterProject ? "Try adjusting your filters" : "Execute a project to see results here"}
        />
      )}
    </MainLayout>
  )
}
