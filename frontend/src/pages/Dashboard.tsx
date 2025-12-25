import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Play, ArrowRight, FolderKanban, Zap, TrendingUp } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Card, Button, EmptyState, StatusBadge, PageSpinner } from '@/components/Common'
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
  const recentProjects = projects?.slice(0, 4) || []
  
  // Calculate stats
  const completedExecutions = executions?.filter(e => e.status === 'completed').length || 0
  const totalExecutions = executions?.length || 0
  const successRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0
  const totalTokens = executions?.reduce((sum, e) => sum + (e.tokens_used || 0), 0) || 0

  const isLoading = projectsLoading || executionsLoading

  return (
    <MainLayout title="Dashboard">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to CrewAI Manager</h1>
        <p className="text-gray-600 mt-1">Design, configure, and execute AI agent workflows</p>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{projects?.length || 0}</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Play className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Executions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalExecutions}</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <Link to="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 truncate">{project.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No projects yet"
                  description="Create your first project to get started"
                  action={
                    <Link to="/projects">
                      <Button icon={<Plus className="w-4 h-4" />} size="sm">
                        Create Project
                      </Button>
                    </Link>
                  }
                />
              )}
            </Card>

            {/* Recent Executions */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
                <Link to="/executions" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {recentExecutions.length > 0 ? (
                <div className="space-y-3">
                  {recentExecutions.map((execution) => (
                    <Link
                      key={execution.id}
                      to={`/executions/${execution.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          Execution {execution.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(execution.created_at).toLocaleString()}
                        </p>
                      </div>
                      <StatusBadge status={execution.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No executions yet"
                  description="Execute a project to see results here"
                />
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/projects">
                <Button variant="secondary" className="w-full">
                  View Projects
                </Button>
              </Link>
              <Link to="/templates">
                <Button variant="secondary" className="w-full">
                  Browse Templates
                </Button>
              </Link>
              <Link to="/llm-providers">
                <Button variant="secondary" className="w-full">
                  Configure LLMs
                </Button>
              </Link>
              <Link to="/tools">
                <Button variant="secondary" className="w-full">
                  Manage Tools
                </Button>
              </Link>
            </div>
          </Card>
        </>
      )}
    </MainLayout>
  )
}
