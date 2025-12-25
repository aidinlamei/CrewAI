import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Search, Users, ListTodo } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, Modal, Input, EmptyState, PageSpinner } from '@/components/Common'
import { projectService } from '@/services/projectService'
import type { ProjectCreate } from '@/types/project'

export default function Projects() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newProject, setNewProject] = useState<ProjectCreate>({
    name: '',
    description: '',
  })

  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created successfully')
      setShowCreateModal(false)
      setNewProject({ name: '', description: '' })
    },
    onError: () => {
      toast.error('Failed to create project')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name) {
      toast.error('Project name is required')
      return
    }
    createMutation.mutate(newProject)
  }

  // Filter projects
  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <MainLayout title="Projects">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your CrewAI projects</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
            >
              <Card hover className="h-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    0 agents
                  </span>
                  <span className="flex items-center gap-1">
                    <ListTodo className="w-4 h-4" />
                    0 tasks
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : searchQuery ? (
        <EmptyState
          title="No projects found"
          description="Try adjusting your search query"
        />
      ) : (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started with CrewAI"
          action={
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Project
            </Button>
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Project"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="My Awesome Project"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Describe your project..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  )
}
