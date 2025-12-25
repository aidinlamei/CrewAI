import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FileText, Users, ListTodo, Rocket } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, Modal, Input, EmptyState, PageSpinner, Badge } from '@/components/Common'
import { templateService, Template } from '@/services/templateService'

const categoryColors: Record<string, string> = {
  research: 'bg-blue-100 text-blue-700',
  content: 'bg-purple-100 text-purple-700',
  analysis: 'bg-green-100 text-green-700',
  default: 'bg-gray-100 text-gray-700',
}

export default function Templates() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [projectName, setProjectName] = useState('')

  // Queries
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.list(),
  })

  // Mutation
  const useTemplateMutation = useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) =>
      templateService.useTemplate(templateId, name),
    onSuccess: (data) => {
      toast.success('Project created from template!')
      navigate(`/projects/${data.project_id}`)
    },
    onError: () => toast.error('Failed to create project'),
  })

  const handleUseTemplate = () => {
    if (!selectedTemplate || !projectName) return
    useTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      name: projectName,
    })
  }

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors.default
  }

  return (
    <MainLayout title="Templates">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Project Templates</h1>
        <p className="text-gray-600">Quick-start your project with pre-built templates</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                {/* Template stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {template.template_data.agents?.length || 0} agents
                  </span>
                  <span className="flex items-center gap-1">
                    <ListTodo className="w-4 h-4" />
                    {template.template_data.tasks?.length || 0} tasks
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="primary"
                  className="w-full"
                  icon={<Rocket className="w-4 h-4" />}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setProjectName(`${template.name} Project`)
                  }}
                >
                  Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No templates available"
          description="Templates will appear here after system initialization"
        />
      )}

      {/* Use Template Modal */}
      <Modal
        isOpen={!!selectedTemplate}
        onClose={() => {
          setSelectedTemplate(null)
          setProjectName('')
        }}
        title="Create Project from Template"
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1">{selectedTemplate.name}</h4>
              <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{selectedTemplate.template_data.agents?.length || 0} agents</span>
                <span>{selectedTemplate.template_data.tasks?.length || 0} tasks</span>
              </div>
            </div>

            <Input
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              required
            />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setSelectedTemplate(null)
                  setProjectName('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUseTemplate}
                loading={useTemplateMutation.isPending}
                disabled={!projectName}
              >
                Create Project
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
