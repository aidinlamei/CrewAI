import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, DollarSign, Zap, XCircle, Download, Wifi, WifiOff, FileJson, FileText, Code } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, CardHeader, PageSpinner, StatusBadge, Alert } from '@/components/Common'
import { executionService } from '@/services/executionService'
import { projectService } from '@/services/projectService'
import { useExecutionWebSocket } from '@/hooks/useExecutionWebSocket'

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>()
  const [wsLogs, setWsLogs] = useState<string[]>([])
  const [wsStatus, setWsStatus] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Queries
  const { data: execution, isLoading, refetch } = useQuery({
    queryKey: ['execution', id],
    queryFn: () => executionService.get(id!),
    enabled: !!id,
    refetchInterval: (data) => {
      const status = wsStatus || data?.state?.data?.status
      if (status === 'running' || status === 'pending') {
        return 3000
      }
      return false
    },
  })

  const { data: project } = useQuery({
    queryKey: ['project', execution?.project_id],
    queryFn: () => projectService.get(execution!.project_id),
    enabled: !!execution?.project_id,
  })

  // WebSocket connection
  const isRunning = (wsStatus || execution?.status) === 'running' || (wsStatus || execution?.status) === 'pending'
  
  const { isConnected, logs: socketLogs } = useExecutionWebSocket({
    executionId: id!,
    enabled: isRunning,
    onLog: (log) => {
      setWsLogs(prev => [...prev, log])
    },
    onStatusChange: (status) => {
      setWsStatus(status)
      if (status === 'completed' || status === 'failed') {
        refetch()
      }
    },
    onResult: () => {
      refetch()
      toast.success('Execution completed!')
    },
    onError: (error) => {
      toast.error(`Execution error: ${error}`)
      refetch()
    },
  })

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [wsLogs, socketLogs])

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
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  }

  const currentStatus = wsStatus || execution?.status || 'pending'
  const allLogs = [...(execution?.logs?.split('\n') || []), ...wsLogs].filter(Boolean)

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
            <StatusBadge status={currentStatus as any} />
            {isRunning && (
              <span className={`flex items-center gap-1 text-sm ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">
            Execution ID: {execution.id}
          </p>
        </div>
        <div className="flex gap-2">
          {isRunning && (
            <Button
              variant="danger"
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => cancelMutation.mutate()}
              loading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          )}
          {currentStatus === 'completed' && (
            <div className="relative group">
              <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
                Export
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <a
                  href={`${import.meta.env.VITE_API_URL}/api/v1/executions/${id}/export?format=json`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  download
                >
                  <FileJson className="w-4 h-4" />
                  JSON
                </a>
                <a
                  href={`${import.meta.env.VITE_API_URL}/api/v1/executions/${id}/export?format=markdown`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  download
                >
                  <FileText className="w-4 h-4" />
                  Markdown
                </a>
                <a
                  href={`${import.meta.env.VITE_API_URL}/api/v1/executions/${id}/export?format=html`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  download
                >
                  <Code className="w-4 h-4" />
                  HTML
                </a>
              </div>
            </div>
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
      {currentStatus === 'failed' && execution.error_message && (
        <Alert type="error" title="Execution Failed" className="mb-6">
          {execution.error_message}
        </Alert>
      )}

      {/* Running indicator */}
      {isRunning && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-blue-700">
              Execution in progress... 
              {isConnected ? ' Receiving live updates.' : ' Connecting to live updates...'}
            </p>
          </div>
        </Card>
      )}

      {/* Logs */}
      <Card className="mb-6">
        <CardHeader 
          title="Execution Logs" 
          subtitle={isRunning ? 'Live updates enabled' : undefined}
        />
        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {allLogs.length > 0 ? (
            <>
              {allLogs.map((log, index) => (
                <div key={index} className="text-green-400 py-0.5">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          ) : (
            <p className="text-gray-500">No logs yet...</p>
          )}
        </div>
      </Card>

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
        <Card>
          <CardHeader title="Result" />
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm max-h-96">
            {typeof execution.result === 'string' 
              ? execution.result 
              : JSON.stringify(execution.result, null, 2)}
          </pre>
        </Card>
      )}
    </MainLayout>
  )
}
