import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { ListTodo, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export interface TaskNodeData {
  id: string
  name: string
  description: string
  expected_output?: string
  agent_name?: string
  order_index?: number
  status?: 'pending' | 'running' | 'completed' | 'failed'
}

const statusIcons = {
  pending: Clock,
  running: Clock,
  completed: CheckCircle,
  failed: AlertCircle,
}

const statusColors = {
  pending: 'text-gray-400',
  running: 'text-blue-500 animate-pulse',
  completed: 'text-green-500',
  failed: 'text-red-500',
}

function TaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  const StatusIcon = data.status ? statusIcons[data.status] : null

  return (
    <div
      className={`
        bg-white rounded-lg shadow-lg border-2 min-w-[220px] max-w-[300px]
        ${selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-300'}
      `}
    >
      {/* Header */}
      <div className="bg-purple-500 text-white px-3 py-2 rounded-t-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4" />
          <span className="font-medium text-sm truncate">{data.name}</span>
        </div>
        {data.order_index !== undefined && (
          <span className="bg-purple-600 px-2 py-0.5 rounded text-xs">
            #{data.order_index + 1}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="text-xs text-gray-600 line-clamp-2 mb-2">
          {data.description}
        </div>

        {data.expected_output && (
          <>
            <div className="text-xs text-gray-500 mb-1">Expected Output</div>
            <div className="text-xs text-gray-600 line-clamp-1 mb-2">
              {data.expected_output}
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          {data.agent_name ? (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              {data.agent_name}
            </span>
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
          
          {StatusIcon && (
            <StatusIcon className={`w-4 h-4 ${statusColors[data.status!]}`} />
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  )
}

export default memo(TaskNode)
