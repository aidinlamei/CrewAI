import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowLeft, Search, Trash2, Brain, Clock } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, Card, CardHeader, PageSpinner, EmptyState, Input, Select, Badge } from '@/components/Common'
import { memoryService, Memory } from '@/services/memoryService'
import { agentService } from '@/services/agentService'

export default function MemoryPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const [searchQuery, setSearchQuery] = useState('')
  const [memoryType, setMemoryType] = useState<string>('all')
  const queryClient = useQueryClient()

  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentService.get(agentId!),
    enabled: !!agentId,
  })

  const { data: memories, isLoading } = useQuery({
    queryKey: ['memories', agentId, memoryType],
    queryFn: () => memoryService.list(agentId!, memoryType === 'all' ? undefined : memoryType),
    enabled: !!agentId,
  })

  const searchMutation = useMutation({
    mutationFn: (query: string) => memoryService.search(agentId!, query),
  })

  const clearMutation = useMutation({
    mutationFn: () => memoryService.clear(agentId!, memoryType === 'all' ? undefined : memoryType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', agentId] })
      toast.success('Memory cleared successfully')
    },
    onError: () => {
      toast.error('Failed to clear memory')
    },
  })

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }
    searchMutation.mutate(searchQuery)
  }

  const displayMemories: Memory[] = searchMutation.data?.results || memories || []

  if (isLoading) {
    return (
      <MainLayout title="Agent Memory">
        <PageSpinner />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Agent Memory">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/executions" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Agent Memory
          </h1>
          <p className="text-gray-600">
            View and manage memories for {agent?.name || 'Agent'}
          </p>
        </div>
        <Button
          variant="danger"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={() => {
            if (confirm('Are you sure you want to clear this memory? This action cannot be undone.')) {
              clearMutation.mutate()
            }
          }}
          loading={clearMutation.isPending}
        >
          Clear Memory
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Memories
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for memories..."
              />
              <Button
                variant="secondary"
                icon={<Search className="w-4 h-4" />}
                onClick={handleSearch}
                loading={searchMutation.isPending}
              >
                Search
              </Button>
            </div>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Memory Type
            </label>
            <Select
              value={memoryType}
              onChange={(e) => setMemoryType(e.target.value)}
              options={[
                { value: 'all', label: 'All Memories' },
                { value: 'short_term', label: 'Short Term' },
                { value: 'long_term', label: 'Long Term' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Memories List */}
      <Card>
        <CardHeader
          title={searchMutation.data ? 'Search Results' : 'Memory Entries'}
          subtitle={`${displayMemories.length} memories`}
          action={
            searchMutation.data && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  searchMutation.reset()
                  setSearchQuery('')
                }}
              >
                Clear Search
              </Button>
            )
          }
        />

        {displayMemories.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayMemories.map((memory) => (
              <div key={memory.id} className="py-4 hover:bg-gray-50 px-4 -mx-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={memory.memory_type === 'long_term' ? 'primary' : 'default'}
                      >
                        {memory.memory_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(memory.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {memory.content}
                    </p>
                    {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        Metadata: {JSON.stringify(memory.metadata)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Brain className="w-12 h-12 text-gray-400" />}
            title={searchMutation.data ? 'No memories found' : 'No memories yet'}
            description={
              searchMutation.data
                ? 'Try a different search query'
                : 'Memories will appear here after executions'
            }
          />
        )}
      </Card>
    </MainLayout>
  )
}
