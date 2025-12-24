import { Panel } from 'reactflow'
import { User, ListTodo, ArrowRight } from 'lucide-react'

export default function FlowLegend() {
  return (
    <Panel position="top-left" className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <User className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">Agent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded" />
          <ListTodo className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">Task</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">Flow direction</span>
        </div>
      </div>
    </Panel>
  )
}
