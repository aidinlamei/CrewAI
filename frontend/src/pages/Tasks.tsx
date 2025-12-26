import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, ArrowLeft, GripVertical } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, Modal, Input, Select, EmptyState, ConfirmDialog, PageSpinner } from '@/components/Common'
import { taskService } from '@/services/taskService'
import { agentService } from '@/services/agentService'
import { projectService } from '@/services/projectService'
import { toolService } from '@/services/toolService'
import type { TaskCreate, TaskUpdate } from '@/types/task'

export default function Tasks() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TaskCreate>({
    name: '',
    description: '',
    expected_output: '',
    agent_id: '',
    tools: [],
  })

  // Queries
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.get(projectId!),
    enabled: !!projectId,
  })

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.list(projectId!),
    enabled: !!projectId,
  })

  const { data: agents } = useQuery({
    queryKey: ['agents', projectId],
    queryFn: () => agentService.list(projectId!),
    enabled: !!projectId,
  })

  const { data: tools } = useQuery({
    queryKey: ['tools'],
    queryFn: () => toolService.list(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: TaskCreate) => taskService.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('Task created successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to create task'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdate }) => taskService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('Task updated successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to update task'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('Task deleted successfully')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormData({
      name: '',
      description: '',
      expected_output: '',
      agent_id: '',
      tools: [],
    })
  }

  const openEditModal = (task: any) => {
    setEditingTask(task.id)
    setFormData({
      name: task.name,
      description: task.description,
      expected_output: task.expected_output || '',
      agent_id: task.agent_id || '',
      tools: task.tools || [],
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask) {
      updateMutation.mutate({ id: editingTask, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Unassigned'
    return agents?.find(a => a.id === agentId)?.name || 'Unassigned'
  }

  return (
    <MainLayout title={`Tasks - ${project?.name || 'Loading...'}`}>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to={`/projects/${projectId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage tasks and their execution order</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Task
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <Card key={task.id} className="flex items-start gap-4">
              <div className="flex items-center gap-3 text-gray-400">
                <GripVertical className="w-5 h-5 cursor-grab" />
                <span className="text-lg font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    {task.expected_output && (
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="font-medium">Expected:</span> {task.expected_output}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {getAgentName(task.agent_id)}
                    </span>
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteId(task.id)}
                      className="p-1.5 rounded hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tasks yet"
          description="Create tasks to define what your agents should do"
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
              Add Task
            </Button>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Research Task"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Describe what this task should accomplish..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
            <textarea
              value={formData.expected_output}
              onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="What output should this task produce?"
            />
          </div>
          
          <Select
            label="Assign to Agent"
            value={formData.agent_id}
            onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
            options={agents?.map(a => ({ value: a.id, label: a.name })) || []}
            placeholder="Select an agent"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tools</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              {tools?.map((tool) => (
                <label key={tool.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tools?.includes(tool.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, tools: [...(formData.tools || []), tool.id] })
                      } else {
                        setFormData({ ...formData, tools: formData.tools?.filter(t => t !== tool.id) })
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{tool.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </MainLayout>
  )
}
