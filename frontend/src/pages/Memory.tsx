import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { memoryService } from '@/services/memoryService';

interface MemoryProps {
  agentId: string;
}

export default function Memory({ agentId }: MemoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: memories, isLoading } = useQuery({
    queryKey: ['memories', agentId],
    queryFn: () => memoryService.list(agentId),
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) => memoryService.search(agentId, query),
  });

  const clearMutation = useMutation({
    mutationFn: () => memoryService.clear(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', agentId] });
      toast.success('Memories cleared');
    },
  });

  const handleSearch = () => {
    if (searchQuery) {
      searchMutation.mutate(searchQuery);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
        <button
          onClick={() => clearMutation.mutate()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Clear All
        </button>
      </div>

      {searchMutation.data && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold mb-3">Search Results</h3>
          {searchMutation.data.results.map((result: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded mb-2">
              <p>{result.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-3">All Memories</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : memories && memories.length > 0 ? (
          <div className="space-y-2">
            {memories.map((memory: any) => (
              <div key={memory.id} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    {memory.memory_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(memory.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-900">{memory.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No memories yet</p>
        )}
      </div>
    </div>
  );
}
