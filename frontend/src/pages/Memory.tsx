import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

export default function Memory() {
  const { agentId } = useParams<{ agentId: string }>()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Agent Memory</h1>

        <div className="card">
          <p className="text-gray-600 mb-4">
            Agent ID: {agentId}
          </p>
          <p className="text-gray-600">
            Memory viewer - View and manage agent memory entries.
          </p>
          {/* TODO: Implement memory viewer using /api/v1/agents/{agentId}/memory */}
        </div>
      </div>
    </div>
  )
}
