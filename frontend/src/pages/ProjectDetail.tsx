import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import { agentService } from '@/services/agentService'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.get(id!),
    enabled: !!id,
  })

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents', id],
    queryFn: () => agentService.list(id!),
    enabled: !!id,
  })

  if (projectLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/projects" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Agents</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {project.agents_count || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {project.tasks_count || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Executions</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {project.executions_count || 0}
            </p>
          </div>
        </div>

        {/* Agents */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Agents</h2>
            <button className="btn btn-primary">Add Agent</button>
          </div>
          {agentsLoading ? (
            <p className="text-gray-500">Loading agents...</p>
          ) : agents && agents.length > 0 ? (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.id} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.role}</p>
                  <p className="text-sm text-gray-500 mt-1">{agent.goal}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No agents yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="btn btn-primary">Execute Project</button>
            <button className="btn btn-secondary">View Executions</button>
            <button className="btn btn-secondary">Manage Tasks</button>
            <button className="btn btn-secondary">Edit Project</button>
          </div>
        </div>
      </div>
    </div>
  )
}
