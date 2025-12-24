import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, Users, ListTodo, Play, Edit2, Trash2, 
  Plus, Clock 
} from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { 
  Button, Card, CardHeader, Modal, Input, 
  EmptyState, PageSpinner, ConfirmDialog, Alert 
} from '@/components/Common'
import { projectService } from '@/services/projectService'
import { agentService } from '@/services/agentService'
import { taskService } from '@/services/taskService'
import { executionService } from '@/services/executionService'
import type { ProjectUpdate } from '@/types/project'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showExecuteModal, setShowExecuteModal] = useState(false)
  const [editData, setEditData] = useState({ name: '', description: '' })
  const [executeInput, setExecuteInput] = useState('')

  // Queries
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

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.list(id!),
    enabled: !!id,
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: ProjectUpdate) => projectService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Project updated successfully')
      setShowEditModal(false)
    },
    onError: () => toast.error('Failed to update project'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectService.delete(id!),
    onSuccess: () => {
      toast.success('Project deleted successfully')
      navigate('/projects')
    },
    onError: () => toast.error('Failed to delete project'),
  })

  const executeMutation = useMutation({
    mutationFn: () => executionService.execute(id!, { 
      input_data: executeInput ? JSON.parse(executeInput) : {},
      output_format: 'json'
    }),
    onSuccess: (data) => {
      toast.success('Execution started!')
      setShowExecuteModal(false)
      navigate(`/executions/${data.id}`)
    },
    onError: () => toast.error('Failed to start execution'),
  })

  const openEditModal = () => {
    setEditData({
      name: project?.name || '',
      description: project?.description || '',
    })
    setShowEditModal(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(editData)
  }

  const handleExecute = () => {
    try {
      if (executeInput) JSON.parse(executeInput) // Validate JSON
      executeMutation.mutate()
    } catch {
      toast.error('Invalid JSON input')
    }
  }

  if (projectLoading) {
    return (
      <MainLayout title="Project">
        <PageSpinner />
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout title="Project">
        <Alert type="error">Project not found</Alert>
      </MainLayout>
    )
  }

  const canExecute = agents && agents.length > 0 && tasks && tasks.length > 0

  return (
    <MainLayout title={project.name}>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/projects" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-1">{project.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={openEditModal}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Agents</p>
              <p className="text-2xl font-bold text-gray-900">
                {agentsLoading ? '...' : agents?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ListTodo className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasksLoading ? '...' : tasks?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Executions</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.executions_count || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Execute Button */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Execute Project</h3>
            <p className="text-sm text-gray-500">
              {canExecute 
                ? 'Run your crew with the configured agents and tasks'
                : 'Add at least one agent and one task to execute'}
            </p>
          </div>
          <Button
            icon={<Play className="w-4 h-4" />}
            onClick={() => setShowExecuteModal(true)}
            disabled={!canExecute}
          >
            Execute
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents */}
        <Card>
          <CardHeader
            title="Agents"
            action={
              <Link to={`/projects/${id}/agents`}>
                <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </Link>
            }
          />
          {agentsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : agents && agents.length > 0 ? (
            <div className="space-y-3">
              {agents.slice(0, 3).map((agent) => (
                <div key={agent.id} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{agent.name}</h4>
                  <p className="text-sm text-primary">{agent.role}</p>
                </div>
              ))}
              {agents.length > 3 && (
                <Link to={`/projects/${id}/agents`} className="text-sm text-primary hover:underline">
                  View all {agents.length} agents →
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No agents"
              description="Add agents to define your crew"
              action={
                <Link to={`/projects/${id}/agents`}>
                  <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                    Add Agent
                  </Button>
                </Link>
              }
            />
          )}
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader
            title="Tasks"
            action={
              <Link to={`/projects/${id}/tasks`}>
                <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </Link>
            }
          />
          {tasksLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.slice(0, 3).map((task, index) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                  <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                  </div>
                </div>
              ))}
              {tasks.length > 3 && (
                <Link to={`/projects/${id}/tasks`} className="text-sm text-primary hover:underline">
                  View all {tasks.length} tasks →
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No tasks"
              description="Add tasks for your agents to complete"
              action={
                <Link to={`/projects/${id}/tasks`}>
                  <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                    Add Task
                  </Button>
                </Link>
              }
            />
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={updateMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Project"
        message="Are you sure you want to delete this project? All agents, tasks, and executions will be permanently deleted."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />

      {/* Execute Modal */}
      <Modal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        title="Execute Project"
        size="lg"
      >
        <div className="space-y-4">
          <Alert type="info">
            Your crew will execute all tasks in order using the configured agents.
          </Alert>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Data (JSON, optional)
            </label>
            <textarea
              value={executeInput}
              onChange={(e) => setExecuteInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              rows={4}
              placeholder='{"topic": "AI agents", "language": "English"}'
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowExecuteModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              icon={<Play className="w-4 h-4" />}
              onClick={handleExecute}
              loading={executeMutation.isPending}
            >
              Start Execution
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
