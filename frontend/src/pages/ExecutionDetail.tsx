import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, DollarSign, Zap, XCircle, Download } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, CardHeader, PageSpinner, StatusBadge, Alert } from '@/components/Common'
import { executionService } from '@/services/executionService'
import { projectService } from '@/services/projectService'

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>()

  // Queries
  const { data: execution, isLoading, refetch } = useQuery({
    queryKey: ['execution', id],
    queryFn: () => executionService.get(id!),
    enabled: !!id,
    refetchInterval: (data) => {
      // Auto-refresh if running
      if (data?.state?.data?.status === 'running' || data?.state?.data?.status === 'pending') {
        return 2000
      }
      return false
    },
  })

  const { data: project } = useQuery({
    queryKey: ['project', execution?.project_id],
    queryFn: () => projectService.get(execution!.project_id),
    enabled: !!execution?.project_id,
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => executionService.cancel(id!),
    onSuccess: () => {
      toast.success('Execution cancelled')
      refetch()
    },
    onError: () => toast.error('Failed to cancel execution'),
  })

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return '-'
    const start = new Date(startedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000)
    if (diff < 60) return `${diff} seconds`
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ${diff % 60} seconds`
    return `${Math.floor(diff / 3600)} hours ${Math.floor((diff % 3600) / 60)} minutes`
  }

  if (isLoading) {
    return (
      <MainLayout title="Execution Details">
        <PageSpinner />
      </MainLayout>
    )
  }

  if (!execution) {
    return (
      <MainLayout title="Execution Details">
        <Alert type="error">Execution not found</Alert>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Execution Details">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/executions" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Executions
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {project?.name || 'Loading...'}
            </h1>
            <StatusBadge status={execution.status} />
          </div>
          <p className="text-gray-600">
            Execution ID: {execution.id}
          </p>
        </div>
        <div className="flex gap-2">
          {(execution.status === 'running' || execution.status === 'pending') && (
            <Button
              variant="danger"
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => cancelMutation.mutate()}
              loading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          )}
          {execution.status === 'completed' && (
            <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-semibold text-gray-900">
                {formatDuration(execution.started_at, execution.completed_at)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tokens Used</p>
              <p className="font-semibold text-gray-900">
                {execution.tokens_used?.toLocaleString() || '0'}
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
              <p className="text-sm text-gray-500">Estimated Cost</p>
              <p className="font-semibold text-gray-900">
                ${execution.estimated_cost ? Number(execution.estimated_cost).toFixed(4) : '0.0000'}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div>
            <p className="text-sm text-gray-500">Output Format</p>
            <p className="font-semibold text-gray-900">
              {execution.output_format || 'json'}
            </p>
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {execution.status === 'failed' && execution.error_message && (
        <Alert type="error" title="Execution Failed" className="mb-6">
          {execution.error_message}
        </Alert>
      )}

      {/* Input Data */}
      {execution.input_data && Object.keys(execution.input_data).length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Input Data" />
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(execution.input_data, null, 2)}
          </pre>
        </Card>
      )}

      {/* Result */}
      {execution.result && (
        <Card className="mb-6">
          <CardHeader title="Result" />
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm max-h-96">
            {typeof execution.result === 'string' 
              ? execution.result 
              : JSON.stringify(execution.result, null, 2)}
          </pre>
        </Card>
      )}

      {/* Logs */}
      {execution.logs && (
        <Card>
          <CardHeader title="Execution Logs" />
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm max-h-96 font-mono">
            {execution.logs}
          </pre>
        </Card>
      )}

      {/* Running indicator */}
      {execution.status === 'running' && (
        <Card className="mt-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-gray-600">Execution in progress... Refreshing automatically.</p>
          </div>
        </Card>
      )}
    </MainLayout>
  )
}
