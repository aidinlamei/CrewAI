import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Zap, CheckCircle, XCircle } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, Modal, Input, Select, EmptyState, ConfirmDialog, PageSpinner, Badge } from '@/components/Common'
import { llmService } from '@/services/llmService'
import type { LLMProviderCreate, LLMProviderUpdate } from '@/types/llm'

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'groq', label: 'Groq' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'together', label: 'Together AI' },
  { value: 'cohere', label: 'Cohere' },
]

const defaultModels: Record<string, string[]> = {
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  google: ['gemini-pro', 'gemini-1.5-pro'],
  azure: ['gpt-4', 'gpt-35-turbo'],
  ollama: ['llama2', 'mistral', 'codellama'],
  groq: ['mixtral-8x7b', 'llama2-70b'],
  mistral: ['mistral-large', 'mistral-medium', 'mistral-small'],
  together: ['llama-2-70b', 'mixtral-8x7b'],
  cohere: ['command', 'command-light'],
}

export default function LLMProviders() {
  const queryClient = useQueryClient()
  
  const [showModal, setShowModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<LLMProviderCreate>({
    name: '',
    display_name: '',
    api_key: '',
    api_base_url: '',
    available_models: [],
    default_model: '',
    is_active: true,
  })

  // Queries
  const { data: providers, isLoading } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: () => llmService.list(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: LLMProviderCreate) => llmService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] })
      toast.success('Provider added successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to add provider'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LLMProviderUpdate }) => llmService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] })
      toast.success('Provider updated successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to update provider'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => llmService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] })
      toast.success('Provider deleted successfully')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete provider'),
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => llmService.test(id),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Connection successful! Latency: ${data.latency_ms?.toFixed(0)}ms`)
      } else {
        toast.error(`Connection failed: ${data.error}`)
      }
      setTestingId(null)
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] })
    },
    onError: () => {
      toast.error('Failed to test connection')
      setTestingId(null)
    },
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingProvider(null)
    setFormData({
      name: '',
      display_name: '',
      api_key: '',
      api_base_url: '',
      available_models: [],
      default_model: '',
      is_active: true,
    })
  }

  const openEditModal = (provider: any) => {
    setEditingProvider(provider.id)
    setFormData({
      name: provider.name,
      display_name: provider.display_name || '',
      api_key: '', // Don't show existing key
      api_base_url: provider.api_base_url || '',
      available_models: provider.available_models || [],
      default_model: provider.default_model || '',
      is_active: provider.is_active,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData }
    if (!data.api_key) delete data.api_key // Don't send empty API key
    
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleProviderChange = (name: string) => {
    const models = defaultModels[name] || []
    setFormData({
      ...formData,
      name,
      available_models: models,
      default_model: models[0] || '',
    })
  }

  return (
    <MainLayout title="LLM Providers">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LLM Providers</h1>
          <p className="text-gray-600">Configure your AI model providers</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Provider
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : providers && providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => {
                    setTestingId(provider.id)
                    testMutation.mutate(provider.id)
                  }}
                  className="p-1.5 rounded hover:bg-gray-100"
                  disabled={testingId === provider.id}
                >
                  <Zap className={`w-4 h-4 ${testingId === provider.id ? 'text-yellow-500 animate-pulse' : 'text-gray-500'}`} />
                </button>
                <button
                  onClick={() => openEditModal(provider)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setDeleteId(provider.id)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 pr-24">
                {provider.display_name || provider.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{provider.name}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {provider.has_api_key ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {provider.has_api_key ? 'API Key configured' : 'No API Key'}
                  </span>
                </div>
                {provider.default_model && (
                  <p className="text-sm text-gray-600">
                    Default: <span className="font-medium">{provider.default_model}</span>
                  </p>
                )}
                {provider.last_tested_at && (
                  <p className="text-xs text-gray-400">
                    Last tested: {new Date(provider.last_tested_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Badge variant={provider.is_active ? 'success' : 'default'} size="sm">
                  {provider.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {provider.available_models && provider.available_models.length > 0 && (
                  <Badge size="sm">{provider.available_models.length} models</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No providers configured"
          description="Add your first LLM provider to start using AI models"
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
              Add Provider
            </Button>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProvider ? 'Edit Provider' : 'Add Provider'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Provider"
            value={formData.name}
            onChange={(e) => handleProviderChange(e.target.value)}
            options={providerOptions}
            placeholder="Select a provider"
            required
          />
          <Input
            label="Display Name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="e.g., My OpenAI Account"
          />
          <Input
            label={editingProvider ? "API Key (leave empty to keep current)" : "API Key"}
            type="password"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            placeholder="sk-..."
            required={!editingProvider}
          />
          <Input
            label="API Base URL (optional)"
            value={formData.api_base_url}
            onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
            placeholder="https://api.openai.com/v1"
            helperText="For custom endpoints or local models"
          />
          <Select
            label="Default Model"
            value={formData.default_model}
            onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
            options={formData.available_models?.map(m => ({ value: m, label: m })) || []}
            placeholder="Select default model"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
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
              {editingProvider ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Provider"
        message="Are you sure you want to delete this provider? Agents using this provider will need to be reconfigured."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </MainLayout>
  )
}
