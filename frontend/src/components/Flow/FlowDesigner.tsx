import { Agent } from '@/types/agent'
import { Task } from '@/types/task'

interface FlowDesignerProps {
  agents: Agent[]
  tasks: Task[]
}

export default function FlowDesigner({ agents, tasks }: FlowDesignerProps) {
  return (
    <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Flow Designer</h3>
        <p className="text-gray-500 mb-4">
          Visual workflow designer for agents and tasks
        </p>
        <p className="text-sm text-gray-400">
          {agents.length} agents, {tasks.length} tasks
        </p>
        <p className="text-xs text-gray-400 mt-2">
          TODO: Implement React Flow or similar visualization library
        </p>
      </div>
    </div>
  )
}
