import { useQuery } from '@tanstack/react-query'

export default function TokenUsage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Token Usage</h1>

        <div className="card">
          <p className="text-gray-600">
            Token usage dashboard - Track your LLM token consumption and costs.
          </p>
          {/* TODO: Implement token usage tracking and visualization */}
        </div>
      </div>
    </div>
  )
}
