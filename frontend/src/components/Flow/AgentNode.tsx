import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { User, Settings } from 'lucide-react'

export interface AgentNodeData {
  id: string
  name: string
  role: string
  goal?: string
  llm_model?: string
}

function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-lg border-2 min-w-[200px] max-w-[280px]
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-300'}
      `}
    >
      {/* Header */}
      <div className="bg-blue-500 text-white px-3 py-2 rounded-t-md flex items-center gap-2">
        <User className="w-4 h-4" />
        <span className="font-medium text-sm truncate">{data.name}</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">Role</div>
        <div className="text-sm font-medium text-gray-800 truncate">{data.role}</div>
        
        {data.goal && (
          <>
            <div className="text-xs text-gray-500 mt-2 mb-1">Goal</div>
            <div className="text-xs text-gray-600 line-clamp-2">{data.goal}</div>
          </>
        )}

        {data.llm_model && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <Settings className="w-3 h-3" />
            {data.llm_model}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  )
}

export default memo(AgentNode)
