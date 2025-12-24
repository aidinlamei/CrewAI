import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import { executionService } from '@/services/executionService'

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list(),
  })

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionService.list(),
  })

  const recentExecutions = executions?.slice(0, 5) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to CrewAI Manager</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {projectsLoading ? '...' : projects?.length || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Executions</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {executionsLoading ? '...' : executions?.length || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {executionsLoading
                ? '...'
                : executions && executions.length > 0
                ? `${Math.round(
                    (executions.filter((e) => e.status === 'completed').length /
                      executions.length) *
                      100
                  )}%`
                : '0%'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/projects" className="btn btn-primary text-center">
              View Projects
            </Link>
            <Link to="/initialize" className="btn btn-secondary text-center">
              System Settings
            </Link>
            <button className="btn btn-secondary">
              View Documentation
            </button>
          </div>
        </div>

        {/* Recent Executions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Executions</h2>
          {executionsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : recentExecutions.length > 0 ? (
            <div className="space-y-3">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Execution {execution.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(execution.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      execution.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : execution.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : execution.status === 'running'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {execution.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No executions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
