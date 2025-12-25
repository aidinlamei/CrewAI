import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Settings as SettingsIcon, Database, Palette } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Card, CardHeader, Button, Input, Alert } from '@/components/Common'
import api from '@/services/api'

export default function Settings() {
  const navigate = useNavigate()
  const [reinitializing, setReinitializing] = useState(false)

  const handleReinitialize = async () => {
    if (!confirm('Are you sure you want to reinitialize the system? This will reset default tools and templates.')) {
      return
    }
    
    setReinitializing(true)
    try {
      await api.post('/initialize')
      toast.success('System reinitialized successfully')
    } catch (error) {
      toast.error('Failed to reinitialize system')
    } finally {
      setReinitializing(false)
    }
  }

  return (
    <MainLayout title="Settings">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your CrewAI Manager</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader
              title="General Settings"
              subtitle="Basic application configuration"
            />
            <div className="space-y-4">
              <Input
                label="Application Name"
                defaultValue="CrewAI Manager"
                disabled
                helperText="Application name cannot be changed"
              />
              <Input
                label="API URL"
                defaultValue={import.meta.env.VITE_API_URL || 'http://localhost:8000'}
                disabled
                helperText="Configure in environment variables"
              />
            </div>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader
              title="System"
              subtitle="System maintenance and operations"
            />
            <div className="space-y-4">
              <Alert type="info">
                Reinitializing will reset default tools and templates to their original state.
                Your projects, agents, and executions will not be affected.
              </Alert>
              <Button
                variant="secondary"
                icon={<Database className="w-4 h-4" />}
                onClick={handleReinitialize}
                loading={reinitializing}
              >
                Reinitialize System
              </Button>
            </div>
          </Card>

          {/* Security Settings (Future) */}
          <Card>
            <CardHeader
              title="Security"
              subtitle="Authentication and access control"
            />
            <Alert type="warning">
              Authentication is not yet implemented. This feature is planned for a future release.
            </Alert>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card>
            <CardHeader title="Quick Links" />
            <div className="space-y-2">
              <button
                onClick={() => navigate('/llm-providers')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <SettingsIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">LLM Providers</p>
                  <p className="text-sm text-gray-500">Configure AI models</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/tools')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Database className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Tools</p>
                  <p className="text-sm text-gray-500">Manage available tools</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/templates')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Palette className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Templates</p>
                  <p className="text-sm text-gray-500">View project templates</p>
                </div>
              </button>
            </div>
          </Card>

          {/* About */}
          <Card>
            <CardHeader title="About" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Framework</span>
                <span className="font-medium">CrewAI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LLM Integration</span>
                <span className="font-medium">LiteLLM</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
