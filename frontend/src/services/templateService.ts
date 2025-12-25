import api from './api'

export interface Template {
  id: string
  name: string
  description: string
  category: string
  template_data: {
    agents: Array<{
      name: string
      role: string
      goal: string
      backstory?: string
    }>
    tasks: Array<{
      name: string
      description: string
      expected_output?: string
      agent?: string
      tools?: string[]
    }>
  }
  is_active: boolean
  created_at: string
}

export const templateService = {
  // List all templates
  async list(): Promise<Template[]> {
    const response = await api.get('/templates')
    return response.data
  },

  // Get single template
  async get(templateId: string): Promise<Template> {
    const response = await api.get(`/templates/${templateId}`)
    return response.data
  },

  // Create project from template
  async useTemplate(templateId: string, projectName: string): Promise<{ project_id: string }> {
    const response = await api.post(`/templates/${templateId}/use`, { name: projectName })
    return response.data
  },
}
