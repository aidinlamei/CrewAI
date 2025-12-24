import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, Modal, Input, Select, EmptyState, ConfirmDialog, PageSpinner } from '@/components/Common'
import { agentService } from '@/services/agentService'
import { projectService } from '@/services/projectService'
import { llmService } from '@/services/llmService'
import type { AgentCreate, AgentUpdate } from '@/types/agent'

export default function Agents() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AgentCreate>({
    name: '',
    role: '',
    goal: '',
    backstory: '',
    llm_provider_id: '',
    llm_model: '',
    temperature: 0.7,
  })

  // Queries
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.get(projectId!),
    enabled: !!projectId,
  })

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents', projectId],
    queryFn: () => agentService.list(projectId!),
    enabled: !!projectId,
  })

  const { data: providers } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: () => llmService.list(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: AgentCreate) => agentService.create(projectId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', projectId] })
      toast.success('Agent created successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to create agent'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentUpdate }) => agentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', projectId] })
      toast.success('Agent updated successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to update agent'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', projectId] })
      toast.success('Agent deleted successfully')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete agent'),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingAgent(null)
    setFormData({
      name: '',
      role: '',
      goal: '',
      backstory: '',
      llm_provider_id: '',
      llm_model: '',
      temperature: 0.7,
    })
  }

  const openEditModal = (agent: any) => {
    setEditingAgent(agent.id)
    setFormData({
      name: agent.name,
      role: agent.role,
      goal: agent.goal,
      backstory: agent.backstory || '',
      llm_provider_id: agent.llm_provider_id || '',
      llm_model: agent.llm_model || '',
      temperature: agent.temperature || 0.7,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const selectedProvider = providers?.find(p => p.id === formData.llm_provider_id)

  return (
    <MainLayout title={`Agents - ${project?.name || 'Loading...'}`}>
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
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600">Manage AI agents for this project</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Agent
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => openEditModal(agent)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setDeleteId(agent.id)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 pr-16">{agent.name}</h3>
              <p className="text-sm text-primary font-medium mb-2">{agent.role}</p>
              <p className="text-sm text-gray-600 mb-3">{agent.goal}</p>
              {agent.backstory && (
                <p className="text-xs text-gray-500 line-clamp-2">{agent.backstory}</p>
              )}
              {agent.llm_model && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Model: {agent.llm_model}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No agents yet"
          description="Create your first AI agent to get started"
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
              Add Agent
            </Button>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingAgent ? 'Edit Agent' : 'Create Agent'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Research Agent"
            required
          />
          <Input
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="e.g., Senior Research Analyst"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="What is this agent's main objective?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Backstory</label>
            <textarea
              value={formData.backstory}
              onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Provide context about this agent's experience and expertise..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="LLM Provider"
              value={formData.llm_provider_id}
              onChange={(e) => setFormData({ ...formData, llm_provider_id: e.target.value, llm_model: '' })}
              options={providers?.map(p => ({ value: p.id, label: p.display_name || p.name })) || []}
              placeholder="Select provider"
            />
            <Select
              label="Model"
              value={formData.llm_model}
              onChange={(e) => setFormData({ ...formData, llm_model: e.target.value })}
              options={selectedProvider?.available_models?.map(m => ({ value: m, label: m })) || []}
              placeholder="Select model"
              disabled={!formData.llm_provider_id}
            />
          </div>

          <Input
            label="Temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            helperText="0 = deterministic, 2 = very creative"
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingAgent ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Agent"
        message="Are you sure you want to delete this agent? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </MainLayout>
  )
}
