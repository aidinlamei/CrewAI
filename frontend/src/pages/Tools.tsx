import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Search, Wrench, Code, Globe, FileText } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, Modal, Input, Select, EmptyState, ConfirmDialog, PageSpinner, Badge } from '@/components/Common'
import { toolService } from '@/services/toolService'
import type { ToolCreate, ToolUpdate } from '@/types/tool'

const categoryIcons: Record<string, any> = {
  search: Globe,
  file: FileText,
  code: Code,
  web: Globe,
  default: Wrench,
}

export default function Tools() {
  const queryClient = useQueryClient()
  
  const [showModal, setShowModal] = useState(false)
  const [editingTool, setEditingTool] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState<ToolCreate>({
    name: '',
    type: 'custom',
    category: '',
    description: '',
    python_code: '',
    config: {},
  })

  // Queries
  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => toolService.list(),
  })

  const { data: categories } = useQuery({
    queryKey: ['tool-categories'],
    queryFn: () => toolService.getCategories(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ToolCreate) => toolService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool created successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to create tool'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ToolUpdate }) => toolService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool updated successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to update tool'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool deleted successfully')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete tool'),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingTool(null)
    setFormData({
      name: '',
      type: 'custom',
      category: '',
      description: '',
      python_code: '',
      config: {},
    })
  }

  const openEditModal = (tool: any) => {
    setEditingTool(tool.id)
    setFormData({
      name: tool.name,
      type: tool.type,
      category: tool.category || '',
      description: tool.description || '',
      python_code: tool.python_code || '',
      config: tool.config || {},
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTool) {
      updateMutation.mutate({ id: editingTool, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  // Filter tools
  const filteredTools = tools?.filter(tool => {
    const matchesCategory = !filterCategory || tool.category === filterCategory
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getIcon = (category: string) => {
    const Icon = categoryIcons[category] || categoryIcons.default
    return <Icon className="w-5 h-5" />
  }

  return (
    <MainLayout title="Tools">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tools</h1>
          <p className="text-gray-600">Manage tools available for your agents</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Create Custom Tool
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            ...(categories?.map(c => ({ value: c, label: c })) || []),
          ]}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : filteredTools && filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <Card key={tool.id} className="relative">
              {tool.type === 'custom' && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => openEditModal(tool)}
                    className="p-1.5 rounded hover:bg-gray-100"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setDeleteId(tool.id)}
                    className="p-1.5 rounded hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                  {getIcon(tool.category || 'default')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate pr-16">{tool.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tool.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant={tool.type === 'custom' ? 'primary' : 'default'} size="sm">
                      {tool.type}
                    </Badge>
                    {tool.category && (
                      <Badge size="sm">{tool.category}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tools found"
          description={searchQuery || filterCategory ? "Try adjusting your filters" : "Create your first custom tool"}
          action={
            !searchQuery && !filterCategory && (
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
                Create Custom Tool
              </Button>
            )
          }
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTool ? 'Edit Tool' : 'Create Custom Tool'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., My Custom Tool"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'custom', label: 'Custom' },
                { value: 'langchain', label: 'LangChain' },
                { value: 'built-in', label: 'Built-in' },
              ]}
              required
            />
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., search, file, web"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="What does this tool do?"
            />
          </div>
          
          {formData.type === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Python Code</label>
              <textarea
                value={formData.python_code}
                onChange={(e) => setFormData({ ...formData, python_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows={8}
                placeholder={`def my_tool(param1: str) -> str:
    """Tool description"""
    # Your code here
    return result`}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTool ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Tool"
        message="Are you sure you want to delete this tool? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </MainLayout>
  )
}
